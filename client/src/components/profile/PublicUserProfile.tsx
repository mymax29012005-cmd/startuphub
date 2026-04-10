"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { accountTypeLabelsByLang } from "@/lib/labelMaps";
import { useI18n } from "@/i18n/I18nProvider";
import type { Lang } from "@/i18n/dictionaries";

export type PublicUserActivity = {
  kind: string;
  at: string;
  title: string;
  href: string | null;
  detail: string | null;
};

export type PublicUserPayload = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  accountType: "founder" | "investor" | "partner" | "buyer";
  role: "user" | "admin";
  createdAt: string;
  startupsCount: number;
  ideasCount: number;
};

function formatWhen(iso: string, lang: Lang) {
  try {
    const locale = lang === "zh" ? "zh-CN" : lang === "en" ? "en-US" : "ru-RU";
    return new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function activityDescription(t: (k: string) => string, a: PublicUserActivity) {
  const prefix = t(`userPublic.activity.${a.kind}`);
  const label = prefix.startsWith("userPublic.") ? a.kind : prefix;
  if (a.kind === "user_registered") {
    return label;
  }
  if (a.kind === "bid_placed") {
    return `${label}: «${a.title}»${a.detail != null ? ` — ${a.detail}` : ""}`;
  }
  if (a.kind === "review_written") {
    return `${label} ${a.title}${a.detail != null ? ` (${a.detail}★)` : ""}`;
  }
  if (a.kind === "favorite_added") {
    return `${label}: «${a.title}»`;
  }
  return `${label}: «${a.title}»`;
}

export function UserActivityFeed({ activities }: { activities: PublicUserActivity[] }) {
  const { lang, t } = useI18n();

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-white mb-3">{t("userPublic.activityTitle")}</h2>
      <Card className="p-6">
        {activities.length === 0 ? (
          <div className="text-sm text-[rgba(234,240,255,0.72)]">{t("userPublic.activityEmpty")}</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activities.map((a, idx) => (
              <li
                key={`${a.at}-${a.kind}-${idx}`}
                className="text-sm border-b border-[rgba(255,255,255,0.08)] pb-3 last:border-0 last:pb-0"
              >
                <div className="text-xs text-[rgba(234,240,255,0.55)] mb-1">{formatWhen(a.at, lang)}</div>
                {a.href ? (
                  <Link href={a.href} className="text-[rgba(234,240,255,0.92)] hover:text-white">
                    {activityDescription(t, a)}
                  </Link>
                ) : (
                  <span className="text-[rgba(234,240,255,0.92)]">{activityDescription(t, a)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

type Props = {
  userId: string;
  /** When set, chat button compares to this id (hide CTA for self). */
  viewerId?: string | null;
};

export function PublicUserProfile({ userId, viewerId }: Props) {
  const { lang, t } = useI18n();
  const [user, setUser] = useState<PublicUserPayload | null>(null);
  const [activities, setActivities] = useState<PublicUserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"load" | "404" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/v1/users/${userId}`, { cache: "no-store" });
        if (r.status === 404) {
          if (!cancelled) setError("404");
          return;
        }
        if (!r.ok) {
          if (!cancelled) setError("load");
          return;
        }
        const data = (await r.json()) as { user: PublicUserPayload; activities: PublicUserActivity[] };
        if (!cancelled) {
          setUser(data.user);
          setActivities(data.activities ?? []);
        }
      } catch {
        if (!cancelled) setError("load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-[rgba(234,240,255,0.72)]">…</div>
    );
  }

  if (error === "404" || !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-[rgba(234,240,255,0.72)]">
        {error === "404" ? t("userPublic.notFound") : t("userPublic.loadError")}
      </div>
    );
  }

  const isSelf = viewerId != null && viewerId === user.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("nav.profile")}</div>
          <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
        </div>
        {!isSelf ? (
          <Link href={`/chat/${user.id}`}>
            <Button className="h-11">{t("userPublic.chatCta")}</Button>
          </Link>
        ) : (
          <span className="text-sm text-[rgba(234,240,255,0.72)]">{t("userPublic.chatSelf")}</span>
        )}
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          <div className="h-24 w-24 rounded-3xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xl font-semibold text-white">{user.name}</div>
              <Badge>{accountTypeLabelsByLang[lang]?.[user.accountType] ?? user.accountType}</Badge>
              {user.role === "admin" ? <Badge>admin</Badge> : null}
            </div>
            {user.bio ? (
              <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">{user.bio}</div>
            ) : (
              <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)]">{t("userPublic.bioEmpty")}</div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/users/${user.id}/startups`}
            className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(110,168,255,0.35)] transition block"
          >
            <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("userPublic.statsStartups")}</div>
            <div className="text-2xl font-semibold text-white mt-1">{user.startupsCount}</div>
          </Link>
          <Link
            href={`/users/${user.id}/ideas`}
            className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(110,168,255,0.35)] transition block"
          >
            <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("userPublic.statsIdeas")}</div>
            <div className="text-2xl font-semibold text-white mt-1">{user.ideasCount}</div>
          </Link>
        </div>
      </Card>

      <UserActivityFeed activities={activities} />
    </div>
  );
}
