import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { Header } from "@/components/layout/Header";
import { img } from "@/lib/images";
import { useDocumentMeta } from "@/lib/useDocumentMeta";

export default function NotFoundPage() {
  const { t } = useLocale();
  useDocumentMeta({ title: `404 · ${t("seo.notFound")} · Twisisa Market`, noindex: true });
  return (
    <main>
      <Header />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center">
        <img src={img.mascotConfused} alt="" width={900} height={844} className="w-56 sm:w-64" />
        <p className="mt-4 font-display text-7xl font-extrabold leading-none text-primary-text">404</p>
        <h1 className="mt-3 text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-2 text-ink-muted">{t("notFound.body")}</p>
        <Link to="/" className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover">{t("notFound.cta")}</Link>
      </div>
    </main>
  );
}
