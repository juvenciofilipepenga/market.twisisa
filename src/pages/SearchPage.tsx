import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ProductGrid } from "@/components/product/ProductGrid";
import { api } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import { useLocale } from "@/i18n/LocaleContext";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchPage() {
  const { locale } = useLocale(); const [params] = useSearchParams(); const navigate = useNavigate();
  const q = params.get("q")?.trim() || ""; const [products, setProducts] = useState<Product[] | null>(null); const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { api.categories.list().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => { setProducts(null); api.products.list({ search: q || undefined, limit: 50 }).then(r => setProducts(r.data)).catch(() => setProducts([])); }, [q]);
  return <main className="pb-10"><Header /><div className="mx-auto max-w-6xl px-4 py-5">
    <div className="mb-5"><h1 className="text-2xl font-extrabold">{q ? `${locale === "pt" ? "Resultados para" : "Results for"} “${q}”` : locale === "pt" ? "Pesquisar produtos" : "Search products"}</h1><p className="mt-1 text-sm text-ink-muted">{products === null ? "…" : `${products.length} ${locale === "pt" ? "produtos encontrados" : "products found"}`}</p></div>
    {categories.length > 0 && <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">{categories.map(c => <button key={c.id} onClick={() => navigate(`/?category=${encodeURIComponent(c.id)}`)} className="shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink-muted hover:border-ink-faint hover:text-ink">{c.name}</button>)}</div>}
    {products === null ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({length:8},(_,i)=><Skeleton key={i} className="aspect-[.82] rounded-2xl" />)}</div> : products.length ? <ProductGrid products={products} /> : <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-ink-muted">{locale === "pt" ? "Nenhum produto corresponde à pesquisa." : "No products match this search."}</div>}
  </div></main>;
}
