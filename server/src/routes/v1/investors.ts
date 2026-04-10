import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { canDeleteAsOwnerOrAdmin, canEditAsOwnerOrAdmin } from "../../lib/authz";
import { allowedCategories } from "../../lib/categories";
import { requireAuth } from "../../middleware/auth";

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
  amount: z.coerce.number().positive(),
  attachmentIds: z.array(z.string().uuid()).optional(),
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
  amount: z.coerce.number().positive().optional(),
  status: z.enum(["active", "paused", "closed"]).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

investorsRouter.get("/", async (_req, res) => {
  const prisma = getPrisma();
  try {
    const items = await prisma.investorRequest.findMany({
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
      })),
    );
  } catch (_e) {
    res.status(503).json({ error: "База данных недоступна" });
  }
});

investorsRouter.get("/:requestId", async (req, res) => {
  const prisma = getPrisma();
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId : req.params.requestId[0];
  try {
    const item = await prisma.investorRequest.findUnique({
      where: { id: requestId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        attachments: { select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true } },
      },
    });
    if (!item) return res.status(404).json({ error: "Запрос не найден" });
    return res.json({
      ...item,
      amount: Number(item.amount),
    });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

investorsRouter.post("/", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const parsed = createInvestorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const created = await prisma.investorRequest.create({
      data: {
        industry: parsed.data.industry,
        description: parsed.data.description,
        amount: parsed.data.amount,
        authorId: req.user!.userId,
      },
      select: { id: true },
    });
    if (parsed.data.attachmentIds && parsed.data.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: parsed.data.attachmentIds }, ownerId: req.user!.userId },
        data: { investorRequestId: created.id },
      });
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

investorsRouter.put("/:requestId", requireAuth, async (req, res) => {
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
      select: { id: true, authorId: true },
    });
    if (!row) return res.status(404).json({ error: "Запрос не найден" });
    if (!canEditAsOwnerOrAdmin(req.user!, row.authorId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const data = parsed.data;
    const updated = await prisma.investorRequest.update({
      where: { id: row.id },
      data: {
        ...(data.industry !== undefined ? { industry: data.industry } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
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

    return res.status(200).json(updated);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

