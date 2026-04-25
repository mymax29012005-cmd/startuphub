import type { Request } from "express";

import { env } from "./config";

export async function verifyTurnstileIfConfigured(req: Request, token: string | undefined) {
  if (!env.TURNSTILE_SECRET) return { ok: true as const };

  if (!token || token.length < 10) {
    return { ok: false as const, status: 400, message: "Подтвердите, что вы не бот" };
  }

  const ip = (req.headers["cf-connecting-ip"] as string) || (req.headers["x-forwarded-for"] as string) || req.ip;
  const form = new URLSearchParams();
  form.set("secret", env.TURNSTILE_SECRET);
  form.set("response", token);
  if (ip) form.set("remoteip", String(ip).split(",")[0]!.trim());

  const vr = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  }).catch(() => null);
  const vdata = (await vr?.json().catch(() => null)) as { success?: boolean; "error-codes"?: string[] } | null;
  if (!vr || !vdata?.success) {
    const codes = Array.isArray(vdata?.["error-codes"]) ? vdata["error-codes"].join(", ") : "";
    // eslint-disable-next-line no-console
    console.warn("[turnstile] siteverify failed", codes || "unknown");
    return { ok: false as const, status: 400, message: "Проверка капчи не пройдена" };
  }

  return { ok: true as const };
}
