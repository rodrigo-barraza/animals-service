// ─── Donation Routes ────────────────────────────────────────

import { Router, Request, Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import CONFIG from "../config.ts";
import * as DonationService from "../services/DonationService.ts";

const router: Router = Router();

// GET /donations/stats — public collective-impact numbers
router.get(
  "/stats",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await DonationService.getDonationStats());
  }),
);

// POST /donations/webhooks/everyorg — Every.org partner webhook.
// Register the URL (with ?token=...) in the Every.org partner dashboard;
// the token must match EVERYORG_WEBHOOK_TOKEN when one is configured.
router.post(
  "/webhooks/everyorg",
  asyncHandler(async (req: Request, res: Response) => {
    if (CONFIG.EVERYORG_WEBHOOK_TOKEN && req.query.token !== CONFIG.EVERYORG_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: true, message: "Invalid webhook token", statusCode: 401 });
    }
    const donation = await DonationService.recordEveryOrgDonation(req.body || {});
    res.status(201).json({ success: true, id: donation._id });
  }),
);

export default router;
