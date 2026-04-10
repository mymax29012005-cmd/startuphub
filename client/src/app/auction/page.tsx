"use client";

import React, { useEffect, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { AuctionCard, type AuctionCardModel } from "@/components/cards/AuctionCard";
import { Card } from "@/components/ui/Card";

type Me = { id: string; role: "user" | "admin" };

export default function AuctionPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [auctions, setAuctions] = useState<AuctionCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

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
        const r = await fetch("/api/v1/auctions", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        const data = (await r.json()) as AuctionCardModel[];
        if (!cancelled) setAuctions(data);
      } catch {
        if (!cancelled) setDbError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("nav.auction")}</div>
          <h1 className="text-2xl font-semibold">{t("nav.auction")}</h1>
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>
        ) : dbError ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.dbUnavailable")}</div>
        ) : auctions.length === 0 ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("pages.noActiveAuctions")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auctions.map((a) => (
              <AuctionCard
                key={a.id}
                auction={a}
                viewer={me}
                onDeleted={() => setAuctions((prev) => prev.filter((x) => x.id !== a.id))}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


