import { useEffect, useState } from "react";
import { api } from "./api";
import type { Product } from "./types";

// Destaques da loja: UMA só chamada partilhada pelo slider do topo e pela fila "Destaques" (sem pedidos repetidos
// e sem mostrar o mesmo produto nos dois sítios). O backend ainda não tem um campo "destaque" no Produto: o critério
// é provisório — os produtos mais recentes com stock (ver README). Quando existir, só este ficheiro muda.
const HERO_COUNT = 5;
const ROW_COUNT = 6;
const FRESH_MS = 60_000;

let cache: { at: number; promise: Promise<Product[]> } | null = null;

function fetchFeatured(): Promise<Product[]> {
  if (cache && Date.now() - cache.at < FRESH_MS) return cache.promise;
  const promise = api.products.list({ limit: 12 })
    .then((res) => res.data.filter((p) => p.stock > 0))
    .catch(() => { cache = null; return [] as Product[]; });
  cache = { at: Date.now(), promise };
  return promise;
}

export function useFeaturedProducts(): { ready: boolean; hero: Product[]; more: Product[] } {
  const [all, setAll] = useState<Product[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchFeatured().then((list) => { if (alive) setAll(list); });
    return () => { alive = false; };
  }, []);
  if (all === null) return { ready: false, hero: [], more: [] };
  // O slider precisa de imagem para vender: prefere produtos que a tenham.
  const withImage = all.filter((p) => p.images.length > 0);
  const hero = (withImage.length > 0 ? withImage : all).slice(0, HERO_COUNT);
  const more = all.filter((p) => !hero.includes(p)).slice(0, ROW_COUNT);
  return { ready: true, hero, more };
}
