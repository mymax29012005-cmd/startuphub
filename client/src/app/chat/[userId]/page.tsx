"use client";

import React, { use as useReact, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

export default function ChatThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: otherUserId } = useReact(params);
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [open, setOpen] = useState<OpenRes | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (conversationId: string) => {
    const r = await fetch(`/api/v1/chats/${conversationId}/messages`, { credentials: "include" });
    if (!r.ok) return;
    const data = (await r.json()) as ChatMsg[];
    setMessages(data);
  }, []);

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
  }, [me, otherUserId, t, loadMessages]);

  useEffect(() => {
    if (!open?.conversationId) return;
    const tmr = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadMessages(open.conversationId);
    }, 12000);
    return () => window.clearInterval(tmr);
  }, [open?.conversationId, loadMessages]);

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
    }
  }

  if (me === undefined || (me !== null && loading)) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-[rgba(234,240,255,0.72)]">…</div>;
  }

  if (me === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-6">
          <p className="text-sm text-[rgba(234,240,255,0.85)]">{t("chatsPage.loginRequired")}</p>
          <Link href="/login" className="mt-4 inline-block text-[var(--accent)] hover:text-white text-sm font-medium">
            {t("nav.login")}
          </Link>
        </Card>
      </div>
    );
  }

  if (err || !open) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-6">
          <p className="text-sm text-[rgba(234,240,255,0.85)]">{err ?? t("chatsPage.threadLoadError")}</p>
          <Link href="/chats" className="mt-4 inline-block text-[var(--accent)] hover:text-white text-sm font-medium">
            ← {t("chatsPage.title")}
          </Link>
        </Card>
      </div>
    );
  }

  const { otherUser } = open;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-4 min-h-[70vh]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/chats" className="text-[var(--accent)] hover:text-white text-sm shrink-0">
            ←
          </Link>
          <div className="h-10 w-10 rounded-2xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden shrink-0">
            {otherUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherUser.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <Link href={`/users/${otherUser.id}`} className="font-semibold text-white truncate block hover:text-[var(--accent)]">
              {otherUser.name}
            </Link>
            <div className="text-xs text-[rgba(234,240,255,0.5)]">{t("nav.chats")}</div>
          </div>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-[420px] max-h-[calc(100vh-220px)]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((m) => {
            const mine = m.senderId === me.id;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "bg-[rgba(110,168,255,0.22)] text-white border border-[rgba(110,168,255,0.35)]"
                      : "bg-white/[0.06] text-[rgba(234,240,255,0.92)] border border-[rgba(255,255,255,0.10)]",
                  ].join(" ")}
                >
                  {!mine ? (
                    <div className="text-[10px] text-[rgba(234,240,255,0.45)] mb-1">{m.sender.name}</div>
                  ) : null}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t("chatsPage.messagePlaceholder")}
            rows={2}
            className="flex-1 rounded-2xl bg-white/[0.06] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-sm text-white placeholder:text-[rgba(234,240,255,0.35)] resize-none"
          />
          <Button type="button" className="h-auto shrink-0 px-4" onClick={() => void send()}>
            {t("chatsPage.send")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
