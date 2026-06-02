// ─── Sighting Routes ────────────────────────────────────────

import { Router, Request, Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import * as SightingService from "../services/SightingService.ts";
import { buildPagination } from "../utilities.ts";

const router = Router();

// GET /sightings — list sightings
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { animalId, spottedBy } = req.query as Record<string, string | undefined>;
    const { skip, limit } = buildPagination(req.query as Record<string, string>);
    const { sightings, total } = await SightingService.listSightings({ animalId, spottedBy, skip, limit });
    res.json({ count: sightings.length, total, items: sightings });
  }),
);

// GET /sightings/:id — single sighting
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const sighting = await SightingService.getSighting(String(req.params.id));
    if (!sighting) return res.status(404).json({ error: true, message: "Sighting not found", statusCode: 404 });
    res.json(sighting);
  }),
);

// POST /sightings — record sighting
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { animalId } = req.body;
    if (!animalId) return res.status(400).json({ error: true, message: "animalId is required", statusCode: 400 });

    const sighting = await SightingService.createSighting(req.body);
    res.status(201).json(sighting);
  }),
);

// DELETE /sightings/:id — delete sighting
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await SightingService.deleteSighting(String(req.params.id));
    if (result.deletedCount === 0) return res.status(404).json({ error: true, message: "Sighting not found", statusCode: 404 });
    res.json({ success: true, message: "Sighting deleted" });
  }),
);

export default router;
