// Função da Vercel: serve o index.html da aplicação com o <head> certo para cada página
// (/produto/:id, /categoria/:slug) e com o código HTTP certo (404 para o que não existe, 503 se a API falhar).
// Ligada em vercel.json por reescritas. A lógica está em api/_lib/render-core.js (testada em tests/).
import { renderPage } from "./_lib/render-core.js";
import { SITE_URL } from "../seo/seo.js";

const API_URL = (process.env.VITE_API_URL || "").replace(/\/$/, "");
const SITE = (process.env.VITE_SITE_URL || SITE_URL).replace(/\/$/, "");
const TIMEOUT_MS = 6000;
const TEMPLATE_TTL_MS = 5 * 60 * 1000;
let templateCache = null; // { at, html }

async function loadTemplate(host) {
  if (templateCache && Date.now() - templateCache.at < TEMPLATE_TTL_MS) return templateCache.html;
  // index.html é um ficheiro estático do build: o sistema de ficheiros responde antes das reescritas, por isso isto não faz ciclo.
  const res = await fetch(`https://${host}/index.html`, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`index.html respondeu ${res.status}`);
  const html = await res.text();
  templateCache = { at: Date.now(), html };
  return html;
}

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
  const type = url.searchParams.get("type") || "notfound";
  const params = { type, id: url.searchParams.get("id") || undefined, slug: url.searchParams.get("slug") || undefined };

  let template;
  try {
    template = await loadTemplate(req.headers["x-forwarded-host"] || req.headers.host);
  } catch (err) {
    console.error("render: index.html indisponível:", err instanceof Error ? err.message : err);
    res.statusCode = 503;
    res.setHeader("Retry-After", "60");
    res.end("Serviço temporariamente indisponível");
    return;
  }

  const out = await renderPage(params, { template, getJson, siteUrl: SITE });
  res.statusCode = out.status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", out.cache);
  if (out.retryAfter) res.setHeader("Retry-After", String(out.retryAfter));
  if (req.method === "HEAD") { res.end(); return; }
  res.end(out.html);
}
