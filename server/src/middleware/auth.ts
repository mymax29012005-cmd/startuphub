import { NextFunction, Request, Response } from "express";

import { env } from "../lib/config";
import { verifyJwt, type JwtPayload } from "../lib/jwt";
import { getPrisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (!token) {
    return res.status(401).json({ error: "Не авторизован" });
  }

  try {
    const payload = verifyJwt(token);
    req.user = payload;
    return next();
  } catch (_e) {
    return res.status(401).json({ error: "Не авторизован" });
  }
}

export function tryAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (!token) return next();
  try {
    const payload = verifyJwt(token);
    req.user = payload;
  } catch {
    // ignore invalid cookie
  }
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Не авторизован" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещен" });
  return next();
}

export async function requireNotDeleted(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Не авторизован" });
  const prisma = getPrisma();
  try {
    const u = (await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { deletedAt: true, deletedReason: true },
    } as any)) as any;
    if (!u) return res.status(401).json({ error: "Не авторизован" });
    if (u.deletedAt) {
      return res.status(403).json({ error: "Аккаунт удалён", reason: u.deletedReason ?? "Удалён администратором" });
    }
    return next();
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
}

export async function requireNotBanned(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Не авторизован" });
  if (req.user.role === "admin") return next();
  const prisma = getPrisma();
  try {
    const u = (await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { bannedAt: true, bannedReason: true },
    } as any)) as any;
    if (!u) return res.status(401).json({ error: "Не авторизован" });
    if (u.bannedAt) {
      return res.status(403).json({ error: "Вы заблокированы", reason: u.bannedReason ?? "Блокировка администратором" });
    }
    return next();
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
}

export async function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Не авторизован" });
  if (req.user.role === "admin") return next();
  const prisma = getPrisma();
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!u) return res.status(401).json({ error: "Не авторизован" });
    // Email is mandatory; until it's verified, block protected actions.
    if (!u.email || !u.emailVerifiedAt) {
      return res.status(403).json({ error: "Подтвердите почту, чтобы пользоваться этим действием" });
    }
    return next();
  } catch {
    return res.status(503).json({ error: "База данных недоступна" });
  }
}

