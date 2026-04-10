import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { canDeleteAsOwnerOrAdmin } from "../../lib/authz";
import { requireAuth } from "../../middleware/auth";

export const auctionsRouter = Router();

function ensureStatus(now: Date, auction: { status: string; startsAt: Date; isActive: boolean }) {
  if (auction.status === "planned" && now >= auction.startsAt) return "live";
  return auction.status;
}

auctionsRouter.get("/", async (_req, res) => {
  const prisma = getPrisma();
  try {
    const now = new Date();
    const auctions = await prisma.auction.findMany({
      where: {
        isActive: true,
      },
      orderBy: { startsAt: "asc" },
      take: 50,
      include: {
        startup: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            price: true,
            ownerId: true,
          },
        },
      },
    });

    const ownerIds = Array.from(new Set(auctions.map((a) => a.startup.ownerId)));
    const ratingByUser = new Map<string, number>();
    await Promise.all(
      ownerIds.map(async (userId) => {
        const agg = await prisma.review.aggregate({
          where: { targetUserId: userId },
          _avg: { rating: true },
        });
        const v = agg._avg.rating;
        ratingByUser.set(userId, v ? Number(v) : 0);
      }),
    );

    const result = await Promise.all(
      auctions.map(async (a) => {
        const nextStatus = ensureStatus(now, a as any);
        if (nextStatus !== (a as any).status) {
          await prisma.auction.update({ where: { id: a.id }, data: { status: nextStatus as any } });
        }
        const owner = await prisma.user.findUnique({
          where: { id: a.startup.ownerId },
          select: { name: true, avatarUrl: true },
        });
        return {
          id: a.id,
          startupId: a.startupId,
          currentPrice: Number(a.currentPrice),
          status: nextStatus,
          startsAt: (a as any).startsAt,
          registrationEndsAt: (a as any).registrationEndsAt,
          endsAt: (a as any).endsAt,
          startup: {
            id: a.startup.id,
            title: a.startup.title,
            description: a.startup.description,
            category: a.startup.category,
            price: Number(a.startup.price),
            ownerId: a.startup.ownerId,
            owner: {
              name: owner?.name ?? "",
              avatarUrl: owner?.avatarUrl ?? null,
              rating: ratingByUser.get(a.startup.ownerId) ?? 0,
            },
          },
        };
      }),
    );

    res.json(result);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

auctionsRouter.get("/:auctionId", async (req, res) => {
  const prisma = getPrisma();
  const auctionId =
    typeof req.params.auctionId === "string" ? req.params.auctionId : req.params.auctionId[0];
  try {
    const now = new Date();
    const latestBid = await prisma.bid.findFirst({
      where: { auctionId },
      orderBy: { createdAt: "desc" },
      select: { userId: true },
    });
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        startup: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            price: true,
            ownerId: true,
            owner: { select: { id: true, name: true, avatarUrl: true, role: true, accountType: true } },
          },
        },
        participants: {
          orderBy: { joinedAt: "asc" },
          select: { id: true, userId: true, active: true, joinedAt: true, leftAt: true, user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        bids: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            userId: true,
            amount: true,
            createdAt: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!auction) return res.status(404).json({ error: "Аукцион не найден" });

    // status transitions
    if (auction.status === "planned" && now >= auction.startsAt) {
      await prisma.auction.update({ where: { id: auction.id }, data: { status: "live" } });
      (auction as any).status = "live";
    }
    if (auction.status === "live") {
      const activeCount = auction.participants.filter((p) => p.active).length;
      if (activeCount <= 1) {
        const winner =
          auction.participants.find((p) => p.active)?.userId ??
          latestBid?.userId ??
          null;
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            status: "finished",
            isActive: false,
            endsAt: now,
            winnerUserId: winner,
          },
        });
        (auction as any).status = "finished";
        (auction as any).isActive = false;
        (auction as any).endsAt = now;
        (auction as any).winnerUserId = winner;
      }
    }

    const agg = await prisma.review.aggregate({
      where: { targetUserId: auction.startup.ownerId },
      _avg: { rating: true },
    });
    const rating = agg._avg.rating ? Number(agg._avg.rating) : 0;

    const winnerUser = auction.winnerUserId
      ? await prisma.user.findUnique({
          where: { id: auction.winnerUserId },
          select: { id: true, name: true, avatarUrl: true },
        })
      : null;

    return res.json({
      id: auction.id,
      currentPrice: Number(auction.currentPrice),
      status: auction.status,
      startsAt: auction.startsAt.toISOString(),
      registrationEndsAt: auction.registrationEndsAt.toISOString(),
      endsAt: auction.endsAt ? auction.endsAt.toISOString() : null,
      isActive: auction.isActive,
      winnerUserId: auction.winnerUserId ?? null,
      winnerUser,
      startup: {
        id: auction.startup.id,
        title: auction.startup.title,
        description: auction.startup.description,
        category: auction.startup.category,
        price: Number(auction.startup.price),
        ownerId: auction.startup.ownerId,
        owner: {
          id: auction.startup.owner.id,
          name: auction.startup.owner.name,
          avatarUrl: auction.startup.owner.avatarUrl,
          rating,
        },
      },
      participants: auction.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        active: p.active,
        joinedAt: p.joinedAt.toISOString(),
        leftAt: p.leftAt ? p.leftAt.toISOString() : null,
        user: p.user,
      })),
      bids: auction.bids.map((b) => ({
        id: b.id,
        userId: b.userId,
        user: b.user,
        amount: Number(b.amount),
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

const createBidSchema = z.object({
  amount: z.coerce.number().positive(),
});

auctionsRouter.post("/:auctionId/bids", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const auctionId =
    typeof req.params.auctionId === "string" ? req.params.auctionId : req.params.auctionId[0];
  const parsed = createBidSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { startup: { select: { ownerId: true } } },
    });
    if (!auction) return res.status(404).json({ error: "Аукцион не найден" });
    if (req.user!.userId === auction.startup.ownerId) {
      return res.status(403).json({ error: "Владелец лота не может делать ставки" });
    }
    const now = new Date();
    if (auction.status === "planned" && now >= auction.startsAt) {
      await prisma.auction.update({ where: { id: auction.id }, data: { status: "live" } });
      auction.status = "live" as any;
    }
    if (auction.status !== "live" || !auction.isActive) {
      return res.status(400).json({ error: "Аукцион не активен" });
    }

    const p = await prisma.auctionParticipant.findUnique({
      where: { auctionId_userId: { auctionId: auction.id, userId: req.user!.userId } },
      select: { active: true },
    });
    if (!p || !p.active) return res.status(403).json({ error: "Вы не участвуете в аукционе" });

    const amount = parsed.data.amount;
    if (amount < Number(auction.currentPrice)) {
      return res.status(400).json({ error: "Ставка должна быть не меньше текущей цены" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.auction.update({
        where: { id: auction.id },
        data: { currentPrice: amount },
      });
      await tx.bid.create({
        data: {
          auctionId: auction.id,
          userId: req.user!.userId,
          amount,
        },
      });
    });

    res.status(201).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

auctionsRouter.post("/:auctionId/join", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const auctionId =
    typeof req.params.auctionId === "string" ? req.params.auctionId : req.params.auctionId[0];
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { id: true, status: true, startsAt: true, registrationEndsAt: true, isActive: true, startup: { select: { ownerId: true } } },
    });
    if (!auction) return res.status(404).json({ error: "Аукцион не найден" });
    if (req.user!.userId === auction.startup.ownerId) {
      return res.status(403).json({ error: "Владелец лота не может участвовать" });
    }
    const now = new Date();
    if (!auction.isActive || auction.status === "finished") return res.status(400).json({ error: "Аукцион закрыт" });
    if (now >= auction.registrationEndsAt) return res.status(400).json({ error: "Регистрация закрыта" });

    const upserted = await prisma.auctionParticipant.upsert({
      where: { auctionId_userId: { auctionId: auction.id, userId: req.user!.userId } },
      update: { active: true, leftAt: null },
      create: { auctionId: auction.id, userId: req.user!.userId, active: true },
    });
    return res.json({ ok: true, participantId: upserted.id });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

auctionsRouter.post("/:auctionId/leave", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const auctionId =
    typeof req.params.auctionId === "string" ? req.params.auctionId : req.params.auctionId[0];
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { id: true, status: true, isActive: true },
    });
    if (!auction) return res.status(404).json({ error: "Аукцион не найден" });

    const latestBid = await prisma.bid.findFirst({
      where: { auctionId: auction.id },
      orderBy: { createdAt: "desc" },
      select: { userId: true },
    });

    const p = await prisma.auctionParticipant.findUnique({
      where: { auctionId_userId: { auctionId, userId: req.user!.userId } },
      select: { id: true, active: true },
    });
    if (!p) return res.status(404).json({ error: "Вы не записаны" });
    if (!p.active) return res.json({ ok: true });

    if (auction.status === "live" && latestBid?.userId === req.user!.userId) {
      return res.status(400).json({ error: "Нельзя выйти, пока ваша ставка последняя" });
    }

    await prisma.auctionParticipant.update({ where: { id: p.id }, data: { active: false, leftAt: new Date() } });

    // If live auction is left with <= 1 active participant, finish and set winner.
    if (auction.status === "live" && auction.isActive) {
      const active = await prisma.auctionParticipant.findMany({
        where: { auctionId: auction.id, active: true },
        select: { userId: true },
      });
      if (active.length <= 1) {
        const winner = active[0]?.userId ?? latestBid?.userId ?? null;
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: "finished", isActive: false, endsAt: new Date(), winnerUserId: winner },
        });
      }
    }

    return res.json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

auctionsRouter.delete("/:auctionId", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const auctionId =
    typeof req.params.auctionId === "string" ? req.params.auctionId : req.params.auctionId[0];
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { startup: { select: { ownerId: true } } },
    });
    if (!auction) return res.status(404).json({ error: "Аукцион не найден" });
    if (!canDeleteAsOwnerOrAdmin(req.user!, auction.startup.ownerId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    await prisma.auction.delete({ where: { id: auction.id } });
    return res.status(200).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

