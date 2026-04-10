import { z } from "zod";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables before parsing/validating.
// This must happen at module import time, because `envSchema.parse(process.env)` below
// is evaluated immediately.
const repoRootEnvPath = path.resolve(__dirname, "..", "..", "..", ".env");
const serverLocalEnvPath = path.resolve(process.cwd(), ".env");

const candidates = [repoRootEnvPath, serverLocalEnvPath];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),

  JWT_SECRET: z.string().min(16),
  COOKIE_NAME: z.string().default("startuphub_token"),

  NODE_ENV: z.string().default("development"),
  CORS_ORIGIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

