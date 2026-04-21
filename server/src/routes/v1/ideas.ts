import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { canDeleteAsOwnerOrAdmin, canEditAsOwnerOrAdmin } from "../../lib/authz";
import { allowedCategories } from "../../lib/categories";
import { requireAuth, tryAuth } from "../../middleware/auth";

export const ideasRouter = Router();

const createIdeaSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(10).max(2000),
  category: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    }),
  price: z.coerce.number().positive().max(9_999_999_999, "Слишком большое число"),
  stage: z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"]),
  format: z.enum(["online", "offline", "hybrid"]),
  analysisId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  problem: z.string().max(2000).optional(),
  solution: z.string().max(2000).optional(),
  market: z.string().max(2000).optional(),
  profileExtra: z
    .object({
      city: z.string().min(1).max(80).optional(),
      doneItems: z.array(z.string().min(1).max(120)).max(24).optional(),
      helpTags: z.array(z.string().min(1).max(40)).max(24).optional(),
      needsText: z.string().min(1).max(2000).optional(),
      coverGradient: z.string().min(1).max(80).optional(),
    })
    .optional(),
  submitMode: z.enum(["draft", "submit"]).optional(),
});

const updateIdeaSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    })
    .optional(),
  price: z.coerce.number().positive().max(9_999_999_999, "Слишком большое число").optional(),
  stage: z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"]).optional(),
  format: z.enum(["online", "offline", "hybrid"]).optional(),
  analysisId: z.string().uuid().nullable().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  problem: z.string().max(2000).optional().nullable(),
  solution: z.string().max(2000).optional().nullable(),
  market: z.string().max(2000).optional().nullable(),
  profileExtra: z
    .object({
      city: z.string().min(1).max(80).optional().nullable(),
      doneItems: z.array(z.string().min(1).max(120)).max(24).optional(),
      helpTags: z.array(z.string().min(1).max(40)).max(24).optional(),
      needsText: z.string().min(1).max(2000).optional().nullable(),
      coverGradient: z.string().min(1).max(80).optional().nullable(),
    })
    .optional(),
  submitForModeration: z.boolean().optional(),
});

ideasRouter.get("/", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
  try {
    const viewer = req.user;
    const canSeeAllForOwner = ownerId && viewer && (viewer.role === "admin" || viewer.userId === ownerId);
    const ideas = await prisma.idea.findMany({
      where: canSeeAllForOwner
        ? { ownerId }
        : ownerId
          ? { ownerId, moderationStatus: "published" }
          : viewer?.role === "admin"
            ? undefined
            : { moderationStatus: "published" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { owner: { select: { name: true, avatarUrl: true, role: true, accountType: true } } },
    });

    const ownerIds = Array.from(new Set(ideas.map((i) => i.ownerId)));
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

    res.json(
      ideas.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        category: i.category,
        price: Number(i.price),
        stage: i.stage,
        format: i.format,
        analysisId: (i as any).analysisId ?? null,
        owner: {
          id: i.ownerId,
          name: i.owner?.name,
          avatarUrl: i.owner?.avatarUrl,
          role: i.owner?.role,
          accountType: i.owner?.accountType,
          rating: ratingByUser.get(i.ownerId) ?? 0,
        },
        problem: i.problem,
        solution: i.solution,
        market: i.market,
        profileExtra: (i as any).profileExtra ?? null,
      })),
    );
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

ideasRouter.get("/:ideaId", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  const ideaId = typeof req.params.ideaId === "string" ? req.params.ideaId : req.params.ideaId[0];
  try {
    const viewer = req.user;
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true, role: true, accountType: true } },
        analysis: { select: { id: true, createdAt: true, result: true } },
        attachments: { select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true } },
      },
    });

    if (!idea) return res.status(404).json({ error: "Идея не найдена" });
    if ((idea as any).moderationStatus !== "published") {
      if (!viewer) return res.status(404).json({ error: "Идея не найдена" });
      const canSee = viewer.role === "admin" || viewer.userId === idea.ownerId;
      if (!canSee) return res.status(404).json({ error: "Идея не найдена" });
      if (viewer.role === "admin") {
        await prisma.moderationEvent.create({
          data: { entityType: "idea", entityId: idea.id, action: "viewed", actorId: viewer.userId },
        });
      }
    }

    const agg = await prisma.review.aggregate({
      where: { targetUserId: idea.ownerId },
      _avg: { rating: true },
    });
    const rating = agg._avg.rating ? Number(agg._avg.rating) : 0;

    return res.json({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      price: Number(idea.price),
      stage: idea.stage,
      format: idea.format,
      analysisId: (idea as any).analysisId ?? null,
      analysis: idea.analysis
        ? { id: idea.analysis.id, createdAt: idea.analysis.createdAt, result: idea.analysis.result }
        : null,
      attachments: idea.attachments,
      owner: {
        id: idea.owner.id,
        name: idea.owner.name,
        avatarUrl: idea.owner.avatarUrl,
        role: idea.owner.role,
        accountType: idea.owner.accountType,
        rating,
      },
      problem: idea.problem,
      solution: idea.solution,
      market: idea.market,
      profileExtra: (idea as any).profileExtra ?? null,
    });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

