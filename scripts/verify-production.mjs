// Verificação em PRODUÇÃO (corre na sua máquina, com rede):  npm run verify:prod  [https://market.twisisa.site]
// Só lê: não altera nada. Falha (código 1) se algo essencial estiver errado.
const BASE = (process.argv[2] || "https://market.twisisa.site").replace(/\/$/, "");
let failed = 0;
const ok = (c, msg) => { console.log(`${c ? "OK   " : "FALHA"} ${msg}`); if (!c) failed++; };
const get = async (p, init) => { const r = await fetch(BASE + p, { redirect: "manual", ...init }); return { r, text: r.headers.get("content-type")?.match(/text|xml|json/) ? await r.text() : "" }; };
const loc = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// Favicon
for (const [p, min] of [["/favicon.ico", "image"], ["/icons/favicon-48.png", "image/png"], ["/icons/apple-touch-icon.png", "image/png"]]) {
  const { r } = await get(p);
  ok(r.status === 200 && (r.headers.get("content-type") || "").startsWith(min), `${p} -> ${r.status} ${r.headers.get("content-type")}`);
}
const home = await get("/");
ok(home.r.status === 200, `/ -> ${home.r.status}`);
ok(/<link rel="icon"[^>]*favicon-48\.png/.test(home.text) && !/favicon-32/.test(home.text), "HTML declara o favicon de 48x48 e não o de 32x32");
ok(home.text.includes(`<link rel="canonical" href="${BASE}/" />`) || home.text.includes('href="https://market.twisisa.site/"'), "canonical da página inicial");

// Robots e sitemap
const robots = await get("/robots.txt");
ok(robots.r.status === 200 && /Sitemap: https:\/\/market\.twisisa\.site\/sitemap\.xml/.test(robots.text), "robots.txt declara o sitemap");
ok(!/Disallow:\s*\/(favicon|icons)/.test(robots.text), "robots.txt não bloqueia o favicon");
const idx = await get("/sitemap.xml");
ok(idx.r.status === 200 && (idx.r.headers.get("content-type") || "").includes("xml"), `/sitemap.xml -> ${idx.r.status} ${idx.r.headers.get("content-type")}`);
const seen = new Set(); let sampleProduct, sampleCategory;
for (const child of loc(idx.text)) {
  const u = new URL(child);
  const c = await get(u.pathname);
  ok(c.r.status === 200, `${u.pathname} -> ${c.r.status}`);
  for (const l of loc(c.text)) {
    if (seen.has(l)) ok(false, `URL duplicada no sitemap: ${l}`);
    seen.add(l);
    if (!l.startsWith("https://market.twisisa.site/")) ok(false, `URL fora do domínio oficial: ${l}`);
    if (l.includes("/produto/")) sampleProduct ??= l;
    if (l.includes("/categoria/")) sampleCategory ??= l;
  }
}
ok(seen.size > 0, `${seen.size} URLs no sitemap, todas únicas e no domínio oficial`);

// Amostras: 200 + canonical certo + título próprio; inexistente = 404 real
for (const sample of [sampleProduct, sampleCategory].filter(Boolean)) {
  const p = new URL(sample).pathname;
  const { r, text } = await get(p);
  ok(r.status === 200, `${p} -> ${r.status}`);
  ok(text.includes(`<link rel="canonical" href="${sample}" />`), `${p}: canonical = própria URL (no HTML do servidor, antes do JavaScript)`);
  ok(/<h1>/.test(text), `${p}: h1 presente no HTML do servidor`);
}
const gone = await get("/produto/id-que-nao-existe-123");
ok(gone.r.status === 404, `produto inexistente -> ${gone.r.status} (esperado 404)`);
const junk = await get("/pagina-que-nao-existe");
ok(junk.r.status === 404, `página inexistente -> ${junk.r.status} (esperado 404)`);

console.log(failed ? `\n${failed} verificação(ões) falharam.` : "\nTudo certo. Isto NÃO confirma indexação: use o Search Console (Inspeção de URL).");
process.exit(failed ? 1 : 0);
