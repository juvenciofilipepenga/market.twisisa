// Sitemap dinâmico (Vercel Function), servido em /sitemap.xml por uma reescrita em vercel.json.
// Só entram páginas públicas e indexáveis (nada do que o robots.txt bloqueia): início, mapa do site, páginas legais e
// todos os produtos activos, com a data da última alteração. Os produtos vêm da API pública (VITE_API_URL).
// Se a API falhar, devolve só as páginas fixas com cache curto: o Google não recebe um erro e volta a tentar em breve.
const SITE_URL = (process.env.VITE_SITE_URL || "https://market.twisisa.site").replace(/\/$/, "");
const API_URL = (process.env.VITE_API_URL || "").replace(/\/$/, "");
const PAGE_SIZE = 100; // máximo que a API pública aceita por pedido
const MAX_PAGES = 50; // tecto de segurança: 5000 produtos
const TIMEOUT_MS = 8000;

const FIXED = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/mapa-do-site", changefreq: "weekly", priority: "0.4" },
  { path: "/termos", changefreq: "yearly", priority: "0.3" },
  { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

async function fetchProducts() {
  if (!API_URL) throw new Error("VITE_API_URL em falta");
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API_URL}/products?page=${page}&limit=${PAGE_SIZE}`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`API respondeu ${res.status}`);
      const body = await res.json();
      all.push(...body.data);
      if (body.data.length < PAGE_SIZE || all.length >= body.pagination.total) break;
    } finally {
      clearTimeout(timer);
    }
  }
  return all;
}

function entry(loc, { lastmod, changefreq, priority } = {}) {
  return `  <url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}${priority ? `<priority>${priority}</priority>` : ""}</url>`;
}

export default async function handler(req, res) {
  let products = [];
  let degraded = false;
  try {
    products = await fetchProducts();
  } catch (err) {
    degraded = true;
    console.error("sitemap: produtos indisponíveis:", err instanceof Error ? err.message : err);
  }

  const lines = FIXED.map((p) => entry(`${SITE_URL}${p.path}`, p));
  for (const product of products) {
    if (!product || typeof product.id !== "string") continue;
    const date = new Date(product.updatedAt);
    lines.push(entry(`${SITE_URL}/produto/${encodeURIComponent(product.id)}`, {
      lastmod: Number.isNaN(date.getTime()) ? undefined : date.toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>\n`;
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", degraded ? "public, s-maxage=60" : "public, s-maxage=3600, stale-while-revalidate=86400");
  if (req.method === "HEAD") { res.end(); return; }
  res.end(xml);
}
