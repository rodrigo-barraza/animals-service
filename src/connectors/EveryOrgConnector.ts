// ─── Every.org Connector ────────────────────────────────────
// Every.org Charity API (https://docs.every.org/docs/intro).
// Search across 1M+ US 501(c)(3) nonprofits; donations happen on
// every.org (they handle processing, receipts, and disbursement —
// we never touch third-party charity money ourselves).
// ─────────────────────────────────────────────────────────────

import CONFIG from "../config.ts";
import type { CharityResult } from "../types.ts";

const API_BASE = "https://partners.every.org/v0.2";

export function isEveryOrgConfigured(): boolean {
  return Boolean(CONFIG.EVERYORG_PUBLIC_KEY);
}

export function everyOrgDonateUrl(slug: string): string {
  return `https://www.every.org/${slug}#/donate`;
}

// Exported for tests
export function mapEveryOrgNonprofit(nonprofit: Record<string, any>): CharityResult {
  const slug = String(nonprofit.slug || nonprofit.primarySlug || "");
  return {
    provider: "everyorg",
    id: slug,
    name: String(nonprofit.name || "Unknown nonprofit"),
    description: String(nonprofit.description || ""),
    country: "US",
    imageUrl: nonprofit.coverImageUrl || nonprofit.logoUrl || null,
    websiteUrl: nonprofit.websiteUrl || null,
    donateUrl: everyOrgDonateUrl(slug),
  };
}

export async function searchEveryOrg(query: string, limit = 20): Promise<CharityResult[]> {
  const url = `${API_BASE}/search/${encodeURIComponent(query)}?take=${limit}&apiKey=${CONFIG.EVERYORG_PUBLIC_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Every.org search failed: ${response.status}`);
  }
  const data = (await response.json()) as { nonprofits?: Record<string, unknown>[] };
  return (data.nonprofits || []).map(mapEveryOrgNonprofit);
}
