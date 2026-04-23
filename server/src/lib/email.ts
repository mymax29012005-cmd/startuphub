import crypto from "crypto";

import nodemailer from "nodemailer";

import { env } from "./config";

export function makeEmailVerifyToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function verifyTokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPublicAppUrl() {
  // Prefer explicit env, otherwise best-effort guess for dev.
  if (env.PUBLIC_APP_URL) return env.PUBLIC_APP_URL.replace(/\/+$/, "");
  return "http://localhost:3000";
}

function smtpConfigured() {
  return !!(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

export async function sendVerifyEmail(toEmail: string, verifyUrl: string) {
  if (!smtpConfigured()) {
    // Dev fallback: avoid throwing, but make it obvious in logs.
    // eslint-disable-next-line no-console
    console.log("[email] SMTP is not configured; verification link:", verifyUrl);
    return { sent: false as const };
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST!,
    port: env.SMTP_PORT!,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
  });

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
      <h2 style="margin:0 0 12px 0;">Подтверждение почты — StartupHub</h2>
      <p style="margin:0 0 14px 0;">Нажмите кнопку, чтобы подтвердить email:</p>
      <p style="margin:18px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;">
          Подтвердить email
        </a>
      </p>
      <p style="margin:14px 0 0 0;color:#667085;font-size:13px;">
        Если кнопка не работает, откройте ссылку: <br/>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: env.SMTP_FROM!,
    to: toEmail,
    subject: "Подтвердите почту — StartupHub",
    html,
  });

  return { sent: true as const };
}

