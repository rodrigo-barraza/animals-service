// ─── Submission Routes ──────────────────────────────────────

import { Router, Request, Response } from "express";
import { asyncHandler } from "@rodrigo-barraza/utilities-library/express";
import { buildPagination, createSecretGuard } from "@rodrigo-barraza/utilities-library/service";
import CONFIG from "../config.ts";
import * as SubmissionService from "../services/SubmissionService.ts";

const router: Router = Router();
const adminGuard = createSecretGuard(CONFIG.ANIMALS_SERVICE_API_SECRET, { bypassPaths: [] });

// POST /submissions — public shelter/rescue interest form
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Honeypot: real users never fill this hidden field.
    if (req.body?.website2) return res.status(201).json({ success: true });

    const validationError = SubmissionService.validateSubmission(req.body || {});
    if (validationError) {
      return res.status(400).json({ error: true, message: validationError, statusCode: 400 });
    }
    const submission = await SubmissionService.createSubmission(req.body);
    res.status(201).json({ success: true, id: submission._id });
  }),
);

// GET /submissions — review inbox (admin-guarded)
router.get(
  "/",
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { skip, limit } = buildPagination(req.query as Record<string, string>);
    const status = req.query.status ? String(req.query.status) : undefined;
    const { submissions, total } = await SubmissionService.listSubmissions(status, skip, limit);
    res.json({ count: submissions.length, total, items: submissions });
  }),
);

// PATCH /submissions/:id — approve/reject (admin-guarded)
router.patch(
  "/:id",
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const submission = await SubmissionService.updateSubmissionStatus(
      String(req.params.id),
      String(req.body?.status || ""),
    );
    if (!submission) {
      return res.status(404).json({ error: true, message: "Submission not found or invalid status", statusCode: 404 });
    }
    res.json(submission);
  }),
);

export default router;
