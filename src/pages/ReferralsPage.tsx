import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { api } from "@/lib/api";
import type { ReferralInfo } from "@/lib/types";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronLeftIcon, GiftIcon } from "@/components/icons";

export default function ReferralsPage() {
  const { token } = useAuth();
  const { locale } = useLocale();
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  useDocumentMeta({ title: `${locale === "pt" ? "Convide e ganhe" : "Invite friends"} · Twisisa Market`, noindex: true });
  useEffect(() => { if (!token) return; api.referrals.me(token).then(setReferral).catch(() => setReferral(null)).finally(() => setLoaded(true)); }, [token]);
  return <main className="min-h-screen pb-8"><Header /><div className="mx-auto max-w-xl px-4 py-5 sm:py-7">
    <Link to="/perfil" className="press inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"><ChevronLeftIcon width={18} height={18} />{locale === "pt" ? "Voltar ao perfil" : "Back to profile"}</Link>
    <div className="mt-4 flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text"><GiftIcon width={23} height={23} /></span><div><h1 className="font-display text-2xl font-extrabold">{locale === "pt" ? "Convide e ganhe" : "Invite friends"}</h1><p className="mt-1 text-sm leading-relaxed text-ink-muted">{locale === "pt" ? "Partilhe o seu convite. Acompanhe os registos e as compras concluídas num só lugar." : "Share your invite and track sign-ups and completed purchases in one place."}</p></div></div>
    <div className="mt-5">{referral ? <ReferralCard referral={referral} /> : !loaded ? <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div> : <div className="rounded-xl border border-border bg-surface p-4 text-sm text-ink-muted">{locale === "pt" ? "Não foi possível carregar os dados de convite. Tente novamente mais tarde." : "Could not load referral details. Please try again later."}</div>}</div>
  </div></main>;
}
