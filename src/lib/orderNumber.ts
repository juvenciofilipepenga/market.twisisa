// "TW-ORD-9881DB2E261CECB8" é longo demais para um ecrã de telemóvel. Mostra-se "#9881DB2E" (único na prática)
// e o número completo fica no detalhe e como dica ao tocar.
export function shortOrder(orderNumber: string): string {
  const core = orderNumber.replace(/^TW-ORD-/i, "");
  return `#${core.slice(0, 8).toUpperCase()}`;
}
