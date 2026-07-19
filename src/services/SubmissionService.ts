// ─── Submission Service ─────────────────────────────────────
// Self-serve intake for shelters/rescues that want to list directly
// (the path for regions the aggregator APIs don't cover). Submissions
// land in a review inbox; approval is an admin action.
// ─────────────────────────────────────────────────────────────

import { ObjectId } from "mongodb";
import { getDatabase } from "@rodrigo-barraza/utilities-library/service";
import { COLLECTIONS, SUBMISSION_STATUS } from "../constants.ts";
import type { CreateSubmissionData, SubmissionDocument } from "../types.ts";

function collection() {
  return getDatabase().collection<SubmissionDocument>(COLLECTIONS.SUBMISSIONS);
}

// Exported for tests — returns an error string or null when valid.
export function validateSubmission(data: Partial<CreateSubmissionData>): string | null {
  if (!data.organizationName || !String(data.organizationName).trim()) {
    return "organizationName is required";
  }
  const email = String(data.email || "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "a valid email is required";
  }
  if (String(data.message || "").length > 5000) {
    return "message is too long (max 5000 characters)";
  }
  return null;
}

export async function createSubmission(data: CreateSubmissionData) {
  const now = new Date();
  const document: SubmissionDocument = {
    organizationName: String(data.organizationName).trim(),
    contactName: String(data.contactName || "").trim(),
    email: String(data.email).trim().toLowerCase(),
    website: String(data.website || "").trim(),
    country: String(data.country || "").trim(),
    city: String(data.city || "").trim(),
    message: String(data.message || "").trim(),
    status: SUBMISSION_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection().insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function listSubmissions(status: string | undefined, skip: number, limit: number) {
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  const [submissions, total] = await Promise.all([
    collection().find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection().countDocuments(query),
  ]);
  return { submissions, total };
}

export async function updateSubmissionStatus(id: string, status: string) {
  if (!ObjectId.isValid(id)) return null;
  if (!(Object.values(SUBMISSION_STATUS) as string[]).includes(status)) return null;
  return collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}
