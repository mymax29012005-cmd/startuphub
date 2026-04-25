"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useSiteSession } from "@/contexts/SessionContext";

const DISMISS_PREFIX = "sh_email_verify_banner_dismiss:";

export function EmailVerifyBanner() {
  const { user, loading } = useSiteSession();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const dismissKey = user?.id ? `${DISMISS_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!dismissKey || typeof sessionStorage === "undefined") return;
    setDismissed(sessionStorage.getItem(dismissKey) === "1");
  }, [dismissKey]);

  const needsBanner = useMemo(() => {
    if (loading) return false;
    if (!user) return false;
    if (!user.email) return false;
    return !user.emailVerifiedAt;
  }, [loading, user]);

  const show = needsBanner && !dismissed;

  const onDismiss = useCallback(() => {
    if (!dismissKey) return;
    try {
      sessionStorage.setItem(dismissKey, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }, [dismissKey]);

  if (!show) return null;

  return (
    <div
      className="sticky top-0 z-[960] border-b border-amber-400/25 bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-amber-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
      role="region"
      aria-label="Подтверждение email"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3">
        <div className="min-w-0 pr-2 text-sm text-amber-50">
          <span className="font-semibold text-white">Подтвердите email</span> для полного функционала. Письмо могло попасть в{" "}
          <span className="font-semibold">спам</span> (проверьте Gmail → «Ещё» → «Спам»).
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          {sent ? <div className="text-xs text-emerald-200">Письмо отправлено</div> : null}
          {err ? <div className="max-w-[200px] truncate text-xs text-rose-200 sm:max-w-none">{err}</div> : null}
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
                try {
                  window.dispatchEvent(new Event("startuphub:session"));
                } catch {
                  // ignore
                }
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Ошибка");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-2xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 disabled:opacity-60 sm:px-4 sm:py-2"
          >
            Отправить ещё раз
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg leading-none text-white hover:bg-white/20"
            aria-label="Скрыть напоминание"
            title="Скрыть до следующего визита"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
