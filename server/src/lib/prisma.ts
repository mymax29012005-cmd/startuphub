// Prisma client is generated in ../database/node_modules/@prisma/client
// to keep the Prisma schema/migrations inside database/.
import { PrismaClient } from "../../../database/node_modules/@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export function getPrisma() {
  if (!global.__prisma) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }

    // Prisma 7.6 runtime requires an adapter when using the "client" engine type.
    const adapter = new PrismaPg(databaseUrl);
    global.__prisma = new PrismaClient({ adapter } as any);
  }
  return global.__prisma;
}

