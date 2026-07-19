// ─── Organization Service ───────────────────────────────────

import { ObjectId } from "mongodb";
import { getDatabase } from "@rodrigo-barraza/utilities-library/service";
import { COLLECTIONS } from "../constants.ts";
import type { ListOrganizationsFilter, OrganizationDocument } from "../types.ts";

function collection() {
  return getDatabase().collection<OrganizationDocument>(COLLECTIONS.ORGANIZATIONS);
}

export async function listOrganizations(filter: ListOrganizationsFilter) {
  const query: Record<string, unknown> = {};
  if (filter.source) query.source = filter.source;
  if (filter.country) query["address.country"] = filter.country.toUpperCase();
  if (filter.search) query.$text = { $search: filter.search };

  const [organizations, total] = await Promise.all([
    collection()
      .find(query)
      .sort(filter.search ? { score: { $meta: "textScore" } } : { name: 1 })
      .skip(filter.skip ?? 0)
      .limit(filter.limit ?? 20)
      .toArray(),
    collection().countDocuments(query),
  ]);
  return { organizations, total };
}

export async function getOrganization(identifier: string) {
  if (ObjectId.isValid(identifier)) {
    const byId = await collection().findOne({ _id: new ObjectId(identifier) });
    if (byId) return byId;
  }
  return collection().findOne({ sourceId: identifier });
}

export async function upsertSyncedOrganizations(organizations: OrganizationDocument[]): Promise<number> {
  if (organizations.length === 0) return 0;
  const operations = organizations.map((org) => {
    const { _id, createdAt, ...rest } = org;
    return {
      updateOne: {
        filter: { source: org.source, sourceId: org.sourceId },
        update: { $set: rest, $setOnInsert: { createdAt } },
        upsert: true,
      },
    };
  });
  const result = await collection().bulkWrite(operations, { ordered: false });
  return result.upsertedCount + result.modifiedCount;
}

/** Coordinates keyed by sourceId, for backfilling listings that lack geo. */
export async function getOrganizationCoordinateMap(source: string, sourceIds: string[]) {
  if (sourceIds.length === 0) return new Map();
  const orgs = await collection()
    .find({ source, sourceId: { $in: sourceIds } })
    .project<{ sourceId: string; coordinates: OrganizationDocument["coordinates"] }>({ sourceId: 1, coordinates: 1 })
    .toArray();
  return new Map(orgs.map((org) => [org.sourceId, org.coordinates]));
}
