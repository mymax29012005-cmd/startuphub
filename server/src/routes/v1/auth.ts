import { Router } from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";

import { env } from "../../lib/config";
import crypto from "crypto";

import { getPublicAppUrl, makeEmailVerifyToken, sendPasswordResetCode, sendVerifyEmail, verifyTokenHash } from "../../lib/email";
import { getPrisma } from "../../lib/prisma";
import { signJwt } from "../../lib/jwt";
import { verifyTurnstileIfConfigured } from "../../lib/turnstile";
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

/** Как на клиенте регистрации: длина, регистр латиницы, спецсимвол. */
const registrationPasswordSchema = z
  .string()
  .min(8, "Пароль: минимум 8 символов")
  .max(128)
  .refine((p) => /[A-Z]/.test(p), "Пароль: нужна заглавная латинская буква")
  .refine((p) => /[a-z]/.test(p), "Пароль: нужна строчная латинская буква")
  .refine((p) => /[^A-Za-z0-9]/.test(p), "Пароль: нужен знак (не буква и не цифра)");

const registerSchema = z.object({
  name: z.string().min(2).max(64),
  email: z.string().email(),
  password: registrationPasswordSchema,
  accountType: z.enum(["founder", "investor", "partner", "buyer"]),
  turnstileToken: z.string().min(10).optional(),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).max(24).optional(),
  password: z.string().min(8).max(128),
});

const resetRequestSchema = z.object({
  email: z.string().email(),
});

const resetConfirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
  newPassword: registrationPasswordSchema,
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const { name, password, accountType, turnstileToken } = parsed.data;
  const email = normEmail(parsed.data.email);
  if (!email) return res.status(400).json({ error: "Нужно указать email" });

  const prisma = getPrisma();
  try {
    const cap = await verifyTurnstileIfConfigured(req, turnstileToken);
    if (!cap.ok) return res.status(cap.status).json({ error: cap.message });

    const exists = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) return res.status(409).json({ error: "Этот email уже используется" });

    const passwordHash = await bcryptjs.hash(password, 10);

    const verify =
      email != null
        ? (() => {
            const { token, tokenHash } = makeEmailVerifyToken();
            const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
            return { token, tokenHash, expires };
          })()
        : null;

    const user = await prisma.user.create({
      data: {
        name,
        email: email ?? null,
        passwordHash,
        accountType,
        ...(verify
          ? { emailVerifiedAt: null, emailVerifyTokenHash: verify.tokenHash, emailVerifyTokenExpires: verify.expires }
          : {}),
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
        emailVerifiedAt: true,
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

    if (email && verify) {
      const verifyUrl = `${getPublicAppUrl()}/verify-email?token=${encodeURIComponent(verify.token)}`;
      // Never block registration on SMTP.
      void sendVerifyEmail(email, verifyUrl).catch((e) => {
        // eslint-disable-next-line no-console
        console.error("[email] failed to send verify email:", e);
      });
      // In non-prod, help testing if SMTP isn't configured.
      const includeUrl = env.NODE_ENV !== "production";
      return res.status(201).json({ ...user, ...(includeUrl ? { emailVerifyUrl: verifyUrl } : {}) });
    }

    return res.status(201).json(user);
  } catch (e: any) {
    // Prisma unique constraint error (race condition).
    if (e?.code === "P2002") {
      const target = (e?.meta?.target ?? []) as unknown;
      const arr = Array.isArray(target) ? (target as string[]) : typeof target === "string" ? [target] : [];
      if (arr.includes("email")) return res.status(409).json({ error: "Этот email уже используется" });
      return res.status(409).json({ error: "Пользователь уже существует" });
    }
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.get("/verify-email", async (req, res) => {
  const parsed = z.object({ token: z.string().min(10) }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные" });
  const prisma = getPrisma();
  const now = new Date();
  const tokenHash = verifyTokenHash(parsed.data.token);

  try {
    const u = await prisma.user.findFirst({
      where: { emailVerifyTokenHash: tokenHash },
      select: { id: true, emailVerifiedAt: true, emailVerifyTokenExpires: true },
    });
    if (!u) return res.status(400).json({ error: "Ссылка недействительна" });
    if (u.emailVerifiedAt) return res.json({ ok: true, already: true });
    if (u.emailVerifyTokenExpires && u.emailVerifyTokenExpires < now) {
      return res.status(400).json({ error: "Ссылка истекла. Запросите письмо ещё раз." });
    }

    await prisma.user.update({
      where: { id: u.id },
      data: { emailVerifiedAt: now, emailVerifyTokenHash: null, emailVerifyTokenExpires: null },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.post("/verify-email/resend", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!u) return res.status(404).json({ error: "Пользователь не найден" });
    if (!u.email) return res.status(400).json({ error: "У пользователя нет email" });
    if (u.emailVerifiedAt) return res.json({ ok: true, already: true });

    const { token, tokenHash } = makeEmailVerifyToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.user.update({
      where: { id: u.id },
      data: { emailVerifyTokenHash: tokenHash, emailVerifyTokenExpires: expires },
    });
    const verifyUrl = `${getPublicAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    // Never block response on SMTP.
    void sendVerifyEmail(u.email, verifyUrl).catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[email] failed to resend verify email:", e);
    });
    const includeUrl = env.NODE_ENV !== "production";
    return res.json({ ok: true, ...(includeUrl ? { emailVerifyUrl: verifyUrl } : {}) });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

function makeResetCode() {
  // 6-digit numeric code (OTP)
  return String(Math.floor(100000 + Math.random() * 900000));
}
function hashResetCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

authRouter.post("/password/reset/request", async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });

  const email = normEmail(parsed.data.email);
  if (!email) return res.json({ ok: true });

  const prisma = getPrisma();
  try {
    const u = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" as const }, deletedAt: null },
      select: { id: true, email: true },
    });

    // Always return ok to avoid leaking whether user exists.
    if (!u?.email) return res.json({ ok: true });

    const code = makeResetCode();
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    await prisma.user.update({
      where: { id: u.id },
      data: {
        passwordResetCodeHash: hashResetCode(code),
        passwordResetCodeExpires: expires,
        passwordResetAttempts: 0,
        passwordResetRequestedAt: new Date(),
      },
      select: { id: true },
    });

    void sendPasswordResetCode(u.email, code).catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[email] failed to send password reset code:", e);
    });

    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

authRouter.post("/password/reset/confirm", async (req, res) => {
  const parsed = resetConfirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });

  const email = normEmail(parsed.data.email);
  const code = String(parsed.data.code || "").trim();
  if (!email) return res.status(400).json({ error: "Неверные данные" });

  const prisma = getPrisma();
  try {
    const u = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" as const }, deletedAt: null },
      select: {
        id: true,
        passwordResetCodeHash: true,
        passwordResetCodeExpires: true,
        passwordResetAttempts: true,
      },
    });
    // Same response for missing user/code
    if (!u?.passwordResetCodeHash || !u.passwordResetCodeExpires) return res.status(400).json({ error: "Неверный код" });
    if (u.passwordResetCodeExpires < new Date()) return res.status(400).json({ error: "Код истёк. Запросите новый." });
    if ((u.passwordResetAttempts ?? 0) >= 8) return res.status(429).json({ error: "Слишком много попыток. Запросите новый код." });

    const ok = hashResetCode(code) === u.passwordResetCodeHash;
    if (!ok) {
      await prisma.user.update({
        where: { id: u.id },
        data: { passwordResetAttempts: (u.passwordResetAttempts ?? 0) + 1 },
        select: { id: true },
      });
      return res.status(400).json({ error: "Неверный код" });
    }

    const nextHash = await bcryptjs.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: u.id },
      data: {
        passwordHash: nextHash,
        passwordResetCodeHash: null,
        passwordResetCodeExpires: null,
        passwordResetAttempts: 0,
        passwordResetRequestedAt: null,
      },
      select: { id: true },
    });

    return res.json({ ok: true });
  } catch {
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
    const where = email ? { email: { equals: email, mode: "insensitive" as const } } : { phone };
    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        role: true,
        accountType: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        passwordHash: true,
        deletedAt: true,
        deletedReason: true,
      },
    });
    if (!user) {
      // If user was deleted by admin and contacts were archived, show reason.
      const deleted = email
        ? await prisma.user.findFirst({
            where: { deletedEmail: { equals: email, mode: "insensitive" as const }, deletedAt: { not: null } as any },
            select: { deletedAt: true, deletedReason: true },
          } as any)
        : phone
          ? await prisma.user.findFirst({
              where: { deletedPhone: phone, deletedAt: { not: null } as any },
              select: { deletedAt: true, deletedReason: true },
            } as any)
          : null;
      if (deleted?.deletedAt) {
        return res.status(403).json({ error: "Аккаунт удалён", reason: deleted.deletedReason ?? "Удалён администратором" });
      }
      return res.status(401).json({ error: "Неверные данные для входа" });
    }

    if (user.deletedAt) {
      return res.status(403).json({ error: "Аккаунт удалён", reason: user.deletedReason ?? "Удалён администратором" });
    }

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
        emailVerifiedAt: true,
        bannedAt: true,
        bannedReason: true,
        deletedAt: true,
        deletedReason: true,
      },
    });

    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    if ((user as any).deletedAt) {
      return res.status(403).json({ error: "Аккаунт удалён", reason: (user as any).deletedReason ?? "Удалён администратором" });
    }
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

// Some reverse proxies restrict DELETE methods. Provide POST alternative.
authRouter.post("/me/delete", requireAuth, async (req, res) => {
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

