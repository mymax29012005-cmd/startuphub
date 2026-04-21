import { Router } from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";

import { env } from "../../lib/config";
import { getPrisma } from "../../lib/prisma";
import { signJwt } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";
import { upload } from "../../upload/multer";

export const authRouter = Router();

function normEmail(v: string | undefined) {
  const x = (v ?? "").trim().toLowerCase();
  return x ? x : undefined;
}

function normPhone(v: string | undefined) {
  const x = (v ?? "").trim().replace(/\s+/g, "");
  return x ? x : undefined;
}

const registerSchema = z.object({
  name: z.string().min(2).max(64),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(24).optional(),
  password: z.string().min(8).max(128),
  accountType: z.enum(["founder", "investor", "partner", "buyer"]),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).max(24).optional(),
  password: z.string().min(8).max(128),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const { name, password, accountType } = parsed.data;
  const email = normEmail(parsed.data.email);
  const phone = normPhone(parsed.data.phone);
  if (!email && !phone)
    return res.status(400).json({ error: "Нужно указать email или телефон" });
  if (email && phone)
    return res
      .status(400)
      .json({ error: "Нужно указать только email или только телефон" });

  const prisma = getPrisma();
  try {
    if (email) {
      const exists = await prisma.user.findFirst({ where: { email }, select: { id: true } });
      if (exists) return res.status(409).json({ error: "Этот email уже используется" });
    }
    if (phone) {
      const exists = await prisma.user.findFirst({ where: { phone }, select: { id: true } });
      if (exists) return res.status(409).json({ error: "Этот телефон уже используется" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email ?? null,
        phone: phone ?? null,
        passwordHash,
        accountType,
      },
      select: {
        id: true,
        role: true,
        accountType: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
      },
    });

    const token = signJwt({
      userId: user.id,
      role: user.role,
      accountType: user.accountType,
    });

    const isProd = env.NODE_ENV === "production";
    res.cookie(env.COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return res.status(201).json(user);
  } catch (e: any) {
    // Prisma unique constraint error (race condition).
    if (e?.code === "P2002") {
      const target = (e?.meta?.target ?? []) as unknown;
      const arr = Array.isArray(target) ? (target as string[]) : typeof target === "string" ? [target] : [];
      if (arr.includes("email")) return res.status(409).json({ error: "Этот email уже используется" });
      if (arr.includes("phone")) return res.status(409).json({ error: "Этот телефон уже используется" });
      return res.status(409).json({ error: "Пользователь уже существует" });
    }
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const email = normEmail(parsed.data.email);
  const phone = normPhone(parsed.data.phone);
  const { password } = parsed.data;
  if (!email && !phone)
    return res.status(400).json({ error: "Нужно указать email или телефон" });
  const prisma = getPrisma();

  try {
  const where = email ? { email } : { phone };
    const user = await prisma.user.findFirst({ where });
    if (!user) return res.status(401).json({ error: "Неверные данные для входа" });

    const ok = await bcryptjs.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Неверные данные для входа" });

    const token = signJwt({
      userId: user.id,
      role: user.role,
      accountType: user.accountType,
    });

    const isProd = env.NODE_ENV === "production";
    res.cookie(env.COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return res.json({
      id: user.id,
      role: user.role,
      accountType: user.accountType,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    });
  } catch (e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.post("/logout", requireAuth, (_req, res) => {
  res.clearCookie(env.COOKIE_NAME, { path: "/" });
  return res.status(200).json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        role: true,
        accountType: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    const [startupsCount, ideasCount, investorRequestsCount, partnerRequestsCount] = await Promise.all([
      prisma.startup.count({ where: { ownerId: user.id } }),
      prisma.idea.count({ where: { ownerId: user.id } }),
      prisma.investorRequest.count({ where: { authorId: user.id } }),
      prisma.partnerRequest.count({ where: { authorId: user.id } }),
    ]);

    return res.json({ ...user, startupsCount, ideasCount, investorRequestsCount, partnerRequestsCount });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.patch("/me", requireAuth, upload.single("avatar"), async (req, res) => {
  const prisma = getPrisma();

  const parsed = z
    .object({
      name: z.string().min(2).max(64).optional(),
      bio: z.string().max(500).optional(),
      accountType: z.enum(["founder", "investor", "partner", "buyer"]).optional(),
      phone: z
        .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().min(6).max(24).optional()),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  try {
    const nextPhone = normPhone(parsed.data.phone);
    if (nextPhone) {
      const exists = await prisma.user.findFirst({ where: { phone: nextPhone, id: { not: req.user!.userId } }, select: { id: true } });
      if (exists) return res.status(409).json({ error: "Этот телефон уже используется" });
    }

    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        name: parsed.data.name ?? undefined,
        bio: parsed.data.bio ?? undefined,
        phone: nextPhone ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        accountType: parsed.data.accountType ?? undefined,
      },
      select: {
        id: true,
        role: true,
        accountType: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    const [startupsCount, ideasCount, investorRequestsCount, partnerRequestsCount] = await Promise.all([
      prisma.startup.count({ where: { ownerId: updated.id } }),
      prisma.idea.count({ where: { ownerId: updated.id } }),
      prisma.investorRequest.count({ where: { authorId: updated.id } }),
      prisma.partnerRequest.count({ where: { authorId: updated.id } }),
    ]);

    return res.json({ ...updated, startupsCount, ideasCount, investorRequestsCount, partnerRequestsCount });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.delete("/me", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    await prisma.user.delete({ where: { id: req.user!.userId } });
    res.clearCookie(env.COOKIE_NAME, { path: "/" });
    return res.status(200).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.patch("/me/password", requireAuth, async (req, res) => {
  const parsed = z
    .object({
      currentPassword: z.string().min(1).max(128),
      newPassword: z.string().min(8).max(128),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { passwordHash: true } });
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const ok = await bcryptjs.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Текущий пароль неверный" });

    const nextHash = await bcryptjs.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash: nextHash },
      select: { id: true },
    });

    return res.json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

