import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    const rows = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(rows);
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

notificationsRouter.get("/unread-count", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    const n = await prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } });
    return res.json({ unread: n });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

notificationsRouter.post("/read-all", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

notificationsRouter.post("/read", requireAuth, async (req, res) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  const prisma = getPrisma();
  try {
    const row = await prisma.notification.findUnique({ where: { id: parsed.data.id }, select: { userId: true } });
    if (!row) return res.status(404).json({ error: "Не найдено" });
    if (row.userId !== req.user!.userId) return res.status(403).json({ error: "Доступ запрещен" });
    await prisma.notification.update({ where: { id: parsed.data.id }, data: { isRead: true }, select: { id: true } });
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

