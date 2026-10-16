# Twisisa Market — Relatório de SEO (Parte 1)

**Estado honesto:** este pacote entrega as Fases 1, 2, 3, 4 e 9 (e os testes da Fase 10 que lhes correspondem).
**As Fases 5, 6, 7 e 8 NÃO foram implementadas** (painel "SEO e Indexação", APIs do Google, credenciais, automação de produtos).
Motivo: o `change.zip` só tem o **frontend**; não há backend, base de dados nem rotas de autenticação para ligar um painel ou guardar tokens do Google. Não vou inventar endpoints. Ver secção 8.

Não consegui correr `npm install`, `tsc` nem `vite build` (sem rede). Os 22 testes novos passam (`npm test`), mas **o TypeScript novo não foi compilado nem a função foi corrida na Vercel**. Corra `npm run build` antes do deploy.

## 1. Diagnóstico dos problemas originais

| Problema | Causa encontrada no código |
|---|---|
| **Favicon** | O HTML declarava `favicon.ico` **e** um PNG de **32×32**. O Google usa um só favicon por site e pede um quadrado de pelo menos 48×48 px; o de 32×32 concorria com o bom. O `favicon.ico` já tinha 48×48 (reaproveitado, nada inventado). Não há bloqueio no robots.txt. |
| **Sem sitelinks** | **Não existiam páginas de categoria.** Categorias eram `/?categoryId=…`, com `noindex`, canonical a apontar para `/`, e chips que eram `<button>` (não rastreáveis). Só havia a página inicial para o Google mostrar. Sitelinks são automáticos: nenhum código os garante. |
| **Páginas só aparecem após pedido manual** | (a) `<head>` igual em todas as páginas no HTML inicial (canonical `/` mesmo em produtos; só o JavaScript corrigia); (b) sitemap sem categorias, com `changefreq/priority` e **200 mesmo quando a API falhava, com produtos em falta**; (c) **todas as URLs inexistentes devolviam 200** (soft 404); (d) produtos sem ligação para a categoria nem breadcrumbs. |
| Outros | Descrição da home centrada em M-Pesa/e-Mola (pedido: não); `SearchAction` no JSON-LD; `SearchPage` apontava para `/?category=` (parâmetro errado, filtro nunca funcionava); `dist/sitemap.xml` antigo (não está no git, mas se fizer deploy da pasta `dist` esse ficheiro estático **sobrepõe** o dinâmico). |

## 2. Ficheiros
**Novos:** `seo/seo.js` (+`seo.d.ts`), `api/render.js`, `api/_lib/render-core.js`, `api/_lib/sitemap-core.js`, `src/pages/CategoryPage.tsx`, `src/components/layout/Breadcrumbs.tsx`, `public/icons/favicon-48.png`, `tests/*` (4 ficheiros), `scripts/verify-production.mjs`.
**Alterados:** `index.html`, `vercel.json`, `public/robots.txt`, `api/sitemap.js`, `package.json` (só scripts), `src/App.tsx`, `src/pages/ProductPage.tsx`, `src/pages/SearchPage.tsx`, `src/components/layout/CategoryChips.tsx`, `src/components/layout/SiteFooter.tsx`, `src/lib/useDocumentMeta.ts`, `src/i18n/dictionaries.ts`.

## 3. O que foi implementado
- **Favicon:** `favicon.ico` (48/32/16) + `favicon-48.png` declarados; removido o PNG 32×32 do HTML; `Allow` explícito para `/favicon.ico` e `/icons/`; cache nos ícones.
- **Metadados:** texto de título/descrição sai de **um só sítio** (`seo/seo.js`), usado pelo servidor e pelo React → HTML do Googlebot = HTML do navegador. Home: *Twisisa Market | Loja Online em Moçambique*, sem métodos de pagamento.
- **Renderização do `<head>` no servidor** (`api/render.js`): `/produto/:id` e `/categoria/:slug` devolvem o `index.html` com título, descrição, canonical absoluto, Open Graph, robots, JSON-LD (Product, BreadcrumbList, CollectionPage) e um corpo com `h1` e links `<a href>`. **404 real** para produto/categoria/rota inexistente; **503 + Retry-After** se a API falhar (nunca 200 com página vazia). Não é SSR completo: o React continua a renderizar a página.
- **Categorias indexáveis:** `/categoria/:slug` (H1, texto gerado só com dados reais — total e nomes de produtos —, links para produtos, breadcrumbs, paginação). Categoria sem produtos → `noindex` e fora do sitemap. Chips, rodapé e pesquisa passam a ser links reais. `/?categoryId=` continua a funcionar como filtro (noindex, bloqueado no robots).
- **Produto:** breadcrumb com link à categoria, JSON-LD Product (preço, moeda MZN, disponibilidade; **sem** rating/brand/sku inventados).
- **Sitemap segmentado:** `/sitemap.xml` (índice) → `/sitemap-pages.xml` (início + categorias com produtos) e `/sitemap-products-N.xml` (5 000 por ficheiro). Só activos, sem duplicados, `lastmod` = `updatedAt` real, sem `changefreq/priority`, sempre `https://market.twisisa.site`.
- **Sitelinks:** navegação rastreável, breadcrumbs, canónicos consistentes, Organization/WebSite. Removi o `SearchAction` (a Google descontinuou a caixa de pesquisa nos resultados — confirme na documentação actual). **Os sitelinks são decididos pela Google; não há botão nem API; nada neste código os promete.**

