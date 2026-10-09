// Compras parciais: o cliente escolhe alguns itens do carrinho, a encomenda é criada só com esses, e os itens SÓ saem
// do carrinho depois de o pagamento ser confirmado. Este registo (por encomenda) lembra o que sair do carrinho quando isso
// acontecer — mesmo que o cliente feche a página e o pagamento confirme mais tarde (a CartReconciler trata desse caso).
export interface CartLine { productId: string; variantId: string | null; quantity: number }
export interface PendingCartRecord { orderId: string; lines: CartLine[]; createdAt: number }

const KEY = "twisisa.cart.pending";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function read(): PendingCartRecord[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as PendingCartRecord[];
    return Array.isArray(raw) ? raw.filter((r) => r && typeof r.orderId === "string" && Array.isArray(r.lines) && Date.now() - r.createdAt < MAX_AGE_MS) : [];
  } catch { return []; }
}
function write(list: PendingCartRecord[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* sem armazenamento: o carrinho só não se limpa sozinho */ }
}

export const lineKey = (l: { productId: string; variantId: string | null }) => `${l.productId}:${l.variantId ?? "base"}`;

export function registerPending(orderId: string, lines: CartLine[]) {
  write([...read().filter((r) => r.orderId !== orderId), { orderId, lines, createdAt: Date.now() }]);
}
export function listPending(): PendingCartRecord[] { return read(); }

/** Devolve e apaga o registo. Só quem o "consome" remove itens do carrinho, por isso nunca se remove duas vezes. */
export function consumePending(orderId: string): PendingCartRecord | null {
  const all = read();
  const found = all.find((r) => r.orderId === orderId) ?? null;
  if (found) write(all.filter((r) => r.orderId !== orderId));
  return found;
}
export function dropPending(orderId: string) { write(read().filter((r) => r.orderId !== orderId)); }

/** Já existe uma encomenda por pagar com exatamente estes itens e quantidades? Reutiliza-a em vez de criar duplicadas. */
export function findReusable(lines: CartLine[]): PendingCartRecord | null {
  const sig = (ls: CartLine[]) => ls.map((l) => `${lineKey(l)}x${l.quantity}`).sort().join("|");
  const wanted = sig(lines);
  return read().find((r) => sig(r.lines) === wanted) ?? null;
}
