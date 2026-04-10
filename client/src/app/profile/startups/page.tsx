"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { StartupCard, type StartupCardModel } from "@/components/cards/StartupCard";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n/I18nProvider";

type Me = { id: string; role: "user" | "admin" };

export default function MyStartupsPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<StartupCardModel[]>([]);
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

        const s = await fetch(`/api/v1/startups?ownerId=${data.id}`, { cache: "no-store" });
        if (!s.ok) throw new Error("db");
        const list = (await s.json()) as StartupCardModel[];
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
        <a href="/add-startup" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          {t("pages.addStartup")}
        </a>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>
        ) : dbError ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.dbUnavailable")}</div>
        ) : items.length === 0 ? (
          <div className="text-[rgba(234,240,255,0.72)]">Пока нет стартапов.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((s) => (
              <StartupCard
                key={s.id}
                startup={s}
                viewer={me}
                onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== s.id))}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

