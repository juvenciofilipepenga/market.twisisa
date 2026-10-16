import test from "node:test";
import assert from "node:assert/strict";
import { read, TEMPLATE } from "./helpers.mjs";
import * as seo from "../seo/seo.js";
import { execSync } from "node:child_process";
import { ROOT } from "./helpers.mjs";

test("página inicial: texto partilhado = index.html = dicionários (sem métodos de pagamento)", () => {
  assert.equal(seo.HOME_TITLE, "Twisisa Market | Loja Online em Moçambique");
  assert.ok(TEMPLATE.includes(`<title>${seo.HOME_TITLE}</title>`));
  assert.ok(TEMPLATE.includes(`<meta name="description" content="${seo.HOME_DESCRIPTION}" />`));
  const dict = read("src/i18n/dictionaries.ts");
  assert.ok(dict.includes(seo.HOME_TITLE) && dict.includes(seo.HOME_DESCRIPTION));
  assert.ok(dict.includes(seo.HOME_TITLE_EN) && dict.includes(seo.HOME_DESCRIPTION_EN));
  for (const w of ["M-Pesa", "e-Mola", "cartão"]) assert.ok(!seo.HOME_DESCRIPTION.includes(w));
  assert.ok(seo.HOME_DESCRIPTION.length <= 200);
});

test("favicon: ICO com 48x48, PNG 48x48 e sem link de 32x32 no HTML", async () => {
  const { readBin } = await import("./helpers.mjs");
  const ico = readBin("public/favicon.ico");
  const n = ico.readUInt16LE(4);
  const sizes = Array.from({ length: n }, (_, i) => ico[6 + 16 * i] || 256);
  assert.ok(sizes.includes(48), `ICO só tem ${sizes}`);
  const png = readBin("public/icons/favicon-48.png");
  assert.equal(png.readUInt32BE(16), 48);
  assert.equal(png.readUInt32BE(20), 48);
  assert.ok(TEMPLATE.includes('href="/icons/favicon-48.png"'));
  assert.ok(!TEMPLATE.includes("favicon-32.png"), "o PNG de 32x32 concorre com o de 48x48");
  const robots = read("public/robots.txt");
  assert.ok(!/Disallow:\s*\/(favicon|icons)/.test(robots));
});

test("injectHead escreve título, canonical absoluto, robots e JSON-LD seguro", () => {
  const meta = seo.productMeta({ id: "p1", name: 'Tênis "X" <b>', description: "", priceMzn: "1500", stock: 3, images: [] }, { name: "Calçado", slug: "calcado" });
  const html = seo.injectHead(TEMPLATE, meta, {
    jsonLd: [seo.productJsonLd({ id: "p1", name: "A </script><script>alert(1)", priceMzn: "10", stock: 0, images: [] })],
    bodyHtml: seo.crawlableBody({ h1: "A <img>", links: [{ name: "x", path: "/produto/1" }] }),
  });
  assert.ok(html.includes('<link rel="canonical" href="https://market.twisisa.site/produto/p1" />'));
  assert.ok(!html.includes('<link rel="canonical" href="https://market.twisisa.site/" />'));
  assert.ok(html.includes("&lt;b&gt;"));
  assert.ok(!html.includes("</script><script>alert(1)"));
  assert.ok(html.includes("OutOfStock"));
  assert.equal((html.match(/<title>/g) ?? []).length, 1);
  assert.ok(html.includes('<div id="root"><main>'));
  const ld = [...html.matchAll(/<script type="application\/ld\+json" data-page="true">([\s\S]*?)<\/script>/g)];
  assert.equal(ld.length, 1);
  assert.doesNotThrow(() => JSON.parse(ld[0][1]));
});

test("títulos e descrições únicos por categoria e por produto, dentro dos limites", () => {
  const a = seo.categoryMeta({ name: "Telemóveis", slug: "telemoveis" }, { total: 4, sampleNames: ["A", "B", "C", "D"] });
  const b = seo.categoryMeta({ name: "Roupa", slug: "roupa" }, { total: 1, sampleNames: ["Camisa"] });
  assert.notEqual(a.title, b.title);
  assert.notEqual(a.description, b.description);
  assert.ok(a.title.length <= 70 && a.description.length <= 160);
  assert.equal(a.path, "/categoria/telemoveis");
  assert.equal(a.noindex, false);
  assert.equal(seo.categoryMeta({ name: "Vazia", slug: "vazia" }, { total: 0, sampleNames: [] }).noindex, true);
  const long = seo.productMeta({ id: "1", name: "N".repeat(200), description: "d ".repeat(300), priceMzn: "1", stock: 1, images: [] }, null);
  assert.ok(long.title.length <= 70 && long.description.length <= 160);
});

test("produto: JSON-LD só com dados reais (sem rating/brand inventados)", () => {
  const ld = seo.productJsonLd({ id: "x", name: "Fone", description: "Bom", priceMzn: "299.5", stock: 2, images: [{ url: "https://img/a.jpg" }] });
  assert.equal(ld["@type"], "Product");
  assert.equal(ld.offers.price, "299.50");
  assert.equal(ld.offers.priceCurrency, "MZN");
  assert.equal(ld.offers.availability, "https://schema.org/InStock");
  for (const k of ["aggregateRating", "review", "brand", "sku", "gtin"]) assert.ok(!(k in ld));
});

test("breadcrumb: URLs absolutos no domínio oficial e posições sequenciais", () => {
  const ld = seo.breadcrumbJsonLd([{ name: "Início", path: "/" }, { name: "C", path: "/categoria/c" }]);
  assert.deepEqual(ld.itemListElement.map((i) => i.position), [1, 2]);
  assert.ok(ld.itemListElement.every((i) => i.item.startsWith("https://market.twisisa.site/")));
});

test("index.html: sem potentialAction/SearchAction e sem promessa de sitelinks", () => {
  assert.ok(!TEMPLATE.includes("SearchAction"));
  assert.ok(!/sitelink\s*:/i.test(TEMPLATE));
});

test("nenhum segredo da Google em código do frontend", () => {
  const out = execSync(`grep -rEn "VITE_[A-Z_]*(SECRET|PRIVATE|REFRESH|TOKEN|SERVICE_ACCOUNT)|private_key|client_secret" src index.html || true`, { cwd: ROOT }).toString();
  assert.equal(out.trim(), "");
});
