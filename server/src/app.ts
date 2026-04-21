import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cors from "cors";

import { apiV1Router } from "./routes";

export function createApp() {
  const app = express();

  // API responses should not be cached with ETags (304 breaks client flows expecting JSON body).
  app.set("etag", false);

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "20mb" }));
  app.use(cookieParser());

  app.set("trust proxy", true);

  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.use(
      cors({
        origin: corsOrigin.split(",").map((s) => s.trim()),
        credentials: true,
      }),
    );
  } else {
    // Dev-friendly fallback: allow any origin (Next dev uses same origin anyway).
    app.use(cors({ origin: true, credentials: true }));
  }

  // Root-level uploads directory (served via Next rewrites in client).
  // Server runs from `server/`, so we go one level up to repo root.
  const uploadsDir = path.resolve(process.cwd(), "..", "uploads");
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/v1/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/v1", apiV1Router);

  // Basic 404 handler.
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}

