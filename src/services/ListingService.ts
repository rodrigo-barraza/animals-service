// ─── Listing Service ────────────────────────────────────────

import { ObjectId } from "mongodb";
import { getDatabase } from "@rodrigo-barraza/utilities-library/service";
import { COLLECTIONS, LISTING_SOURCE, LISTING_STATUS } from "../constants.ts";
import type { ListingDocument, ListListingsFilter } from "../types.ts";

function collection() {
  return getDatabase().collection<ListingDocument>(COLLECTIONS.LISTINGS);
}

// Exported for tests — pure query construction from a filter.
export function buildListingQuery(filter: ListListingsFilter): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  query.status = filter.status || LISTING_STATUS.ADOPTABLE;
  if (filter.status === "any") delete query.status;
  if (filter.species) query.species = filter.species;
  if (filter.age) query.age = filter.age;
  if (filter.sex) query.sex = filter.sex;
  if (filter.size) query.size = filter.size;
  if (filter.source) query.source = filter.source;
  if (filter.country) query["location.country"] = filter.country.toUpperCase();
  if (filter.organizationSourceId) query.organizationSourceId = filter.organizationSourceId;
  if (filter.search) query.$text = { $search: filter.search };
  if (filter.near) {
    query["location.coordinates"] = {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [filter.near.longitude, filter.near.latitude] },
        $maxDistance: filter.near.radiusKm * 1000,
      },
    };
  }
  return query;
}

export async function listListings(filter: ListListingsFilter) {
  const query = buildListingQuery(filter);
  // $nearSphere sorts by distance and cannot combine with countDocuments.
  const isGeo = Boolean(filter.near);

  const cursor = collection()
    .find(query)
    .skip(filter.skip ?? 0)
    .limit(filter.limit ?? 20);
  if (!isGeo) cursor.sort(filter.search ? { score: { $meta: "textScore" } } : { publishedAt: -1, createdAt: -1 });

  const [listings, total] = await Promise.all([
    cursor.toArray(),
    isGeo ? Promise.resolve(-1) : collection().countDocuments(query),
  ]);
  return { listings, total };
}

export async function getListing(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function getListingStats() {
  const [bySpecies, byStatus, bySource, total] = await Promise.all([
    collection().aggregate([
      { $match: { status: LISTING_STATUS.ADOPTABLE } },
      { $group: { _id: "$species", count: { $sum: 1 } } },
    ]).toArray(),
    collection().aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray(),
    collection().aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]).toArray(),
    collection().countDocuments({ status: LISTING_STATUS.ADOPTABLE }),
  ]);
  const toRecord = (rows: Array<Record<string, unknown>>) =>
    Object.fromEntries(rows.map((row) => [String(row._id), row.count]));
  return {
    adoptable: total,
    bySpecies: toRecord(bySpecies as Array<Record<string, unknown>>),
    byStatus: toRecord(byStatus as Array<Record<string, unknown>>),
    bySource: toRecord(bySource as Array<Record<string, unknown>>),
  };
}

// ─── Direct listings (partner shelters / admin) ─────────────

export async function createDirectListing(data: Partial<ListingDocument>) {
  const now = new Date();
  const document: ListingDocument = {
    source: LISTING_SOURCE.DIRECT,
    sourceId: new ObjectId().toString(),
    name: String(data.name || "").trim() || "Unnamed friend",
    species: data.species || "other",
    breed: data.breed || "",
    breedSecondary: data.breedSecondary || "",
    mixedBreed: data.mixedBreed ?? false,
    age: data.age || "unknown",
    sex: data.sex || "unknown",
    size: data.size || "unknown",
    status: data.status || LISTING_STATUS.ADOPTABLE,
    description: data.description || "",
    photos: Array.isArray(data.photos) ? data.photos : [],
    attributes: {
      spayedNeutered: data.attributes?.spayedNeutered ?? null,
      houseTrained: data.attributes?.houseTrained ?? null,
      specialNeeds: data.attributes?.specialNeeds ?? null,
      shotsCurrent: data.attributes?.shotsCurrent ?? null,
      goodWithChildren: data.attributes?.goodWithChildren ?? null,
      goodWithDogs: data.attributes?.goodWithDogs ?? null,
      goodWithCats: data.attributes?.goodWithCats ?? null,
    },
    organizationSourceId: data.organizationSourceId || "",
    location: {
      city: data.location?.city || "",
      state: data.location?.state || "",
      postcode: data.location?.postcode || "",
      country: (data.location?.country || "").toUpperCase(),
      coordinates: data.location?.coordinates ?? null,
    },
    url: data.url ?? null,
    publishedAt: now,
    syncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection().insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateListing(id: string, data: Partial<ListingDocument>) {
  if (!ObjectId.isValid(id)) return null;
  const { _id, source, sourceId, createdAt, ...rest } = data;
  return collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...rest, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function deleteListing(id: string) {
  if (!ObjectId.isValid(id)) return { deletedCount: 0 };
  return collection().deleteOne({ _id: new ObjectId(id) });
}

// ─── Sync support ───────────────────────────────────────────

export async function upsertSyncedListings(listings: ListingDocument[]): Promise<number> {
  if (listings.length === 0) return 0;
  const operations = listings.map((listing) => {
    const { _id, createdAt, ...rest } = listing;
    return {
      updateOne: {
        filter: { source: listing.source, sourceId: listing.sourceId },
        update: { $set: rest, $setOnInsert: { createdAt } },
        upsert: true,
      },
    };
  });
  const result = await collection().bulkWrite(operations, { ordered: false });
  return result.upsertedCount + result.modifiedCount;
}

export async function markStaleListingsRemoved(cutoff: Date): Promise<number> {
  const result = await collection().updateMany(
    {
      source: { $in: [LISTING_SOURCE.PETFINDER, LISTING_SOURCE.RESCUEGROUPS] },
      status: { $ne: LISTING_STATUS.REMOVED },
      syncedAt: { $lt: cutoff },
    },
    { $set: { status: LISTING_STATUS.REMOVED, updatedAt: new Date() } },
  );
  return result.modifiedCount;
}
