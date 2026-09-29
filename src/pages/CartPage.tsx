import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BoxIcon, MinusIcon, PlusIcon, TrashIcon, CartIcon } from "@/components/icons";

export default function CartPage() {
  const { t } = useLocale();
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (!token) { navigate("/entrar?next=/carrinho"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.orders.create(items.map((i) => ({ productId: i.productId, quantity: i.quantity })), token);
      clear();
      navigate(`/encomenda/${order.id}`);
    } catch {
      setError(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">{t("cart.title")}</h1>

        {items.length === 0 ? (
          <EmptyState title={t("cart.empty")} icon={<CartIcon width={26} height={26} />} />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-elevated">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={20} height={20} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/produto/${item.productId}`} className="line-clamp-1 text-sm font-medium">{item.name}</Link>
                  <p className="text-sm font-bold text-primary">{formatMzn(item.priceMzn)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-border">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 text-ink-muted hover:text-ink"><MinusIcon width={14} height={14} /></button>
                      <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 text-ink-muted hover:text-ink"><PlusIcon width={14} height={14} /></button>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="flex items-center gap-1 text-xs text-danger hover:underline">
                      <TrashIcon width={13} height={13} />{t("cart.remove")}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-ink-muted">{t("cart.subtotal")}</span>
              <span className="text-lg font-bold">{formatMzn(subtotal)}</span>
            </div>
            {!token && <p className="text-xs text-warning">{t("cart.loginRequired")}</p>}
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button className="w-full" onClick={checkout} disabled={submitting}>{t("cart.checkout")}</Button>
          </div>
        )}
      </div>
    </main>
  );
}
