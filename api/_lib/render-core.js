// Núcleo (testável, sem Vercel) da renderização do <head> por página. Ver api/render.js.
import {
  SITE_URL, homeMeta, categoryMeta, productMeta, breadcrumbJsonLd, productJsonLd, collectionJsonLd,
  injectHead, crawlableBody, categoryPath, productPath, SITE_NAME,
} from "../../seo/seo.js";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

const NOT_FOUND_META = {
  title: `Página não encontrada | ${SITE_NAME}`,
  description: "A página que procura não existe ou já não está disponível na Twisisa Market.",
  path: "/",
  noindex: true,
};

/**
 * @param {{type:"product"|"category"|"notfound", id?:string, slug?:string}} params
 * @param {{template:string, getJson:(path:string)=>Promise<{status:number, body:any}>, siteUrl?:string}} deps
 * @returns {Promise<{status:number, html:string, cache:string, retryAfter?:number}>}
 */
export async function renderPage(params, deps) {
  const siteUrl = deps.siteUrl ?? SITE_URL;
  const { template, getJson } = deps;
  const notFound = () => ({
    status: 404,
    html: injectHead(template, NOT_FOUND_META, { siteUrl }),
    cache: "public, s-maxage=60, stale-while-revalidate=300",
  });
  // A API falhou ou demorou: 503 (temporário) diz ao Google para voltar mais tarde, em vez de indexar uma página vazia.
  const unavailable = () => ({ status: 503, html: template, cache: "no-store", retryAfter: 120 });

  try {
    if (params.type === "product") {
      if (!ID_RE.test(params.id ?? "")) return notFound();
      const res = await getJson(`/products/${encodeURIComponent(params.id)}`);
      if (res.status === 404) return notFound();
      if (res.status !== 200 || !res.body?.id) return unavailable();
      const product = res.body;
      // Produto desactivado/ sem stock nunca chega aqui como activo=false se a API o esconde; se chegar, não se indexa.
      let category = null;
      if (product.categoryId) {
        const cats = await getJson("/categories").catch(() => ({ status: 0, body: null }));
        if (cats.status === 200 && Array.isArray(cats.body)) category = cats.body.find((c) => c.id === product.categoryId) ?? null;
      }
      const meta = productMeta(product, category);
      if (product.active === false) meta.noindex = true;
      const trail = [{ name: "Início", path: "/" }];
      if (category) trail.push({ name: category.name, path: categoryPath(category) });
      trail.push({ name: product.name, path: productPath(product) });
      return {
        status: 200,
        cache: "public, s-maxage=300, stale-while-revalidate=3600",
        html: injectHead(template, meta, {
          siteUrl,
          jsonLd: [productJsonLd(product, siteUrl), breadcrumbJsonLd(trail, siteUrl)],
          bodyHtml: crawlableBody({ h1: product.name, intro: meta.description, breadcrumb: trail.slice(0, -1) }),
        }),
      };
    }

    if (params.type === "category") {
      if (!SLUG_RE.test(params.slug ?? "")) return notFound();
      const cats = await getJson("/categories");
      if (cats.status !== 200 || !Array.isArray(cats.body)) return unavailable();
      const category = cats.body.find((c) => c.slug === params.slug);
      if (!category) return notFound();
      const list = await getJson(`/products?categoryId=${encodeURIComponent(category.id)}&page=1&limit=24`);
      if (list.status !== 200 || !Array.isArray(list.body?.data)) return unavailable();
      const products = list.body.data;
      const total = Number(list.body.pagination?.total ?? products.length);
      const meta = categoryMeta(category, { total, sampleNames: products.map((p) => p.name) });
      const trail = [{ name: "Início", path: "/" }, { name: category.name, path: categoryPath(category) }];
      return {
        status: 200,
        cache: "public, s-maxage=300, stale-while-revalidate=3600",
        html: injectHead(template, meta, {
          siteUrl,
          jsonLd: [breadcrumbJsonLd(trail, siteUrl), collectionJsonLd(category, products, siteUrl)],
          bodyHtml: crawlableBody({
            h1: category.name,
            intro: meta.description,
            breadcrumb: trail.slice(0, -1),
            links: products.map((p) => ({ name: p.name, path: productPath(p) })),
          }),
        }),
      };
    }

    return notFound();
  } catch {
    return unavailable();
  }
}

export { homeMeta };
