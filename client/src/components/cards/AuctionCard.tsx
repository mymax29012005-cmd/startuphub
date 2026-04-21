"use client";

import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";

export type AuctionCardModel = {
  id: string;
  currentPrice: number;
  startup: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    ownerId: string;
    owner: { name: string; avatarUrl: string | null; rating: number };
  };
  status?: "planned" | "live" | "finished" | string;
  startsAt?: string;
  registrationEndsAt?: string;
  endsAt?: string | null;
};

export function AuctionCard({
  auction,
  viewer,
  onDeleted,
}: {
  auction: AuctionCardModel;
  viewer?: { id: string; role: "user" | "admin" } | null;
  onDeleted?: () => void;
}) {
  const canDelete =
    Boolean(viewer && onDeleted) &&
    (viewer!.role === "admin" || viewer!.id === auction.startup.ownerId);

  return (
    <Card className="p-5 sm:p-6">
      {canDelete ? (
        <div className="flex justify-end mb-2">
          <DeleteResourceButton apiUrl={`/api/v1/auctions/${auction.id}`} onDeleted={onDeleted!} />
        </div>
      ) : null}
      <Link href={`/auction/${auction.id}`} className="block" aria-label={`Открыть аукцион: ${auction.startup.title}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge>Аукцион</Badge>
              <Badge>{auction.startup.category}</Badge>
            </div>
            <div className="mt-3 text-white font-semibold leading-tight text-base sm:text-lg truncate">{auction.startup.title}</div>
            <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] line-clamp-2">
              {auction.startup.description}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-[rgba(234,240,255,0.72)]">
            Текущая цена
          </div>
          <div className="text-sm font-semibold text-white">
            {auction.currentPrice.toLocaleString("ru-RU")} ₽
          </div>
        </div>

        {auction.status ? (
          <div className="mt-4 text-xs text-[rgba(234,240,255,0.72)]">
            Статус: <span className="text-white/90">{String(auction.status)}</span>
            {auction.startsAt ? ` · Старт: ${new Date(auction.startsAt).toLocaleString("ru-RU")}` : ""}
          </div>
        ) : auction.endsAt ? (
          <div className="mt-4 text-xs text-[rgba(234,240,255,0.72)]">
            Окончание: {new Date(auction.endsAt).toLocaleString("ru-RU")}
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
            {auction.startup.owner.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={auction.startup.owner.avatarUrl}
                alt={auction.startup.owner.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{auction.startup.owner.name}</div>
            <div className="text-xs text-[rgba(234,240,255,0.72)]">
              Рейтинг: {auction.startup.owner.rating.toFixed(1)}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

