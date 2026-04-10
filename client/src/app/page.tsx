"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StartupCard, type StartupCardModel } from "@/components/cards/StartupCard";
import { IdeaCard, type IdeaCardModel } from "@/components/cards/IdeaCard";
import { AuctionCard, type AuctionCardModel } from "@/components/cards/AuctionCard";

type Stats = {
  startupsCount: number;
  ideasCount: number;
  activeAuctions: number;
};

type Me = { id: string; role: "user" | "admin" };

export default function Home() {
  const { t } = useI18n();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [startups, setStartups] = useState<StartupCardModel[]>([]);
  const [ideas, setIdeas] = useState<IdeaCardModel[]>([]);
  const [auctions, setAuctions] = useState<AuctionCardModel[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/stats", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Stats;
        if (!cancelled) setStats(data);
      } catch {
        // ignore (DB down)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const meR = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (meR.ok && !cancelled) setMe((await meR.json()) as Me);
        const [sR, iR, aR] = await Promise.all([
          fetch("/api/v1/startups", { cache: "no-store" }),
          fetch("/api/v1/ideas", { cache: "no-store" }),
          fetch("/api/v1/auctions", { cache: "no-store" }),
        ]);
        const [s, i, a] = await Promise.all([sR.json(), iR.json(), aR.json()]);
        if (!cancelled) {
          setStartups((s ?? []).slice(0, 2));
          setIdeas((i ?? []).slice(0, 2));
          setAuctions((a ?? []).slice(0, 2));
        }
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-12">
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[rgba(110,168,255,0.18)] blur-2xl" />
          <div className="absolute top-10 -left-24 h-64 w-64 rounded-full bg-[rgba(175,110,255,0.12)] blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <Badge>StartupHub</Badge>
            <h1 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-white">
              {t("hero.title")}
            </h1>
            <p className="mt-3 text-[rgba(234,240,255,0.72)] leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/add-startup">
                <Button className="h-11 px-6">{t("hero.ctaSell")}</Button>
              </Link>
              <Link href="/add-idea">
                <Button variant="secondary" className="h-11 px-6">
                  {t("hero.ctaIdea")}
                </Button>
              </Link>
              <Link href="/startups">
                <Button variant="ghost" className="h-11 px-6">
                  {t("hero.ctaExplore")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative w-full md:max-w-md">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("home.statsStartups")}</div>
                  <div className="text-3xl font-semibold text-white">
                    {stats ? stats.startupsCount : loading ? "—" : "—"}
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#00ff7a] shadow-[0_0_24px_rgba(0,255,122,0.85)]" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("home.statsIdeas")}</div>
                  <div className="text-2xl font-semibold text-white">
                    {stats ? stats.ideasCount : loading ? "—" : "—"}
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#c000ff] shadow-[0_0_24px_rgba(192,0,255,0.8)]" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("home.statsAuctions")}</div>
                  <div className="text-2xl font-semibold text-white">
                    {stats ? stats.activeAuctions : loading ? "—" : "—"}
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#ff3df2] shadow-[0_0_24px_rgba(255,61,242,0.8)]" />
                </div>
              </div>

              {!loading && !stats ? (
                <div className="mt-5 text-sm text-[rgba(234,240,255,0.72)]">
                  {t("common.dbUnavailable")}
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-white font-semibold">{t("home.howItWorksTitle")}</div>
          <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
            {t("home.howItWorksText")}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-white font-semibold">{t("home.foundersTitle")}</div>
          <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
            {t("home.foundersText")}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-white font-semibold">{t("home.investorsTitle")}</div>
          <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
            {t("home.investorsText")}
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="p-6 md:p-10">
          <div className="text-white font-semibold text-xl">{t("home.whyTitle")}</div>
          <div className="mt-3 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
            {t("home.whyText")}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link href="/favorites">
              <Button variant="secondary" className="h-11 px-6">
                {t("home.favoritesBtn")}
              </Button>
            </Link>
            <Link href="/auction">
              <Button variant="ghost" className="h-11 px-6">
                {t("home.auctionsBtn")}
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-white font-semibold">{t("home.lastStartups")}</div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {startups.map((s) => (
              <StartupCard
                key={s.id}
                startup={s}
                viewer={me}
                onDeleted={() => setStartups((prev) => prev.filter((x) => x.id !== s.id))}
              />
            ))}
          </div>
          <div className="mt-4">
            <Link href="/startups" className="text-[var(--accent)] hover:text-white text-sm font-medium">
              {t("home.seeAll")}
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-white font-semibold">{t("home.lastIdeas")}</div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {ideas.map((i) => (
              <IdeaCard
                key={i.id}
                idea={i}
                viewer={me}
                onDeleted={() => setIdeas((prev) => prev.filter((x) => x.id !== i.id))}
              />
            ))}
          </div>
          <div className="mt-4">
            <Link href="/ideas" className="text-[var(--accent)] hover:text-white text-sm font-medium">
              {t("home.seeAll")}
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-white font-semibold">{t("home.lastAuctions")}</div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {auctions.map((a) => (
              <AuctionCard
                key={a.id}
                auction={a}
                viewer={me}
                onDeleted={() => setAuctions((prev) => prev.filter((x) => x.id !== a.id))}
              />
            ))}
          </div>
          <div className="mt-4">
            <Link href="/auction" className="text-[var(--accent)] hover:text-white text-sm font-medium">
              {t("home.seeAll")}
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
