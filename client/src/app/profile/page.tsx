"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserActivityFeed, type PublicUserActivity } from "@/components/profile/PublicUserProfile";
import { accountTypeLabelsByLang } from "@/lib/labelMaps";
import { useI18n } from "@/i18n/I18nProvider";

type Me = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "user" | "admin";
  accountType: "founder" | "investor" | "partner" | "buyer";
  startupsCount: number;
  ideasCount: number;
};

export default function ProfilePage() {
  const { lang, t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [activities, setActivities] = useState<PublicUserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as Me;
        if (!cancelled) setMe(data);
        if (data?.id) {
          const pr = await fetch(`/api/v1/users/${data.id}`, { cache: "no-store" });
          if (pr.ok) {
            const payload = (await pr.json()) as { activities?: PublicUserActivity[] };
            if (!cancelled) setActivities(payload.activities ?? []);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[rgba(234,240,255,0.72)]">Загрузка…</div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-[rgba(234,240,255,0.72)]">
        Чтобы открыть профиль, пожалуйста, войдите в аккаунт.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("nav.profile")}</div>
          <h1 className="text-2xl font-semibold text-white">{t("nav.profile")}</h1>
        </div>
        <Link href="/profile/settings">
          <Button variant="secondary" className="h-11">
            {t("pages.settings")}
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          <div className="h-24 w-24 rounded-3xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt={me.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xl font-semibold text-white">{me.name}</div>
              <Badge>{accountTypeLabelsByLang[lang]?.[me.accountType] ?? me.accountType}</Badge>
              {me.role === "admin" ? <Badge>admin</Badge> : null}
            </div>
            {me.bio ? (
              <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                {me.bio}
              </div>
            ) : (
              <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)]">Bio не заполнено.</div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/profile/startups"
            className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(110,168,255,0.35)] transition block"
          >
            <div className="text-xs text-[rgba(234,240,255,0.72)]">Мои стартапы</div>
            <div className="text-2xl font-semibold text-white mt-1">{me.startupsCount}</div>
          </Link>
          <Link
            href="/profile/ideas"
            className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(110,168,255,0.35)] transition block"
          >
            <div className="text-xs text-[rgba(234,240,255,0.72)]">Мои идеи</div>
            <div className="text-2xl font-semibold text-white mt-1">{me.ideasCount}</div>
          </Link>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a href="/add-startup" className="text-[var(--accent)] hover:text-white text-sm font-medium">
            + Разместить стартап
          </a>
          <a href="/add-idea" className="text-[var(--accent)] hover:text-white text-sm font-medium">
            + Разместить идею
          </a>
          <Link href={`/users/${me.id}`} className="text-[var(--accent)] hover:text-white text-sm font-medium">
            {t("pages.publicProfileLink")}
          </Link>
        </div>
      </Card>

      <UserActivityFeed activities={activities} />
    </div>
  );
}


