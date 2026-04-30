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
import { isValidIndustryPair, isSectorId } from "../../lib/industryHierarchy";
import { requireAuth, requireNotBanned, requireNotDeleted, requireVerifiedEmail, tryAuth } from "../../middleware/auth";

function isOnlineFromFormat(format: "online" | "offline" | "hybrid", isOnline?: boolean): boolean {
  if (typeof isOnline === "boolean") return isOnline;
  if (format === "offline") return false;
  return true;
}

export const startupsRouter = Router();

const profileExtraSchema = z
  .object({
    tagline: z.string().max(280).optional(),
    valuationPreMoney: z.coerce.number().nonnegative().optional(),
    equityOfferedPct: z.coerce.number().min(0).max(100).optional(),
    locationAddress: z.string().max(220).optional(),
    kpis: z
      .array(
        z.object({
          value: z.string().max(100).optional(),
          label: z.string().max(250).optional(),
        }),
      )
      .max(20)
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

const createStartupSchema = z
  .object({
    title: z.string().min(1).max(120),
    description: z.string().min(10).max(2000),
    sector: z.string().min(2).max(40).refine((v) => isSectorId(v), { message: "Недопустимая отрасль" }),
    category: z.string().min(2).max(80),
    price: z.coerce.number().positive().max(9_999_999_999, "Слишком большое число"),

    stage: z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"]),
    format: z.enum(["online", "offline", "hybrid"]),
    isOnline: z.boolean().optional(),
    listingType: z.enum(["sale", "investment"]).optional(),

    profileExtra: profileExtraSchema,

    analysisId: z.string().uuid().optional(),
    attachmentIds: z.array(z.string().uuid()).optional(),

    submitMode: z.enum(["draft", "submit"]).optional(),
  })
  .refine((d) => isValidIndustryPair(d.sector, d.category), {
    message: "Категория не соответствует выбранной отрасли",
    path: ["category"],
  });

const updateStartupSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().min(10).max(2000).optional(),
    sector: z.string().min(2).max(40).refine((v) => isSectorId(v), { message: "Недопустимая отрасль" }).optional(),
    category: z.string().min(2).max(80).optional(),
    price: z.coerce.number().positive().max(9_999_999_999, "Слишком большое число").optional(),
    stage: z.enum(["idea", "seed", "series_a", "series_b", "growth", "exit"]).optional(),
    format: z.enum(["online", "offline", "hybrid"]).optional(),
    isOnline: z.boolean().optional(),
    listingType: z.enum(["sale", "investment"]).optional(),
    analysisId: z.string().uuid().nullable().optional(),
    attachmentIds: z.array(z.string().uuid()).optional(),
    profileExtra: profileExtraSchema.nullable().optional(),
    submitForModeration: z.boolean().optional(),
  })
  .refine(
    (d) => {
      if (d.sector === undefined && d.category === undefined) return true;
      if (d.sector !== undefined && d.category !== undefined) return isValidIndustryPair(d.sector, d.category);
      return false;
    },
    { message: "Укажите отрасль и категорию отрасли вместе", path: ["category"] },
  );

