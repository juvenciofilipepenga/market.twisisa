import { useEffect, useState } from "react";
import { api } from "./api";
import type { Product } from "./types";

// O que "acabou de chegar": os produtos mais recentes com stock, para o slider do topo. O backend (GET /products) devolve
// por ordem de criação, e ainda não tem um campo "destaque" no Produto: por isso o slider se chama "Acabou de chegar" e
// não "Destaques" (não promete uma curadoria que não existe). Quando existir um destaque real, só este ficheiro muda.
const HERO_COUNT = 5;
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

export function useFeaturedProducts(): { ready: boolean; hero: Product[] } {
  const [all, setAll] = useState<Product[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchFeatured().then((list) => { if (alive) setAll(list); });
    return () => { alive = false; };
  }, []);
  if (all === null) return { ready: false, hero: [] };
  // O slider precisa de imagem para vender: prefere produtos que a tenham.
  const withImage = all.filter((p) => p.images.length > 0);
  const hero = (withImage.length > 0 ? withImage : all).slice(0, HERO_COUNT);
  return { ready: true, hero };
}
