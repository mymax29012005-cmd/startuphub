import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createApp } from "./app";
import { env } from "./lib/config";

// Prefer repository root `.env`, but keep a fallback to local `.env`.
// This avoids relying on npm's process.cwd() when using `--prefix`.
const repoRootEnvPath = path.resolve(__dirname, "..", "..", ".env");
const serverLocalEnvPath = path.resolve(process.cwd(), ".env");
const serverEnvAltPath = path.resolve(process.cwd(), "server", ".env");

const candidates = [repoRootEnvPath, serverLocalEnvPath, serverEnvAltPath];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const app = createApp();

const port = env.PORT;
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`StartupHub API listening on port ${port}`);
});

