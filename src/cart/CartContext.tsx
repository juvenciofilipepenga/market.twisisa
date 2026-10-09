import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "../lib/types";
import type { CartLine } from "../lib/cartPending";

export interface CartItem {
  productId: string;
  variantId: string | null;
  colorHex: string | null;
  size: string | null;
  name: string;
  priceMzn: string;
  quantity: number;
  imageUrl: string | null;
  stock: number;
  /** Escolhido para pagar agora. Ausente (carrinhos antigos) = escolhido. */
  selected?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  /** Volta a pôr um item removido ("Desfazer"), na posição original. */
  restoreItem: (item: CartItem, index?: number) => void;
  clear: () => void;
  /** Itens escolhidos para pagar agora (por omissão, todos). */
  selectedItems: CartItem[];
  selectedCount: number;
  selectedSubtotal: number;
  toggleSelected: (productId: string, variantId: string | null) => void;
  setAllSelected: (selected: boolean) => void;
  /** Tira do carrinho o que foi pago (desconta as quantidades; o que não foi escolhido fica). */
  removePaid: (lines: CartLine[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "twisisa.cart";

// Carrinho é só do lado do cliente: o backend não tem endpoint de carrinho, apenas
// POST /orders que recebe a lista final de itens directamente no checkout.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch { /* carrinho guardado inválido, ignora */ }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(product: Product, quantity = 1, variant?: ProductVariant) {
    setItems((prev) => {
      const variantId = variant?.id ?? null;
      const existing = prev.find((i) => i.productId === product.id && i.variantId === variantId);
      const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
      if (existing) {
        const maxStock = variant?.stock ?? product.stock;
        const nextQty = Math.min(existing.quantity + quantity, maxStock || existing.quantity + quantity);
        return prev.map((i) => (i.productId === product.id && i.variantId === variantId ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, {
        productId: product.id, variantId, colorHex: variant?.colorHex ?? null, size: variant?.size ?? null,
        name: product.name, priceMzn: product.priceMzn, quantity, imageUrl: primaryImage?.url ?? null, stock: variant?.stock ?? product.stock
      }];
    });
  }

  function updateQuantity(productId: string, quantity: number, variantId: string | null = null) {
    setItems((prev) => prev.map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || quantity)) } : i)));
  }

  function removeItem(productId: string, variantId: string | null = null) {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  }

  function restoreItem(item: CartItem, index?: number) {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) return prev;
      const next = [...prev];
      next.splice(Math.min(index ?? next.length, next.length), 0, item);
      return next;
    });
  }

  function clear() { setItems([]); }

  function toggleSelected(productId: string, variantId: string | null) {
    setItems((prev) => prev.map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, selected: i.selected === false } : i)));
  }

  function setAllSelected(selected: boolean) {
    setItems((prev) => prev.map((i) => ({ ...i, selected })));
  }

  // Desconta o que foi pago. Se o cliente aumentou a quantidade depois de criar a encomenda, o excedente fica no carrinho.
  // useCallback: identidade estável, para a CartReconciler não voltar a consultar o servidor a cada alteração do carrinho.
  const removePaid = useCallback((lines: CartLine[]) => {
    setItems((prev) => prev.flatMap((i) => {
      const paid = lines.filter((l) => l.productId === i.productId && l.variantId === i.variantId).reduce((n, l) => n + l.quantity, 0);
      if (paid === 0) return [i];
      const left = i.quantity - paid;
      return left > 0 ? [{ ...i, quantity: left }] : [];
    }));
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + Number(i.priceMzn) * i.quantity, 0),
    addItem, updateQuantity, removeItem, restoreItem, clear,
    selectedItems: items.filter((i) => i.selected !== false),
    selectedCount: items.filter((i) => i.selected !== false).reduce((sum, i) => sum + i.quantity, 0),
    selectedSubtotal: items.filter((i) => i.selected !== false).reduce((sum, i) => sum + Number(i.priceMzn) * i.quantity, 0),
    toggleSelected, setAllSelected, removePaid
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
