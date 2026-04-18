"use client";

import Link from "next/link";
import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";

export type StartupCardModel = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
  format: string;
  isOnline: boolean;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
    rating: number;
  };
  auction: null | { currentPrice: number; endsAt: string };
};

function coverGradient(category: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("ai") || c.includes("ии") || c.includes("ml")) return "from-[#4F46E5] via-[#7c3aed] to-[#EC4899]";
  if (c.includes("fin") || c.includes("фин")) return "from-[#0ea5e9] to-[#6366f1]";
  if (c.includes("eco") || c.includes("эко") || c.includes("green")) return "from-[#f59e0b] to-[#fb7185]";
  return "from-[#4F46E5] to-[#EC4899]";
}

function initials(title: string, category: string) {
  const t = (title || "").trim();
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  const c = (category || "").trim();
  if (c.length >= 2) return c.slice(0, 2).toUpperCase();
  return "S";
}

export function StartupCard({
  startup,
  favorited,
  onToggleFavorite,
  viewer,
  onDeleted,
}: {
  startup: StartupCardModel;
  favorited?: boolean;
  onToggleFavorite?: (next: boolean) => void;
  viewer?: { id: string; role: "user" | "admin" } | null;
  onDeleted?: () => void;
}) {
  const [loadingFav, setLoadingFav] = useState(false);
  const { lang } = useI18n();
  const canDelete =
    Boolean(viewer && onDeleted) &&
    (viewer!.role === "admin" || viewer!.id === startup.owner.id);

  const stageLabel = stageLabelsByLang[lang]?.[startup.stage] ?? startup.stage;
  const tagParts = startup.category
    .split(/[,•·|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = tagParts.length ? tagParts.slice(0, 4) : [startup.category];

  return (
    <div className="listing-card relative rounded-3xl border border-white/10 bg-[#12121A]">
      {canDelete ? (
        <div className="absolute right-3 top-3 z-10">
          <DeleteResourceButton apiUrl={`/api/v1/startups/${startup.id}`} onDeleted={onDeleted!} />
        </div>
      ) : null}

      <Link href={`/startups/${startup.id}`} className="block" aria-label={`Открыть ${startup.title}`}>
        <div className={`relative flex h-[180px] items-center justify-center bg-gradient-to-br ${coverGradient(startup.category)}`}>
          <div className="text-5xl font-bold text-white/90">{initials(startup.title, startup.category)}</div>
          <div className="badge absolute right-4 top-4 rounded-full bg-emerald-500/90 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            {stageLabel}
          </div>
          {startup.auction ? (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
              Аукцион
            </div>
          ) : null}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold leading-tight tracking-tight text-white">{startup.title}</h3>
            {onToggleFavorite ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10"
                disabled={loadingFav}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLoadingFav(true);
                  try {
                    const next = !favorited;
                    await fetch("/api/v1/favorites/toggle", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ type: "startup", id: startup.id }),
                    });
                    onToggleFavorite(next);
                  } finally {
                    setLoadingFav(false);
                  }
                }}
                aria-label={favorited ? "Убрать из избранного" : "Добавить в избранное"}
              >
                <span className={favorited ? "text-[#00f5d4]" : "text-white/50"}>{favorited ? "♥" : "♡"}</span>
              </Button>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-gray-400">{startup.description}</p>

          <div className="mt-6 flex items-end justify-between gap-3 border-t border-white/10 pt-6">
            <div>
              <div className="text-xs text-gray-500">Нужно привлечь</div>
              <div className="text-lg font-semibold text-emerald-400">{startup.price.toLocaleString("ru-RU")} ₽</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{startup.isOnline ? "Онлайн" : "Офлайн"}</div>
              <div className="mt-0.5 text-sm text-violet-400">
                {formatLabelsByLang[lang]?.[startup.format] ?? startup.format}
              </div>
            </div>
          </div>

          {startup.auction ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
              Ставка:{" "}
              <span className="font-semibold text-white">{startup.auction.currentPrice.toLocaleString("ru-RU")} ₽</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <div className="h-9 w-9 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {startup.owner.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={startup.owner.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                  {(startup.owner.name || "?").slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{startup.owner.name}</div>
              <div className="text-xs text-gray-500">Рейтинг {startup.owner.rating.toFixed(1)}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-2xl bg-white/10 px-4 py-2 text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
