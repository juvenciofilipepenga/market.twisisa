// Núcleo (testável) do sitemap segmentado. Ver api/sitemap.js.
import {
  SITE_URL, SITEMAP_PRODUCTS_PER_FILE, urlEntry, buildUrlset, buildSitemapIndex,
  isSitemapProduct, isSitemapCategory, categoryPath, productPath,
} from "../../seo/seo.js";

const API_PAGE = 100; // máximo que a API pública aceita por pedido
const PAGES_PER_FILE = SITEMAP_PRODUCTS_PER_FILE / API_PAGE;

async function need(getJson, path) {
  const res = await getJson(path);
  if (res.status !== 200 || res.body == null) throw new Error(`API respondeu ${res.status} em ${path}`);
  return res.body;
}

/** @returns {Promise<{status:number, xml?:string, cache:string, retryAfter?:number}>} */
export async function buildSitemap(part, { getJson, siteUrl = SITE_URL }) {
  const fail = { status: 503, cache: "no-store", retryAfter: 300 };
  try {
    if (part === "index") {
      const first = await need(getJson, "/products?page=1&limit=1");
      const total = Number(first.pagination?.total ?? 0);
      const files = Math.max(0, Math.ceil(total / SITEMAP_PRODUCTS_PER_FILE));
      const locs = [{ loc: `${siteUrl}/sitemap-pages.xml` }];
      for (let n = 1; n <= files; n++) locs.push({ loc: `${siteUrl}/sitemap-products-${n}.xml` });
      return { status: 200, xml: buildSitemapIndex(locs), cache: "public, s-maxage=3600, stale-while-revalidate=86400" };
    }

    if (part === "pages") {
      const entries = [urlEntry(`${siteUrl}/`)];
      const cats = await need(getJson, "/categories");
      for (const c of Array.isArray(cats) ? cats : []) {
        const list = await need(getJson, `/products?categoryId=${encodeURIComponent(c.id)}&page=1&limit=1`);
        const total = Number(list.pagination?.total ?? 0);
        if (isSitemapCategory(c, total)) entries.push(urlEntry(`${siteUrl}${categoryPath(c)}`));
      }
      return { status: 200, xml: buildUrlset(entries), cache: "public, s-maxage=3600, stale-while-revalidate=86400" };
    }

    const m = /^products-(\d{1,4})$/.exec(part);
    if (m) {
      const n = Number(m[1]);
      if (n < 1) return { status: 404, cache: "public, s-maxage=60" };
      const seen = new Set();
      const entries = [];
      for (let i = 0; i < PAGES_PER_FILE; i++) {
        const page = (n - 1) * PAGES_PER_FILE + i + 1;
        const body = await need(getJson, `/products?page=${page}&limit=${API_PAGE}`);
        const data = Array.isArray(body.data) ? body.data : [];
        for (const p of data) {
          if (!isSitemapProduct(p) || seen.has(p.id)) continue;
          seen.add(p.id);
          // lastmod = data de alteração real do produto na base de dados (updatedAt), nunca "agora".
          entries.push(urlEntry(`${siteUrl}${productPath(p)}`, p.updatedAt));
        }
        if (data.length < API_PAGE) break;
      }
      if (entries.length === 0 && n > 1) return { status: 404, cache: "public, s-maxage=60" };
      return { status: 200, xml: buildUrlset(entries), cache: "public, s-maxage=3600, stale-while-revalidate=86400" };
    }

    return { status: 404, cache: "public, s-maxage=60" };
  } catch (err) {
    console.error("sitemap:", err instanceof Error ? err.message : err);
    return fail;
  }
}
