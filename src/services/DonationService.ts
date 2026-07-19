// ─── Donation Service ───────────────────────────────────────
// Records donations reported by giving providers (Every.org partner
// webhooks). We never process third-party charity money — providers
// handle payment, receipts, and disbursement; this is bookkeeping
// so the platform can show collective impact.
// ─────────────────────────────────────────────────────────────

import { getDatabase } from "@rodrigo-barraza/utilities-library/service";
import { COLLECTIONS } from "../constants.ts";
import type { DonationDocument } from "../types.ts";

function collection() {
  return getDatabase().collection<DonationDocument>(COLLECTIONS.DONATIONS);
}

// Exported for tests — maps an Every.org webhook payload to a document.
export function mapEveryOrgWebhook(payload: Record<string, any>): DonationDocument {
  return {
    provider: "everyorg",
    chargeId: String(payload.chargeId || payload.id || ""),
    partnerDonationId: payload.partnerDonationId ? String(payload.partnerDonationId) : null,
    nonprofitSlug: String(payload.toNonprofit?.slug || payload.nonprofitSlug || ""),
    amount: payload.amount != null && Number.isFinite(Number(payload.amount)) ? Number(payload.amount) : null,
    currency: String(payload.currency || "USD").toUpperCase(),
    frequency: String(payload.frequency || "one_time"),
    raw: payload,
    createdAt: new Date(),
  };
}

export async function recordEveryOrgDonation(payload: Record<string, unknown>) {
  const document = mapEveryOrgWebhook(payload);
  if (document.chargeId) {
    // Webhooks can retry — dedupe on chargeId.
    const existing = await collection().findOne({ provider: "everyorg", chargeId: document.chargeId });
    if (existing) return existing;
  }
  const result = await collection().insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function getDonationStats() {
  const [totals] = await collection()
    .aggregate([
      { $match: { amount: { $ne: null } } },
      { $group: { _id: "$currency", count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ])
    .toArray();
  const count = await collection().countDocuments();
  return {
    count,
    totalAmount: totals ? totals.total : 0,
    currency: totals ? totals._id : "USD",
  };
}
