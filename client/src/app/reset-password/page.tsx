"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const e = sp.get("email");
      if (e && e.includes("@")) setEmail(e);
    } catch {
      // ignore
    }
  }, []);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !email.includes("@")) return false;
    if (!code.trim() || code.trim().length < 4) return false;
    if (!newPassword || newPassword.length < 8) return false;
    if (newPassword !== newPassword2) return false;
    return true;
  }, [code, email, newPassword, newPassword2]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/v1/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data?.error as string) ?? "Ошибка");
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
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
          <button type="button" onClick={() => router.back()} className="text-sm sm:text-base text-gray-400 hover:text-white">
            ← Назад
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
        <div className="max-w-md mx-auto bg-[#12121A] border border-white/10 rounded-3xl p-6 sm:p-10">
          <h1 className="text-2xl font-semibold mb-2 text-center">Сброс пароля</h1>
          <p className="text-sm text-gray-400 text-center mb-8">Введите код из письма (проверьте “Спам”) и задайте новый пароль.</p>

          {ok ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-gray-200">
              Пароль обновлён.
              <div className="mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
                >
                  Войти
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-violet-500"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Код</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-violet-500"
                  placeholder="123456"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-violet-500"
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Повторите пароль</label>
                <input
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-violet-500"
                  placeholder="Повторите пароль"
                  autoComplete="new-password"
                />
              </div>

              {error ? <div className="text-sm text-red-300">{error}</div> : null}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full py-5 text-lg font-semibold rounded-3xl bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition disabled:opacity-60"
              >
                {loading ? "…" : "Сменить пароль"}
              </button>
            </form>
          )}

          <div className="mt-6 flex justify-between text-sm text-gray-400">
            <Link className="text-violet-400 hover:text-violet-300 font-medium" href="/forgot-password">
              Отправить код ещё раз
            </Link>
            <Link className="text-violet-400 hover:text-violet-300 font-medium" href="/login">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

