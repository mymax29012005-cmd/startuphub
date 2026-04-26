"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { StartupCard, type StartupCardModel } from "@/components/cards/StartupCard";
import { IdeaCard, type IdeaCardModel } from "@/components/cards/IdeaCard";
import { Card } from "@/components/ui/Card";

type Me = { id: string; name: string; role: "user" | "admin" };

export default function FavoritesPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [startups, setStartups] = useState<StartupCardModel[]>([]);
  const [ideas, setIdeas] = useState<IdeaCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("cosmic-bg");
    document.documentElement.classList.add("cosmic-bg");
    return () => {
      document.body.classList.remove("cosmic-bg");
      document.documentElement.classList.remove("cosmic-bg");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const meR = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!meR.ok) return;
        const data = (await meR.json()) as Me;
        if (!cancelled) setMe(data);
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
    if (!me) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/favorites", { credentials: "include" });
        if (!r.ok) throw new Error("no");
        const data = await r.json();
        const s: StartupCardModel[] = [];
        const i: IdeaCardModel[] = [];
        for (const f of data) {
          if (f.type === "startup" && f.startup) s.push(f.startup);
          if (f.type === "idea" && f.idea) i.push(f.idea);
        }
        if (!cancelled) {
          setStartups(s);
          setIdeas(i);
        }
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
  }, [me]);

  return (
    <div className="min-h-screen mx-auto max-w-6xl px-4 py-10 text-white">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("nav.favorites")}</div>
          <h1 className="text-2xl font-semibold">{t("nav.favorites")}</h1>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        {!me ? (
          <div className="text-[rgba(234,240,255,0.72)]">
            {t("pages.loginToSaveFavoritesPrefix")}
            <Link href="/login" className="font-medium text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline">
              {t("pages.loginToSaveFavoritesLink")}
            </Link>
            {t("pages.loginToSaveFavoritesSuffix")}
          </div>
        ) : loading ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>
        ) : dbError ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.dbUnavailable")}</div>
        ) : startups.length === 0 && ideas.length === 0 ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("pages.emptyFavorites")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {startups.map((s) => (
              <StartupCard
                key={s.id}
                startup={s}
                favorited={true}
                viewer={me}
                onDeleted={() => setStartups((prev) => prev.filter((x) => x.id !== s.id))}
              />
            ))}
            {ideas.map((i) => (
              <IdeaCard
                key={i.id}
                idea={i}
                favorited={true}
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


