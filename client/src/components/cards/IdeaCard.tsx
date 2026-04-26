"use client";

import Link from "next/link";
import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatIndustryLine } from "@/lib/industryHierarchy";

export type IdeaCardModel = {
  id: string;
  title: string;
  description: string;
  sector?: string;
  category: string;
  price: number;
  stage: string;
  format: string;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
    rating: number;
  };
  problem?: string | null;
};

export function IdeaCard({
  idea,
  favorited,
  onToggleFavorite,
  viewer,
  onDeleted,
}: {
  idea: IdeaCardModel;
  favorited?: boolean;
  onToggleFavorite?: (next: boolean) => void;
  viewer?: { id: string; role: "user" | "admin" } | null;
  onDeleted?: () => void;
}) {
  const [loadingFav, setLoadingFav] = useState(false);
  const { lang } = useI18n();
  const canDelete =
    Boolean(viewer && onDeleted) &&
    (viewer!.role === "admin" || viewer!.id === idea.owner.id);

  return (
    <Card className="p-5 sm:p-6">
      {canDelete ? (
        <div className="flex justify-end mb-2">
          <DeleteResourceButton apiUrl={`/api/v1/ideas/${idea.id}`} onDeleted={onDeleted!} />
        </div>
      ) : null}
      <Link href={`/ideas/${idea.id}`} className="block" aria-label={`Открыть ${idea.title}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge>{formatIndustryLine(idea.sector, idea.category)}</Badge>
            </div>
            <div className="mt-3 text-white font-semibold leading-tight text-base sm:text-lg truncate">{idea.title}</div>
            <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] line-clamp-2">
              {idea.description}
            </div>
          </div>

          <div>
            {onToggleFavorite ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-10 shrink-0 rounded-2xl border border-[rgba(255,255,255,0.16)]"
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
                      body: JSON.stringify({ type: "idea", id: idea.id }),
                    });
                    onToggleFavorite(next);
                  } finally {
                    setLoadingFav(false);
                  }
                }}
                aria-label={favorited ? "Убрать из избранного" : "Добавить в избранное"}
              >
                <span className={favorited ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"}>
                  {favorited ? "♥" : "♡"}
                </span>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-[rgba(234,240,255,0.72)]">
            {formatLabelsByLang[lang]?.[idea.format] ?? idea.format} ·{" "}
            {stageLabelsByLang[lang]?.[idea.stage] ?? idea.stage}
          </div>
          <div className="text-sm font-semibold text-white">{idea.price.toLocaleString("ru-RU")} ₽</div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
            {idea.owner.avatarUrl ? (
              <img src={idea.owner.avatarUrl} alt={idea.owner.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{idea.owner.name}</div>
            <div className="text-xs text-[rgba(234,240,255,0.72)]">Рейтинг: {idea.owner.rating.toFixed(1)}</div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

