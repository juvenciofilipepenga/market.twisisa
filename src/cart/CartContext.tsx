import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../lib/types";

export interface CartItem {
  productId: string;
  name: string;
  priceMzn: string;
  quantity: number;
  imageUrl: string | null;
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  /** Volta a pôr um item removido ("Desfazer"), na posição original. */
  restoreItem: (item: CartItem, index?: number) => void;
  clear: () => void;
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

  function addItem(product: Product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, product.stock || existing.quantity + quantity);
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, {
        productId: product.id, name: product.name, priceMzn: product.priceMzn,
        quantity, imageUrl: primaryImage?.url ?? null, stock: product.stock
      }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((prev) => prev
      .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || quantity)) } : i))
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
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

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + Number(i.priceMzn) * i.quantity, 0),
    addItem, updateQuantity, removeItem, restoreItem, clear
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
