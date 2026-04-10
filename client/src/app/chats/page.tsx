"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n/I18nProvider";

type Row = {
  id: string;
  otherUser: { id: string; name: string; avatarUrl: string | null };
  lastMessage: null | { body: string; at: string; fromMe: boolean };
  updatedAt: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "error" }
  | { status: "ok"; rows: Row[] };

export default function ChatsPage() {
  const { t } = useI18n();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/chats", { credentials: "include" });
        if (cancelled) return;
        if (r.status === 401) {
          setState({ status: "guest" });
          return;
        }
        if (!r.ok) {
          setState({ status: "error" });
          return;
        }
        const rows = (await r.json()) as Row[];
        setState({ status: "ok", rows });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[rgba(234,240,255,0.72)]">…</div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[rgba(234,240,255,0.72)]">
        {t("chatsPage.loadError")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-[rgba(234,240,255,0.72)] text-sm mb-1">{t("nav.chats")}</div>
      <h1 className="text-2xl font-semibold text-white mb-6">{t("chatsPage.title")}</h1>

      {state.status === "guest" ? (
        <Card className="p-6">
          <p className="text-sm text-[rgba(234,240,255,0.85)]">{t("chatsPage.loginRequired")}</p>
          <Link href="/login" className="mt-4 inline-block text-[var(--accent)] hover:text-white text-sm font-medium">
            {t("nav.login")}
          </Link>
        </Card>
      ) : state.rows.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-[rgba(234,240,255,0.85)]">{t("chatsPage.emptyList")}</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden divide-y divide-[rgba(255,255,255,0.08)]">
          {state.rows.map((row) => (
            <Link
              key={row.id}
              href={`/chat/${row.otherUser.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition"
            >
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden shrink-0">
                {row.otherUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.otherUser.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white truncate">{row.otherUser.name}</div>
                {row.lastMessage ? (
                  <div className="text-xs text-[rgba(234,240,255,0.55)] truncate mt-0.5">
                    {row.lastMessage.fromMe ? t("chatsPage.lastMessageYou") : ""}
                    {row.lastMessage.body}
                  </div>
                ) : (
                  <div className="text-xs text-[rgba(234,240,255,0.45)] mt-0.5">—</div>
                )}
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
