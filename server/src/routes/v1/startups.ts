import { Router } from "express";
import { z } from "zod";

import { getPrisma } from "../../lib/prisma";

function hintForStartupDbError(e: unknown): string | undefined {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw + (e && typeof e === "object" && "meta" in e ? " " + JSON.stringify((e as { meta?: unknown }).meta) : "");
  if (/MODULE_NOT_FOUND|\.prisma\/client|Cannot find module ['"]\.prisma\/client/i.test(m)) {
    return "На сервере выполните: cd database && npx prisma generate, затем pm2 restart startuphub-api";
  }
  if (/P1001|Can't reach database server|ECONNREFUSED/i.test(m)) {
    return "PostgreSQL недоступен по DATABASE_URL (хост, порт, firewall, sslmode).";
  }
  if (/P2022|does not exist|Unknown column|column .* not found/i.test(m)) {
    return "Нужна миграция: cd database && npx prisma migrate deploy";
  }
  if (/DATABASE_URL is not set/i.test(m)) {
    return "В окружении PM2 не задан DATABASE_URL (или не читается .env).";
  }
  return undefined;
}
import { canDeleteAsOwnerOrAdmin, canEditAsOwnerOrAdmin } from "../../lib/authz";
import { allowedCategories } from "../../lib/categories";
import { requireAuth } from "../../middleware/auth";

export const startupsRouter = Router();

const profileExtraSchema = z
  .object({
    tagline: z.string().max(280).optional(),
    valuationPreMoney: z.coerce.number().nonnegative().optional(),
    equityOfferedPct: z.coerce.number().min(0).max(100).optional(),
    kpis: z
      .array(
        z.object({
          value: z.string().max(100).optional(),
          label: z.string().max(250).optional(),
        }),
      )
      .max(6)
      .optional(),
    milestones: z.string().max(4000).optional(),
    team: z
      .array(
        z.object({
          name: z.string().max(160),
          role: z.string().max(200),
        }),
      )
      .max(30)
      .optional(),
    videoPitchUrl: z.string().max(2000).optional(),
    materialSlotIds: z
      .object({
        pitchDeckId: z.string().uuid().nullable().optional(),
        financialModelId: z.string().uuid().nullable().optional(),
        videoFileId: z.string().uuid().nullable().optional(),
        otherIds: z.array(z.string().uuid()).max(50).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .optional();

const createStartupSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(10).max(2000),
  category: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    }),
  price: z.coerce.number().positive(),

  stage: z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"]),
  format: z.enum(["online", "offline", "hybrid"]),
  isOnline: z.boolean().optional(),

  profileExtra: profileExtraSchema,

  analysisId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),

  auction: z
    .object({
      currentPrice: z.coerce.number().positive(),
      endsAt: z.coerce.date(),
    })
    .optional(),
});

const updateStartupSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z
    .string()
    .min(2)
    .max(60)
    .refine((v) => (allowedCategories as readonly string[]).includes(v), {
      message: "Недопустимая категория",
    })
    .optional(),
  price: z.coerce.number().positive().optional(),
  stage: z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"]).optional(),
  format: z.enum(["online", "offline", "hybrid"]).optional(),
  isOnline: z.boolean().optional(),
  analysisId: z.string().uuid().nullable().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  profileExtra: profileExtraSchema.nullable().optional(),
});

