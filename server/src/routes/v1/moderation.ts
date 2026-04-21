import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { requireAdmin, requireAuth } from "../../middleware/auth";

export const moderationRouter = Router();

const entityTypeSchema = z.enum(["startup", "idea", "investor", "partner", "auction"]);
const queueStatusSchema = z.enum(["pending_moderation", "needs_revision", "rejected"]);

function sevenDaysAgo(now: Date) {
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
}

async function autoRejectExpiredRevisions() {
  const prisma = getPrisma();
  const now = new Date();
  const cutoff = sevenDaysAgo(now);
  const reason = "Срок на доработку истёк (7 дней)";

  await Promise.all([
    prisma.startup.updateMany({
      where: { moderationStatus: "needs_revision", revisionDate: { lt: cutoff } },
      data: { moderationStatus: "rejected", rejectedReason: reason },
    }),
    prisma.idea.updateMany({
      where: { moderationStatus: "needs_revision", revisionDate: { lt: cutoff } },
      data: { moderationStatus: "rejected", rejectedReason: reason },
    }),
    prisma.investorRequest.updateMany({
      where: { moderationStatus: "needs_revision", revisionDate: { lt: cutoff } },
      data: { moderationStatus: "rejected", rejectedReason: reason },
    }),
    prisma.partnerRequest.updateMany({
      where: { moderationStatus: "needs_revision", revisionDate: { lt: cutoff } },
      data: { moderationStatus: "rejected", rejectedReason: reason },
    }),
    prisma.auction.updateMany({
      where: { moderationStatus: "needs_revision", revisionDate: { lt: cutoff } },
      data: { moderationStatus: "rejected", rejectedReason: reason, isActive: false },
    }),
  ]);
}

type QueueItem = {
  type: z.infer<typeof entityTypeSchema>;
  id: string;
  status: z.infer<typeof queueStatusSchema>;
  title: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  revisionDate: string | null;
  adminComment: string | null;
  rejectedReason: string | null;
};

