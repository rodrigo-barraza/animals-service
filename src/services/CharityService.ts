// ─── Charity Service ────────────────────────────────────────
// Charity discovery across giving providers. Curated collections
// always work (static data); live search requires provider keys
// and degrades gracefully when unconfigured.
// ─────────────────────────────────────────────────────────────

import logger from "../logger.ts";
import type { CharityResult } from "../types.ts";
import { isEveryOrgConfigured, searchEveryOrg } from "../connectors/EveryOrgConnector.ts";
import { isGlobalGivingConfigured, searchGlobalGiving } from "../connectors/GlobalGivingConnector.ts";
import { CHARITY_COLLECTIONS } from "../data/charityCollections.ts";

export function getCollections() {
  return CHARITY_COLLECTIONS;
}

export function getCollection(slug: string) {
  return CHARITY_COLLECTIONS.find((c) => c.slug === slug) || null;
}

export async function searchCharities(query: string, limit: number) {
  const providers = {
    everyorg: isEveryOrgConfigured(),
    globalgiving: isGlobalGivingConfigured(),
  };

  const tasks: Promise<CharityResult[]>[] = [];
  if (providers.everyorg) tasks.push(searchEveryOrg(query, limit));
  if (providers.globalgiving) tasks.push(searchGlobalGiving(query, limit));

  const settled = await Promise.allSettled(tasks);
  const results: CharityResult[] = [];
  for (const outcome of settled) {
    if (outcome.status === "fulfilled") results.push(...outcome.value);
    else logger.error(`Charity search provider failed: ${outcome.reason}`);
  }

  // No live providers → fall back to substring match over curated data.
  if (tasks.length === 0) {
    const needle = query.toLowerCase();
    for (const collection of CHARITY_COLLECTIONS) {
      for (const charity of collection.charities) {
        if (
          charity.name.toLowerCase().includes(needle) ||
          charity.description.toLowerCase().includes(needle)
        ) {
          results.push(charity);
        }
      }
    }
  }

  return { providers, count: results.length, items: results.slice(0, limit) };
}
