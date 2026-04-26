"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";

type Row = {
  id: string;
  otherUser: { id: string; name: string; avatarUrl: string | null };
  unreadCount: number;
  lastMessage: null | { body: string; at: string; fromMe: boolean };
  updatedAt: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "error" }
  | { status: "ok"; rows: Row[] };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[1]![0]! : "";
  return (a + b).toUpperCase();
}

function formatListTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export default function ChatsPage() {
  const { t } = useI18n();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [q, setQ] = useState("");
  const [supportUserId, setSupportUserId] = useState<string | null>(null);

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

  useEffect(() => {
    if (state.status !== "ok") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/v1/chats/support-user", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as { user?: { id: string } };
        const id = data?.user?.id;
        if (!cancelled && typeof id === "string" && id) setSupportUserId(id);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  const rows = useMemo(() => {
    if (state.status !== "ok") return [];
    const query = q.trim().toLowerCase();
    if (!query) return state.rows;
    return state.rows.filter((r) => {
      const blob = [
        r.otherUser.name,
        r.lastMessage?.body ?? "",
        r.id,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [q, state]);

  return (
    <div className="bg-[#0A0A0F] text-white h-[100dvh] flex flex-col">
      <nav className="bg-[rgba(10,10,15,0.95)] backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 min-w-0">
            <span className="logo-dot inline-block h-4 w-4 shrink-0 rounded-full" />
            <span className="text-xl sm:text-2xl font-semibold tracking-tight truncate">StartupHub</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link className="hover:text-violet-400" href="/">
              Главная
            </Link>
            <Link className="hover:text-violet-400" href="/marketplace">
              Маркетплейс
            </Link>
            <span className="text-violet-400 font-semibold">Чаты</span>
            <Link className="hover:text-violet-400" href="/profile">
              Профиль
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-[380px] border-r border-white/10 chat-sidebar flex flex-col">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder="Поиск по чатам..."
                className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-violet-500"
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {state.status === "loading" ? <div className="text-sm text-gray-400 px-2 py-2">…</div> : null}
            {state.status === "error" ? <div className="text-sm text-gray-400 px-2 py-2">{t("chatsPage.loadError")}</div> : null}
            {state.status === "guest" ? (
              <div className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-5">
                <div className="text-sm text-gray-300">{t("chatsPage.loginRequired")}</div>
                <Link href="/login" className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm font-medium">
                  {t("nav.login")}
                </Link>
              </div>
            ) : null}

            {state.status === "ok" && supportUserId ? (
              <Link
                href={`/chat/${supportUserId}`}
                className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/5 transition"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden flex items-center justify-center text-base sm:text-lg font-bold shrink-0 bg-gradient-to-br from-emerald-500 to-cyan-400 text-black/80">
                  ?
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3">
                    <div className="font-medium truncate">Поддержка</div>
                    <div className="text-xs text-gray-500 shrink-0">online</div>
                  </div>
                  <div className="text-sm text-gray-400 truncate mt-0.5">Написать в поддержку</div>
                </div>
              </Link>
            ) : null}

            {state.status === "ok" && rows.length === 0 ? (
              <div className="text-sm text-gray-400 px-2 py-2">{t("chatsPage.emptyList")}</div>
            ) : null}

            {rows.map((row) => {
              const last = row.lastMessage;
              const time = last ? formatListTime(last.at) : formatListTime(row.updatedAt);
              return (
                <Link
                  key={row.id}
                  href={`/chat/${row.otherUser.id}`}
                  className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-3xl hover:bg-white/5 transition"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-rose-500 rounded-2xl overflow-hidden flex items-center justify-center text-base sm:text-lg font-bold shrink-0">
                    {row.otherUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.otherUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{initials(row.otherUser.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <div className="font-medium truncate">{row.otherUser.name}</div>
                      <div className="text-xs text-gray-400 shrink-0">{time}</div>
                    </div>
                    <div className="text-sm text-gray-400 truncate mt-0.5">
                      {last ? (
                        <>
                          {last.fromMe ? `${t("chatsPage.lastMessageYou")} ` : ""}
                          {last.body}
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                  {row.unreadCount > 0 ? (
                    <div className="w-7 h-7 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center shrink-0 mt-1">
                      {row.unreadCount > 9 ? "9+" : row.unreadCount}
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-col bg-[#0A0A0F]">
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="max-w-md text-center">
              <div className="text-2xl font-semibold">Выберите чат</div>
              <div className="mt-3 text-gray-400">Слева список диалогов — откройте любой, чтобы продолжить переписку.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
