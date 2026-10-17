// Lógica de SEO partilhada entre a aplicação React (src/) e as funções da Vercel (api/).
// É JavaScript simples de propósito: as funções da Vercel não passam pelo Vite nem pelo TypeScript.
// Os tipos estão em seo.d.ts. Os testes estão em tests/.
//
// REGRA: o texto de título/descrição de cada página sai SEMPRE daqui. Assim o HTML que o Googlebot recebe do
// servidor (api/render.js) e o que o React escreve depois no navegador (useDocumentMeta) são idênticos.

export const SITE_URL = "https://market.twisisa.site";
export const SITE_NAME = "Twisisa Market";
export const DEFAULT_IMAGE = "/og-image.jpg";

export const HOME_TITLE = "Twisisa Market | Loja Online em Moçambique";
export const HOME_DESCRIPTION =
  "A Twisisa Market é uma loja online em Moçambique: explore as categorias, escolha os produtos disponíveis, veja preço e stock reais e acompanhe a sua encomenda até à entrega.";
export const HOME_TITLE_EN = "Twisisa Market | Online Store in Mozambique";
export const HOME_DESCRIPTION_EN =
  "Twisisa Market is an online store in Mozambique: browse the categories, pick from the products in stock, see real prices and follow your order until it arrives.";

/** Caminhos que a aplicação React serve como página (ver src/App.tsx). Tudo o resto deve responder 404. */
export const SPA_STATIC_PATHS = [
  "/", "/carrinho", "/perfil", "/notificacoes", "/instalar", "/definicoes", "/mais", "/pedidos", "/convites",
  "/pesquisa", "/termos", "/privacidade", "/cookies", "/mapa-do-site", "/entrar", "/registar", "/recuperar", "/redefinir",
];
/** Prefixos com um segmento dinâmico (/produto/:id, ...). */
export const SPA_DYNAMIC_PREFIXES = ["/produto/", "/categoria/", "/encomenda/", "/notificacoes/", "/pagamento/"];

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapa XML (sitemap). */
export function escapeXml(value) {
  return escapeHtml(value).replace(/&#39;/g, "&apos;");
}

/** Para JSON dentro de <script>: impede que "</script>" ou "<!--" no conteúdo fechem o bloco. */
export function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function absoluteUrl(pathOrUrl, siteUrl = SITE_URL) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

const squash = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** Corta sem partir palavras. */
export function truncate(text, max) {
  const clean = squash(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

export function formatMznPlain(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
}

export function categoryPath(category) {
  return `/categoria/${encodeURIComponent(category.slug)}`;
}
export function productPath(product) {
  return `/produto/${encodeURIComponent(product.id)}`;
}

// ---------------------------------------------------------------------------------------------------------------
// Metadados por tipo de página
// ---------------------------------------------------------------------------------------------------------------

export function homeMeta(locale = "pt") {
  return locale === "en"
    ? { title: HOME_TITLE_EN, description: HOME_DESCRIPTION_EN, path: "/", image: DEFAULT_IMAGE, noindex: false }
    : { title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/", image: DEFAULT_IMAGE, noindex: false };
}

/**
 * @param {{name:string, slug:string}} category
 * @param {{total:number, sampleNames:string[]}} info  total de produtos activos e até 3 nomes reais
 */
export function categoryMeta(category, info) {
  const name = squash(category.name);
  const total = Number(info?.total ?? 0);
  const names = (info?.sampleNames ?? []).map(squash).filter(Boolean).slice(0, 3);
  let description;
  if (total > 0) {
    const count = total === 1 ? "1 produto" : `${total} produtos`;
    description = `Compre ${name} na Twisisa Market, loja online em Moçambique: ${count} disponível${total === 1 ? "" : "is"}${names.length ? `, como ${names.join(", ")}` : ""}. Veja preços e stock reais.`;
  } else {
    description = `Categoria ${name} da Twisisa Market, loja online em Moçambique. Neste momento não há produtos disponíveis nesta categoria.`;
  }
  return {
    title: truncate(`${name} | Comprar Online em Moçambique | ${SITE_NAME}`, 70),
    description: truncate(description, 158),
    path: categoryPath(category),
    image: DEFAULT_IMAGE,
    // Categorias vazias não têm valor para pesquisa: não se indexam (e saem do sitemap).
    noindex: total === 0,
  };
}

/**
 * @param {object} product  produto da API pública (name, description, priceMzn, stock, images, id)
 * @param {{name:string, slug:string}|null} category
 */
export function productMeta(product, category) {
  const name = squash(product.name);
  const price = formatMznPlain(product.priceFromMzn ?? product.priceMzn);
  const own = squash(product.description);
  const stock = product.stock > 0 ? "em stock" : "esgotado de momento";
  const description = own
    ? truncate(own, 158)
    : truncate(`Compre ${name}${category ? ` (${squash(category.name)})` : ""} na Twisisa Market, loja online em Moçambique${price ? ` por ${price}` : ""}, ${stock}.`, 158);
  const primary = (product.images ?? []).find((i) => i.isPrimary) ?? (product.images ?? [])[0];
  return {
    title: truncate(`${name} | ${SITE_NAME}`, 70),
    description,
    path: productPath(product),
    image: primary?.url ?? DEFAULT_IMAGE,
    noindex: false,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Dados estruturados (schema.org). Só descrevem o que a página realmente mostra.
// ---------------------------------------------------------------------------------------------------------------

export function breadcrumbJsonLd(trail, siteUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absoluteUrl(step.path, siteUrl),
    })),
  };
}

export function productJsonLd(product, siteUrl = SITE_URL) {
  const url = absoluteUrl(productPath(product), siteUrl);
  const images = (product.images ?? []).map((i) => i.url).filter(Boolean);
  const price = Number(product.priceFromMzn ?? product.priceMzn);
  const node = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: squash(product.name),
    url,
  };
  const description = squash(product.description);
  if (description) node.description = description;
  if (images.length) node.image = images;
  if (Number.isFinite(price)) {
    node.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "MZN",
      price: price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${siteUrl}/#organization` },
    };
  }
  return node;
}

