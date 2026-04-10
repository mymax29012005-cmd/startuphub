"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { accountTypeLabelsByLang } from "@/lib/labelMaps";
import { useI18n } from "@/i18n/I18nProvider";

type Me = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  accountType: "founder" | "investor" | "partner" | "buyer";
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [accountType, setAccountType] = useState<Me["accountType"]>("founder");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as Me;
        if (cancelled) return;
        setMe(data);
        setName(data.name);
        setBio(data.bio ?? "");
        setAccountType(data.accountType);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("bio", bio);
      form.append("accountType", accountType);
      if (avatarFile) form.append("avatar", avatarFile);

      const r = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        credentials: "include",
        body: form,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Ошибка сохранения");
        return;
      }
      setMe(data as Me);
      setAvatarFile(null);
      router.push("/profile");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">{t("pages.profileSettingsTitle")}</h1>

        {loading ? (
          <div className="mt-6 text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>
        ) : !me ? (
          <div className="mt-6 text-[rgba(234,240,255,0.72)]">
            Чтобы редактировать профиль, пожалуйста, войдите в аккаунт.
          </div>
        ) : (
          <form className="mt-7 flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
                {me.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.avatarUrl} alt={me.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <div className="text-xs text-[rgba(234,240,255,0.72)]">Аватар</div>
                <input
                  className="mt-2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setAvatarFile(f);
                  }}
                />
              </div>
            </div>

            <Input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />

            <textarea
              className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[130px]"
              placeholder="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />

            <label className="flex flex-col gap-2">
              <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("pages.status")}</div>
              <select
                className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
              >
                {(["founder", "investor", "partner", "buyer"] as const).map((t) => (
                  <option key={t} value={t}>
                    {accountTypeLabelsByLang[lang]?.[t] ?? t}
                  </option>
                ))}
              </select>
            </label>

            {error ? <div className="text-sm text-red-300">{error}</div> : null}

            <Button type="submit" disabled={saving} className="h-11">
              {saving ? "…" : t("pages.save")}
            </Button>

            <Button type="button" variant="ghost" className="h-11" onClick={onLogout}>
              {t("pages.logout")}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}