moderationRouter.get("/queue", requireAuth, requireAdmin, async (req, res) => {
  await autoRejectExpiredRevisions();
  const parsed = z
    .object({
      type: entityTypeSchema.optional(),
      userId: z.string().uuid().optional(),
      status: z.union([queueStatusSchema, z.literal("all")]).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  const { type, userId, status, from, to } = parsed.data;
  const statuses = status && status !== "all" ? [status] : ["pending_moderation", "needs_revision", "rejected"];

  const dateWhere = {
    ...(from ? { createdAt: { gte: from } } : {}),
    ...(to ? { createdAt: { lte: to } } : {}),
  };

  async function forStartups(): Promise<QueueItem[]> {
    const rows = await prisma.startup.findMany({
      where: {
        moderationStatus: { in: statuses as any },
        ...(userId ? { ownerId: userId } : {}),
        ...dateWhere,
      } as any,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { owner: { select: { id: true, name: true } } },
    });
    return rows.map((r) => ({
      type: "startup",
      id: r.id,
      status: r.moderationStatus as any,
      title: r.title,
      userId: r.ownerId,
      userName: r.owner.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      revisionDate: r.revisionDate ? r.revisionDate.toISOString() : null,
      adminComment: r.adminComment ?? null,
      rejectedReason: r.rejectedReason ?? null,
    }));
  }

  async function forIdeas(): Promise<QueueItem[]> {
    const rows = await prisma.idea.findMany({
      where: {
        moderationStatus: { in: statuses as any },
        ...(userId ? { ownerId: userId } : {}),
        ...dateWhere,
      } as any,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { owner: { select: { id: true, name: true } } },
    });
    return rows.map((r) => ({
      type: "idea",
      id: r.id,
      status: r.moderationStatus as any,
      title: r.title,
      userId: r.ownerId,
      userName: r.owner.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      revisionDate: r.revisionDate ? r.revisionDate.toISOString() : null,
      adminComment: r.adminComment ?? null,
      rejectedReason: r.rejectedReason ?? null,
    }));
  }

  async function forInvestors(): Promise<QueueItem[]> {
    const rows = await prisma.investorRequest.findMany({
      where: {
        moderationStatus: { in: statuses as any },
        ...(userId ? { authorId: userId } : {}),
        ...dateWhere,
      } as any,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { author: { select: { id: true, name: true } } },
    });
    return rows.map((r) => ({
      type: "investor",
      id: r.id,
      status: r.moderationStatus as any,
      title: (r.profileExtra as any)?.investorName ?? `Инвестор: ${r.industry}`,
      userId: r.authorId,
      userName: r.author.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      revisionDate: r.revisionDate ? r.revisionDate.toISOString() : null,
      adminComment: r.adminComment ?? null,
      rejectedReason: r.rejectedReason ?? null,
    }));
  }

  async function forPartners(): Promise<QueueItem[]> {
    const rows = await prisma.partnerRequest.findMany({
      where: {
        moderationStatus: { in: statuses as any },
        ...(userId ? { authorId: userId } : {}),
        ...dateWhere,
      } as any,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { author: { select: { id: true, name: true } } },
    });
    return rows.map((r) => ({
      type: "partner",
      id: r.id,
      status: r.moderationStatus as any,
      title: (r.profileExtra as any)?.partnerName ?? `Партнёр: ${r.industry}`,
      userId: r.authorId,
      userName: r.author.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      revisionDate: r.revisionDate ? r.revisionDate.toISOString() : null,
      adminComment: r.adminComment ?? null,
      rejectedReason: r.rejectedReason ?? null,
    }));
  }

  async function forAuctions(): Promise<QueueItem[]> {
    const rows = await prisma.auction.findMany({
      where: {
        moderationStatus: { in: statuses as any },
        ...dateWhere,
        ...(userId ? { startup: { ownerId: userId } } : {}),
      } as any,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { startup: { select: { id: true, title: true, ownerId: true, owner: { select: { name: true } } } } },
    });
    return rows.map((r) => ({
      type: "auction",
      id: r.id,
      status: r.moderationStatus as any,
      title: `Аукцион: ${r.startup.title}`,
      userId: r.startup.ownerId,
      userName: r.startup.owner.name,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      revisionDate: r.revisionDate ? r.revisionDate.toISOString() : null,
      adminComment: r.adminComment ?? null,
      rejectedReason: r.rejectedReason ?? null,
    }));
  }

  const loaders: Record<z.infer<typeof entityTypeSchema>, () => Promise<QueueItem[]>> = {
    startup: forStartups,
    idea: forIdeas,
    investor: forInvestors,
    partner: forPartners,
    auction: forAuctions,
  };

  const items = type
    ? await loaders[type]()
    : (await Promise.all([forStartups(), forIdeas(), forInvestors(), forPartners(), forAuctions()])).flat();

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return res.json(items);
});

moderationRouter.get("/queue/count", requireAuth, requireAdmin, async (_req, res) => {
  await autoRejectExpiredRevisions();
  const prisma = getPrisma();
  try {
    const [pendingS, pendingI, pendingInv, pendingP, pendingA, totalS, totalI, totalInv, totalP, totalA] = await Promise.all([
      prisma.startup.count({ where: { moderationStatus: "pending_moderation" as any } }),
      prisma.idea.count({ where: { moderationStatus: "pending_moderation" as any } }),
      prisma.investorRequest.count({ where: { moderationStatus: "pending_moderation" as any } }),
      prisma.partnerRequest.count({ where: { moderationStatus: "pending_moderation" as any } }),
      prisma.auction.count({ where: { moderationStatus: "pending_moderation" as any } }),
      prisma.startup.count({ where: { moderationStatus: { in: ["pending_moderation", "needs_revision"] } as any } }),
      prisma.idea.count({ where: { moderationStatus: { in: ["pending_moderation", "needs_revision"] } as any } }),
      prisma.investorRequest.count({ where: { moderationStatus: { in: ["pending_moderation", "needs_revision"] } as any } }),
      prisma.partnerRequest.count({ where: { moderationStatus: { in: ["pending_moderation", "needs_revision"] } as any } }),
      prisma.auction.count({ where: { moderationStatus: { in: ["pending_moderation", "needs_revision"] } as any } }),
    ]);
    return res.json({ pending: pendingS + pendingI + pendingInv + pendingP + pendingA, total: totalS + totalI + totalInv + totalP + totalA });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

moderationRouter.get("/my", requireAuth, async (req, res) => {
  await autoRejectExpiredRevisions();
  const prisma = getPrisma();
  const userId = req.user!.userId;
  try {
    const [startups, ideas, inv, partners, auctions] = await Promise.all([
      prisma.startup.findMany({
        where: { ownerId: userId, moderationStatus: { not: "published" } as any },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: { id: true, title: true, moderationStatus: true, adminComment: true, revisionDate: true, rejectedReason: true, updatedAt: true, createdAt: true },
      }),
      prisma.idea.findMany({
        where: { ownerId: userId, moderationStatus: { not: "published" } as any },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: { id: true, title: true, moderationStatus: true, adminComment: true, revisionDate: true, rejectedReason: true, updatedAt: true, createdAt: true },
      }),
      prisma.investorRequest.findMany({
        where: { authorId: userId, moderationStatus: { not: "published" } as any },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: { id: true, industry: true, moderationStatus: true, adminComment: true, revisionDate: true, rejectedReason: true, updatedAt: true, createdAt: true, profileExtra: true },
      }),
      prisma.partnerRequest.findMany({
        where: { authorId: userId, moderationStatus: { not: "published" } as any },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: { id: true, industry: true, moderationStatus: true, adminComment: true, revisionDate: true, rejectedReason: true, updatedAt: true, createdAt: true, profileExtra: true },
      }),
      prisma.auction.findMany({
        where: { startup: { ownerId: userId }, moderationStatus: { not: "published" } as any },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true,
          moderationStatus: true,
          adminComment: true,
          revisionDate: true,
          rejectedReason: true,
          updatedAt: true,
          createdAt: true,
          startup: { select: { title: true } },
        },
      }),
    ]);

    const items = [
      ...startups.map((x) => ({ type: "startup" as const, id: x.id, title: x.title, ...x })),
      ...ideas.map((x) => ({ type: "idea" as const, id: x.id, title: x.title, ...x })),
      ...inv.map((x) => ({ type: "investor" as const, id: x.id, title: (x.profileExtra as any)?.investorName ?? `Инвестор: ${x.industry}`, ...x })),
      ...partners.map((x) => ({ type: "partner" as const, id: x.id, title: (x.profileExtra as any)?.partnerName ?? `Партнёр: ${x.industry}`, ...x })),
      ...auctions.map((x) => ({ type: "auction" as const, id: x.id, title: `Аукцион: ${x.startup.title}`, ...x })),
    ].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

    return res.json(items);
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

const actionItemSchema = z.object({
  type: entityTypeSchema,
  id: z.string().uuid(),
});

const bulkApproveSchema = z.object({
  items: z.array(actionItemSchema).min(1).max(200),
});

async function setStatusForItem(
  item: z.infer<typeof actionItemSchema>,
  next: "published" | "needs_revision" | "rejected",
  actorId: string,
  comment?: string,
) {
  const prisma = getPrisma();
  const now = new Date();
  let targetUserId: string | null = null;

  if (item.type === "startup") {
    const row = await prisma.startup.update({
      where: { id: item.id },
      data:
        next === "published"
          ? { moderationStatus: "published", adminComment: null, revisionDate: null, rejectedReason: null }
          : next === "needs_revision"
            ? { moderationStatus: "needs_revision", adminComment: comment ?? null, revisionDate: now, rejectedReason: null }
            : { moderationStatus: "rejected", rejectedReason: comment ?? "Отклонено", adminComment: null, revisionDate: null },
      select: { id: true, ownerId: true, title: true },
    });
    targetUserId = row.ownerId;
  } else if (item.type === "idea") {
    const row = await prisma.idea.update({
      where: { id: item.id },
      data:
        next === "published"
          ? { moderationStatus: "published", adminComment: null, revisionDate: null, rejectedReason: null }
          : next === "needs_revision"
            ? { moderationStatus: "needs_revision", adminComment: comment ?? null, revisionDate: now, rejectedReason: null }
            : { moderationStatus: "rejected", rejectedReason: comment ?? "Отклонено", adminComment: null, revisionDate: null },
      select: { id: true, ownerId: true, title: true },
    });
    targetUserId = row.ownerId;
  } else if (item.type === "investor") {
    const row = await prisma.investorRequest.update({
      where: { id: item.id },
      data:
        next === "published"
          ? { moderationStatus: "published", adminComment: null, revisionDate: null, rejectedReason: null }
          : next === "needs_revision"
            ? { moderationStatus: "needs_revision", adminComment: comment ?? null, revisionDate: now, rejectedReason: null }
            : { moderationStatus: "rejected", rejectedReason: comment ?? "Отклонено", adminComment: null, revisionDate: null },
      select: { id: true, authorId: true, industry: true },
    });
    targetUserId = row.authorId;
  } else if (item.type === "partner") {
    const row = await prisma.partnerRequest.update({
      where: { id: item.id },
      data:
        next === "published"
          ? { moderationStatus: "published", adminComment: null, revisionDate: null, rejectedReason: null }
          : next === "needs_revision"
            ? { moderationStatus: "needs_revision", adminComment: comment ?? null, revisionDate: now, rejectedReason: null }
            : { moderationStatus: "rejected", rejectedReason: comment ?? "Отклонено", adminComment: null, revisionDate: null },
      select: { id: true, authorId: true, industry: true },
    });
    targetUserId = row.authorId;
  } else if (item.type === "auction") {
    const row = await prisma.auction.update({
      where: { id: item.id },
      data:
        next === "published"
          ? { moderationStatus: "published", adminComment: null, revisionDate: null, rejectedReason: null, isActive: true }
          : next === "needs_revision"
            ? { moderationStatus: "needs_revision", adminComment: comment ?? null, revisionDate: now, rejectedReason: null, isActive: false }
            : { moderationStatus: "rejected", rejectedReason: comment ?? "Отклонено", adminComment: null, revisionDate: null, isActive: false },
      select: { id: true, startup: { select: { ownerId: true, title: true } } },
    });
    targetUserId = row.startup.ownerId;
  }

  const action =
    next === "published" ? "approved" : next === "needs_revision" ? "revision_requested" : "rejected";
  await prisma.moderationEvent.create({
    data: {
      entityType: item.type,
      entityId: item.id,
      action,
      actorId,
      comment: comment ?? null,
    } as any,
  });

  if (targetUserId) {
    const title =
      item.type === "startup"
        ? "Статус карточки: стартап"
        : item.type === "idea"
          ? "Статус карточки: идея"
          : item.type === "investor"
            ? "Статус карточки: инвестор"
            : item.type === "partner"
              ? "Статус карточки: партнёр"
              : "Статус карточки: аукцион";
    const statusText =
      next === "published" ? "Одобрено и опубликовано" : next === "needs_revision" ? "Требует доработки" : "Отклонено";
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "moderation_status",
        payload: { entityType: item.type, entityId: item.id, nextStatus: next, message: statusText, comment: comment ?? null },
      },
      select: { id: true },
    });
    // also notify admins? they already have queue dot, skip
    void title;
  }
}

moderationRouter.post("/approve", requireAuth, requireAdmin, async (req, res) => {
  const parsed = actionItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  try {
    await setStatusForItem(parsed.data, "published", req.user!.userId);
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

moderationRouter.post("/approve/bulk", requireAuth, requireAdmin, async (req, res) => {
  const parsed = bulkApproveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  try {
    await Promise.all(parsed.data.items.map((it) => setStatusForItem(it, "published", req.user!.userId)));
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

moderationRouter.post("/revision", requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({ item: actionItemSchema, comment: z.string().min(1).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  try {
    await setStatusForItem(parsed.data.item, "needs_revision", req.user!.userId, parsed.data.comment);
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

moderationRouter.post("/reject", requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({ item: actionItemSchema, reason: z.string().min(3).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  try {
    await setStatusForItem(parsed.data.item, "rejected", req.user!.userId, parsed.data.reason);
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

moderationRouter.post("/submit", requireAuth, async (req, res) => {
  const parsed = actionItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  const prisma = getPrisma();
  const meId = req.user!.userId;
  try {
    const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
    if (parsed.data.type === "startup") {
      const row = await prisma.startup.findUnique({ where: { id: parsed.data.id }, select: { ownerId: true } });
      if (!row) return res.status(404).json({ error: "Не найдено" });
      if (row.ownerId !== meId && req.user!.role !== "admin") return res.status(403).json({ error: "Доступ запрещен" });
      await prisma.startup.update({
        where: { id: parsed.data.id },
        data: { moderationStatus: "pending_moderation", adminComment: null, revisionDate: null, rejectedReason: null },
        select: { id: true },
      });
    } else if (parsed.data.type === "idea") {
      const row = await prisma.idea.findUnique({ where: { id: parsed.data.id }, select: { ownerId: true } });
      if (!row) return res.status(404).json({ error: "Не найдено" });
      if (row.ownerId !== meId && req.user!.role !== "admin") return res.status(403).json({ error: "Доступ запрещен" });
      await prisma.idea.update({
        where: { id: parsed.data.id },
        data: { moderationStatus: "pending_moderation", adminComment: null, revisionDate: null, rejectedReason: null },
        select: { id: true },
      });
    } else if (parsed.data.type === "investor") {
      const row = await prisma.investorRequest.findUnique({ where: { id: parsed.data.id }, select: { authorId: true } });
      if (!row) return res.status(404).json({ error: "Не найдено" });
      if (row.authorId !== meId && req.user!.role !== "admin") return res.status(403).json({ error: "Доступ запрещен" });
      await prisma.investorRequest.update({
        where: { id: parsed.data.id },
        data: { moderationStatus: "pending_moderation", adminComment: null, revisionDate: null, rejectedReason: null },
        select: { id: true },
      });
    } else if (parsed.data.type === "partner") {
      const row = await prisma.partnerRequest.findUnique({ where: { id: parsed.data.id }, select: { authorId: true } });
      if (!row) return res.status(404).json({ error: "Не найдено" });
      if (row.authorId !== meId && req.user!.role !== "admin") return res.status(403).json({ error: "Доступ запрещен" });
      await prisma.partnerRequest.update({
        where: { id: parsed.data.id },
        data: { moderationStatus: "pending_moderation", adminComment: null, revisionDate: null, rejectedReason: null },
        select: { id: true },
      });
    } else if (parsed.data.type === "auction") {
      const row = await prisma.auction.findUnique({
        where: { id: parsed.data.id },
        select: { startup: { select: { ownerId: true } } },
      });
      if (!row) return res.status(404).json({ error: "Не найдено" });
      if (row.startup.ownerId !== meId && req.user!.role !== "admin") return res.status(403).json({ error: "Доступ запрещен" });
      await prisma.auction.update({
        where: { id: parsed.data.id },
        data: { moderationStatus: "pending_moderation", adminComment: null, revisionDate: null, rejectedReason: null, isActive: true },
        select: { id: true },
      });
    }

    await prisma.moderationEvent.create({
      data: { entityType: parsed.data.type, entityId: parsed.data.id, action: "submitted", actorId: meId } as any,
    });

    await Promise.all(
      admins.map((a) =>
        prisma.notification.create({
          data: {
            userId: a.id,
            type: "moderation_new",
            payload: { entityType: parsed.data.type, entityId: parsed.data.id },
          },
          select: { id: true },
        }),
      ),
    );

    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

