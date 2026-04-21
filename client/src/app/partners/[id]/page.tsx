"use client";

import React, { use as useReact, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { partnerRoleLabelsByLang } from "@/lib/labelMaps";
import { useI18n } from "@/i18n/I18nProvider";
import type { PartnerProfileExtra, PartnerService } from "@/lib/marketplaceExtras";

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
  profileExtra?: PartnerProfileExtra | null;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return (p[0]?.[0] ?? "?").toUpperCase();
}

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { lang } = useI18n();
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

  const display = useMemo(() => {
    if (!item) return null;
    const pe = item.profileExtra ?? null;
    const name = (pe?.partnerName?.trim() || item.author.name || "Партнёр").trim();
    const roleLabel =
      (partnerRoleLabelsByLang as Record<string, Record<string, string> | undefined>)[lang]?.[String(item.role)] ??
      String(item.role);
    const sub = (pe?.partnerType?.trim() || roleLabel).trim();
    const services: PartnerService[] = (pe?.services ?? []).filter((s) => s.title?.trim());
    const fitFor = pe?.fitFor ?? [];
    const cta = (pe?.ctaText?.trim() || "Стать партнёром / Получить условия").trim();
    return { name, sub, services, fitFor, cta, pe };
  }, [item, lang]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/marketplace?tab=partners" className="text-sm text-gray-400 transition hover:text-white">
            ← Назад в маркетплейс
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
              <DeleteResourceButton apiUrl={`/api/v1/partners/${id}`} onDeleted={() => router.push("/marketplace?tab=partners")} />
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400">Загрузка…</div>
        ) : dbError ? (
          <div className="text-gray-400">База данных недоступна.</div>
        ) : !item || !display ? (
          <div className="text-gray-400">Карточка не найдена.</div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="space-y-12 lg:col-span-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-xl font-bold sm:h-14 sm:w-14 sm:text-2xl">
                  {initials(display.name)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{display.name}</h1>
                  <p className="mt-1 text-lg text-cyan-400 sm:mt-2 sm:text-2xl">{display.sub}</p>
                  <p className="mt-3 text-sm text-gray-500">Категория: {item.industry}</p>
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-semibold sm:mb-5 sm:text-3xl">Чем мы помогаем стартапам</h2>
                <p className="text-base leading-relaxed text-gray-300 sm:text-lg">{item.description}</p>
              </div>

              {display.services.length ? (
                <div>
                  <h2 className="mb-5 text-2xl font-semibold sm:mb-6 sm:text-3xl">Доступные услуги</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {display.services.map((s) => (
                      <div key={s.title} className="rounded-3xl bg-[#12121A] p-6">
                        <div className="font-medium">{s.title}</div>
                        {s.note ? <div className="mt-2 text-sm text-gray-400">{s.note}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.attachments && item.attachments.length ? (
                <div>
                  <h2 className="mb-5 text-3xl font-semibold">Файлы</h2>
                  <div className="grid gap-2">
                    {item.attachments.map((a) => (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-3xl border border-white/10 bg-[#12121A] p-4 text-sm text-white/90 transition hover:border-cyan-500/40"
                      >
                        {a.filename}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-3xl border border-white/10 bg-[#12121A] p-6 sm:p-8">
                <h3 className="mb-6 text-xl font-semibold">Для кого мы подходим</h3>
                {display.fitFor.length ? (
                  <ul className="space-y-4 text-gray-300">
                    {display.fitFor.map((line) => (
                      <li key={line}>• {line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Список можно добавить при создании карточки.</p>
                )}
                <Button
                  type="button"
                  className="mt-8 w-full rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 py-5 text-base font-semibold hover:brightness-110 sm:mt-10 sm:py-6 sm:text-lg"
                  onClick={() => {
                    if (!item) return;
                    if (!me) {
                      router.push("/login");
                      return;
                    }
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const link = origin ? `${origin}/partners/${item.id}` : `/partners/${item.id}`;
                    const prefill = `Здравствуйте! Пишу по вашей карточке партнёра: ${link}\n`;
                    router.push(`/chat/${item.author.id}?prefill=${encodeURIComponent(prefill)}`);
                  }}
                >
                  {display.cta}
                </Button>
                <div className="mt-8 text-center text-xs text-gray-500">Опубликовано: {new Date(item.createdAt).toLocaleString("ru-RU")}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
