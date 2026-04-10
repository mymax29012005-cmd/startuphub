import { Router } from "express";

import { getPrisma } from "../../lib/prisma";

export const usersRouter = Router();

const ACTIVITY_LIMIT = 120;

type ActivityKind =
  | "user_registered"
  | "startup_created"
  | "idea_created"
  | "bid_placed"
  | "review_written"
  | "investor_request"
  | "partner_request"
  | "favorite_added";

type ActivityRow = {
  at: Date;
  kind: ActivityKind;
  title: string;
  href: string | null;
  detail?: string;
};

usersRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  const prisma = getPrisma();

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        accountType: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const [
      startupsCount,
      ideasCount,
      startups,
      ideas,
      bids,
      reviews,
      investorReqs,
      partnerReqs,
      favorites,
    ] = await Promise.all([
      prisma.startup.count({ where: { ownerId: id } }),
      prisma.idea.count({ where: { ownerId: id } }),
      prisma.startup.findMany({
        where: { ownerId: id },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.idea.findMany({
        where: { ownerId: id },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.bid.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          auction: {
            select: {
              id: true,
              startup: { select: { id: true, title: true } },
            },
          },
        },
      }),
      prisma.review.findMany({
        where: { authorId: id },
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          target: { select: { id: true, name: true } },
        },
      }),
      prisma.investorRequest.findMany({
        where: { authorId: id },
        select: { id: true, industry: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.partnerRequest.findMany({
        where: { authorId: id },
        select: { id: true, role: true, industry: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.favorite.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          startup: { select: { id: true, title: true } },
          idea: { select: { id: true, title: true } },
        },
      }),
    ]);

    const rows: ActivityRow[] = [];

    rows.push({
      at: user.createdAt,
      kind: "user_registered",
      title: user.name,
      href: null,
    });

    for (const s of startups) {
      rows.push({
        at: s.createdAt,
        kind: "startup_created",
        title: s.title,
        href: `/startups/${s.id}`,
      });
    }
    for (const i of ideas) {
      rows.push({
        at: i.createdAt,
        kind: "idea_created",
        title: i.title,
        href: `/ideas/${i.id}`,
      });
    }
    for (const b of bids) {
      const st = b.auction.startup;
      const amount = Number(b.amount);
      rows.push({
        at: b.createdAt,
        kind: "bid_placed",
        title: st.title,
        href: `/startups/${st.id}`,
        detail: String(amount),
      });
    }
    for (const r of reviews) {
      rows.push({
        at: r.createdAt,
        kind: "review_written",
        title: r.target.name,
        href: `/users/${r.target.id}`,
        detail: String(r.rating),
      });
    }
    for (const ir of investorReqs) {
      rows.push({
        at: ir.createdAt,
        kind: "investor_request",
        title: ir.industry,
        href: `/investors/${ir.id}`,
      });
    }
    for (const pr of partnerReqs) {
      rows.push({
        at: pr.createdAt,
        kind: "partner_request",
        title: `${pr.role} · ${pr.industry}`,
        href: `/partners/${pr.id}`,
      });
    }
    for (const f of favorites) {
      if (f.startup) {
        rows.push({
          at: f.createdAt,
          kind: "favorite_added",
          title: f.startup.title,
          href: `/startups/${f.startup.id}`,
          detail: "startup",
        });
      } else if (f.idea) {
        rows.push({
          at: f.createdAt,
          kind: "favorite_added",
          title: f.idea.title,
          href: `/ideas/${f.idea.id}`,
          detail: "idea",
        });
      }
    }

    rows.sort((a, b) => b.at.getTime() - a.at.getTime());
    const activities = rows.slice(0, ACTIVITY_LIMIT).map((r) => ({
      kind: r.kind,
      at: r.at.toISOString(),
      title: r.title,
      href: r.href,
      detail: r.detail ?? null,
    }));

    return res.json({
      user: {
        ...user,
        startupsCount,
        ideasCount,
        createdAt: user.createdAt.toISOString(),
      },
      activities,
    });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});
