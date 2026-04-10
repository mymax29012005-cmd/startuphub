import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

// PrismaClient reads DATABASE_URL from process.env at runtime.
// Load repository root `.env` so seed works when executed via `npm --prefix database ...`.
const repoRootEnvPath = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: repoRootEnvPath });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (seed.ts)");
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@startuphub.local";
  const userEmail = process.env.SEED_USER_EMAIL ?? "user@startuphub.local";
  const buyerEmail = process.env.SEED_BUYER_EMAIL ?? "buyer@startuphub.local";

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  const userPassword = process.env.SEED_USER_PASSWORD ?? "User1234!";
  const buyerPassword = process.env.SEED_BUYER_PASSWORD ?? "Buyer1234!";

  const adminHash = await bcryptjs.hash(adminPassword, 10);
  const userHash = await bcryptjs.hash(userPassword, 10);
  const buyerHash = await bcryptjs.hash(buyerPassword, 10);

  const [admin, user, buyer] = await Promise.all([
    prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        role: "admin",
        accountType: "founder",
        name: "Admin",
        email: adminEmail,
        passwordHash: adminHash,
      },
    }),
    prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        role: "user",
        accountType: "founder",
        name: "Founder",
        email: userEmail,
        passwordHash: userHash,
      },
    }),
    prisma.user.upsert({
      where: { email: buyerEmail },
      update: {},
      create: {
        role: "user",
        accountType: "buyer",
        name: "Buyer",
        email: buyerEmail,
        passwordHash: buyerHash,
      },
    }),
  ]);

  const startup = await prisma.startup.upsert({
    where: { id: "f0f3b0f2-2f0b-4f7a-a0b0-111111111111" },
    update: {},
    create: {
      id: "f0f3b0f2-2f0b-4f7a-a0b0-111111111111",
      title: "Premium Analytics",
      description: "A premium startup analytics platform for teams.",
      category: "SaaS",
      price: 120000,
      stage: "seed",
      format: "hybrid",
      isOnline: true,
      ownerId: user.id,
    },
  });

  const auction = await prisma.auction.upsert({
    where: { startupId: startup.id },
    update: {},
    create: {
      startupId: startup.id,
      currentPrice: startup.price,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      isActive: true,
    },
  });

  await prisma.bid.create({
    data: {
      auctionId: auction.id,
      userId: buyer.id,
      amount: 130000,
    },
  }).catch(() => {
    // Idempotency: if bids already exist, skip.
  });

  const startup2 = await prisma.startup.upsert({
    where: { id: "c2c2c2c2-2c2c-4c2c-8c2c-333333333333" },
    update: {},
    create: {
      id: "c2c2c2c2-2c2c-4c2c-8c2c-333333333333",
      title: "Fintech Checkout",
      description: "A премиальный платёжный модуль с быстрой интеграцией.",
      category: "Fintech",
      price: 75000,
      stage: "growth",
      format: "online",
      isOnline: true,
      ownerId: admin.id,
    },
  });

  const auction2 = await prisma.auction.upsert({
    where: { startupId: startup2.id },
    update: {},
    create: {
      startupId: startup2.id,
      currentPrice: startup2.price,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      isActive: true,
    },
  });

  await prisma.bid.create({
    data: {
      auctionId: auction2.id,
      userId: user.id,
      amount: 80000,
    },
  }).catch(() => {
    // idempotent
  });

  await prisma.idea.upsert({
    where: { id: "a9c8c4aa-1234-4d9c-9b9b-222222222222" },
    update: {},
    create: {
      id: "a9c8c4aa-1234-4d9c-9b9b-222222222222",
      title: "AI Meeting Notes",
      description: "Generate action items and structured summaries from calls.",
      category: "AI",
      price: 25000,
      stage: "idea",
      format: "online",
      ownerId: user.id,
      problem: "Teams waste time on manual notes.",
      solution: "Automated summaries + tasks extraction.",
      market: "Growing demand for meeting productivity tools.",
    },
  });

  await prisma.idea.upsert({
    where: { id: "b1b2c3d4-e5f6-4a7b-8c9d-444444444444" },
    update: {},
    create: {
      id: "b1b2c3d4-e5f6-4a7b-8c9d-444444444444",
      title: "Voice AI Assistant",
      description: "Ассистент для команд: распознавание речи, резюме и задачи.",
      category: "AI",
      price: 42000,
      stage: "seed",
      format: "hybrid",
      ownerId: admin.id,
      problem: "Командам сложно фиксировать решения и договорённости.",
      solution: "Авто-резюме + список задач и уведомления.",
      market: "Спрос растёт вместе с удалённой работой.",
    },
  });

  await prisma.review.upsert({
    where: { authorId_targetUserId: { authorId: buyer.id, targetUserId: user.id } },
    update: {},
    create: {
      authorId: buyer.id,
      targetUserId: user.id,
      rating: 5,
      comment: "Great founder and transparent communication.",
    },
  });

  await prisma.review.upsert({
    where: { authorId_targetUserId: { authorId: user.id, targetUserId: buyer.id } },
    update: {},
    create: {
      authorId: user.id,
      targetUserId: buyer.id,
      rating: 4,
      comment: "Понятная коммуникация и быстрые ответы.",
    },
  });

  await prisma.investorRequest.upsert({
    where: { id: "d9d9d9d9-9d9d-4dd9-9d9d-555555555555" },
    update: {},
    create: {
      id: "d9d9d9d9-9d9d-4dd9-9d9d-555555555555",
      industry: "SaaS",
      description: "Ищем инвестиции для масштабирования: маркетинг + развитие продукта.",
      amount: 300000,
      status: "active",
      authorId: buyer.id,
    },
  });

  await prisma.partnerRequest.upsert({
    where: { id: "e8e8e8e8-8e8e-4ee8-8e8e-666666666666" },
    update: {},
    create: {
      id: "e8e8e8e8-8e8e-4ee8-8e8e-666666666666",
      role: "integration",
      industry: "Fintech",
      description: "Нужны интеграции с платежными провайдерами для нашего продуктового витка.",
      authorId: user.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

