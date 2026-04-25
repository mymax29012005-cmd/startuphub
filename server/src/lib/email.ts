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

function createSmtpTransport() {
  const port = env.SMTP_PORT!;
  const secure = port === 465;
  return nodemailer.createTransport({
    host: env.SMTP_HOST!,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 12_000,
    tls: { minVersion: "TLSv1.2" as const },
  });
}

export async function sendVerifyEmail(toEmail: string, verifyUrl: string) {
  if (!smtpConfigured()) {
    // Dev fallback: avoid throwing, but make it obvious in logs.
    // eslint-disable-next-line no-console
    console.log("[email] SMTP is not configured; verification link:", verifyUrl);
    return { sent: false as const };
  }

  // eslint-disable-next-line no-console
  console.log("[email] sending verification email to", toEmail, "via", env.SMTP_HOST, ":", env.SMTP_PORT);

  const transporter = createSmtpTransport();

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
      <h2 style="margin:0 0 12px 0;">Подтверждение почты — StartupHub</h2>
      <p style="margin:0 0 14px 0;">Нажмите кнопку, чтобы подтвердить email:</p>
      <p style="margin:18px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;">
          Подтвердить email
        </a>
      </p>
      <p style="margin:0 0 12px 0;color:#667085;font-size:13px;">
        Если письма нет — проверьте папку “Спам”.
      </p>
      <p style="margin:14px 0 0 0;color:#667085;font-size:13px;">
        Если кнопка не работает, откройте ссылку: <br/>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </p>
    </div>
  `;
  const text = `Подтверждение почты — StartupHub\n\nОткройте ссылку, чтобы подтвердить email:\n${verifyUrl}\n\nЕсли письма нет — проверьте папку “Спам”.\n`;

  const sendPromise = transporter.sendMail({
    from: env.SMTP_FROM!,
    to: toEmail,
    replyTo: env.SMTP_FROM!,
    subject: "Подтвердите почту — StartupHub",
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `verify-${Date.now()}`,
    },
  });

  // Extra safety: hard timeout even if underlying socket hangs.
  await Promise.race([
    sendPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("SMTP sendMail timeout")), 12_000),
    ),
  ]);

  return { sent: true as const };
}

export async function sendPasswordResetCode(toEmail: string, code: string) {
  if (!smtpConfigured()) {
    // eslint-disable-next-line no-console
    console.log("[email] SMTP is not configured; password reset code for", toEmail, ":", code);
    return { sent: false as const };
  }

  // eslint-disable-next-line no-console
  console.log("[email] sending password reset code to", toEmail, "via", env.SMTP_HOST, ":", env.SMTP_PORT);

  const transporter = createSmtpTransport();

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
      <h2 style="margin:0 0 12px 0;">Сброс пароля — StartupHub</h2>
      <p style="margin:0 0 14px 0;">Одноразовый код:</p>
      <div style="display:inline-block;padding:12px 16px;border-radius:14px;background:#111827;color:#fff;font-weight:800;font-size:20px;letter-spacing:0.25em;">
        ${code}
      </div>
      <p style="margin:14px 0 0 0;color:#667085;font-size:13px;">
        Код действует ограниченное время. Если вы не запрашивали сброс пароля — просто игнорируйте это письмо.
      </p>
      <p style="margin:10px 0 0 0;color:#667085;font-size:13px;">
        Если письма нет — проверьте папку “Спам”.
      </p>
    </div>
  `;
  const text = `Сброс пароля — StartupHub\n\nОдноразовый код: ${code}\n\nКод действует ограниченное время. Если вы не запрашивали сброс пароля — игнорируйте письмо.\nЕсли письма нет — проверьте “Спам”.\n`;

  const sendPromise = transporter.sendMail({
    from: env.SMTP_FROM!,
    to: toEmail,
    replyTo: env.SMTP_FROM!,
    subject: "Сброс пароля — StartupHub",
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `reset-${Date.now()}`,
    },
  });

  await Promise.race([
    sendPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP sendMail timeout")), 12_000)),
  ]);

  return { sent: true as const };
}

