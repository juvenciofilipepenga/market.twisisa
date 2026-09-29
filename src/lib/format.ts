// Formatação de moeda em Metical (MZN), a moeda usada pelo backend (campos "...Mzn").
export function formatMzn(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " MT";
}
