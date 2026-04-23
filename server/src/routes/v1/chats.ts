import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";
import { requireAuth, requireVerifiedEmail } from "../../middleware/auth";

export const chatsRouter = Router();

chatsRouter.use(requireAuth);
chatsRouter.use(requireVerifiedEmail);

function orderedUserIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

chatsRouter.get("/", async (req, res) => {
  const me = req.user!.userId;
  const prisma = getPrisma();
  try {
    const convos = await prisma.directConversation.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      orderBy: { updatedAt: "desc" },
      include: {
        userA: { select: { id: true, name: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, avatarUrl: true } },
        // Read markers needed for unread computation
        // (selected implicitly below via `select` on convo itself isn't available with include).
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, senderId: true },
        },
      },
    });

    const unreadCounts = await Promise.all(
      convos.map(async (c) => {
        const lastReadAt = c.userAId === me ? c.lastReadAtA : c.lastReadAtB;
        const count = await prisma.chatMessage.count({
          where: {
            conversationId: c.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: me },
          },
        });
        return count;
      }),
    );

    const list = convos.map((c, idx) => {
      const other = c.userAId === me ? c.userB : c.userA;
      const last = c.messages[0];
      return {
        id: c.id,
        otherUser: other,
        unreadCount: unreadCounts[idx] ?? 0,
        lastMessage: last
          ? {
              body: last.body,
              at: last.createdAt.toISOString(),
              fromMe: last.senderId === me,
            }
          : null,
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return res.json(list);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

chatsRouter.get("/unread-count", async (req, res) => {
  const me = req.user!.userId;
  const prisma = getPrisma();
  try {
    const convos = await prisma.directConversation.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      select: { id: true, userAId: true, userBId: true, lastReadAtA: true, lastReadAtB: true },
    });

    const counts = await Promise.all(
      convos.map((c) => {
        const lastReadAt = c.userAId === me ? c.lastReadAtA : c.lastReadAtB;
        return prisma.chatMessage.count({
          where: {
            conversationId: c.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: me },
          },
        });
      }),
    );

    const total = counts.reduce((acc, v) => acc + v, 0);
    return res.json({ total });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

chatsRouter.post("/open", async (req, res) => {
  const parsed = z.object({ otherUserId: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные" });
  }

  const other = parsed.data.otherUserId;
  const me = req.user!.userId;
  if (other === me) {
    return res.status(400).json({ error: "Нельзя написать самому себе" });
  }

  const prisma = getPrisma();
  try {
    const exists = await prisma.user.findUnique({ where: { id: other }, select: { id: true } });
    if (!exists) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const [userAId, userBId] = orderedUserIds(me, other);
    let conv = await prisma.directConversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (!conv) {
      conv = await prisma.directConversation.create({
        data: { userAId, userBId },
      });
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: other },
      select: { id: true, name: true, avatarUrl: true },
    });

    return res.json({ conversationId: conv.id, otherUser });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

chatsRouter.get("/:conversationId/messages", async (req, res) => {
  const me = req.user!.userId;
  const { conversationId } = req.params;
  const prisma = getPrisma();

  try {
    const conv = await prisma.directConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || (conv.userAId !== me && conv.userBId !== me)) {
      return res.status(404).json({ error: "Не найдено" });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Mark as read for the viewer.
    await prisma.directConversation.update({
      where: { id: conversationId },
      data: conv.userAId === me ? { lastReadAtA: new Date() } : { lastReadAtB: new Date() },
    });

    return res.json(
      messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        sender: m.sender,
      })),
    );
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

chatsRouter.post("/:conversationId/messages", async (req, res) => {
  const parsed = z.object({ body: z.string().min(1).max(4000) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные" });
  }

  const me = req.user!.userId;
  const { conversationId } = req.params;
  const text = parsed.data.body.trim();
  if (!text) {
    return res.status(400).json({ error: "Пустое сообщение" });
  }

  const prisma = getPrisma();
  try {
    const conv = await prisma.directConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || (conv.userAId !== me && conv.userBId !== me)) {
      return res.status(404).json({ error: "Не найдено" });
    }

    const msg = await prisma.chatMessage.create({
      data: { conversationId, senderId: me, body: text },
    });

    await prisma.directConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const sender = await prisma.user.findUnique({
      where: { id: me },
      select: { id: true, name: true, avatarUrl: true },
    });

    return res.status(201).json({
      id: msg.id,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
      senderId: msg.senderId,
      sender: sender!,
    });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});
