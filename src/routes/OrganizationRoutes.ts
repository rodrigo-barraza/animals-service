// ─── Organization Routes ────────────────────────────────────

import { Router, Request, Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import { buildPagination } from "@rodrigo-barraza/utilities-library/service";
import * as OrganizationService from "../services/OrganizationService.ts";
import * as ListingService from "../services/ListingService.ts";

const router: Router = Router();

// GET /organizations — list/search shelters and rescues
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { source, country, search } = req.query as Record<string, string | undefined>;
    const { skip, limit } = buildPagination(req.query as Record<string, string>);
    const { organizations, total } = await OrganizationService.listOrganizations({
      source, country, search, skip, limit,
    });
    res.json({ count: organizations.length, total, items: organizations });
  }),
);

// GET /organizations/:id — org profile (+ its adoptable listings)
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const organization = await OrganizationService.getOrganization(String(req.params.id));
    if (!organization) {
      return res.status(404).json({ error: true, message: "Organization not found", statusCode: 404 });
    }
    const { listings } = await ListingService.listListings({
      organizationSourceId: organization.sourceId,
      limit: 24,
    });
    res.json({ ...organization, listings });
  }),
);

export default router;