startupsRouter.get("/", async (req, res) => {
  const prisma = getPrisma();
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
  try {
    const startups = await prisma.startup.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        owner: { select: { name: true, avatarUrl: true, role: true, accountType: true } },
        auction: { select: { currentPrice: true, endsAt: true, isActive: true } },
      },
    });

    // Basic rating (average from reviews where user is target).
    const ownerIds = Array.from(new Set(startups.map((s) => s.ownerId)));
    const ratingByUser = new Map<string, number>();
    await Promise.all(
      ownerIds.map(async (userId) => {
        const agg = await prisma.review.aggregate({
          where: { targetUserId: userId },
          _avg: { rating: true },
        });
        const v = agg._avg.rating;
        ratingByUser.set(userId, v ? Number(v) : 0);
      }),
    );

    res.json(
      startups.map((s) => {
        const extra = (s as { profileExtra?: unknown }).profileExtra as
          | { tagline?: string }
          | null
          | undefined;
        return {
        id: s.id,
        title: s.title,
        description: s.description,
        tagline: extra && typeof extra === "object" && typeof extra.tagline === "string" ? extra.tagline : undefined,
        category: s.category,
        price: Number(s.price),
        stage: s.stage,
        format: s.format,
        isOnline: s.isOnline,
        analysisId: (s as any).analysisId ?? null,
        owner: {
          id: s.ownerId,
          name: s.owner?.name,
          avatarUrl: s.owner?.avatarUrl,
          role: s.owner?.role,
          accountType: s.owner?.accountType,
          rating: ratingByUser.get(s.ownerId) ?? 0,
        },
        auction:
          s.auction && s.auction.isActive && s.auction.endsAt && s.auction.endsAt > new Date()
            ? {
                currentPrice: Number(s.auction.currentPrice),
                endsAt: s.auction.endsAt,
              }
            : null,
        };
      })
    );
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

startupsRouter.get("/:startupId", async (req, res) => {
  const prisma = getPrisma();
  const startupId = typeof req.params.startupId === "string" ? req.params.startupId : req.params.startupId[0];
  try {
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true, role: true, accountType: true } },
        auction: { select: { currentPrice: true, endsAt: true, isActive: true } },
        analysis: { select: { id: true, createdAt: true, result: true } },
        attachments: { select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true } },
      },
    });

    if (!startup) return res.status(404).json({ error: "Стартап не найден" });

    const agg = await prisma.review.aggregate({
      where: { targetUserId: startup.ownerId },
      _avg: { rating: true },
    });
    const rating = agg._avg.rating ? Number(agg._avg.rating) : 0;

    res.json({
      id: startup.id,
      title: startup.title,
      description: startup.description,
      category: startup.category,
      price: Number(startup.price),
      stage: startup.stage,
      format: startup.format,
      isOnline: startup.isOnline,
      profileExtra: (startup as { profileExtra?: unknown }).profileExtra ?? null,
      analysisId: (startup as any).analysisId ?? null,
      analysis: startup.analysis
        ? { id: startup.analysis.id, createdAt: startup.analysis.createdAt, result: startup.analysis.result }
        : null,
      attachments: startup.attachments,
      owner: {
        id: startup.owner.id,
        name: startup.owner.name,
        avatarUrl: startup.owner.avatarUrl,
        role: startup.owner.role,
        accountType: startup.owner.accountType,
        rating,
      },
      auction:
        startup.auction && startup.auction.isActive && startup.auction.endsAt && startup.auction.endsAt > new Date()
          ? { currentPrice: Number(startup.auction.currentPrice), endsAt: startup.auction.endsAt.toISOString() }
          : null,
    });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

startupsRouter.post("/", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const parsed = createStartupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Неверные данные", details: parsed.error.flatten() });
  }

  const data = parsed.data;
  try {
    if (data.analysisId) {
      const a = await prisma.startupAnalysis.findUnique({
        where: { id: data.analysisId },
        select: { id: true, userId: true },
      });
      if (!a) return res.status(404).json({ error: "Анализ не найден" });
      if (a.userId !== req.user!.userId) return res.status(403).json({ error: "Доступ запрещен" });
    }

    const created = await prisma.startup.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        stage: data.stage,
        format: data.format,
        isOnline: data.isOnline ?? true,
        profileExtra: data.profileExtra ? (data.profileExtra as any) : undefined,
        ownerId: req.user!.userId,
        analysisId: data.analysisId ?? null,
        auction: data.auction
          ? {
              create: {
                currentPrice: data.auction.currentPrice,
                isActive: true,
                status: "planned",
                startsAt: data.auction.endsAt,
                registrationEndsAt: data.auction.endsAt,
                endsAt: data.auction.endsAt,
              },
            }
          : undefined,
      },
      select: { id: true },
    });

    if (data.attachmentIds && data.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: data.attachmentIds }, ownerId: req.user!.userId },
        data: { startupId: created.id },
      });
    }

    res.status(201).json(created);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/v1/startups]", e);
    const hint = hintForStartupDbError(e);
    return res.status(503).json({ error: "База данных недоступна", ...(hint ? { hint } : {}) });
  }
});

