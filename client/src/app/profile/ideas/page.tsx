"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { IdeaCard, type IdeaCardModel } from "@/components/cards/IdeaCard";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n/I18nProvider";

type Me = { id: string; role: "user" | "admin" };

export default function MyIdeasPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<IdeaCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) {
          if (!cancelled) setMe(null);
          return;
        }
        const data = (await r.json()) as Me;
        if (!cancelled) setMe(data);

        const s = await fetch(`/api/v1/ideas?ownerId=${data.id}`, { cache: "no-store" });
        if (!s.ok) throw new Error("db");
        const list = (await s.json()) as IdeaCardModel[];
        if (!cancelled) setItems(list);
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
  }, []);

  if (!me && !loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-[rgba(234,240,255,0.72)]">
        Чтобы открыть страницу, пожалуйста, войдите в аккаунт.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/profile" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← {t("nav.profile")}
        </Link>
        <a href="/add-idea" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          {t("pages.addIdea")}
        </a>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>
        ) : dbError ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.dbUnavailable")}</div>
        ) : items.length === 0 ? (
          <div className="text-[rgba(234,240,255,0.72)]">Пока нет идей.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((i) => (
              <IdeaCard
                key={i.id}
                idea={i}
                viewer={me}
                onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