export function collectionJsonLd(category, products, siteUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: squash(category.name),
    url: absoluteUrl(categoryPath(category), siteUrl),
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(productPath(p), siteUrl),
        name: squash(p.name),
      })),
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Injecção no index.html (renderização no servidor do <head> e de um corpo rastreável)
// ---------------------------------------------------------------------------------------------------------------

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

/**
 * Devolve o index.html com título, descrição, canonical, Open Graph, Twitter, robots e JSON-LD desta página,
 * mais um bloco <noscript>-independente com h1 e ligações (dentro de #root; o React substitui-o ao arrancar).
 * @param {string} html  conteúdo de index.html
 * @param {{title:string,description:string,path:string,image?:string,noindex?:boolean}} meta
 * @param {{jsonLd?:object[], bodyHtml?:string, siteUrl?:string}} extra
 */
export function injectHead(html, meta, extra = {}) {
  const siteUrl = extra.siteUrl ?? SITE_URL;
  const url = absoluteUrl(meta.path, siteUrl);
  const image = absoluteUrl(meta.image ?? DEFAULT_IMAGE, siteUrl);
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);

  let out = html;
  out = replaceTag(out, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  out = replaceTag(out, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`);
  out = replaceTag(out, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  out = replaceTag(out, /<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${robots}" />`);
  out = replaceTag(out, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`);
  out = replaceTag(out, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`);
  out = replaceTag(out, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  out = replaceTag(out, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  out = replaceTag(out, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${t}" />`);
  out = replaceTag(out, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${d}" />`);
  out = replaceTag(out, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);

  const ld = (extra.jsonLd ?? []).map((node) => `<script type="application/ld+json" data-page="true">${safeJson(node)}</script>`).join("\n    ");
  if (ld) out = out.replace("</head>", `    ${ld}\n  </head>`);
  if (extra.bodyHtml) out = out.replace('<div id="root"></div>', `<div id="root">${extra.bodyHtml}</div>`);
  return out;
}

/** Corpo mínimo rastreável (h1, texto e ligações <a href>) enquanto o React não arranca. */
export function crawlableBody({ h1, intro, breadcrumb = [], links = [] }) {
  const crumbs = breadcrumb.length
    ? `<nav aria-label="Breadcrumb"><ol>${breadcrumb.map((c) => `<li><a href="${escapeHtml(c.path)}">${escapeHtml(c.name)}</a></li>`).join("")}</ol></nav>`
    : "";
  const list = links.length ? `<ul>${links.map((l) => `<li><a href="${escapeHtml(l.path)}">${escapeHtml(l.name)}</a></li>`).join("")}</ul>` : "";
  return `<main>${crumbs}<h1>${escapeHtml(h1)}</h1>${intro ? `<p>${escapeHtml(intro)}</p>` : ""}${list}</main>`;
}

// ---------------------------------------------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------------------------------------------

export const SITEMAP_PRODUCTS_PER_FILE = 5000; // muito abaixo do limite de 50 000 URLs / 50 MB do protocolo

function validDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** lastmod só quando há uma data real; sem changefreq/priority (o Google ignora-os). */
export function urlEntry(loc, lastmod) {
  const date = validDate(lastmod);
  return `  <url><loc>${escapeXml(loc)}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</url>`;
}

export function buildUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

export function buildSitemapIndex(locs) {
  const items = locs.map((l) => `  <sitemap><loc>${escapeXml(l.loc)}</loc>${validDate(l.lastmod) ? `<lastmod>${validDate(l.lastmod)}</lastmod>` : ""}</sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>\n`;
}

/** Um produto só entra no sitemap se tiver id e estiver activo (a API pública já só devolve activos; confirma-se aqui). */
export function isSitemapProduct(product) {
  return Boolean(product) && typeof product.id === "string" && product.id.length > 0 && product.active !== false;
}

/** Uma categoria só entra se tiver slug válido. A contagem de produtos decide se vale a pena indexá-la. */
export function isSitemapCategory(category, total) {
  return Boolean(category) && typeof category.slug === "string" && category.slug.length > 0 && total > 0;
}
