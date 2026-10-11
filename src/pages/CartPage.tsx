import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useCart } from "@/cart/CartContext";
import {
  findReusable,
  registerPending,
  dropPending,
  type CartLine,
} from "@/lib/cartPending";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { img } from "@/lib/images";
import { formatMzn } from "@/lib/format";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast, useBottomBarOffset } from "@/components/ui/Toast";
import {
  BoxIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";

export default function CartPage() {
  const { t } = useLocale();

  useDocumentMeta({
    title: `${t("cart.title")} · Twisisa Market`,
    noindex: true,
  });

  const {
    items,
    count,
    updateQuantity,
    removeItem,
    restoreItem,
    selectedItems,
    selectedSubtotal,
    toggleSelected,
    setAllSelected,
  } = useCart();

  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agrupa remoções próximas e permite desfazê-las em conjunto.
  const removedBatch = useRef<{
    at: number;
    list: Array<{
      item: (typeof items)[number];
      index: number;
    }>;
  }>({
    at: 0,
    list: [],
  });

  useBottomBarOffset(items.length > 0, 84);

  const allSelected =
    items.length > 0 && selectedItems.length === items.length;

  const someLeftOut =
    selectedItems.length > 0 && !allSelected;

  // Paga apenas os artigos seleccionados.
  // O carrinho não é esvaziado antes da confirmação do pagamento.
  async function checkout() {
    if (!token) {
      navigate("/entrar?next=/carrinho");
      return;
    }

    if (selectedItems.length === 0 || submitting) return;

    setSubmitting(true);
    setError(null);

    const lines: CartLine[] = selectedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    try {
      // Reutiliza uma encomenda pendente com os mesmos artigos.
      const reusable = findReusable(lines);

      if (reusable) {
        const existing = await api.orders
          .get(reusable.orderId, token)
          .catch(() => null);

        if (existing?.status === "PENDING_PAYMENT") {
          navigate(`/pagamento/${existing.id}`);
          return;
        }

        dropPending(reusable.orderId);
      }

      const order = await api.orders.create(
        lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId ?? undefined,
          quantity: line.quantity,
        })),
        token,
      );

      registerPending(order.id, lines);
      navigate(`/pagamento/${order.id}`);
    } catch {
      setError(t("common.error"));
      setSubmitting(false);
    }
  }

  function onRemove(
    productId: string,
    variantId: string | null,
  ) {
    const index = items.findIndex(
      (item) =>
        item.productId === productId &&
        item.variantId === variantId,
    );

    const item = items[index];

    if (!item) return;

    removeItem(productId, variantId);

    const batch = removedBatch.current;

    if (Date.now() - batch.at > 6000) {
      batch.list = [];
    }

    batch.at = Date.now();
    batch.list.push({ item, index });

    const snapshot = [...batch.list];

    toast.show(
      snapshot.length === 1
        ? `${item.name} ${t("toast.removed")}`
        : `${snapshot.length} ${t("toast.removedMany")}`,
      {
        key: "cart-remove",
        action: {
          label: t("common.undo"),
          onClick: () => {
            [...snapshot]
              .reverse()
              .forEach((removed) =>
                restoreItem(removed.item, removed.index),
              );

            removedBatch.current = {
              at: 0,
              list: [],
            };
          },
        },
      },
    );
  }

  const checkoutButton = (className: string) => (
    <Button
      size="lg"
      className={className}
      loading={submitting}
      disabled={selectedItems.length === 0 || submitting}
      onClick={checkout}
    >
      {allSelected
        ? t("cart.checkout")
        : selectedItems.length === 0
          ? t("cart.noneSelected")
          : `${t("cart.payChosen")} (${selectedItems.length})`}
    </Button>
  );

  return (
    <main className="pb-32 md:pb-10">
      <Header />

      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold">
            {t("cart.title")}
          </h1>

          {count > 0 && (
            <p className="text-sm text-ink-muted">
              {count} {count === 1 ? "artigo" : "artigos"}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            image={img.cart}
            title={t("cart.empty")}
            description={t("cart.emptyHint")}
            action={
              <Link to="/" className={buttonClass("primary", "lg")}>
                {t("hero.cta")}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_20rem] md:items-start">
            <div>
              {/* Seleccionar todos */}
              <div className="mb-3 flex min-h-[44px] items-center gap-3 rounded-2xl border border-border bg-surface px-3 text-sm font-medium">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={allSelected}
                  aria-label={t("cart.selectAll")}
                  onClick={() => setAllSelected(!allSelected)}
                  className={`press flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                    allSelected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-elevated"
                  }`}
                >
                  {allSelected && (
                    <CheckIcon width={14} height={14} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAllSelected(!allSelected)}
                  className="flex-1 text-left"
                >
                  {t("cart.selectAll")}
                </button>

                <span className="text-xs text-ink-muted">
                  {selectedItems.length} / {items.length}
                </span>
              </div>

              {/* Lista de produtos */}
              <ul className="space-y-3">
                {items.map((item) => {
                  const checked = item.selected !== false;

                  return (
                    <li
                      key={`${item.productId}:${item.variantId ?? "base"}`}
                      className={`rounded-2xl border bg-surface p-3 transition-opacity ${
                        checked
                          ? "border-primary/40"
                          : "border-border opacity-70"
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Selecção */}
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`${t("cart.select")}: ${item.name}`}
                          onClick={() =>
                            toggleSelected(
                              item.productId,
                              item.variantId,
                            )
                          }
                          className="press flex w-6 shrink-0 items-start justify-center pt-1"
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              checked
                                ? "border-primary bg-primary text-white"
                                : "border-border bg-elevated"
                            }`}
                          >
                            {checked && (
                              <CheckIcon width={13} height={13} />
                            )}
                          </span>
                        </button>

                        {/* Imagem */}
                        <Link
                          to={`/produto/${item.productId}`}
                          aria-label={item.name}
                          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-elevated"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-faint">
                              <BoxIcon width={24} height={24} />
                            </div>
                          )}
                        </Link>

                        {/* Nome, variante e preço */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <Link
                              to={`/produto/${item.productId}`}
                              className="min-w-0 flex-1 text-sm font-semibold leading-snug line-clamp-2"
                            >
                              {item.name}
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                onRemove(
                                  item.productId,
                                  item.variantId,
                                )
                              }
                              aria-label={`${t("cart.remove")}: ${item.name}`}
                              className="press -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger"
                            >
                              <TrashIcon
                                width={16}
                                height={16}
                              />
                            </button>
                          </div>

                          {(item.colorHex || item.size) && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                              {item.colorHex && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className="h-3.5 w-3.5 rounded-full border border-border"
                                    style={{
                                      backgroundColor: item.colorHex,
                                    }}
                                    aria-label="Cor seleccionada"
                                  />
                                  Cor
                                </span>
                              )}

                              {item.size && (
                                <span>
                                  Tamanho: {item.size}
                                </span>
                              )}
                            </div>
                          )}

                          <p className="mt-2 font-display text-base font-extrabold leading-tight tabular-nums">
                            {formatMzn(
                              Number(item.priceMzn) * item.quantity,
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Quantidade */}
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-ink-muted">
                          Quantidade
                        </span>

                        <div className="flex items-center rounded-xl border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity - 1,
                                item.variantId,
                              )
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Diminuir quantidade"
                            className="press flex h-9 w-10 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"
                          >
                            <MinusIcon
                              width={14}
                              height={14}
                            />
                          </button>

                          <span className="w-8 text-center text-sm font-bold tabular-nums">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity + 1,
                                item.variantId,
                              )
                            }
                            disabled={
                              item.stock > 0 &&
                              item.quantity >= item.stock
                            }
                            aria-label={
                              item.stock > 0 &&
                              item.quantity >= item.stock
                                ? t("cart.maxStock")
                                : "Aumentar quantidade"
                            }
                            className="press flex h-9 w-10 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"
                          >
                            <PlusIcon
                              width={14}
                              height={14}
                            />
                          </button>
                        </div>
                      </div>

                      {item.stock > 0 &&
                        item.quantity >= item.stock && (
                          <p className="mt-2 text-right text-xs text-sun">
                            {t("cart.maxStock")}
                          </p>
                        )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Resumo para ecrãs largos */}
            <aside className="hidden rounded-2xl border border-border bg-surface p-5 md:sticky md:top-28 md:block">
              <h2 className="mb-4 text-base font-bold">
                {t("cart.summary")}
              </h2>

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink-muted">
                  {allSelected
                    ? t("cart.subtotal")
                    : t("cart.selectedSubtotal")}
                </span>

                <span className="font-display text-2xl font-extrabold">
                  {formatMzn(selectedSubtotal)}
                </span>
              </div>

              {someLeftOut && (
                <p className="mt-2 text-xs text-ink-muted">
                  {items.length - selectedItems.length}{" "}
                  {t("cart.restStay")}
                </p>
              )}

              {!token && (
                <p className="mt-3 text-xs text-warning">
                  {t("cart.loginRequired")}
                </p>
              )}

              {error && (
                <p role="alert" className="mt-3 text-xs text-danger">
                  {error}
                </p>
              )}

              {checkoutButton("mt-4 w-full")}

              <Link
                to="/"
                className="mt-2 flex h-11 items-center justify-center text-sm font-medium text-ink-muted hover:text-ink"
              >
                {t("cart.continue")}
              </Link>
            </aside>
          </div>
        )}
      </div>

      {/* Barra fixa de pagamento no telemóvel */}
      {items.length > 0 && (
        <div className="bar-above-nav fixed inset-x-0 z-40 border-t border-border bg-bg/95 backdrop-blur md:hidden">
          {(!token || error) && (
            <p
              role={error ? "alert" : undefined}
              className={`px-4 pt-2 text-xs ${
                error ? "text-danger" : "text-warning"
              }`}
            >
              {error ?? t("cart.loginRequired")}
            </p>
          )}

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">
                {allSelected
                  ? t("cart.total")
                  : t("cart.selectedSubtotal")}
              </p>

              <p className="font-display text-xl font-extrabold leading-tight">
                {formatMzn(selectedSubtotal)}
              </p>

              {someLeftOut && (
                <p className="text-[11px] text-ink-faint">
                  {items.length - selectedItems.length}{" "}
                  {t("cart.restStay")}
                </p>
              )}
            </div>

            {checkoutButton("ml-auto shrink-0")}
          </div>
        </div>
      )}
    </main>
  );
}
