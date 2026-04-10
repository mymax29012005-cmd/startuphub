"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { useI18n } from "@/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { partnerRoleLabelsByLang } from "@/lib/labelMaps";

type Me = { id: string; role: "user" | "admin" };

type PartnerItem = {
  id: string;
  role: string;
  industry: string;
  description: string;
  authorId: string;
  author: { name: string; avatarUrl: string | null };
};

export default function PartnersPage() {
  const { lang, t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<PartnerItem[]>([]);
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
        const r = await fetch("/api/v1/partners", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        const data = (await r.json()) as PartnerItem[];
        if (!cancelled) setItems(data);
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
          <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("nav.partners")}</div>
          <h1 className="text-2xl font-semibold">{t("nav.partners")}</h1>
        </div>
        <a href="/add-partner" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          {t("pages.addPartner")}
        </a>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.loading")}</div>
        ) : dbError ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("common.dbUnavailable")}</div>
        ) : items.length === 0 ? (
          <div className="text-[rgba(234,240,255,0.72)]">{t("pages.emptyPartners")}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((it) => (
              <div
                key={it.id}
                className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(110,168,255,0.35)] transition flex gap-3 items-start"
              >
                <Link href={`/partners/${it.id}`} className="flex-1 min-w-0 block">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge>{it.industry}</Badge>
                        <Badge>{partnerRoleLabelsByLang[lang]?.[it.role] ?? it.role}</Badge>
                      </div>
                      <div className="mt-3 font-semibold text-white">Описание</div>
                      <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed line-clamp-2">
                        {it.description}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
                      {it.author.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.author.avatarUrl} alt={it.author.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{it.author.name}</div>
                    </div>
                  </div>
                </Link>
                {me && (me.role === "admin" || me.id === it.authorId) ? (
                  <DeleteResourceButton
                    className="shrink-0"
                    apiUrl={`/api/v1/partners/${it.id}`}
                    onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


