import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { canDeleteAsOwnerOrAdmin, canEditAsOwnerOrAdmin } from "../../lib/authz";
import { allowedCategories } from "../../lib/categories";
import { requireAuth, requireVerifiedEmail, tryAuth } from "../../middleware/auth";

export const partnersRouter = Router();

const createPartnerSchema = z.object({
  role: z.enum(["supplier", "reseller", "integration", "cofounder"]),
  industry: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    }),
  description: z.string().min(10).max(2000),
  profileExtra: z
    .object({
      partnerName: z.string().min(1).max(120),
      partnerType: z.string().min(0).max(120).optional(),
      helpText: z.string().min(0).max(4000).optional(),
      services: z
        .array(
          z.object({
            title: z.string().min(1).max(140),
            note: z.string().min(0).max(200).optional(),
          }),
        )
        .max(24)
        .optional(),
      fitFor: z.array(z.string().min(1).max(80)).max(24).optional(),
      ctaText: z.string().min(0).max(80).optional(),
    })
    .optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  submitMode: z.enum(["draft", "submit"]).optional(),
});

const updatePartnerSchema = z.object({
  role: z.enum(["supplier", "reseller", "integration", "cofounder"]).optional(),
  industry: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    })
    .optional(),
  description: z.string().min(10).max(2000).optional(),
  profileExtra: z
    .object({
      partnerName: z.string().min(1).max(120).optional(),
      partnerType: z.string().min(0).max(120).optional(),
      helpText: z.string().min(0).max(4000).optional(),
      services: z
        .array(
          z.object({
            title: z.string().min(1).max(140),
            note: z.string().min(0).max(200).optional(),
          }),
        )
        .max(24)
        .optional(),
      fitFor: z.array(z.string().min(1).max(80)).max(24).optional(),
      ctaText: z.string().min(0).max(80).optional(),
    })
    .optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  submitForModeration: z.boolean().optional(),
});

partnersRouter.get("/", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    const viewer = req.user;
    const includeAll = req.query.includeAll === "1" || req.query.includeAll === "true";
    const items = await prisma.partnerRequest.findMany({
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
        role: it.role,
        industry: it.industry,
        description: it.description,
        authorId: it.authorId,
        author: it.author,
        profileExtra: (it as any).profileExtra ?? null,
      })),
    );
  } catch (_e) {
    res.status(503).json({ error: "База данных недоступна" });
  }
});

partnersRouter.get("/:requestId", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  try {
    const viewer = req.user;
    const item = await prisma.partnerRequest.findUnique({
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
          data: { entityType: "partner", entityId: item.id, action: "viewed", actorId: viewer.userId },
        });
      }
    }
    return res.json(item);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

partnersRouter.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  const parsed = createPartnerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const nextStatus = req.user!.role === "admin" ? "published" : parsed.data.submitMode === "draft" ? "draft" : "pending_moderation";
    const created = await prisma.partnerRequest.create({
      data: {
        role: parsed.data.role,
        industry: parsed.data.industry,
        description: parsed.data.description,
        authorId: req.user!.userId,
        moderationStatus: nextStatus as any,
        ...(parsed.data.profileExtra ? { profileExtra: parsed.data.profileExtra as any } : {}),
      },
      select: { id: true },
    });
    if (parsed.data.attachmentIds && parsed.data.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: parsed.data.attachmentIds }, ownerId: req.user!.userId },
        data: { partnerRequestId: created.id },
      });
    }
    if (nextStatus === "pending_moderation") {
      await prisma.moderationEvent.create({
        data: { entityType: "partner", entityId: created.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "partner", entityId: created.id } },
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

partnersRouter.delete("/:requestId", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  try {
    const row = await prisma.partnerRequest.findUnique({
      where: { id: requestId },
      select: { id: true, authorId: true },
    });
    if (!row) return res.status(404).json({ error: "Запрос не найден" });
    if (!canDeleteAsOwnerOrAdmin(req.user!, row.authorId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    await prisma.partnerRequest.delete({ where: { id: row.id } });
    return res.status(200).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

partnersRouter.put("/:requestId", requireAuth, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  const parsed = updatePartnerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const row = await prisma.partnerRequest.findUnique({
      where: { id: requestId },
      select: { id: true, authorId: true, moderationStatus: true },
    });
    if (!row) return res.status(404).json({ error: "Запрос не найден" });
    if (!canEditAsOwnerOrAdmin(req.user!, row.authorId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const data = parsed.data;
    const resubmit = data.submitForModeration === true && req.user!.role !== "admin";
    const updated = await prisma.partnerRequest.update({
      where: { id: row.id },
      data: {
        ...(data.role !== undefined ? { role: data.role as any } : {}),
        ...(data.industry !== undefined ? { industry: data.industry } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
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
        where: { partnerRequestId: updated.id, ownerId: req.user!.userId, id: { notIn: data.attachmentIds } },
        data: { partnerRequestId: null },
      });
      if (data.attachmentIds.length > 0) {
        await prisma.attachment.updateMany({
          where: { id: { in: data.attachmentIds }, ownerId: req.user!.userId },
          data: { partnerRequestId: updated.id },
        });
      }
    }

    if (resubmit) {
      await prisma.moderationEvent.create({
        data: { entityType: "partner", entityId: updated.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "partner", entityId: updated.id } },
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

