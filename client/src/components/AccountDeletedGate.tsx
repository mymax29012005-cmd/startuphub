"use client";

import React, { useEffect, useState } from "react";

type DeletedState = { reason: string } | null;

export function AccountDeletedGate() {
  const [deleted, setDeleted] = useState<DeletedState>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" });
        if (r.status !== 403) return;
        const data = (await r.json().catch(() => ({}))) as { error?: string; reason?: string };
        if (data?.error !== "Аккаунт удалён") return;
        const reason = (data?.reason || "Удалён администратором").trim();
        if (!cancelled) setDeleted({ reason });
      } catch {
        // ignore
      }
    }

    void check();
    function onFocus() {
      void check();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  if (!deleted) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#12121A] p-6 sm:p-8 shadow-2xl">
        <div className="text-2xl font-bold text-white">Ваш аккаунт удалён</div>
        <div className="mt-3 text-sm text-gray-300">
          Причина: <span className="text-white/90">{deleted.reason}</span>
        </div>
        <div className="mt-2 text-xs text-gray-500">После подтверждения вы выйдете из аккаунта и сможете зарегистрироваться заново.</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
              } catch {
                // ignore
              } finally {
                window.location.href = "/register";
              }
            }}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

