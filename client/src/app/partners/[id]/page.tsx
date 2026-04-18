"use client";

import React, { use as useReact, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { Button } from "@/components/ui/Button";

type Me = { id: string; role: "user" | "admin" };

type PartnerDetail = {
  id: string;
  role: string;
  industry: string;
  description: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  attachments?: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string | null;
    size: number | null;
    createdAt: string;
  }>;
};

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = useReact(params);
  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const m = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (m.ok && !c) setMe((await m.json()) as Me);
      } catch {
        // ignore
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setDbError(false);
      try {
        const r = await fetch(`/api/v1/partners/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        const data = (await r.json()) as PartnerDetail;
        if (!cancelled) setItem(data);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/marketplace?tab=partners" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← Назад к запросам партнёров
        </Link>
        <div className="flex items-center gap-2">
          {me && item && (me.role === "admin" || me.id === item.author.id) ? (
            <Link href={`/partners/${id}/edit`}>
              <Button variant="secondary" className="h-10">
                Редактировать
              </Button>
            </Link>
          ) : null}
          {me && item && (me.role === "admin" || me.id === item.author.id) ? (
            <DeleteResourceButton
              apiUrl={`/api/v1/partners/${id}`}
              onDeleted={() => router.push("/marketplace?tab=partners")}
            />
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-[rgba(234,240,255,0.72)]">Загрузка…</div>
      ) : dbError ? (
        <div className="text-[rgba(234,240,255,0.72)]">База данных недоступна.</div>
      ) : !item ? (
        <div className="text-[rgba(234,240,255,0.72)]">Запрос не найден.</div>
      ) : (
        <Card className="p-6 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{item.industry}</Badge>
                <Badge>{item.role}</Badge>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-white leading-tight">Запрос партнёра</h1>
            </div>
            <div className="text-right">
              <div className="text-xs text-[rgba(234,240,255,0.72)]">Создан</div>
              <div className="text-sm font-semibold text-white">
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-3xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
              {item.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.author.avatarUrl} alt={item.author.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{item.author.name}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-white">Описание</div>
            <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">{item.description}</div>
          </div>

          {item.attachments && item.attachments.length ? (
            <div className="mt-6">
              <div className="text-sm font-semibold text-white">Файлы</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {item.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(110,168,255,0.35)] transition text-sm text-white/90"
                  >
                    {a.filename}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

