"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";

type LoginMode = "email" | "phone";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!password || password.length < 8) return false;
    if (mode === "email") return email.trim().length > 0;
    return phone.trim().length > 0;
  }, [email, mode, password, phone]);

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
          email: mode === "email" && email.trim() ? email.trim() : undefined,
          phone: mode === "phone" && phone.trim() ? phone.trim() : undefined,
          password,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const base = (data?.error as string) ?? "Не удалось войти";
        const reason = typeof data?.reason === "string" && data.reason.trim() ? String(data.reason).trim() : "";
        setError(reason ? `${base}: ${reason}` : base);
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
    <div className="bg-[#0A0A0F] text-white min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="logo-dot inline-block h-4 w-4 rounded-full" />
            <span className="text-xl sm:text-3xl font-semibold tracking-tight">StartupHub</span>
          </Link>
          <Link href="/" className="text-sm sm:text-base text-gray-400 hover:text-white flex items-center gap-2">
            ← На главную
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter">С возвращением</h1>
          <p className="text-gray-400 mt-3 text-base sm:text-xl">Войдите, чтобы продолжить работу с проектами и аукционами</p>
        </div>

        <div className="max-w-md mx-auto bg-[#12121A] border border-white/10 rounded-3xl p-6 sm:p-10">
          <h2 className="text-2xl font-semibold mb-8 text-center">Вход в аккаунт</h2>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode("email");
                  setError(null);
                }}
                className={[
                  "py-3 rounded-xl text-sm font-semibold transition",
                  mode === "email" ? "bg-gradient-to-r from-violet-600 to-rose-500 text-white" : "text-gray-300 hover:text-white",
                ].join(" ")}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("phone");
                  setError(null);
                }}
                className={[
                  "py-3 rounded-xl text-sm font-semibold transition",
                  mode === "phone" ? "bg-gradient-to-r from-violet-600 to-rose-500 text-white" : "text-gray-300 hover:text-white",
                ].join(" ")}
              >
                Телефон
              </button>
            </div>

            {mode === "email" ? (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Телефон</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                  placeholder="+7 (999) 123-45-67"
                  autoComplete="tel"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                placeholder="Пароль"
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="text-sm text-red-300">{error}</div> : null}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-5 sm:py-6 text-lg sm:text-xl font-semibold rounded-3xl bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition disabled:opacity-60"
            >
              {loading ? "…" : t("auth.submitLogin")}
            </button>

            <div className="text-center text-sm text-gray-400">
              Нет аккаунта?{" "}
              <Link className="text-violet-400 hover:text-violet-300 font-medium" href="/register">
                Зарегистрироваться
              </Link>
            </div>

            <p className="text-center text-xs text-gray-500">
              Продолжая, вы соглашаетесь с{" "}
              <Link className="text-violet-400 hover:text-violet-300" href="/terms">
                Условиями
              </Link>{" "}
              и{" "}
              <Link className="text-violet-400 hover:text-violet-300" href="/privacy">
                Политикой конфиденциальности
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
