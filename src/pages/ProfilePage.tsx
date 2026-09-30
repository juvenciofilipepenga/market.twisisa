import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { detectLocation, type DetectedLocation } from "@/lib/geolocation";
import type { Me, ReferralInfo } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { ClipboardIcon, CheckIcon } from "@/components/icons";
import { useCopy } from "@/lib/useCopy";

const LOCATION_STORAGE_KEY = "twisisa.deliveryLocation";

export default function ProfilePage() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const [referral, setReferral] = useState<ReferralInfo | null>(null);

  const [location, setLocation] = useState<DetectedLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { copiedKey, copy } = useCopy();
  const copied = copiedKey === "address";

  useEffect(() => {
    if (!token) return;
    api.users.me(token).then((data) => { setMe(data); setName(data.name); setPhone(data.phone ?? ""); });
    api.referrals.me(token).then(setReferral).catch(() => setReferral(null));
    const stored = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) { try { setLocation(JSON.parse(stored)); } catch { /* ignora */ } }
  }, [token]);

  async function saveProfile() {
    if (!token) return;
    setSaving(true);
    setSavedOk(false);
    try {
      await api.users.updateMe(token, { name, phone: phone || null });
      setSavedOk(true);
    } finally {
      setSaving(false);
    }
  }

  async function useMyLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      const result = await detectLocation();
      setLocation(result);
      window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(result));
    } catch {
      setLocationError(t("profile.locationDenied"));
    } finally {
      setLocating(false);
    }
  }

  function copyAddress() {
    if (location) void copy(location.address, "address");
  }

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <h1 className="text-xl font-bold">{t("profile.title")}</h1>

        {me === null ? (
          <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.name")}
              className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
            <input value={me.email} disabled className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm text-ink-faint" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("auth.phone")}
              className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
            <Button onClick={saveProfile} disabled={saving}>{t("common.save")}</Button>
            {savedOk && <span className="ml-2 text-xs text-success">✓</span>}
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-1 text-sm font-semibold">{t("profile.locationTitle")}</h2>
          <p className="mb-3 text-xs text-ink-faint">{t("profile.locationHint")}</p>
          <Button variant="secondary" onClick={useMyLocation} disabled={locating}>{t("profile.useLocation")}</Button>
          {locationError && <p className="mt-2 text-xs text-danger">{locationError}</p>}
          {location && (
            <div className="mt-3 rounded-lg bg-elevated p-3">
              <p className="text-sm">{location.address}</p>
              <button onClick={copyAddress} className={`press mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors ${copied ? "text-success" : "text-primary-text hover:text-ink"}`}>
                {copied ? <CheckIcon className="pop" width={16} height={16} /> : <ClipboardIcon width={16} height={16} />}
                {copied ? t("common.copied") : t("common.copy")}
              </button>
            </div>
          )}
        </div>

        {referral && <ReferralCard referral={referral} />}
      </div>
    </main>
  );
}
