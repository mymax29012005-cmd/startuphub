import { NextFunction, Request, Response } from "express";

import { env } from "../lib/config";
import { verifyJwt, type JwtPayload } from "../lib/jwt";

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

