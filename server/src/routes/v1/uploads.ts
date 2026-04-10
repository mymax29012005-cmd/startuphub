import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { requireAuth } from "../../middleware/auth";
import { getPrisma } from "../../lib/prisma";

export const uploadsRouter = Router();

function ensureUploadsDir() {
  // Same dir as in server/src/app.ts: repoRoot/uploads
  const uploadsDir = path.resolve(process.cwd(), "..", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      const dir = ensureUploadsDir();
      cb(null, dir);
    } catch (e) {
      cb(e as any, "");
    }
  },
  filename: (_req, file, cb) => {
    const safeOriginal = String(file.originalname || "file").replace(/[^\w.\-()\s]+/g, "_");
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
});

// Upload files and create Attachment records (unassigned yet).
uploadsRouter.post("/", requireAuth, upload.array("files", 10), async (req, res) => {
  const prisma = getPrisma();
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "Файлы не выбраны" });
  }

  try {
    const created = await prisma.attachment.createMany({
      data: files.map((f) => ({
        ownerId: req.user!.userId,
        url: `/uploads/${path.basename(f.filename)}`,
        filename: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
      })),
    });

    // createMany doesn't return rows, so fetch the last ones for this user.
    // We fetch by url list to be precise.
    const urls = files.map((f) => `/uploads/${path.basename(f.filename)}`);
    const rows = await prisma.attachment.findMany({
      where: { ownerId: req.user!.userId, url: { in: urls } },
      select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(201).json({ ok: true, count: created.count, attachments: rows });
  } catch (_e) {
    return res.status(503).json({ error: "База данных недоступна" });
  }
});

