import { Router } from "express";

import { getPrisma } from "../../lib/prisma";

export const statsRouter = Router();

statsRouter.get("/", async (_req, res) => {
  const prisma = getPrisma();
  try {
    const now = new Date();
    const [startupsCount, ideasCount, activeAuctions, investorsCount, partnersCount] = await Promise.all([
      prisma.startup.count(),
      prisma.idea.count(),
      prisma.auction.count({
        where: {
          isActive: true,
          endsAt: { gt: now },
        },
      }),
      prisma.investorRequest.count(),
      prisma.partnerRequest.count(),
    ]);

    res.json({
      startupsCount,
      ideasCount,
      activeAuctions,
      investorsCount,
      partnersCount,
    });
  } catch (_e) {
    // When DB is down / migrations not applied.
    res.status(503).json({ error: "База данных недоступна" });
  }
});

