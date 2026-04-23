import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { canDeleteAsOwnerOrAdmin, canEditAsOwnerOrAdmin } from "../../lib/authz";
import { allowedCategories } from "../../lib/categories";
import { requireAuth, requireVerifiedEmail, tryAuth } from "../../middleware/auth";

export const investorsRouter = Router();

const createInvestorSchema = z.object({
  industry: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    }),
  description: z.string().min(10).max(2000),
  amount: z.coerce.number().positive().max(9_999_999_999, "Слишком большое число"),
  profileExtra: z
    .object({
      investorName: z.string().min(1).max(90),
      investorTitle: z.string().max(90).optional(),
      checkMin: z.coerce.number().positive().optional(),
      checkMax: z.coerce.number().positive().optional(),
      stages: z.array(z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"])).max(10).optional(),
      dealsCount: z.coerce.number().int().min(0).max(9999).optional(),
      exitsCount: z.coerce.number().int().min(0).max(9999).optional(),
      interests: z.array(z.string().min(1).max(48)).max(24).optional(),
    })
    .optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  submitMode: z.enum(["draft", "submit"]).optional(),
});

const updateInvestorSchema = z.object({
  industry: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    })
    .optional(),
  description: z.string().min(10).max(2000).optional(),
  amount: z.coerce.number().positive().max(9_999_999_999, "Слишком большое число").optional(),
  status: z.enum(["active", "paused", "closed"]).optional(),
  profileExtra: z
    .object({
      investorName: z.string().min(1).max(90).optional(),
      investorTitle: z.string().max(90).optional(),
      checkMin: z.coerce.number().positive().optional().nullable(),
      checkMax: z.coerce.number().positive().optional().nullable(),
      stages: z.array(z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"])).max(10).optional(),
      dealsCount: z.coerce.number().int().min(0).max(9999).optional().nullable(),
      exitsCount: z.coerce.number().int().min(0).max(9999).optional().nullable(),
      interests: z.array(z.string().min(1).max(48)).max(24).optional(),
    })
    .optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  submitForModeration: z.boolean().optional(),
});

investorsRouter.get("/", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    const viewer = req.user;
    const includeAll = req.query.includeAll === "1" || req.query.includeAll === "true";
    const items = await prisma.investorRequest.findMany({
      where:
        viewer?.role === "admin"
          ? includeAll
            ? undefined
            : { moderationStatus: "published" }
          : {
              moderationStatus: "published",
            },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { name: true, avatarUrl: true } } },
    });
    res.json(
      items.map((it) => ({
        id: it.id,
        industry: it.industry,
        description: it.description,
        amount: Number(it.amount),
        status: it.status,
        authorId: it.authorId,
        author: it.author,
        profileExtra: (it as any).profileExtra ?? null,
      })),
    );
  } catch (_e) {
    res.status(503).json({ error: "База данных недоступна" });
  }
});

investorsRouter.get("/:requestId", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  try {
    const viewer = req.user;
    const item = await prisma.investorRequest.findUnique({
      where: { id: requestId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        attachments: { select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true } },
      },
    });
    if (!item) return res.status(404).json({ error: "Запрос не найден" });
    if (item.moderationStatus !== "published") {
      if (!viewer) return res.status(404).json({ error: "Запрос не найден" });
      const canSee = viewer.role === "admin" || viewer.userId === item.authorId;
      if (!canSee) return res.status(404).json({ error: "Запрос не найден" });
      if (viewer.role === "admin") {
        await prisma.moderationEvent.create({
          data: { entityType: "investor", entityId: item.id, action: "viewed", actorId: viewer.userId },
        });
      }
    }
    return res.json({
      ...item,
      amount: Number(item.amount),
    });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

investorsRouter.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  const parsed = createInvestorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const nextStatus = req.user!.role === "admin" ? "published" : parsed.data.submitMode === "draft" ? "draft" : "pending_moderation";
    const created = await prisma.investorRequest.create({
      data: {
        industry: parsed.data.industry,
        description: parsed.data.description,
        amount: parsed.data.amount,
        authorId: req.user!.userId,
        moderationStatus: nextStatus as any,
        ...(parsed.data.profileExtra ? { profileExtra: parsed.data.profileExtra as any } : {}),
      },
      select: { id: true },
    });
    if (parsed.data.attachmentIds && parsed.data.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: parsed.data.attachmentIds }, ownerId: req.user!.userId },
        data: { investorRequestId: created.id },
      });
    }
    if (nextStatus === "pending_moderation") {
      await prisma.moderationEvent.create({
        data: { entityType: "investor", entityId: created.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "investor", entityId: created.id } },
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

investorsRouter.delete("/:requestId", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  try {
    const row = await prisma.investorRequest.findUnique({
      where: { id: requestId },
      select: { id: true, authorId: true },
    });
    if (!row) return res.status(404).json({ error: "Запрос не найден" });
    if (!canDeleteAsOwnerOrAdmin(req.user!, row.authorId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    await prisma.investorRequest.delete({ where: { id: row.id } });
    return res.status(200).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

investorsRouter.put("/:requestId", requireAuth, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  const parsed = updateInvestorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const row = await prisma.investorRequest.findUnique({
      where: { id: requestId },
      select: { id: true, authorId: true, moderationStatus: true },
    });
    if (!row) return res.status(404).json({ error: "Запрос не найден" });
    if (!canEditAsOwnerOrAdmin(req.user!, row.authorId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const data = parsed.data;
    const resubmit = data.submitForModeration === true && req.user!.role !== "admin";
    const updated = await prisma.investorRequest.update({
      where: { id: row.id },
      data: {
        ...(data.industry !== undefined ? { industry: data.industry } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
        ...(data.profileExtra !== undefined ? { profileExtra: data.profileExtra as any } : {}),
        ...(resubmit
          ? {
              moderationStatus: "pending_moderation",
              adminComment: null,
              revisionDate: null,
              rejectedReason: null,
            }
          : {}),
      },
      select: { id: true },
    });

    if (data.attachmentIds) {
      await prisma.attachment.updateMany({
        where: { investorRequestId: updated.id, ownerId: req.user!.userId, id: { notIn: data.attachmentIds } },
        data: { investorRequestId: null },
      });
      if (data.attachmentIds.length > 0) {
        await prisma.attachment.updateMany({
          where: { id: { in: data.attachmentIds }, ownerId: req.user!.userId },
          data: { investorRequestId: updated.id },
        });
      }
    }

    if (resubmit) {
      await prisma.moderationEvent.create({
        data: { entityType: "investor", entityId: updated.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "investor", entityId: updated.id } },
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