startupsRouter.delete("/:startupId", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const startupId =
    typeof req.params.startupId === "string" ? req.params.startupId : req.params.startupId[0];
  try {
    const s = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { id: true, ownerId: true },
    });
    if (!s) return res.status(404).json({ error: "Стартап не найден" });
    if (!canDeleteAsOwnerOrAdmin(req.user!, s.ownerId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    await prisma.startup.delete({ where: { id: s.id } });
    return res.status(200).json({ ok: true });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

startupsRouter.put("/:startupId", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const startupId =
    typeof req.params.startupId === "string" ? req.params.startupId : req.params.startupId[0];
  const parsed = updateStartupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  try {
    const row = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { id: true, ownerId: true },
    });
    if (!row) return res.status(404).json({ error: "Стартап не найден" });
    if (!canEditAsOwnerOrAdmin(req.user!, row.ownerId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const data = parsed.data;

    if (data.analysisId !== undefined && data.analysisId !== null) {
      const a = await prisma.startupAnalysis.findUnique({
        where: { id: data.analysisId },
        select: { id: true, userId: true },
      });
      if (!a) return res.status(404).json({ error: "Анализ не найден" });
      if (a.userId !== req.user!.userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Доступ запрещен" });
      }
    }

    const updateData: Record<string, unknown> = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.format !== undefined ? { format: data.format } : {}),
      ...(data.isOnline !== undefined ? { isOnline: data.isOnline } : {}),
      ...(data.analysisId !== undefined ? { analysisId: data.analysisId } : {}),
      ...(data.profileExtra !== undefined
        ? { profileExtra: data.profileExtra === null ? null : (data.profileExtra as object) }
        : {}),
    };

    const updated = await prisma.startup.update({
      where: { id: row.id },
      data: updateData as any,
      select: { id: true },
    });

    if (data.attachmentIds) {
      // Detach removed attachments (owned by the editor).
      await prisma.attachment.updateMany({
        where: {
          startupId: updated.id,
          ownerId: req.user!.userId,
          id: { notIn: data.attachmentIds },
        },
        data: { startupId: null },
      });
      // Attach newly provided ones.
      if (data.attachmentIds.length > 0) {
        await prisma.attachment.updateMany({
          where: { id: { in: data.attachmentIds }, ownerId: req.user!.userId },
          data: { startupId: updated.id },
        });
      }
    }

    return res.status(200).json(updated);
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

const createAuctionSchema = z.object({
  startsAt: z.coerce.date(),
  registrationEndsAt: z.coerce.date(),
  startPrice: z.coerce.number().positive(),
});

startupsRouter.post("/:startupId/auction", requireAuth, async (req, res) => {
  const prisma = getPrisma();
  const startupId =
    typeof req.params.startupId === "string" ? req.params.startupId : req.params.startupId[0];
  const parsed = createAuctionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
  }
  const { startsAt, registrationEndsAt, startPrice } = parsed.data;
  if (registrationEndsAt >= startsAt) {
    return res.status(400).json({ error: "Регистрация должна закончиться до старта аукциона" });
  }
  try {
    const s = await prisma.startup.findUnique({
      where: { id: startupId },
      include: { auction: { select: { id: true } } },
    });
    if (!s) return res.status(404).json({ error: "Стартап не найден" });
    if (!canDeleteAsOwnerOrAdmin(req.user!, s.ownerId)) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    if (s.auction) return res.status(409).json({ error: "Аукцион уже создан" });

    const created = await prisma.auction.create({
      data: {
        startupId: s.id,
        status: "planned",
        isActive: true,
        currentPrice: startPrice,
        startsAt,
        registrationEndsAt,
        endsAt: null,
      },
      select: { id: true },
    });

    return res.status(201).json({ id: created.id });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

