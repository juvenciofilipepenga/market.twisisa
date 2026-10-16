import test from "node:test";
import assert from "node:assert/strict";
import { TEMPLATE, fakeApi } from "./helpers.mjs";
import { renderPage } from "../api/_lib/render-core.js";

const cats = [{ id: "c1", name: "Telemóveis", slug: "telemoveis" }, { id: "c2", name: "Vazia", slug: "vazia" }];
const prod = { id: "p1", name: "Telemóvel Z", description: "Ecrã de 6,5 polegadas.", priceMzn: "9000", stock: 4, active: true, categoryId: "c1", images: [{ url: "https://img/z.jpg", isPrimary: true }] };

test("produto existente: 200, canonical, h1, Product + BreadcrumbList e ligação à categoria", async () => {
  const r = await renderPage({ type: "product", id: "p1" }, { template: TEMPLATE, getJson: fakeApi({ "/products/p1": { status: 200, body: prod }, "/categories": { status: 200, body: cats } }) });
  assert.equal(r.status, 200);
  assert.ok(r.html.includes('href="https://market.twisisa.site/produto/p1"'));
  assert.ok(r.html.includes("<h1>Telemóvel Z</h1>"));
  assert.ok(r.html.includes('<a href="/categoria/telemoveis">Telemóveis</a>'));
  assert.ok(r.html.includes('"@type":"Product"') && r.html.includes('"@type":"BreadcrumbList"'));
  assert.ok(r.html.includes("<title>Telemóvel Z | Twisisa Market</title>"));
});

test("produto inexistente: 404 + noindex; id inválido: 404 sem chamar a API", async () => {
  const calls = [];
  const r = await renderPage({ type: "product", id: "nada" }, { template: TEMPLATE, getJson: fakeApi({ "/products/nada": { status: 404, body: {} } }, calls) });
  assert.equal(r.status, 404);
  assert.ok(r.html.includes("noindex, nofollow"));
  const bad = await renderPage({ type: "product", id: "../x" }, { template: TEMPLATE, getJson: fakeApi({}, calls) });
  assert.equal(bad.status, 404);
  assert.equal(calls.length, 1);
});

test("API em baixo ou lenta: 503 com Retry-After (nunca 200 com página vazia)", async () => {
  const down = await renderPage({ type: "product", id: "p1" }, { template: TEMPLATE, getJson: fakeApi({ "/products/p1": new Error("timeout") }) });
  assert.equal(down.status, 503);
  assert.ok(down.retryAfter > 0);
  const err500 = await renderPage({ type: "category", slug: "telemoveis" }, { template: TEMPLATE, getJson: fakeApi({ "/categories": { status: 500, body: null } }) });
  assert.equal(err500.status, 503);
});

test("categoria: 200 com ligações para produtos; vazia = noindex; desconhecida = 404", async () => {
  const api = fakeApi({
    "/categories": { status: 200, body: cats },
    "/products?categoryId=c1&page=1&limit=24": { status: 200, body: { data: [prod], pagination: { total: 1 } } },
    "/products?categoryId=c2&page=1&limit=24": { status: 200, body: { data: [], pagination: { total: 0 } } },
  });
  const ok = await renderPage({ type: "category", slug: "telemoveis" }, { template: TEMPLATE, getJson: api });
  assert.equal(ok.status, 200);
  assert.ok(ok.html.includes('<a href="/produto/p1">Telemóvel Z</a>'));
  assert.ok(ok.html.includes('href="https://market.twisisa.site/categoria/telemoveis"'));
  assert.ok(ok.html.includes("index, follow"));
  const empty = await renderPage({ type: "category", slug: "vazia" }, { template: TEMPLATE, getJson: api });
  assert.equal(empty.status, 200);
  assert.ok(empty.html.includes("noindex, nofollow"));
  const unknown = await renderPage({ type: "category", slug: "nao-existe" }, { template: TEMPLATE, getJson: api });
  assert.equal(unknown.status, 404);
});

test("rota desconhecida: 404", async () => {
  const r = await renderPage({ type: "notfound" }, { template: TEMPLATE, getJson: fakeApi({}) });
  assert.equal(r.status, 404);
});
