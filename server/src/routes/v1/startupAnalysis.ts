import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { requireAuth, requireNotBanned, requireNotDeleted, requireVerifiedEmail } from "../../middleware/auth";

export const startupAnalysisRouter = Router();

const createStartupAnalysisSchema = z.object({
  data: z.any(),
  result: z.any(),
});

// Save computed analysis for the current user.
startupAnalysisRouter.post("/", requireAuth, requireNotDeleted, requireNotBanned, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  const parsed = createStartupAnalysisSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  try {
    const created = await prisma.startupAnalysis.create({
      data: {
        userId: req.user!.userId,
        data: parsed.data.data as any,
        result: parsed.data.result as any,
      },
      select: { id: true, createdAt: true },
    });

    return res.status(201).json(created);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

// List saved analyses for current user (history).
startupAnalysisRouter.get("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  try {
    const items = await prisma.startupAnalysis.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        data: true,
        result: true,
      },
      take: 50,
    });

    return res.json({ items });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

// Get one saved analysis (owner only).
startupAnalysisRouter.get("/:id", requireAuth, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  const raw = (req.params as any).id as string | string[] | undefined;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) return res.status(400).json({ error: "Неверные данные" });

  try {
    const item = await prisma.startupAnalysis.findUnique({
      where: { id },
      select: { id: true, createdAt: true, userId: true, data: true, result: true },
    });
    if (!item) return res.status(404).json({ error: "Не найдено" });
    if (item.userId !== req.user!.userId) return res.status(403).json({ error: "Доступ запрещен" });
    return res.json({ id: item.id, createdAt: item.createdAt, data: item.data, result: item.result });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

// Delete a saved analysis (owner only).
startupAnalysisRouter.delete("/:id", requireAuth, requireVerifiedEmail, async (req, res) => {
  const prisma = getPrisma();
  const raw = (req.params as any).id as string | string[] | undefined;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) return res.status(400).json({ error: "Неверные данные" });

  try {
    const existing = await prisma.startupAnalysis.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!existing) return res.status(404).json({ error: "Не найдено" });
    if (existing.userId !== req.user!.userId) return res.status(403).json({ error: "Доступ запрещен" });

    await prisma.startupAnalysis.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

