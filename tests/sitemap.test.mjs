import test from "node:test";
import assert from "node:assert/strict";
import { fakeApi } from "./helpers.mjs";
import { buildSitemap } from "../api/_lib/sitemap-core.js";

const P = (id, extra = {}) => ({ id, name: id, active: true, updatedAt: "2026-10-01T10:00:00.000Z", ...extra });
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

test("índice aponta para pages e para ficheiros de produtos (5000 por ficheiro)", async () => {
  const r = await buildSitemap("index", { getJson: fakeApi({ "/products?page=1&limit=1": { status: 200, body: { data: [], pagination: { total: 5001 } } } }) });
  assert.equal(r.status, 200);
  assert.deepEqual(locs(r.xml), ["https://market.twisisa.site/sitemap-pages.xml", "https://market.twisisa.site/sitemap-products-1.xml", "https://market.twisisa.site/sitemap-products-2.xml"]);
  assert.ok(r.xml.includes("<sitemapindex"));
});

test("pages: início + só categorias com produtos", async () => {
  const r = await buildSitemap("pages", { getJson: fakeApi({
    "/categories": { status: 200, body: [{ id: "a", slug: "roupa" }, { id: "b", slug: "vazia" }] },
    "/products?categoryId=a&page=1&limit=1": { status: 200, body: { data: [], pagination: { total: 3 } } },
    "/products?categoryId=b&page=1&limit=1": { status: 200, body: { data: [], pagination: { total: 0 } } },
  }) });
  assert.deepEqual(locs(r.xml), ["https://market.twisisa.site/", "https://market.twisisa.site/categoria/roupa"]);
});

test("produtos: sem duplicados nem inactivos; lastmod real; sem changefreq/priority; só domínio oficial", async () => {
  const r = await buildSitemap("products-1", { getJson: fakeApi({ "/products?page=1&limit=100": { status: 200, body: { data: [P("a"), P("a"), P("b", { active: false }), P("c", { updatedAt: "lixo" })], pagination: { total: 4 } } } }) });
  assert.equal(r.status, 200);
  assert.deepEqual(locs(r.xml), ["https://market.twisisa.site/produto/a", "https://market.twisisa.site/produto/c"]);
  assert.ok(r.xml.includes("<lastmod>2026-10-01T10:00:00.000Z</lastmod>"));
  assert.equal((r.xml.match(/<lastmod>/g) ?? []).length, 1, "produto com data inválida não leva lastmod");
  assert.ok(!/changefreq|priority/.test(r.xml));
  assert.ok(!/localhost|vercel\.app/.test(r.xml));
  assert.ok(r.xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
});

test("falha da API: 503 + Retry-After; ficheiro de produtos inexistente: 404", async () => {
  const bad = await buildSitemap("products-1", { getJson: fakeApi({ "/products?page=1&limit=100": { status: 500, body: null } }) });
  assert.equal(bad.status, 503);
  assert.ok(bad.retryAfter > 0 && bad.xml === undefined);
  assert.equal((await buildSitemap("lixo", { getJson: fakeApi({}) })).status, 404);
  const empty2 = await buildSitemap("products-2", { getJson: fakeApi({ "/products?page=51&limit=100": { status: 200, body: { data: [], pagination: { total: 3 } } } }) });
  assert.equal(empty2.status, 404);
});