ideasRouter.post("/", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const parsed = createIdeaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const data = parsed.data;
  try {
    if (data.analysisId) {
      const a = await prisma.startupAnalysis.findUnique({
        where: { id: data.analysisId },
        select: { id: true, userId: true },
      });
      if (!a) return res.status(404).json({ error: "Анализ не найден" });
      if (a.userId !== req.user!.userId) return res.status(403).json({ error: "Доступ запрещен" });
    }

    const nextStatus = data.submitMode === "draft" ? "draft" : "pending_moderation";
    const created = await prisma.idea.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        stage: data.stage,
        format: data.format,
        problem: data.problem ?? null,
        solution: data.solution ?? null,
        market: data.market ?? null,
        ownerId: req.user!.userId,
        analysisId: data.analysisId ?? null,
        moderationStatus: nextStatus as any,
        ...(data.profileExtra ? { profileExtra: data.profileExtra as any } : {}),
      },
      select: { id: true },
    });

    if (data.attachmentIds && data.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: data.attachmentIds }, ownerId: req.user!.userId },
        data: { ideaId: created.id },
      });
    }

    if (nextStatus !== "draft") {
      await prisma.moderationEvent.create({
        data: { entityType: "idea", entityId: created.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "idea", entityId: created.id } },
            select: { id: true },
          }),
        ),
      );
    }
    res.status(201).json(created);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

ideasRouter.delete("/:ideaId", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const ideaId = typeof req.params.ideaId === "string" ? req.params.ideaId : req.params.ideaId[0];
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true, ownerId: true },
    });
    if (!idea) return res.status(404).json({ error: "Идея не найдена" });
    if (!canDeleteAsOwnerOrAdmin(req.user!, idea.ownerId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    await prisma.idea.delete({ where: { id: idea.id } });
    return res.status(200).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

ideasRouter.put("/:ideaId", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const ideaId = typeof req.params.ideaId === "string" ? req.params.ideaId : req.params.ideaId[0];
  const parsed = updateIdeaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const row = await prisma.idea.findUnique({ where: { id: ideaId }, select: { id: true, ownerId: true } });
    if (!row) return res.status(404).json({ error: "Идея не найдена" });
    if (!canEditAsOwnerOrAdmin(req.user!, row.ownerId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const data = parsed.data;

    if (data.analysisId !== undefined && data.analysisId !== null) {
      const a = await prisma.startupAnalysis.findUnique({
        where: { id: data.analysisId },
        select: { id: true, userId: true },
      });
      if (!a) return res.status(404).json({ error: "Анализ не найден" });
      if (a.userId !== req.user!.userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Доступ запрещен" });
      }
    }

    const updated = await prisma.idea.update({
      where: { id: row.id },
      data: {
        ...(data.submitForModeration === true && req.user!.role !== "admin"
          ? {
              moderationStatus: "pending_moderation",
              adminComment: null,
              revisionDate: null,
              rejectedReason: null,
            }
          : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.stage !== undefined ? { stage: data.stage } : {}),
        ...(data.format !== undefined ? { format: data.format } : {}),
        ...(data.problem !== undefined ? { problem: data.problem } : {}),
        ...(data.solution !== undefined ? { solution: data.solution } : {}),
        ...(data.market !== undefined ? { market: data.market } : {}),
        ...(data.analysisId !== undefined ? { analysisId: data.analysisId } : {}),
        ...(data.profileExtra !== undefined ? { profileExtra: data.profileExtra as any } : {}),
      },
      select: { id: true },
    });

    if (data.attachmentIds) {
      await prisma.attachment.updateMany({
        where: { ideaId: updated.id, ownerId: req.user!.userId, id: { notIn: data.attachmentIds } },
        data: { ideaId: null },
      });
      if (data.attachmentIds.length > 0) {
        await prisma.attachment.updateMany({
          where: { id: { in: data.attachmentIds }, ownerId: req.user!.userId },
          data: { ideaId: updated.id },
        });
      }
    }

    if (data.submitForModeration === true && req.user!.role !== "admin") {
      await prisma.moderationEvent.create({
        data: { entityType: "idea", entityId: updated.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "idea", entityId: updated.id } },
            select: { id: true },
          }),
        ),
      );
    }
    return res.status(200).json(updated);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

