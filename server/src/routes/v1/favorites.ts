import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const favoritesRouter = Router();

const toggleSchema = z.object({
  type: z.enum(["startup", "idea", "investor", "partner"]),
  id: z.string().min(1),
});

favoritesRouter.post("/toggle", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const parsed = toggleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const { type, id } = parsed.data;
  const userId = req.user!.userId;

  try {
    const existing =
      type === "startup"
        ? await prisma.favorite.findFirst({ where: { userId, startupId: id } })
        : type === "idea"
          ? await prisma.favorite.findFirst({ where: { userId, ideaId: id } })
          : type === "investor"
            ? await prisma.favorite.findFirst({ where: { userId, investorRequestId: id } })
            : await prisma.favorite.findFirst({ where: { userId, partnerRequestId: id } });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }

    if (type === "startup") await prisma.favorite.create({ data: { userId, startupId: id } });
    else if (type === "idea") await prisma.favorite.create({ data: { userId, ideaId: id } });
    else if (type === "investor") await prisma.favorite.create({ data: { userId, investorRequestId: id } });
    else await prisma.favorite.create({ data: { userId, partnerRequestId: id } });
    return res.json({ favorited: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

favoritesRouter.get("/", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const userId = req.user!.userId;
  try {
    const now = new Date();
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        startup: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            price: true,
            stage: true,
            format: true,
            isOnline: true,
            ownerId: true,
            owner: {
              select: { id: true, name: true, avatarUrl: true, role: true, accountType: true },
            },
            auction: { select: { currentPrice: true, endsAt: true, isActive: true } },
          },
        },
        idea: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            price: true,
            stage: true,
            format: true,
            ownerId: true,
            owner: {
              select: { id: true, name: true, avatarUrl: true, role: true, accountType: true },
            },
            problem: true,
          },
        },
        investorRequest: {
          select: {
            id: true,
            industry: true,
            description: true,
            amount: true,
            status: true,
            authorId: true,
            author: { select: { id: true, name: true, avatarUrl: true, role: true, accountType: true } },
            profileExtra: true,
          },
        },
        partnerRequest: {
          select: {
            id: true,
            role: true,
            industry: true,
            description: true,
            authorId: true,
            author: { select: { id: true, name: true, avatarUrl: true, role: true, accountType: true } },
            profileExtra: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const ownerIds = Array.from(
      new Set(
        favorites
          .map((f) =>
            f.startup
              ? f.startup.ownerId
              : f.idea
                ? f.idea.ownerId
                : f.investorRequest
                  ? f.investorRequest.authorId
                  : f.partnerRequest
                    ? f.partnerRequest.authorId
                    : null,
          )
          .filter(Boolean) as string[],
      ),
    );

    const ratingByUser = new Map<string, number>();
    await Promise.all(
      ownerIds.map(async (ownerId) => {
        const agg = await prisma.review.aggregate({
          where: { targetUserId: ownerId },
          _avg: { rating: true },
        });
        const v = agg._avg.rating;
        ratingByUser.set(ownerId, v ? Number(v) : 0);
      }),
    );

    return res.json(
      favorites.map((f) => ({
        id: f.id,
        type: f.startupId ? "startup" : f.ideaId ? "idea" : f.investorRequestId ? "investor" : "partner",
        startup:
          f.startupId && f.startup
            ? {
                id: f.startup.id,
                title: f.startup.title,
                description: f.startup.description,
                category: f.startup.category,
                price: Number(f.startup.price),
                stage: f.startup.stage,
                format: f.startup.format,
                isOnline: f.startup.isOnline,
                owner: {
                  id: f.startup.owner.id,
                  name: f.startup.owner.name,
                  avatarUrl: f.startup.owner.avatarUrl,
                  role: f.startup.owner.role,
                  accountType: f.startup.owner.accountType,
                  rating: ratingByUser.get(f.startup.ownerId) ?? 0,
                },
                auction:
                  f.startup.auction &&
                  f.startup.auction.isActive &&
                  f.startup.auction.endsAt &&
                  f.startup.auction.endsAt > now
                    ? {
                        currentPrice: Number(f.startup.auction.currentPrice),
                        endsAt: f.startup.auction.endsAt.toISOString(),
                      }
                    : null,
              }
            : null,
        idea:
          f.ideaId && f.idea
            ? {
                id: f.idea.id,
                title: f.idea.title,
                description: f.idea.description,
                category: f.idea.category,
                price: Number(f.idea.price),
                stage: f.idea.stage,
                format: f.idea.format,
                owner: {
                  id: f.idea.owner.id,
                  name: f.idea.owner.name,
                  avatarUrl: f.idea.owner.avatarUrl,
                  role: f.idea.owner.role,
                  accountType: f.idea.owner.accountType,
                  rating: ratingByUser.get(f.idea.ownerId) ?? 0,
                },
                problem: f.idea.problem,
              }
            : null,
        investor:
          f.investorRequestId && f.investorRequest
            ? {
                id: f.investorRequest.id,
                industry: f.investorRequest.industry,
                description: f.investorRequest.description,
                amount: Number(f.investorRequest.amount),
                status: f.investorRequest.status,
                author: {
                  id: f.investorRequest.author.id,
                  name: f.investorRequest.author.name,
                  avatarUrl: f.investorRequest.author.avatarUrl,
                  role: f.investorRequest.author.role,
                  accountType: f.investorRequest.author.accountType,
                  rating: ratingByUser.get(f.investorRequest.authorId) ?? 0,
                },
                profileExtra: (f.investorRequest as any).profileExtra ?? null,
              }
            : null,
        partner:
          f.partnerRequestId && f.partnerRequest
            ? {
                id: f.partnerRequest.id,
                role: f.partnerRequest.role,
                industry: f.partnerRequest.industry,
                description: f.partnerRequest.description,
                author: {
                  id: f.partnerRequest.author.id,
                  name: f.partnerRequest.author.name,
                  avatarUrl: f.partnerRequest.author.avatarUrl,
                  role: f.partnerRequest.author.role,
                  accountType: f.partnerRequest.author.accountType,
                  rating: ratingByUser.get(f.partnerRequest.authorId) ?? 0,
                },
                profileExtra: (f.partnerRequest as any).profileExtra ?? null,
              }
            : null,
      })),
    );
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

