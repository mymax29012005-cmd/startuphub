"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim() ? email.trim() : undefined,
          phone: phone.trim() ? phone.trim() : undefined,
          password,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Не удалось войти");
        return;
      }
      router.push("/profile");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="glass rounded-3xl p-6 md:p-10">
        <h1 className="text-2xl font-semibold">{t("auth.loginTitle")}</h1>
        <p className="mt-2 text-sm text-[rgba(234,240,255,0.72)]">
          Войдите, чтобы публиковать проекты, участвовать в аукционах и сохранять избранное.
        </p>

        <form className="mt-7 flex flex-col gap-4" onSubmit={onSubmit}>
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
          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button type="submit" disabled={loading} className="h-11">
            {loading ? "…" : t("auth.submitLogin")}
          </Button>
        </form>
      </div>
    </div>
  );
}

