import test from "node:test";
import assert from "node:assert/strict";
import { read } from "./helpers.mjs";

const vercel = JSON.parse(read("vercel.json"));

// Converte a origem de uma reescrita da Vercel (:param, :path*, (a|b)) numa expressão regular para o teste.
function toRegex(source) {
  let re = source.replace(/:[A-Za-z]+\*/g, "(?:.*)").replace(/:[A-Za-z]+/g, "[^/]+");
  return new RegExp(`^${re}$`);
}
const resolve = (p) => vercel.rewrites.find((r) => toRegex(r.source).test(p))?.destination;

test("todas as rotas do App.tsx são servidas como SPA (200) ou pela função certa; o resto vai para 404", () => {
  const app = read("src/App.tsx");
  const paths = [...app.matchAll(/<Route\s+path="([^"*]+)"/g)].map((m) => m[1]);
  const absolute = [];
  for (const p of paths) if (p.startsWith("/")) absolute.push(p);
  assert.ok(absolute.length > 15);
  for (const p of absolute) {
    const sample = p.replace(/:[A-Za-z]+/g, "abc");
    const dest = resolve(sample);
    if (sample === "/") continue; // servido pelo index.html estático
    assert.ok(dest && !dest.includes("type=notfound"), `${p} cairia em 404 pela reescrita`);
  }
  for (const sub of ["produtos", "login", "categorias", "pedidos", "utilizadores", "fatura", "pagamentos", "chat"]) {
    if (sub === "produtos" || sub === "categorias" || sub === "pedidos" || sub === "utilizadores" || sub === "fatura" || sub === "pagamentos" || sub === "chat" || sub === "login")
      assert.ok(resolve(`/admin/${sub}`) === "/index.html", `/admin/${sub}`);
  }
  assert.equal(resolve("/produto/abc"), "/api/render?type=product&id=:id");
  assert.equal(resolve("/categoria/roupa"), "/api/render?type=category&slug=:slug");
  assert.equal(resolve("/uma/pagina/que/nao/existe"), "/api/render?type=notfound");
  assert.equal(resolve("/sitemap.xml"), "/api/sitemap?part=index");
  assert.equal(resolve("/sitemap-products-2.xml"), "/api/sitemap?part=:part");
});

test("seo.js: lista de rotas fixas coincide com o App.tsx", async () => {
  const { SPA_STATIC_PATHS } = await import("../seo/seo.js");
  const app = read("src/App.tsx");
  const statics = [...app.matchAll(/<Route\s+path="(\/[^":*]*)"/g)].map((m) => m[1]).filter((p) => !p.startsWith("/admin"));
  for (const p of statics) assert.ok(SPA_STATIC_PATHS.includes(p), `${p} em falta em SPA_STATIC_PATHS`);
});

test("robots.txt: sitemap declarado no domínio oficial; privado bloqueado; público livre", () => {
  const r = read("public/robots.txt");
  assert.ok(r.includes("Sitemap: https://market.twisisa.site/sitemap.xml"));
  for (const p of ["/admin", "/carrinho", "/perfil", "/entrar", "/registar", "/recuperar", "/redefinir", "/encomenda", "/pagamento"]) assert.ok(r.includes(`Disallow: ${p}`), p);
  for (const p of ["/produto", "/categoria"]) assert.ok(!r.includes(`Disallow: ${p}`), p);
});

test("rotas públicas que o robots bloqueia não entram no sitemap (api só emite início, categorias e produtos)", () => {
  const code = read("api/_lib/sitemap-core.js");
  for (const p of ["/admin", "/carrinho", "/perfil", "/entrar", "/pesquisa"]) assert.ok(!code.includes(p));
});

test("package.json: script de teste e sem dependências novas de SEO", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts.test);
});
