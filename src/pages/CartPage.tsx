import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useCart } from "@/cart/CartContext";
import { findReusable, registerPending, dropPending, type CartLine } from "@/lib/cartPending";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { img } from "@/lib/images";
import { formatMzn } from "@/lib/format";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast, useBottomBarOffset } from "@/components/ui/Toast";
import { BoxIcon, CheckIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function CartPage() {
  const { t } = useLocale();
  useDocumentMeta({ title: `${t("cart.title")} · Twisisa Market`, noindex: true });
  const { items, count, updateQuantity, removeItem, restoreItem, selectedItems, selectedSubtotal, toggleSelected, setAllSelected } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Remoções seguidas (janela de 6 s) juntam-se num só aviso, e um só "Desfazer" repõe todas.
  const removedBatch = useRef<{ at: number; list: Array<{ item: (typeof items)[number]; index: number }> }>({ at: 0, list: [] });
  useBottomBarOffset(items.length > 0, 84);

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someLeftOut = selectedItems.length > 0 && !allSelected;

  // Paga só o que está escolhido. O carrinho NÃO é esvaziado aqui: os itens só saem depois de o pagamento ser confirmado
  // (ver PaymentPage / CartReconciler), e o que não foi escolhido nunca sai.
  async function checkout() {
    if (!token) { navigate("/entrar?next=/carrinho"); return; }
    if (selectedItems.length === 0) return;
    setSubmitting(true);
    setError(null);
    const lines: CartLine[] = selectedItems.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }));
    try {
      // Já há uma encomenda por pagar com exatamente estes itens? Retoma-a em vez de criar uma duplicada.
      const reusable = findReusable(lines);
      if (reusable) {
        const existing = await api.orders.get(reusable.orderId, token).catch(() => null);
        if (existing?.status === "PENDING_PAYMENT") { navigate(`/pagamento/${existing.id}`); return; }
        dropPending(reusable.orderId);
      }
      const order = await api.orders.create(lines.map((l) => ({ productId: l.productId, variantId: l.variantId ?? undefined, quantity: l.quantity })), token);
      registerPending(order.id, lines);
      navigate(`/pagamento/${order.id}`);
    } catch {
      setError(t("common.error"));
      setSubmitting(false);
    }
  }

  function onRemove(productId: string, variantId: string | null) {
    const index = items.findIndex((i) => i.productId === productId && i.variantId === variantId);
    const item = items[index];
    if (!item) return;
    removeItem(productId, variantId);
    const batch = removedBatch.current;
    if (Date.now() - batch.at > 6000) batch.list = [];
    batch.at = Date.now();
    batch.list.push({ item, index });
    const snapshot = [...batch.list];
    toast.show(snapshot.length === 1 ? `${item.name} ${t("toast.removed")}` : `${snapshot.length} ${t("toast.removedMany")}`, {
      key: "cart-remove",
      action: {
        label: t("common.undo"),
        onClick: () => { [...snapshot].reverse().forEach((r) => restoreItem(r.item, r.index)); removedBatch.current = { at: 0, list: [] }; }
      }
    });
  }

  const checkoutButton = (className: string) => (
    <Button size="lg" className={className} loading={submitting} disabled={selectedItems.length === 0} onClick={checkout}>
      {allSelected ? t("cart.checkout") : selectedItems.length === 0 ? t("cart.noneSelected") : `${t("cart.payChosen")} (${selectedItems.length})`}
    </Button>
  );

  return (
    <main className="pb-32 md:pb-10">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold">{t("cart.title")}</h1>
          {count > 0 && <p className="text-sm text-ink-muted">{count} {count === 1 ? "artigo" : "artigos"}</p>}
        </div>

        {items.length === 0 ? (
          <EmptyState
            image={img.cart}
            title={t("cart.empty")}
            description={t("cart.emptyHint")}
            action={<Link to="/" className={buttonClass("primary", "lg")}>{t("hero.cta")}</Link>}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_20rem] md:items-start">
            <div>
            <label className="mb-3 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-3 text-sm font-medium">
              <button type="button" role="checkbox" aria-checked={allSelected} aria-label={t("cart.selectAll")} onClick={() => setAllSelected(!allSelected)}
                className={`press flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${allSelected ? "border-primary bg-primary text-white" : "border-border bg-elevated"}`}>
                {allSelected && <CheckIcon width={14} height={14} />}
              </button>
              <span onClick={() => setAllSelected(!allSelected)} className="flex-1">{t("cart.selectAll")}</span>
              <span className="text-xs text-ink-muted">{selectedItems.length} / {items.length}</span>
            </label>
            <ul className="space-y-3">
              {items.map((item) => {
                const checked = item.selected !== false;
                return (
                <li key={`${item.productId}:${item.variantId ?? "base"}`} className={`flex gap-3 rounded-2xl border bg-surface p-3 transition-opacity ${checked ? "border-primary/50" : "border-border opacity-70"}`}>
                  <button type="button" role="checkbox" aria-checked={checked} aria-label={`${t("cart.select")}: ${item.name}`} onClick={() => toggleSelected(item.productId, item.variantId)}
                    className="press -ml-1 flex w-9 shrink-0 items-center justify-center self-stretch">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md border ${checked ? "border-primary bg-primary text-white" : "border-border bg-elevated"}`}>{checked && <CheckIcon width={14} height={14} />}</span>
                  </button>
                  <Link to={`/produto/${item.productId}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-elevated">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
                      <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={22} height={22} /></div>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/produto/${item.productId}`} className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</Link>
                      {(item.colorHex || item.size) && <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">{item.colorHex && <span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: item.colorHex }} aria-label="Cor selecionada" />}{item.size && <span>Tamanho {item.size}</span>}</div>}
                      <button onClick={() => onRemove(item.productId, item.variantId)} aria-label={`${t("cart.remove")}: ${item.name}`} className="press -mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger">
                        <TrashIcon width={17} height={17} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <div className="flex items-center rounded-xl border border-border">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)} disabled={item.quantity <= 1} aria-label="-" className="press flex h-10 w-10 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"><MinusIcon width={14} height={14} /></button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)} disabled={item.stock > 0 && item.quantity >= item.stock} aria-label={item.quantity >= item.stock ? t("cart.maxStock") : "+"} className="press flex h-10 w-10 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"><PlusIcon width={14} height={14} /></button>
                      </div>
                      <p className="font-display text-base font-bold tabular-nums">{formatMzn(Number(item.priceMzn) * item.quantity)}</p>
                    </div>
                    {item.stock > 0 && item.quantity >= item.stock && <p className="mt-1 text-xs text-sun">{t("cart.maxStock")}</p>}
                  </div>
                </li>
                );
              })}
            </ul>
            </div>

            {/* Resumo: coluna ao lado no ecrã largo; no telemóvel vira a barra fixa em baixo */}
            <aside className="hidden rounded-2xl border border-border bg-surface p-5 md:sticky md:top-28 md:block">
              <h2 className="mb-4 text-base font-bold">{t("cart.summary")}</h2>
              <div className="flex items-baseline justify-between"><span className="text-sm text-ink-muted">{allSelected ? t("cart.subtotal") : t("cart.selectedSubtotal")}</span><span className="font-display text-2xl font-extrabold">{formatMzn(selectedSubtotal)}</span></div>
              {someLeftOut && <p className="mt-2 text-xs text-ink-muted">{items.length - selectedItems.length} {t("cart.restStay")}</p>}
              {!token && <p className="mt-3 text-xs text-warning">{t("cart.loginRequired")}</p>}
              {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}
              {checkoutButton("mt-4 w-full")}
              <Link to="/" className="mt-2 flex h-11 items-center justify-center text-sm font-medium text-ink-muted hover:text-ink">{t("cart.continue")}</Link>
            </aside>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="bar-above-nav fixed inset-x-0 z-40 border-t border-border bg-bg/95 backdrop-blur md:hidden">
          {(!token || error) && <p role={error ? "alert" : undefined} className={`px-4 pt-2 text-xs ${error ? "text-danger" : "text-warning"}`}>{error ?? t("cart.loginRequired")}</p>}
          <div className="flex items-center gap-3 px-4 py-3">
            <div><p className="text-xs text-ink-muted">{allSelected ? t("cart.total") : t("cart.selectedSubtotal")}</p><p className="font-display text-xl font-extrabold leading-tight">{formatMzn(selectedSubtotal)}</p>{someLeftOut && <p className="text-[11px] text-ink-faint">{items.length - selectedItems.length} {t("cart.restStay")}</p>}</div>
            {checkoutButton("ml-auto shrink-0")}
          </div>
        </div>
      )}
    </main>
  );
}
