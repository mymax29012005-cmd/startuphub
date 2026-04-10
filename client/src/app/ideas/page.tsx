"use client";

import React, { useEffect, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { IdeaCard, type IdeaCardModel } from "@/components/cards/IdeaCard";
import { Card } from "@/components/ui/Card";

type Me = {
  id: string;
  role: "user" | "admin";
  accountType: "founder" | "investor" | "partner" | "buyer";
  name: string;
};

export default function IdeasPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [ideas, setIdeas] = useState<IdeaCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [favoriteIdeaIds, setFavoriteIdeaIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const meR = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (meR.ok) setMe((await meR.json()) as Me);
      } catch {
        // ignore
      }
      try {
        const r = await fetch("/api/v1/ideas", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        const data = (await r.json()) as IdeaCardModel[];
        if (!cancelled) setIdeas(data);
      } catch {
        if (!cancelled) setDbError("Database unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    async function loadFavs() {
      try {
        const r = await fetch("/api/v1/favorites", { credentials: "include" });
        if (!r.ok) return;
        const data = await r.json();
        const set = new Set<string>();
        for (const f of data) {
          if (f.type === "idea" && f.idea) set.add(f.idea.id);
        }
        if (!cancelled) setFavoriteIdeaIds(set);
      } catch {
        // ignore
      }
    }
    loadFavs();
    return () => {
      cancelled = true;
    };
  }, [me]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("nav.ideas")}</div>
          <h1 className="text-2xl font-semibold">{t("nav.ideas")}</h1>
        </div>
        <a href="/add-idea" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          {t("pages.addIdea")}
        </a>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>
        ) : dbError ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.dbUnavailable")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((i) => (
              <IdeaCard
                key={i.id}
                idea={i}
                favorited={favoriteIdeaIds.has(i.id)}
                onToggleFavorite={
                  me
                    ? (next) => {
                        setFavoriteIdeaIds((prev) => {
                          const copy = new Set(prev);
                          if (next) copy.add(i.id);
                          else copy.delete(i.id);
                          return copy;
                        });
                      }
                    : undefined
                }
                viewer={me}
                onDeleted={() => setIdeas((prev) => prev.filter((x) => x.id !== i.id))}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


