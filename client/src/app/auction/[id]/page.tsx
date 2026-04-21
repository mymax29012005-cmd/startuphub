"use client";

import React, { use as useReact, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { Button } from "@/components/ui/Button";

type Me = { id: string; role: "user" | "admin" };

type AuctionDetail = {
  id: string;
  currentPrice: number;
  status: "planned" | "live" | "finished";
  startsAt: string;
  registrationEndsAt: string;
  endsAt: string | null;
  isActive: boolean;
  winnerUserId: string | null;
  winnerUser: { id: string; name: string; avatarUrl: string | null } | null;
  startup: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    ownerId: string;
    owner: { id: string; name: string; avatarUrl: string | null; rating: number };
  };
  participants: Array<{
    id: string;
    userId: string;
    active: boolean;
    joinedAt: string;
    leftAt: string | null;
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
  bids: Array<{
    id: string;
    userId: string;
    user: { id: string; name: string; avatarUrl: string | null } | null;
    amount: number;
    createdAt: string;
  }>;
};

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = useReact(params);
  const [me, setMe] = useState<Me | null>(null);
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("cosmic-bg");
    return () => {
      document.body.classList.remove("cosmic-bg");
    };
  }, []);
  const [bidAmount, setBidAmount] = useState("");
  const [acting, setActing] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  async function refreshAuction() {
    const r = await fetch(`/api/v1/auctions/${id}`, { cache: "no-store" });
    if (r.ok) setAuction((await r.json()) as AuctionDetail);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const m = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (m.ok && !cancelled) setMe((await m.json()) as Me);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setDbError(false);
      try {
        const r = await fetch(`/api/v1/auctions/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        const data = (await r.json()) as AuctionDetail;
        if (!cancelled) setAuction(data);
      } catch {
        if (!cancelled) setDbError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!auction) return;
    const tmr = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      setNowTs(Date.now());
      void refreshAuction().catch(() => {});
    }, 3000);
    return () => window.clearInterval(tmr);
  }, [auction?.id]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState !== "hidden") void refreshAuction();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [id]);

  const ownerBlock = useMemo(() => {
    if (!auction) return null;
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
          {auction.startup.owner.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={auction.startup.owner.avatarUrl}
              alt={auction.startup.owner.name}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{auction.startup.owner.name}</div>
          <div className="text-xs text-[rgba(234,240,255,0.72)]">
            Рейтинг: {auction.startup.owner.rating.toFixed(1)}
          </div>
        </div>
      </div>
    );
  }, [auction]);

  const isOwner = !!me && !!auction && me.id === auction.startup.ownerId;
  const myParticipant = useMemo(() => {
    if (!me || !auction) return null;
    return auction.participants.find((p) => p.userId === me.id) ?? null;
  }, [auction, me]);
  const isJoinedActive = !!myParticipant?.active;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/auction" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← Назад к аукционам
        </Link>
        {me && auction && (me.role === "admin" || me.id === auction.startup.ownerId) ? (
          <DeleteResourceButton
            apiUrl={`/api/v1/auctions/${id}`}
            onDeleted={() => router.push("/auction")}
          />
        ) : null}
      </div>

      {loading ? (
        <div className="text-[rgba(234,240,255,0.72)]">Загрузка…</div>
      ) : dbError ? (
        <div className="text-[rgba(234,240,255,0.72)]">База данных недоступна.</div>
      ) : !auction ? (
        <div className="text-[rgba(234,240,255,0.72)]">Аукцион не найден.</div>
      ) : (
        <Card className="p-5 sm:p-6 md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Аукцион</Badge>
                <Badge>{auction.startup.category}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-white leading-tight sm:text-3xl">{auction.startup.title}</h1>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)]">
                Текущая цена:{" "}
                <b className="text-white">{auction.currentPrice.toLocaleString("ru-RU")} ₽</b>
              </div>
              <div className="mt-1 text-sm text-[rgba(234,240,255,0.72)]">
                Старт: {new Date(auction.startsAt).toLocaleString("ru-RU")}
              </div>
              <div className="mt-1 text-sm text-[rgba(234,240,255,0.72)]">
                Регистрация до: {new Date(auction.registrationEndsAt).toLocaleString("ru-RU")}
              </div>
              {auction.status === "planned" ? (
                <div className="mt-2 text-xs text-[rgba(234,240,255,0.55)]">
                  До старта:{" "}
                  {Math.max(0, new Date(auction.startsAt).getTime() - nowTs) < 60_000
                    ? "меньше минуты"
                    : `${Math.ceil(Math.max(0, new Date(auction.startsAt).getTime() - nowTs) / 60_000)} мин`}
                </div>
              ) : null}
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-[rgba(234,240,255,0.72)]">Статус</div>
              <div className="text-sm font-semibold text-white">{auction.status}</div>
            </div>
          </div>

          <div className="mt-6">{ownerBlock}</div>

          <div className="mt-6 flex flex-col gap-3">
            {auction.status === "finished" && auction.winnerUser ? (
              <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
                <div className="text-sm text-[rgba(234,240,255,0.72)]">Победитель</div>
                <Link
                  href={`/users/${auction.winnerUser.id}`}
                  className="mt-1 inline-flex items-center gap-2 text-white font-semibold hover:text-[var(--accent)]"
                >
                  {auction.winnerUser.name}
                </Link>
              </div>
            ) : null}
            <div className="text-sm text-[rgba(234,240,255,0.72)]">
              Участники: <b className="text-white">{auction.participants.length}</b> · Активные:{" "}
              <b className="text-white">{auction.participants.filter((p) => p.active).length}</b>
            </div>
            {me ? (
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                {auction.status === "planned" && !isOwner && !isJoinedActive ? (
                  <Button
                    variant="secondary"
                    disabled={acting}
                    onClick={async () => {
                      setActing(true);
                      setActionErr(null);
                      try {
                        const rr = await fetch(`/api/v1/auctions/${auction.id}/join`, { method: "POST", credentials: "include" });
                        if (!rr.ok) {
                          const j = await rr.json().catch(() => null);
                          setActionErr(j?.error ?? "Не удалось записаться");
                          return;
                        }
                        const r = await fetch(`/api/v1/auctions/${id}`, { cache: "no-store" });
                        if (r.ok) setAuction((await r.json()) as AuctionDetail);
                      } finally {
                        setActing(false);
                      }
                    }}
                    className="h-10 w-full sm:w-auto"
                  >
                    Записаться
                  </Button>
                ) : null}

                {(auction.status === "planned" || auction.status === "live") && !isOwner && isJoinedActive ? (
                  <Button
                    variant="secondary"
                    disabled={acting}
                    onClick={async () => {
                      setActing(true);
                      setActionErr(null);
                      try {
                        const rr = await fetch(`/api/v1/auctions/${auction.id}/leave`, { method: "POST", credentials: "include" });
                        if (!rr.ok) {
                          const j = await rr.json().catch(() => null);
                          setActionErr(j?.error ?? "Не удалось выйти");
                          return;
                        }
                        const r = await fetch(`/api/v1/auctions/${id}`, { cache: "no-store" });
                        if (r.ok) setAuction((await r.json()) as AuctionDetail);
                      } finally {
                        setActing(false);
                      }
                    }}
                    className="h-10 w-full sm:w-auto"
                  >
                    Выйти из аукциона
                  </Button>
                ) : null}

                <Button
                  variant="ghost"
                  className="h-10 w-full sm:w-auto"
                  onClick={() => setShowParticipants((v) => !v)}
                >
                  {showParticipants ? "Скрыть участников" : "Список участников"}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-[rgba(234,240,255,0.72)]">Войдите в аккаунт, чтобы участвовать.</div>
            )}
            {actionErr ? <div className="text-sm text-[rgba(255,160,160,0.95)]">{actionErr}</div> : null}
            {showParticipants ? (
              <div className="grid grid-cols-1 gap-2">
                {auction.participants.map((p) => (
                  <div
                    key={p.id}
                    className="glass rounded-3xl p-3 border border-[rgba(255,255,255,0.12)] flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/users/${p.user.id}`}
                      className="text-sm text-white hover:text-[var(--accent)] truncate"
                    >
                      {p.user.name}
                    </Link>
                    <div className="text-xs text-[rgba(234,240,255,0.55)]">{p.active ? "active" : "watch"}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {me && auction.status === "live" && !isOwner && isJoinedActive ? (
            <div className="mt-6">
              <div className="text-sm font-semibold text-white">Сделать ставку</div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={bidAmount}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    const n = digits ? Number(digits) : 0;
                    if (!digits) return setBidAmount("");
                    setBidAmount(new Intl.NumberFormat("ru-RU").format(n));
                  }}
                  placeholder="Сумма"
                  className="h-11 flex-1 rounded-2xl bg-white/[0.06] border border-[rgba(255,255,255,0.12)] px-3 text-sm text-white placeholder:text-[rgba(234,240,255,0.35)]"
                />
                <Button
                  disabled={acting}
                  className="h-11"
                  onClick={async () => {
                    const n = Number(String(bidAmount).replace(/[^\d]/g, ""));
                    if (!Number.isFinite(n) || n <= 0) return;
                    setActing(true);
                    setActionErr(null);
                    try {
                      const r = await fetch(`/api/v1/auctions/${auction.id}/bids`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount: n }),
                      });
                      if (!r.ok) {
                        const j = await r.json().catch(() => null);
                        setActionErr(j?.error ?? "Не удалось поставить");
                        return;
                      }
                      setBidAmount("");
                      const rr = await fetch(`/api/v1/auctions/${id}`, { cache: "no-store" });
                      if (rr.ok) setAuction((await rr.json()) as AuctionDetail);
                    } finally {
                      setActing(false);
                    }
                  }}
                >
                  Поставить
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <div className="text-sm font-semibold text-white">Описание стартапа</div>
            <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">{auction.startup.description}</div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-white">Последние ставки</div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {auction.bids.length === 0 ? (
                <div className="text-sm text-[rgba(234,240,255,0.72)]">Пока нет ставок.</div>
              ) : (
                auction.bids.map((b) => (
                  <div
                    key={b.id}
                    className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)] flex items-center justify-between gap-4"
                  >
                    <div className="text-sm">
                      <div className="text-white/90 font-medium">
                        {b.user ? (
                          <Link href={`/users/${b.user.id}`} className="hover:text-[var(--accent)]">
                            {b.user.name}
                          </Link>
                        ) : (
                          "Пользователь"
                        )}
                      </div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)]">
                        {new Date(b.createdAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {b.amount.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

