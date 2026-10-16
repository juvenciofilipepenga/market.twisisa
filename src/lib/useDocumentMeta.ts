import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_IMAGE, SITE_URL } from "@/config/site";

interface PageMeta {
  /** Título completo da página (aparece no separador, nos resultados do Google e nas partilhas). */
  title: string;
  description?: string;
  /** URL absoluto ou caminho (ex.: /og-image.jpg). Por omissão, a imagem da marca. */
  image?: string | null;
  /** Páginas privadas ou sem valor para pesquisa (carrinho, perfil, resultados de pesquisa…). */
  noindex?: boolean;
  /** Dados estruturados (schema.org), ex.: Product. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
}

function setTag(kind: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${kind}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(kind, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

// A loja é uma SPA: sem isto, todas as páginas partilhavam o mesmo título e a mesma descrição.
// Cada página chama este hook; ele actualiza título, descrição, canonical, Open Graph, Twitter e robots.
export function useDocumentMeta({ title, description, image, noindex = false, jsonLd = null }: PageMeta) {
  const { pathname } = useLocation();
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const url = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
    const pic = image ?? DEFAULT_IMAGE;
    const absolute = pic.startsWith("http") ? pic : `${SITE_URL}${pic}`;

    document.title = title;
    if (description) {
      setTag("name", "description", description);
      setTag("property", "og:description", description);
      setTag("name", "twitter:description", description);
    }
    setTag("property", "og:title", title);
    setTag("name", "twitter:title", title);
    setTag("property", "og:url", url);
    setTag("property", "og:image", absolute);
    setTag("name", "twitter:image", absolute);
    setTag("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;

    // Substitui o JSON-LD da página que o servidor (api/render.js) já escreveu no HTML, sem duplicar.
    document.head.querySelectorAll('script[type="application/ld+json"][data-page]').forEach((n) => n.remove());
    const nodes: Record<string, unknown>[] = jsonKey ? (Array.isArray(JSON.parse(jsonKey)) ? JSON.parse(jsonKey) : [JSON.parse(jsonKey)]) : [];
    const scripts = nodes.map((node) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.page = "true";
      script.textContent = JSON.stringify(node);
      document.head.appendChild(script);
      return script;
    });
    return () => { scripts.forEach((s) => s.remove()); };
  }, [title, description, image, noindex, pathname, jsonKey]);
}
