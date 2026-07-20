// ─── Charity Routes ─────────────────────────────────────────

import { Router, type Request, type Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import * as CharityService from "../services/CharityService.ts";

const router: Router = Router();

// GET /charities/collections — curated giving collections (no keys needed)
router.get(
  "/collections",
  asyncHandler(async (_req: Request, res: Response) => {
    const collections = CharityService.getCollections();
    res.json({ count: collections.length, items: collections });
  }),
);

// GET /charities/collections/:slug — one curated collection
router.get(
  "/collections/:slug",
  asyncHandler(async (req: Request, res: Response) => {
    const collection = CharityService.getCollection(String(req.params.slug));
    if (!collection) {
      return res.status(404).json({ error: true, message: "Collection not found", statusCode: 404 });
    }
    res.json(collection);
  }),
);

// GET /charities/search?q= — live search across configured giving providers
router.get(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    const query = String(req.query.q || "").trim();
    if (!query) return res.status(400).json({ error: true, message: "q is required", statusCode: 400 });
    const limit = Math.min(50, parseInt(String(req.query.limit || ""), 10) || 20);
    res.json(await CharityService.searchCharities(query, limit));
  }),
);

export default router;
