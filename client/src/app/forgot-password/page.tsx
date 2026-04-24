"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && email.includes("@"), [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/v1/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data?.error as string) ?? "Ошибка");
      setDone(true);
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
          <h1 className="text-2xl font-semibold mb-2 text-center">Забыли пароль?</h1>
          <p className="text-sm text-gray-400 text-center mb-8">Введите email — мы отправим одноразовый код. Проверьте “Спам”.</p>

          {done ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-gray-200">
              Если аккаунт существует — код отправлен на почту.
              <div className="mt-4">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(email.trim())}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
                >
                  Ввести код
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

              {error ? <div className="text-sm text-red-300">{error}</div> : null}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full py-5 text-lg font-semibold rounded-3xl bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition disabled:opacity-60"
              >
                {loading ? "…" : "Отправить код"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            Вспомнили пароль?{" "}
            <Link className="text-violet-400 hover:text-violet-300 font-medium" href="/login">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

