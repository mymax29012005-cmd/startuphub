import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { canDeleteAsOwnerOrAdmin, canEditAsOwnerOrAdmin } from "../../lib/authz";
import { allowedCategories } from "../../lib/categories";
import { requireAuth } from "../../middleware/auth";

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
  attachmentIds: z.array(z.string().uuid()).optional(),
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
  attachmentIds: z.array(z.string().uuid()).optional(),
});

partnersRouter.get("/", async (_req, res) => {
  const prisma = getPrisma();
  try {
    const items = await prisma.partnerRequest.findMany({
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
      })),
    );
  } catch (_e) {
    res.status(503).json({ error: "База данных недоступна" });
  }
});

partnersRouter.get("/:requestId", async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  try {
    const item = await prisma.partnerRequest.findUnique({
      where: { id: requestId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        attachments: { select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true } },
      },
    });
    if (!item) return res.status(404).json({ error: "Запрос не найден" });
    return res.json(item);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

partnersRouter.post("/", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const parsed = createPartnerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const created = await prisma.partnerRequest.create({
      data: {
        role: parsed.data.role,
        industry: parsed.data.industry,
        description: parsed.data.description,
        authorId: req.user!.userId,
      },
      select: { id: true },
    });
    if (parsed.data.attachmentIds && parsed.data.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: parsed.data.attachmentIds }, ownerId: req.user!.userId },
        data: { partnerRequestId: created.id },
      });
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

partnersRouter.put("/:requestId", requireAuth, async (req, res) => {
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
      select: { id: true, authorId: true },
    });
    if (!row) return res.status(404).json({ error: "Запрос не найден" });
    if (!canEditAsOwnerOrAdmin(req.user!, row.authorId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const data = parsed.data;
    const updated = await prisma.partnerRequest.update({
      where: { id: row.id },
      data: {
        ...(data.role !== undefined ? { role: data.role as any } : {}),
        ...(data.industry !== undefined ? { industry: data.industry } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
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

    return res.status(200).json(updated);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

