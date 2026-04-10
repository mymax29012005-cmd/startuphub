"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { accountTypeLabelsByLang } from "@/lib/labelMaps";

const accountTypes = ["founder", "investor", "partner", "buyer"] as const;

export default function RegisterPage() {
  const { t, lang } = useI18n();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<(typeof accountTypes)[number]>("founder");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email: email.trim() ? email.trim() : undefined,
          phone: phone.trim() ? phone.trim() : undefined,
          password,
          accountType,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Не удалось создать аккаунт");
        return;
      }
      router.push("/login");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="glass rounded-3xl p-6 md:p-10">
        <h1 className="text-2xl font-semibold">{t("auth.registerTitle")}</h1>

        <form className="mt-7 flex flex-col gap-4" onSubmit={onSubmit}>
          <Input placeholder={t("auth.name")} value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Эл. почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
          />
          <Input
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
          <Input
            type="password"
            placeholder={t("auth.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Badge>{t("auth.accountType")}</Badge>
            <select
              className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
            >
              {accountTypes.map((tpe) => (
                <option key={tpe} value={tpe}>
                  {accountTypeLabelsByLang[lang]?.[tpe] ?? tpe}
                </option>
              ))}
            </select>
          </div>

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button type="submit" disabled={loading} className="h-11">
            {loading ? "…" : t("auth.submitRegister")}
          </Button>
        </form>
      </div>
    </div>
  );
}

