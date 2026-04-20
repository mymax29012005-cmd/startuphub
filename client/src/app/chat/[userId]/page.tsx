"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use as useReact, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { accountTypeLabelsByLang } from "@/lib/labelMaps";
import { useI18n } from "@/i18n/I18nProvider";

type Me = { id: string };
type OpenRes = { conversationId: string; otherUser: { id: string; name: string; avatarUrl: string | null } };
type ChatMsg = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; avatarUrl: string | null };
};

type ConversationRow = {
  id: string;
  otherUser: { id: string; name: string; avatarUrl: string | null };
  unreadCount: number;
  lastMessage: null | { body: string; at: string; fromMe: boolean };
  updatedAt: string;
};

type PublicUserPayload = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  accountType: "founder" | "investor" | "partner" | "buyer";
  role: "user" | "admin";
  createdAt: string;
  startupsCount: number;
  ideasCount: number;
};

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default function ChatThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: otherUserId } = useReact(params);
  const searchParams = useSearchParams();
  const { t, lang } = useI18n();

  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [open, setOpen] = useState<OpenRes | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ConversationRow[]>([]);

  const [publicUser, setPublicUser] = useState<PublicUserPayload | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (conversationId: string) => {
    const r = await fetch(`/api/v1/chats/${conversationId}/messages`, { credentials: "include" });
    if (!r.ok) return;
    const data = (await r.json()) as ChatMsg[];
    setMessages(data);
  }, []);

  const loadConversations = useCallback(async () => {
    const r = await fetch("/api/v1/chats", { credentials: "include" });
    if (!r.ok) return;
    const data = (await r.json()) as ConversationRow[];
    setRows(data);
  }, []);

  useEffect(() => {
    const raw = searchParams.get("prefill");
    if (!raw) return;
    // don't clobber user's typing
    if (draft.trim()) return;
    try {
      const decoded = decodeURIComponent(raw);
      const safe = decoded.length > 1200 ? decoded.slice(0, 1200) : decoded;
      setDraft(safe);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (c) return;
        if (!r.ok) setMe(null);
        else setMe((await r.json()) as Me);
      } catch {
        if (!c) setMe(null);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/v1/users/${otherUserId}`, { cache: "no-store" });
        if (!r.ok) return;
        const payload = (await r.json()) as { user: PublicUserPayload };
        if (!cancelled) setPublicUser(payload.user);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  useEffect(() => {
    if (me === undefined) return;
    if (me === null) {
      setLoading(false);
      return;
    }
    if (me.id === otherUserId) {
      setErr(t("chatsPage.cannotSelf"));
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function run() {
      try {
        await loadConversations();
        const r = await fetch("/api/v1/chats/open", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otherUserId }),
        });
        if (cancelled) return;
        if (!r.ok) {
          setErr(t("chatsPage.threadLoadError"));
          setLoading(false);
          return;
        }
        const data = (await r.json()) as OpenRes;
        setOpen(data);
        await loadMessages(data.conversationId);
      } catch {
        if (!cancelled) setErr(t("chatsPage.threadLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [me, otherUserId, t, loadMessages, loadConversations]);

  useEffect(() => {
    if (!open?.conversationId) return;
    const tmr = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadMessages(open.conversationId);
      void loadConversations();
    }, 12000);
    return () => window.clearInterval(tmr);
  }, [open?.conversationId, loadMessages, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!open || !draft.trim()) return;
    const r = await fetch(`/api/v1/chats/${open.conversationId}/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft.trim() }),
    });
    if (r.ok) {
      setDraft("");
      await loadMessages(open.conversationId);
      await loadConversations();
    }
  }

  const filteredRows = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((r) => {
      const blob = [r.otherUser.name, r.lastMessage?.body ?? "", r.id].join(" ").toLowerCase();
      return blob.includes(query);
    });
  }, [q, rows]);

  const interestChips = useMemo(() => {
    const chips: string[] = [];
    if (publicUser?.startupsCount) chips.push(`Стартапы: ${publicUser.startupsCount}`);
    if (publicUser?.ideasCount) chips.push(`Идеи: ${publicUser.ideasCount}`);
    chips.push(accountTypeLabelsByLang[lang]?.[publicUser?.accountType ?? "founder"] ?? "Участник");
    return chips.slice(0, 6);
  }, [lang, publicUser?.accountType, publicUser?.ideasCount, publicUser?.startupsCount]);

  if (me === undefined || (me !== null && loading)) {
    return <div className="h-[100dvh] bg-[#0A0A0F] text-gray-400 flex items-center justify-center">…</div>;
  }

  if (me === null) {
    return (
      <div className="h-[100dvh] bg-[#0A0A0F] text-white flex flex-col">
        <nav className="bg-[rgba(10,10,15,0.95)] backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3 min-w-0">
              <span className="logo-dot inline-block h-4 w-4 shrink-0 rounded-full" />
              <span className="text-2xl font-semibold tracking-tight truncate">StartupHub</span>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#12121A] p-8">
            <div className="text-sm text-gray-300">{t("chatsPage.loginRequired")}</div>
            <Link href="/login" className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm font-medium">
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (err || !open) {
    return (
      <div className="h-[100dvh] bg-[#0A0A0F] text-white flex flex-col">
        <nav className="bg-[rgba(10,10,15,0.95)] backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3 min-w-0">
              <span className="logo-dot inline-block h-4 w-4 shrink-0 rounded-full" />
              <span className="text-2xl font-semibold tracking-tight truncate">StartupHub</span>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#12121A] p-8">
            <div className="text-sm text-gray-300">{err ?? t("chatsPage.threadLoadError")}</div>
            <Link href="/chats" className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm font-medium">
              ← {t("chatsPage.title")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { otherUser } = open;

  return (
    <div className="bg-[#0A0A0F] text-white h-[100dvh] flex flex-col">
      <nav className="bg-[rgba(10,10,15,0.95)] backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 min-w-0">
            <span className="logo-dot inline-block h-4 w-4 shrink-0 rounded-full" />
            <span className="text-2xl font-semibold tracking-tight truncate">StartupHub</span>
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
        {/* sidebar */}
        <div className="hidden md:flex w-[380px] border-r border-white/10 chat-sidebar flex-col">
          <div className="p-6 border-b border-white/10">
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

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredRows.map((row) => {
              const active = row.otherUser.id === otherUserId;
              const last = row.lastMessage;
              const time = last ? formatListTime(last.at) : formatListTime(row.updatedAt);
              return (
                <Link
                  key={row.id}
                  href={`/chat/${row.otherUser.id}`}
                  className={[
                    "flex gap-4 p-4 rounded-3xl transition",
                    active ? "bg-white/10" : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-rose-500 rounded-2xl overflow-hidden flex items-center justify-center text-lg font-bold shrink-0">
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

        {/* main chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-white/10 px-6 md:px-8 py-5 flex items-center gap-4 bg-[#12121A]">
            <Link href="/chats" className="md:hidden text-violet-400 hover:text-violet-300 text-sm shrink-0">
              ←
            </Link>
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-rose-500 rounded-2xl overflow-hidden flex items-center justify-center text-xl font-bold shrink-0">
              {otherUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherUser.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{initials(otherUser.name)}</span>
              )}
            </div>
            <div className="min-w-0">
              <Link href={`/users/${otherUser.id}`} className="font-semibold text-lg truncate block hover:text-violet-300">
                {otherUser.name}
              </Link>
              <div className="text-gray-400 text-sm">Диалог</div>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-5 text-gray-400">
              <Link href={`/users/${otherUser.id}`} className="hover:text-white text-sm">
                Профиль
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#0A0A0F]">
            {messages.map((m) => {
              const mine = m.senderId === me.id;
              const ts = formatMsgTime(m.createdAt);
              return (
                <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div className={["message-bubble", mine ? "my-message" : "their-message"].join(" ")}>
                    {!mine ? <div className="text-[11px] text-white/50 mb-1">{m.sender.name}</div> : null}
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    {ts ? <div className="text-[10px] mt-2 opacity-70 text-right">{ts}</div> : null}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="p-6 border-t border-white/10 bg-[#12121A]">
            <div className="flex gap-4">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                type="text"
                placeholder={t("chatsPage.messagePlaceholder")}
                className="flex-1 bg-[#1A1A24] border border-white/10 rounded-3xl px-7 py-5 focus:outline-none focus:border-violet-500 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void send()}
                className="w-14 h-14 bg-gradient-to-br from-violet-600 to-rose-500 rounded-3xl flex items-center justify-center hover:scale-110 transition"
                aria-label={t("chatsPage.send")}
                title={t("chatsPage.send")}
              >
                ➤
              </button>
            </div>
            <div className="text-center text-[10px] text-gray-500 mt-3">Сообщения передаются по защищённому соединению (HTTPS)</div>
          </div>
        </div>

        {/* right panel */}
        <div className="hidden xl:flex w-80 border-l border-white/10 bg-[#12121A] p-6 flex-col">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500 to-rose-500 rounded-3xl overflow-hidden flex items-center justify-center text-4xl font-bold">
              {otherUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherUser.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{initials(otherUser.name)}</span>
              )}
            </div>
            <h3 className="mt-5 font-semibold text-xl">{otherUser.name}</h3>
            <p className="text-violet-300 text-sm mt-1">
              {publicUser ? accountTypeLabelsByLang[lang]?.[publicUser.accountType] ?? publicUser.accountType : "—"}
            </p>
          </div>

          <div className="mt-10 space-y-6 text-sm flex-1 overflow-y-auto">
            <div>
              <div className="text-gray-400 mb-2">Интересы</div>
              <div className="flex flex-wrap gap-2">
                {interestChips.map((x) => (
                  <span key={x} className="bg-white/10 px-4 py-1.5 rounded-2xl">
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-gray-400 mb-2">О собеседнике</div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {publicUser?.bio?.trim()
                  ? publicUser.bio
                  : "Пользователь ещё не заполнил описание. Откройте публичный профиль, чтобы узнать больше."}
              </p>
            </div>
          </div>

          <Link
            href={`/users/${otherUser.id}`}
            className="mt-8 w-full py-4 border border-violet-500 text-violet-300 rounded-3xl hover:bg-violet-500/10 transition text-center text-sm font-semibold"
          >
            Открыть профиль
          </Link>
        </div>
      </div>
    </div>
  );
}
