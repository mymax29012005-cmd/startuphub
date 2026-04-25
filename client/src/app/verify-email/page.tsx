"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 max-w-3xl mx-auto px-6 pb-16 text-gray-400">Загрузка…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState<string>("");
  const [manual, setManual] = useState("");

  async function runVerify(t: string) {
    setStatus("loading");
    setMsg("");
    const trimmed = (t ?? "").trim();
    if (!trimmed) {
      setStatus("err");
      setMsg("Нет токена подтверждения.");
      return;
    }
    try {
      const r = await fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
      const data = (await r.json().catch(() => ({}))) as { error?: string; ok?: boolean; already?: boolean };
      if (!r.ok) throw new Error(data.error ?? "Не удалось подтвердить email");
      setStatus("ok");
      setMsg(data.already ? "Email уже подтверждён." : "Email подтверждён. Спасибо!");
      try {
        window.dispatchEvent(new Event("startuphub:session"));
      } catch {
        // ignore
      }
    } catch (e) {
      setStatus("err");
      setMsg(e instanceof Error ? e.message : "Не удалось подтвердить email");
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        if (!cancelled) {
          setStatus("err");
          setMsg("Нет токена в ссылке. Вставьте токен вручную ниже.");
        }
        return;
      }
      await runVerify(token);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // runVerify замыкается на текущий рендер; зависим только от token из URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen text-white">
      <div className="pt-28 max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-[#12121A] p-8 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {status === "loading" ? "Подтверждаем email…" : status === "ok" ? "Готово" : "Ошибка"}
          </h1>
          <div className="mt-4 text-gray-300">{status === "loading" ? "Пожалуйста, подождите." : msg}</div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/profile"
              className="w-full sm:w-auto px-7 py-4 rounded-3xl font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition text-center"
            >
              В профиль
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-4 rounded-3xl font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition text-center"
            >
              Войти
            </Link>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Письмо не приходит (например, в Gmail)?</div>
          <p className="mt-2 text-xs text-white/55">
            Скопируйте длинный токен из письма или из ссылки после <span className="text-white/80">token=</span> и вставьте сюда.
          </p>
          <textarea
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1A1A24] px-4 py-3 text-sm text-white placeholder:text-white/30"
            placeholder="Вставьте токен…"
          />
          <button
            type="button"
            disabled={status === "loading" || !manual.trim()}
            onClick={() => void runVerify(manual)}
            className="mt-3 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            Подтвердить по токену
          </button>
        </div>

        <div className="mt-6 text-xs text-white/40">
          Если ссылка истекла — откройте профиль и запросите письмо подтверждения повторно.
        </div>
      </div>
    </div>
  );
}

