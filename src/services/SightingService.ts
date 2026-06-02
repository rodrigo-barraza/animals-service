// ─── Sighting Service ───────────────────────────────────────

import { ObjectId } from "mongodb";
import { getDB } from "@rodrigo-barraza/service-library";
import { COLLECTIONS } from "../constants.ts";
import type { SightingDocument, CreateSightingData, ListSightingsFilter } from "../types.ts";

function collection() {
  return getDB().collection<SightingDocument>(COLLECTIONS.SIGHTINGS);
}

export async function listSightings(filter: ListSightingsFilter) {
  const query: Record<string, unknown> = {};
  if (filter.animalId) query.animalId = new ObjectId(filter.animalId);
  if (filter.spottedBy) query.spottedBy = filter.spottedBy;

  const [sightings, total] = await Promise.all([
    collection()
      .find(query)
      .sort({ spottedAt: -1 })
      .skip(filter.skip ?? 0)
      .limit(filter.limit ?? 20)
      .toArray(),
    collection().countDocuments(query),
  ]);

  return { sightings, total };
}

export async function getSighting(identifier: string) {
  return collection().findOne({ _id: new ObjectId(identifier) });
}

export async function createSighting(data: CreateSightingData) {
  const now = new Date();
  const document: SightingDocument = {
    animalId: new ObjectId(data.animalId),
    location: data.location || "",
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    notes: data.notes || "",
    spottedBy: data.spottedBy || "anonymous",
    spottedAt: data.spottedAt ? new Date(data.spottedAt) : now,
    createdAt: now,
  };
  const result = await collection().insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function deleteSighting(identifier: string) {
  return collection().deleteOne({ _id: new ObjectId(identifier) });
}
