// Leitura do CSV de produtos (importação em massa). Sem dependências: funciona igual no navegador e nos testes.
//
// O que aceita:
//  - campos entre aspas com vírgulas, aspas duplicadas ("") e QUEBRAS DE LINHA (descrições de várias linhas);
//  - separador "," ou ";" ou tab (o Excel em português grava com ";"), detectado pelo cabeçalho;
//  - colunas de características: "caract:Nome" ou "attr:Nome" (uma coluna por característica, vazio = não tem);
//  - categoria pelo nome ("category") ou pelo id ("categoryId").

import type { PricingInput } from "@/lib/types";

export type CsvAttribute = { name: string; value: string };

export type ImportRow = {
  // Linha do ficheiro onde o registo começa: o servidor usa-a para dizer ONDE falhou.
  line: number;
  name: string;
  description?: string;
  // Ou o preço fixo (priceMzn), ou os custos (pricing) de onde o servidor calcula o preço.
  priceMzn?: number;
  pricing?: PricingInput;
  stock: number;
  categoryId?: string;
  // Nome (ou slug) da categoria; o servidor resolve para o id.
  category?: string;
  active: boolean;
  variants?: Array<{ colorHex?: string; size?: string; stock: number; active: boolean }>;
  // Características por NOME: o servidor encontra (ou cria) a característica na categoria.
  attributes?: CsvAttribute[];
};

/** Erro de leitura com o número da linha do ficheiro (1 = cabeçalho). */
export class CsvError extends Error {
  constructor(public readonly code: string, public readonly line?: number, public readonly detail?: string) {
    super(code);
  }
}

const ATTR_PREFIX = /^(caract|attr)\s*:\s*/i;

/** Escolhe o separador pela primeira linha do ficheiro (fora de aspas): o que aparece mais vezes. */
export function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && ch in counts) counts[ch] = (counts[ch] ?? 0) + 1;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ",";
}

/**
 * Divide o texto em registos e campos como a norma CSV: uma quebra de linha dentro de aspas faz parte do campo.
 * Devolve cada registo com a linha onde começa (para mensagens de erro).
 */
export function parseRecords(text: string, delimiter: string): Array<{ line: number; cells: string[] }> {
  const records: Array<{ line: number; cells: string[] }> = [];
  let cells: string[] = [];
  let current = "";
  let quoted = false;
  let line = 1;
  let startLine = 1;
  let touched = false;

  const endCell = () => { cells.push(current.trim()); current = ""; };
  const endRecord = () => {
    endCell();
    if (cells.some((cell) => cell !== "")) records.push({ line: startLine, cells });
    cells = [];
    touched = false;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (quoted) {
      if (ch === '"' && text.charAt(i + 1) === '"') { current += '"'; i++; }
      else if (ch === '"') quoted = false;
      else { current += ch === "\r" ? "" : ch; if (ch === "\n") line++; }
      continue;
    }
    if (!touched) { startLine = line; touched = true; }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) endCell();
    else if (ch === "\n") { endRecord(); line++; }
    else if (ch === "\r") { /* \r\n conta uma só vez, no \n */ }
    else current += ch;
  }
  if (quoted) throw new CsvError("CSV_UNCLOSED_QUOTE", startLine);
  if (touched || current !== "" || cells.length) endRecord();
  return records;
}

