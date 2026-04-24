"use client";

import React, { useMemo, useState } from "react";

import { useSiteSession } from "@/contexts/SessionContext";

export function EmailVerifyBanner() {
  const { user, loading } = useSiteSession();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const show = useMemo(() => {
    if (loading) return false;
    if (!user) return false;
    if (!user.email) return false;
    return !user.emailVerifiedAt;
  }, [loading, user]);

  if (!show) return null;

  return (
    <div className="border-b border-white/10 bg-amber-500/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-amber-100">
          <span className="font-semibold text-white">Подтвердите email</span> для полного функционала. Письмо могло попасть в{" "}
          <span className="font-semibold">спам</span>.
        </div>
        <div className="flex items-center gap-3">
          {sent ? <div className="text-xs text-emerald-200">Письмо отправлено</div> : null}
          {err ? <div className="text-xs text-rose-200">{err}</div> : null}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setErr(null);
              setSent(false);
              try {
                const r = await fetch("/api/v1/auth/verify-email/resend", { method: "POST", credentials: "include" });
                const data = (await r.json().catch(() => ({}))) as { error?: string; ok?: boolean };
                if (!r.ok) throw new Error(data?.error ?? "Ошибка");
                setSent(true);
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Ошибка");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-60"
          >
            Отправить ещё раз
          </button>
        </div>
      </div>
    </div>
  );
}

