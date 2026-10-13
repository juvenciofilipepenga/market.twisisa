import { useEffect, useState } from "react";
import { api } from "./api";
import type { Category } from "./types";

// Categorias da loja: uma só chamada partilhada pelo bloco "Encontre o que procura" e pelos filtros (sem pedidos
// repetidos ao abrir a página). `null` = a carregar; `[]` = não existem ou o pedido falhou (o que mostrar é decisão de quem usa).
const FRESH_MS = 60_000;
let cache: { at: number; promise: Promise<Category[]> } | null = null;

function fetchCategories(): Promise<Category[]> {
  if (cache && Date.now() - cache.at < FRESH_MS) return cache.promise;
  const promise = api.categories.list().catch(() => { cache = null; return [] as Category[]; });
  cache = { at: Date.now(), promise };
  return promise;
}

export function useCategories(): Category[] | null {
  const [categories, setCategories] = useState<Category[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchCategories().then((list) => { if (alive) setCategories(list); });
    return () => { alive = false; };
  }, []);
  return categories;
}