const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function parseProductsCsv(source: string): ImportRow[] {
  const text = source.replace(/^\uFEFF/, "");
  const records = parseRecords(text, detectDelimiter(text));
  if (records.length < 2) throw new CsvError("CSV_EMPTY");

  const header = records[0]!;
  const headers = header.cells.map((cell) => cell.trim());
  const has = (key: string) => headers.includes(key);

  // Preço: coluna priceMzn (valor fixo) ou purchaseMzn (calculadora: o preço sai dos custos).
  if (!has("name") || !has("stock") || (!has("priceMzn") && !has("purchaseMzn"))) {
    throw new CsvError("CSV_HEADERS", 1, "name,stock,priceMzn|purchaseMzn");
  }

  // Colunas de características: nome sem o prefixo. Duas colunas com o mesmo nome seriam ambíguas.
  const attrColumns: Array<{ index: number; name: string }> = [];
  headers.forEach((cell, index) => {
    if (!ATTR_PREFIX.test(cell)) return;
    const name = cell.replace(ATTR_PREFIX, "").trim();
    if (!name) throw new CsvError("CSV_ATTR_HEADER", 1, cell);
    if (attrColumns.some((column) => norm(column.name) === norm(name))) throw new CsvError("CSV_ATTR_DUPLICATE", 1, name);
    attrColumns.push({ index, name });
  });

  const rows: ImportRow[] = [];

  for (const record of records.slice(1)) {
    const at = record.line;
    const row = Object.fromEntries(headers.map((h, i) => [h, record.cells[i] ?? ""])) as Record<string, string>;

    const name = (row.name ?? "").trim();
    if (!name) throw new CsvError("CSV_ROW_NAME", at);

    // Com purchaseMzn a linha usa a calculadora: compra e retorno são obrigatórios, o resto vazio = 0.
    const num = (key: string) => {
      const raw = (row[key] ?? "").replace(",", ".").trim();
      return raw === "" ? 0 : Number(raw);
    };
    const hasCosts = (row.purchaseMzn ?? "").trim() !== "";
    const pricing: PricingInput | undefined = hasCosts
      ? {
          purchaseMzn: num("purchaseMzn"),
          taxPct: num("taxPct"),
          transportMzn: num("transportMzn"),
          otherCostsMzn: num("otherCostsMzn"),
          returnPct: (row.returnPct ?? "").trim() === "" ? Number.NaN : num("returnPct"),
          commissionPct: num("commissionPct"),
          discountPct: num("discountPct")
        }
      : undefined;
    if (
      pricing &&
      !(
        Object.values(pricing).every(Number.isFinite) &&
        pricing.purchaseMzn > 0 &&
        pricing.taxPct >= 0 && pricing.taxPct <= 100 &&
        pricing.transportMzn >= 0 && pricing.otherCostsMzn >= 0 &&
        pricing.returnPct >= 0 && pricing.returnPct <= 1000 &&
        pricing.commissionPct >= 0 && pricing.commissionPct <= 60 &&
        pricing.discountPct >= 0 && pricing.discountPct <= 50
      )
    ) throw new CsvError("CSV_ROW_PRICE", at);

    // Preço fixo: aceita "19500" e "19 500" / "19.500" / "19500,00" como se escreve em Moçambique.
    const priceMzn = priceFrom(row.priceMzn ?? "");
    if (!pricing && !(Number.isFinite(priceMzn) && priceMzn > 0)) throw new CsvError("CSV_ROW_PRICE", at);

    const stockRaw = (row.stock ?? "").trim();
    const stock = stockRaw === "" ? Number.NaN : Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) throw new CsvError("CSV_ROW_STOCK", at);

    const hasVariant = Boolean(row.colorHex?.trim()) || Boolean(row.size?.trim());
    const attributes = attrColumns
      .map((column) => ({ name: column.name, value: (record.cells[column.index] ?? "").trim() }))
      .filter((attribute) => attribute.value !== "");

    rows.push({
      line: at,
      name,
      description: row.description?.trim() || undefined,
      ...(pricing ? { pricing } : { priceMzn }),
      stock,
      categoryId: row.categoryId?.trim() || undefined,
      category: row.category?.trim() || undefined,
      active: norm(row.active ?? "") !== "false",
      variants: hasVariant
        ? [{ colorHex: row.colorHex?.trim() || undefined, size: row.size?.trim() || undefined, stock: Number(row.variantStock || row.stock), active: true }]
        : undefined,
      attributes: attributes.length ? attributes : undefined
    });
  }

  return rows;
}

/** "19500", "19 500", "19.500", "19500,00", "19.500,00" → número. Vazio ou lixo → NaN. */
export function priceFrom(raw: string): number {
  let s = raw.replace(/\s|MZN/gi, "");
  if (s === "") return Number.NaN;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // O separador que vem por último é o decimal; o outro é de milhares.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (lastDot >= 0 && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  return Number(s);
}

/** Template para descarregar: duas linhas de exemplo, uma com preço calculado e outra com preço fixo + características. */
export function templateCsv(): string {
  const head = "name,description,priceMzn,purchaseMzn,taxPct,transportMzn,otherCostsMzn,returnPct,commissionPct,discountPct,stock,category,active,colorHex,size,variantStock,caract:Processador,caract:Memória RAM,caract:Armazenamento,caract:Ecrã";
  return [
    head,
    'Samsung A04 (preço calculado),Exemplo,,10000,16,400,,80,,,10,,true,#000000,,10,,,,',
    '"Portátil (preço fixo)","EXCLUSIVO & MODERNO\nProcessador e geração\nRAM e armazenamento",19500,,,,,,,,2,,true,,,,Intel Core i5,8 GB,SSD 256 GB,14 polegadas',
    ""
  ].join("\n");
}
