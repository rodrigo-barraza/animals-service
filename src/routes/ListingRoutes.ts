// ─── Listing Routes ─────────────────────────────────────────

import { Router, type Request, type Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import { buildPagination, createSecretGuard } from "@rodrigo-barraza/utilities-library/service";
import CONFIG from "../config.ts";
import * as ListingService from "../services/ListingService.ts";

const router: Router = Router();
const adminGuard = createSecretGuard(CONFIG.ANIMALS_SERVICE_API_SECRET, { bypassPaths: [] });

// GET /listings — browse/search adoptable animals
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { species, age, sex, size, status, source, country, organizationSourceId, search, lat, lng, radiusKm } =
      req.query as Record<string, string | undefined>;
    const { skip, limit } = buildPagination(req.query as Record<string, string>);

    let near;
    if (lat && lng) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({ error: true, message: "lat/lng must be numbers", statusCode: 400 });
      }
      near = { latitude, longitude, radiusKm: Math.min(500, Number(radiusKm) || 100) };
    }

    const { listings, total } = await ListingService.listListings({
      species, age, sex, size, status, source, country, organizationSourceId, search, near, skip, limit,
    });
    res.json({ count: listings.length, total, items: listings });
  }),
);

// GET /listings/stats — adoptable counts for dashboards
router.get(
  "/stats",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await ListingService.getListingStats());
  }),
);

// GET /listings/:id — single listing
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const listing = await ListingService.getListing(String(req.params.id));
    if (!listing) return res.status(404).json({ error: true, message: "Listing not found", statusCode: 404 });
    res.json(listing);
  }),
);

// POST /listings — create a direct listing (partner shelters; admin-guarded)
router.post(
  "/",
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.body?.name) {
      return res.status(400).json({ error: true, message: "name is required", statusCode: 400 });
    }
    const listing = await ListingService.createDirectListing(req.body);
    res.status(201).json(listing);
  }),
);

// PATCH /listings/:id — update a listing (admin-guarded)
router.patch(
  "/:id",
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const listing = await ListingService.updateListing(String(req.params.id), req.body);
    if (!listing) return res.status(404).json({ error: true, message: "Listing not found", statusCode: 404 });
    res.json(listing);
  }),
);

// DELETE /listings/:id — remove a listing (admin-guarded)
router.delete(
  "/:id",
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await ListingService.deleteListing(String(req.params.id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: true, message: "Listing not found", statusCode: 404 });
    }
    res.json({ success: true, message: "Listing deleted" });
  }),
);

export default router;