startupsRouter.get("/", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
  const includeAll = req.query.includeAll === "1" || req.query.includeAll === "true";
  try {
    const viewer = req.user;
    const canSeeAllForOwner = ownerId && viewer && (viewer.role === "admin" || viewer.userId === ownerId);
    const startups = await prisma.startup.findMany({
      where: canSeeAllForOwner
        ? { ownerId }
        : ownerId
          ? { ownerId, moderationStatus: "published" }
          : viewer?.role === "admin"
            ? includeAll
              ? undefined
              : { moderationStatus: "published" }
            : { moderationStatus: "published" },
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
          | { tagline?: string; locationAddress?: string }
          | null
          | undefined;
        return {
        id: s.id,
        title: s.title,
        description: s.description,
        tagline: extra && typeof extra === "object" && typeof extra.tagline === "string" ? extra.tagline : undefined,
        locationAddress:
          extra && typeof extra === "object" && typeof (extra as any).locationAddress === "string"
            ? String((extra as any).locationAddress)
            : undefined,
        sector: (s as { sector?: string }).sector ?? "software_it",
        category: s.category,
        price: Number(s.price),
        stage: s.stage,
        format: s.format,
        isOnline: s.isOnline,
        listingType: (s as any).listingType ?? "investment",
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

startupsRouter.get("/:startupId", tryAuth, async (req, res) => {
  const prisma = getPrisma();
  const startupId = typeof req.params.startupId === "string" ? req.params.startupId : req.params.startupId[0];
  try {
    const viewer = req.user;
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
    if ((startup as any).moderationStatus !== "published") {
      if (!viewer) return res.status(404).json({ error: "Стартап не найден" });
      const canSee = viewer.role === "admin" || viewer.userId === startup.ownerId;
      if (!canSee) return res.status(404).json({ error: "Стартап не найден" });
      if (viewer.role === "admin") {
        await prisma.moderationEvent.create({
          data: { entityType: "startup", entityId: startup.id, action: "viewed", actorId: viewer.userId },
        });
      }
    }

    const agg = await prisma.review.aggregate({
      where: { targetUserId: startup.ownerId },
      _avg: { rating: true },
    });
    const rating = agg._avg.rating ? Number(agg._avg.rating) : 0;

    res.json({
      id: startup.id,
      title: startup.title,
      description: startup.description,
      sector: (startup as { sector?: string }).sector ?? "software_it",
      category: startup.category,
      price: Number(startup.price),
      stage: startup.stage,
      format: startup.format,
      isOnline: startup.isOnline,
      listingType: (startup as any).listingType ?? "investment",
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

startupsRouter.post("/", requireAuth, requireNotDeleted, requireNotBanned, requireVerifiedEmail, async (req, res) => {
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

    const nextStatus = req.user!.role === "admin" ? "published" : data.submitMode === "draft" ? "draft" : "pending_moderation";
    const created = await prisma.startup.create({
      data: {
        title: data.title,
        description: data.description,
        sector: data.sector,
        category: data.category,
        price: data.price,
        stage: data.stage,
        format: data.format,
        isOnline: isOnlineFromFormat(data.format, data.isOnline),
        listingType: data.listingType ?? "investment",
        profileExtra: data.profileExtra ? (data.profileExtra as any) : undefined,
        ownerId: req.user!.userId,
        analysisId: data.analysisId ?? null,
        moderationStatus: nextStatus as any,
      },
      select: { id: true },
    });

    if (data.attachmentIds && data.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: data.attachmentIds }, ownerId: req.user!.userId },
        data: { startupId: created.id },
      });
    }

    if (nextStatus === "pending_moderation") {
      await prisma.moderationEvent.create({
        data: { entityType: "startup", entityId: created.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "startup", entityId: created.id } },
            select: { id: true },
          }),
        ),
      );
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

startupsRouter.put("/:startupId", requireAuth, requireNotDeleted, requireNotBanned, requireVerifiedEmail, async (req, res) => {
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
    const resubmit = data.submitForModeration === true && req.user!.role !== "admin";

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
      ...(data.sector !== undefined ? { sector: data.sector } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.format !== undefined ? { format: data.format } : {}),
      ...(data.isOnline !== undefined ? { isOnline: data.isOnline } : {}),
      ...(data.listingType !== undefined ? { listingType: data.listingType } : {}),
      ...(data.format !== undefined && data.isOnline === undefined
        ? { isOnline: isOnlineFromFormat(data.format) }
        : {}),
      ...(data.analysisId !== undefined ? { analysisId: data.analysisId } : {}),
      ...(data.profileExtra !== undefined
        ? { profileExtra: data.profileExtra === null ? null : (data.profileExtra as object) }
        : {}),
      ...(resubmit
        ? {
            moderationStatus: "pending_moderation",
            adminComment: null,
            revisionDate: null,
            rejectedReason: null,
          }
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

    if (resubmit) {
      await prisma.moderationEvent.create({
        data: { entityType: "startup", entityId: updated.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "startup", entityId: updated.id } },
            select: { id: true },
          }),
        ),
      );
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

startupsRouter.post("/:startupId/auction", requireAuth, requireNotDeleted, requireNotBanned, requireVerifiedEmail, async (req, res) => {
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
        moderationStatus: req.user!.role === "admin" ? "published" : "pending_moderation",
      },
      select: { id: true },
    });

    if (req.user!.role !== "admin") {
      await prisma.moderationEvent.create({
        data: { entityType: "auction", entityId: created.id, action: "submitted", actorId: req.user!.userId },
      });
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, type: "moderation_new", payload: { entityType: "auction", entityId: created.id } },
            select: { id: true },
          }),
        ),
      );
    }

    return res.status(201).json({ id: created.id });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

