// ─── Sync Routes ────────────────────────────────────────────

import { Router, Request, Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import { createSecretGuard } from "@rodrigo-barraza/utilities-library/service";
import CONFIG from "../config.ts";
import * as SyncService from "../services/SyncService.ts";

const router: Router = Router();
const adminGuard = createSecretGuard(CONFIG.ANIMALS_SERVICE_API_SECRET, { bypassPaths: [] });

// GET /sync/status — source configuration + recent runs
router.get(
  "/status",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await SyncService.getSyncStatus());
  }),
);

// POST /sync — trigger an ingest run (admin-guarded)
router.post(
  "/",
  adminGuard,
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await SyncService.runSync("manual");
    if ("skipped" in result) return res.status(409).json({ error: true, message: result.skipped, statusCode: 409 });
    res.json(result);
  }),
);

export default router;
