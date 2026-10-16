// Sitemap dinâmico segmentado (Vercel Function), ligado por reescritas em vercel.json:
//   /sitemap.xml               -> índice (aponta para os ficheiros abaixo)
//   /sitemap-pages.xml         -> página inicial + categorias com produtos
//   /sitemap-products-N.xml    -> produtos activos, até 5 000 por ficheiro, com lastmod = updatedAt real
// Só entram URLs canónicas, públicas e indexáveis, sempre no domínio de produção.
// Se a API falhar devolve 503 + Retry-After (o Google tenta de novo) em vez de um sitemap incompleto com HTTP 200.
import { buildSitemap } from "./_lib/sitemap-core.js";
import { SITE_URL } from "../seo/seo.js";

const API_URL = (process.env.VITE_API_URL || "").replace(/\/$/, "");
const SITE = (process.env.VITE_SITE_URL || SITE_URL).replace(/\/$/, "");
const TIMEOUT_MS = 8000;

async function getJson(path) {
  if (!API_URL) throw new Error("VITE_API_URL em falta");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const part = url.searchParams.get("part") || "index";
  const out = await buildSitemap(part, { getJson, siteUrl: SITE });
  res.statusCode = out.status;
  res.setHeader("Cache-Control", out.cache);
  if (out.retryAfter) res.setHeader("Retry-After", String(out.retryAfter));
  if (out.xml === undefined) { res.end(); return; }
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  if (req.method === "HEAD") { res.end(); return; }
  res.end(out.xml);
}