## 4. Variáveis de ambiente (Vercel)
`VITE_API_URL` (**obrigatória** também para as funções `api/*`, como já era no sitemap; termina em `/api/v1`), `VITE_SITE_URL=https://market.twisisa.site`. Nenhuma nova.

## 5. Configuração Google (Search Console)
1. Propriedade correcta (prefixo `https://market.twisisa.site/` ou domínio). A verificação por ficheiro `googleb96e…html` e meta tag já existem — não apagar.
2. Sitemaps → submeter `https://market.twisisa.site/sitemap.xml` (o índice; os filhos são lidos automaticamente). Remover o sitemap antigo se aparecer com erros.
3. **Favicon:** depois do deploy, Inspeção de URL da página inicial → "Solicitar indexação". A Google actualiza o favicon quando volta a rastrear a home; a mudança nos resultados pode demorar dias ou semanas (cache da Google). Não mude o URL do favicon depois.

## 6. Migrações de BD
Nenhuma nesta parte.

## 7. Testes (`npm test`, 22/22 a passar)
Cobrem: texto da home igual em HTML/dicionários; favicon (ICO com 48 px, PNG 48×48, sem 32×32); injecção de `<head>` e escape de JSON-LD; unicidade/limites de títulos e descrições; Product/Breadcrumb sem dados inventados; render 200/404/503 de produto e categoria; sitemap (índice, categorias vazias fora, duplicados/inactivos fora, `lastmod` válido, 503 em falha, 404 em ficheiro inexistente); **todas as rotas do `App.tsx` mapeadas em `vercel.json`**; robots; ausência de segredos Google no frontend.
**Não testado:** execução na Vercel, `tsc`/`vite build`, respostas HTTP reais, ligação ao Google.
Depois do deploy: `npm run verify:prod` (favicon, robots, sitemap, 200/404, canonical) — **confirma tecnicamente, não confirma indexação**.

## 8. O que falta (Fases 5–8) e o que preciso
Preciso do **zip do backend** (Fastify/Prisma) para: ver a autenticação de admin existente, o schema Prisma e as convenções.
Direcção que proponho (**proposta, nada disto existe ainda**):
- Tabela `SeoUrl` (url, tipo, lastmod, estado técnico, último envio, último erro, estado de indexação nullable) + `SeoSyncLog`; rotas `/admin/seo/*` com o middleware de admin existente; página "SEO e Indexação" no `AdminShell` existente.
- Google: **OAuth2 ou conta de serviço só no backend** (utilizador adicionado à propriedade no Search Console); **sitemaps.submit** (Search Console API) e **URL Inspection API** (só leitura do estado — ela **não pede indexação**). Mostrar "Estado de indexação desconhecido" quando a inspecção falhar ou ainda não correu.
- **Não existe API oficial para "solicitar indexação" de páginas de loja.** A Indexing API é só para vagas de emprego e transmissões em direto: não usar para produtos. A alternativa suportada é sitemap actualizado + links internos; pedido manual na interface do Search Console quando necessário.
- Fase 8: ao criar/editar produto, marcar `SeoUrl` como "pendente" (assíncrono, sem bloquear o pedido); política para removidos: 404 ou 410 conforme o caso (a função `render` já devolve 404 para produtos que a API não devolve).

## 9. Limitações e riscos conhecidos
- **URLs de produto usam o `id`**, não o slug. Mantive-as para não quebrar URLs já conhecidas pela Google; mudar exigiria redirecionamentos 301.
- **Categorias não têm descrição na BD**; o texto introdutório é gerado a partir de dados reais. Um campo `description` por categoria (backend) melhoraria muito.
- O corpo `h1 + links` injectado no HTML aparece sem estilo por instantes antes do React arrancar.
- Outras páginas privadas (carrinho, perfil…) continuam sem `<meta robots>` próprio; estão bloqueadas no robots.txt.
- `Disallow: /*?search=` e `/*?categoryId=` impedem o Google de ver o `noindex` dessas URLs, o que é o pretendido (são duplicados).

## 10. Deploy
1. Copiar os ficheiros por cima do projecto (mesmos caminhos). 2. `npm install && npm test && npm run build`. 3. Fazer deploy do **repositório** (não da pasta `dist`). 4. `npm run verify:prod`. 5. Search Console: passos da secção 5.
