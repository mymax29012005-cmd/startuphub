"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { StartupCard, type StartupCardModel } from "@/components/cards/StartupCard";
import { Card } from "@/components/ui/Card";

type Me = {
  id: string;
  role: "user" | "admin";
  accountType: "founder" | "investor" | "partner" | "buyer";
  name: string;
};

export default function StartupsPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [startups, setStartups] = useState<StartupCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [favoriteStartupIds, setFavoriteStartupIds] = useState<Set<string>>(new Set());

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
        const r = await fetch("/api/v1/startups", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        const data = (await r.json()) as StartupCardModel[];
        if (!cancelled) setStartups(data);
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
          if (f.type === "startup" && f.startup) set.add(f.startup.id);
        }
        if (!cancelled) setFavoriteStartupIds(set);
      } catch {
        // ignore
      }
    }
    loadFavs();
    return () => {
      cancelled = true;
    };
  }, [me]);

  const content = useMemo(() => {
    if (loading) return <div className="text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>;
    if (dbError) return <div className="text-[rgba(234,240,255,0.72)]">{t("common.dbUnavailable")}</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startups.map((s) => (
          <StartupCard
            key={s.id}
            startup={s}
            favorited={favoriteStartupIds.has(s.id)}
            onToggleFavorite={
              me
                ? (next) => {
                    setFavoriteStartupIds((prev) => {
                      const copy = new Set(prev);
                      if (next) copy.add(s.id);
                      else copy.delete(s.id);
                      return copy;
                    });
                  }
                : undefined
            }
            viewer={me}
            onDeleted={() => setStartups((prev) => prev.filter((x) => x.id !== s.id))}
          />
        ))}
      </div>
    );
  }, [loading, dbError, startups, favoriteStartupIds, me]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("nav.startups")}</div>
          <h1 className="text-2xl font-semibold">{t("nav.startups")}</h1>
        </div>
        <a href="/add-startup" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          {t("pages.addStartup")}
        </a>
      </div>
      <Card className="p-6">{content}</Card>
    </div>
  );
}


