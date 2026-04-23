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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      setMsg("");
      if (!token) {
        setStatus("err");
        setMsg("Нет токена подтверждения.");
        return;
      }
      try {
        const r = await fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = (await r.json().catch(() => ({}))) as { error?: string; ok?: boolean; already?: boolean };
        if (!r.ok) throw new Error(data.error ?? "Не удалось подтвердить email");
        if (!cancelled) {
          setStatus("ok");
          setMsg(data.already ? "Email уже подтверждён." : "Email подтверждён. Спасибо!");
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("err");
          setMsg(e instanceof Error ? e.message : "Не удалось подтвердить email");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
        <div className="mt-6 text-xs text-white/40">
          Если ссылка истекла — откройте профиль и запросите письмо подтверждения повторно.
        </div>
      </div>
    </div>
  );
}

