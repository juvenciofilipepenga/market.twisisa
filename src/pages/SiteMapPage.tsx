import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import type { Product } from "@/lib/types";
import { BoxIcon, CartIcon, ChevronRightIcon, HomeIcon, ShieldIcon, UserIcon } from "@/components/icons";

type IconType = (props: SVGProps<SVGSVGElement>) => JSX.Element;

function Card({ title, Icon, children }: { title: string; Icon: IconType; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Icon width={20} height={20} /></span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <ul className="mt-2">{children}</ul>
    </section>
  );
}

function Row({ to, label, hint }: { to: string; label: string; hint?: string }) {
  return (
    <li>
      <Link to={to} className="press flex items-start gap-3 rounded-xl px-1 py-3 hover:bg-elevated">
        <ChevronRightIcon width={16} height={16} className="mt-1.5 shrink-0 text-ink-faint" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{label}</span>
          {hint && <span className="block text-sm text-ink-muted">{hint}</span>}
        </span>
      </Link>
    </li>
  );
}

// Mapa do site: ligações reais (<a href>) para todas as páginas públicas, para pessoas e para o Google as seguir.
// A versão para motores de busca é o /sitemap.xml (gerado em api/sitemap.js, com todos os produtos).
export default function SiteMapPage() {
  const { t, locale } = useLocale();
  const pt = locale === "pt";
  const [products, setProducts] = useState<Product[]>([]);

  useDocumentMeta({
    title: `${pt ? "Mapa do site" : "Site map"} · Twisisa Market`,
    description: pt
      ? "Encontre rapidamente qualquer página do Twisisa Market: produtos, carrinho, conta, ajuda e informação legal."
      : "Quickly find any page of Twisisa Market: products, cart, account, help and legal information."
  });

  useEffect(() => {
    let alive = true;
    api.products.list({ limit: 24 })
      .then((r) => { if (alive) setProducts(r.data); })
      .catch(() => { /* sem produtos, o resto do mapa continua útil */ });
    return () => { alive = false; };
  }, []);

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold md:text-5xl">{pt ? "Mapa do site" : "Site map"}</h1>
        <p className="mt-3 text-ink-muted">
          {pt
            ? "Encontre rapidamente qualquer página do Twisisa Market. Esta é uma visão completa da loja online: produtos, compra, conta e informação legal."
            : "Quickly find any page of Twisisa Market. A complete view of the online store: products, checkout, account and legal information."}
        </p>

        <div className="mt-8 space-y-4">
          <Card title={pt ? "Páginas principais" : "Main pages"} Icon={HomeIcon}>
            <Row to="/" label={t("nav.home")} hint={pt ? "Montra da loja e produtos em destaque" : "Storefront and featured products"} />
            <Row to="/pesquisa" label={t("nav.search")} hint={pt ? "Procurar produtos pelo nome" : "Find products by name"} />
          </Card>

          {products.length > 0 && (
            <Card title={pt ? "Produtos recentes" : "Latest products"} Icon={BoxIcon}>
              {products.map((p) => (
                <Row key={p.id} to={`/produto/${p.id}`} label={p.name} hint={formatMzn(p.priceFromMzn ?? p.priceMzn)} />
              ))}
            </Card>
          )}

          <Card title={pt ? "Compra" : "Shopping"} Icon={CartIcon}>
            <Row to="/carrinho" label={t("nav.cart")} hint={pt ? "Os produtos que escolheu" : "The products you picked"} />
            <Row to="/pedidos" label={pt ? "Os meus pedidos" : "My orders"} hint={pt ? "Acompanhe as suas encomendas" : "Follow your orders"} />
            <Row to="/instalar" label={t("install.nav")} hint={pt ? "O Twisisa Market no ecrã inicial do telemóvel" : "Twisisa Market on your phone's home screen"} />
          </Card>

          <Card title={pt ? "Conta" : "Account"} Icon={UserIcon}>
            <Row to="/entrar" label={t("auth.login")} hint={pt ? "Acesso à conta existente" : "Sign in to your account"} />
            <Row to="/registar" label={t("auth.register")} hint={pt ? "Crie conta para comprar e acompanhar encomendas" : "Create an account to shop and track orders"} />
            <Row to="/perfil" label={t("nav.profile")} />
            <Row to="/notificacoes" label={t("nav.notifications")} />
            <Row to="/convites" label={pt ? "Convidar amigos" : "Invite friends"} />
            <Row to="/definicoes" label={pt ? "Definições" : "Settings"} />
          </Card>

          <Card title="Legal" Icon={ShieldIcon}>
            <Row to="/termos" label={t("legal.terms")} />
            <Row to="/privacidade" label={t("legal.privacy")} />
            <Row to="/cookies" label={t("legal.cookies")} />
          </Card>
        </div>

        <p className="mt-8 rounded-2xl border border-border bg-elevated p-4 text-sm text-ink-muted">
          <strong className="text-ink">{pt ? "Para motores de busca:" : "For search engines:"}</strong>{" "}
          {pt ? "uma versão XML deste mapa, com todos os produtos, está em" : "an XML version of this map, with every product, is at"}{" "}
          <a href="/sitemap.xml" className="font-semibold text-primary-text underline underline-offset-4">/sitemap.xml</a>.
        </p>
      </div>
    </main>
  );
}
