import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { requireAdmin, requireAuth } from "../../middleware/auth";

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth);
adminUsersRouter.use(requireAdmin);

adminUsersRouter.get("/", async (req, res) => {
  const parsed = z
    .object({
      q: z.string().max(200).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
      offset: z.coerce.number().int().min(0).max(10_000).optional(),
      showDeleted: z.coerce.boolean().optional(),
    })
    .safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });

  const prisma = getPrisma();
  const q = parsed.data.q?.trim();
  const limit = parsed.data.limit ?? 50;
  const offset = parsed.data.offset ?? 0;
  const showDeleted = parsed.data.showDeleted ?? false;

  const where: any = {
    ...(showDeleted ? {} : { deletedAt: null }),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          accountType: true,
          createdAt: true,
          bannedAt: true,
          bannedReason: true,
          deletedAt: true,
          deletedReason: true,
          emailVerifiedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // counts: keep it light by using separate count queries per user
    const ids = items.map((u) => u.id);
    const [startupsCounts, ideasCounts, invCounts, partnerCounts] = await Promise.all([
      prisma.startup.groupBy({ by: ["ownerId"], where: { ownerId: { in: ids } }, _count: { _all: true } }),
      prisma.idea.groupBy({ by: ["ownerId"], where: { ownerId: { in: ids } }, _count: { _all: true } }),
      prisma.investorRequest.groupBy({ by: ["authorId"], where: { authorId: { in: ids } }, _count: { _all: true } }),
      prisma.partnerRequest.groupBy({ by: ["authorId"], where: { authorId: { in: ids } }, _count: { _all: true } }),
    ]);
    const mapCounts = (rows: Array<{ ownerId?: string; authorId?: string; _count: { _all: number } }>) => {
      const m = new Map<string, number>();
      for (const r of rows as any) {
        const key = (r.ownerId ?? r.authorId) as string;
        m.set(key, r._count._all);
      }
      return m;
    };
    const startupsM = mapCounts(startupsCounts as any);
    const ideasM = mapCounts(ideasCounts as any);
    const invM = mapCounts(invCounts as any);
    const partnerM = mapCounts(partnerCounts as any);

    return res.json({
      total,
      items: items.map((u) => {
        const x = u as any;
        return {
          ...x,
          createdAt: x.createdAt?.toISOString?.() ?? String(x.createdAt),
          bannedAt: x.bannedAt ? x.bannedAt.toISOString() : null,
          deletedAt: x.deletedAt ? x.deletedAt.toISOString() : null,
          emailVerifiedAt: x.emailVerifiedAt ? x.emailVerifiedAt.toISOString() : null,
          startupsCount: startupsM.get(x.id) ?? 0,
          ideasCount: ideasM.get(x.id) ?? 0,
          investorRequestsCount: invM.get(x.id) ?? 0,
          partnerRequestsCount: partnerM.get(x.id) ?? 0,
        };
      }),
    });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

adminUsersRouter.post("/:id/ban", async (req, res) => {
  const id = req.params.id;
  const parsed = z.object({ reason: z.string().min(3).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  const prisma = getPrisma();
  try {
    if (id === req.user!.userId) return res.status(400).json({ error: "Нельзя заблокировать самого себя" });
    await prisma.user.update({
      where: { id },
      data: { bannedAt: new Date(), bannedReason: parsed.data.reason },
      select: { id: true },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

adminUsersRouter.post("/:id/unban", async (req, res) => {
  const id = req.params.id;
  const prisma = getPrisma();
  try {
    await prisma.user.update({
      where: { id },
      data: { bannedAt: null, bannedReason: null },
      select: { id: true },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

adminUsersRouter.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const parsed = z.object({ reason: z.string().min(3).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  const prisma = getPrisma();
  try {
    if (id === req.user!.userId) return res.status(400).json({ error: "Нельзя удалить самого себя" });
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Remove user-owned marketplace content & related data. Many relations have onDelete: Cascade, but we soft-delete user.
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { authorId: id } });
      await tx.review.deleteMany({ where: { targetUserId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.startupAnalysis.deleteMany({ where: { userId: id } });

      // Chats: messages and conversations where user participates
      const convos = await tx.directConversation.findMany({
        where: { OR: [{ userAId: id }, { userBId: id }] },
        select: { id: true },
      });
      const convoIds = convos.map((c) => c.id);
      if (convoIds.length) {
        await tx.chatMessage.deleteMany({ where: { conversationId: { in: convoIds } } });
        await tx.directConversation.deleteMany({ where: { id: { in: convoIds } } });
      }

      await tx.bid.deleteMany({ where: { userId: id } });
      await tx.auctionParticipant.deleteMany({ where: { userId: id } });

      // Marketplace entities
      await tx.auction.deleteMany({ where: { startup: { ownerId: id } } as any });
      await tx.startup.deleteMany({ where: { ownerId: id } });
      await tx.idea.deleteMany({ where: { ownerId: id } });
      await tx.investorRequest.deleteMany({ where: { authorId: id } });
      await tx.partnerRequest.deleteMany({ where: { authorId: id } });

      // Attachments owned by user (other attachments removed via cascade with entities)
      await tx.attachment.deleteMany({ where: { ownerId: id } });

      // Finally, soft-delete user so we can show message on login.
      await tx.user.update({
        where: { id },
        data: {
          deletedAt: now,
          deletedReason: parsed.data.reason,
          bannedAt: null,
          bannedReason: null,
          emailVerifyTokenHash: null,
          emailVerifyTokenExpires: null,
        },
        select: { id: true },
      });
    });

    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

