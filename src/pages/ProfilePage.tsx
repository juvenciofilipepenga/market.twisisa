import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { img } from "@/lib/images";
import { detectLocation, type DetectedLocation } from "@/lib/geolocation";
import { getLocalAvatar } from "@/lib/avatar";
import { useCopy } from "@/lib/useCopy";
import type { Me, ReferralInfo } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { ClipboardIcon, CheckIcon, LogOutIcon, PinIcon } from "@/components/icons";

const LOCATION_STORAGE_KEY = "twisisa.deliveryLocation";

export default function ProfilePage() {
  const { t, locale } = useLocale();
  useDocumentMeta({ title: `${t("profile.title")} · Twisisa Market`, noindex: true });
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [location, setLocation] = useState<DetectedLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { copiedKey, copy } = useCopy();
  const copied = copiedKey === "address";

  useEffect(() => {
    if (!token) return;
    api.users.me(token).then((data) => { setMe(data); setName(data.name); setPhone(data.phone ?? ""); setPhoto(data.avatarUrl ?? getLocalAvatar()); }).catch(() => { /* 401 já é tratado globalmente */ });
    api.referrals.me(token).then(setReferral).catch(() => setReferral(null));
    try {
      const stored = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) setLocation(JSON.parse(stored));
    } catch { /* localização guardada inválida: ignora */ }
  }, [token]);

  async function saveProfile() {
    if (!token) return;
    try {
      await api.users.updateMe(token, { name, phone: phone || null });
      toast.show(t("toast.saved"), { key: "profile" });
    } catch {
      toast.show(t("common.error"), { tone: "error", key: "profile" });
    }
  }

  async function useMyLocation() {
    setLocationError(null);
    try {
      const result = await detectLocation();
      setLocation(result);
      try { window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(result)); } catch { /* sem armazenamento */ }
    } catch {
      setLocationError(t("profile.locationDenied"));
    }
  }

  function onLogout() {
    logout();
    toast.show(t("toast.loggedOut"));
    navigate("/", { replace: true });
  }

  const since = me ? new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { month: "long", year: "numeric" }).format(new Date(me.createdAt)) : null;

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Capa + avatar (foto ou iniciais) com o botão de câmara */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="h-28 bg-primary-active bg-cover bg-center sm:h-32" style={{ backgroundImage: `url(${img.profileCover})` }} />
          <div className="px-5 pb-5">
            {token && <AvatarEditor name={me?.name ?? ""} photo={photo} token={token} onChange={setPhoto} />}
            {me ? (
              <div className="mt-3">
                <h1 className="text-2xl font-extrabold leading-tight">{me.name}</h1>
                <p className="text-sm text-ink-muted">{me.email}</p>
                {since && <p className="mt-1 text-xs capitalize text-ink-faint">{t("profile.memberSince")} {since}</p>}
              </div>
            ) : <div className="mt-3 space-y-2"><Skeleton className="h-7 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-bold">{t("profile.personal")}</h2>
          {me === null ? (
            <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : (
            <div className="space-y-4">
              <Field label={t("auth.name")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              <Field label={t("auth.email")} value={me.email} disabled readOnly />
              <Field label={t("auth.phone")} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button size="lg" className="w-full sm:w-auto" onClick={saveProfile} disabled={!name.trim()}>{t("common.save")}</Button>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-bold">{t("profile.locationTitle")}</h2>
          <p className="mb-4 mt-1 text-sm text-ink-muted">{t("profile.locationHint")}</p>
          <Button variant="secondary" onClick={useMyLocation}><PinIcon width={18} height={18} />{t("profile.useLocation")}</Button>
          {locationError && <p role="alert" className="mt-3 text-sm text-danger">{locationError}</p>}
          {location && (
            <div className="mt-4 rounded-xl bg-elevated p-3">
              <p className="text-sm">{location.address}</p>
              <button onClick={() => void copy(location.address, "address")} className={`press mt-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors ${copied ? "text-success" : "text-primary-text hover:text-ink"}`}>
                {copied ? <CheckIcon className="pop" width={16} height={16} /> : <ClipboardIcon width={16} height={16} />}
                {copied ? t("common.copied") : t("common.copy")}
              </button>
            </div>
          )}
        </section>

        {referral && <div className="mt-4"><ReferralCard referral={referral} /></div>}

        <Button variant="ghost" size="lg" className="mt-4 w-full text-ink-muted" onClick={onLogout}><LogOutIcon width={18} height={18} />{t("profile.logout")}</Button>
      </div>
    </main>
  );
}
