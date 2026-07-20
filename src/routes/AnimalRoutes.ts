// ─── Animal Routes ──────────────────────────────────────────

import { Router, type Request, type Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import * as AnimalService from "../services/AnimalService.ts";
import { buildPagination } from "@rodrigo-barraza/utilities-library/service";

const router: Router = Router();

// GET /animals — list/search animals
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { animalClass, conservationStatus, search } = req.query as Record<string, string | undefined>;
    const { skip, limit } = buildPagination(req.query as Record<string, string>);
    const { animals, total } = await AnimalService.listAnimals({ animalClass, conservationStatus, search, skip, limit });
    res.json({ count: animals.length, total, items: animals });
  }),
);

// GET /animals/:id — single animal
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const animal = await AnimalService.getAnimal(String(req.params.id));
    if (!animal) return res.status(404).json({ error: true, message: "Animal not found", statusCode: 404 });
    res.json(animal);
  }),
);

// POST /animals — create animal
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { commonName } = req.body;
    if (!commonName) return res.status(400).json({ error: true, message: "commonName is required", statusCode: 400 });

    const existingSlug = commonName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await AnimalService.getAnimalBySlug(existingSlug);
    if (existing) return res.status(409).json({ error: true, message: "Animal with this name already exists", statusCode: 409 });

    const animal = await AnimalService.createAnimal(req.body);
    res.status(201).json(animal);
  }),
);

// PATCH /animals/:id — update animal
router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const animal = await AnimalService.updateAnimal(String(req.params.id), req.body);
    if (!animal) return res.status(404).json({ error: true, message: "Animal not found", statusCode: 404 });
    res.json(animal);
  }),
);

// DELETE /animals/:id — delete animal
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await AnimalService.deleteAnimal(String(req.params.id));
    if (result.deletedCount === 0) return res.status(404).json({ error: true, message: "Animal not found", statusCode: 404 });
    res.json({ success: true, message: "Animal deleted" });
  }),
);

export default router;
