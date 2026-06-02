// ─── Animal Service ─────────────────────────────────────────

import { ObjectId } from "mongodb";
import { getDB } from "@rodrigo-barraza/service-library";
import { COLLECTIONS } from "../constants.ts";
import type { AnimalDocument, CreateAnimalData, ListAnimalsFilter } from "../types.ts";

function collection() {
  return getDB().collection<AnimalDocument>(COLLECTIONS.ANIMALS);
}

export async function listAnimals(filter: ListAnimalsFilter) {
  const query: Record<string, unknown> = {};
  if (filter.animalClass) query.animalClass = filter.animalClass;
  if (filter.conservationStatus) query.conservationStatus = filter.conservationStatus;
  if (filter.search) query.$text = { $search: filter.search };

  const [animals, total] = await Promise.all([
    collection()
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filter.skip ?? 0)
      .limit(filter.limit ?? 20)
      .toArray(),
    collection().countDocuments(query),
  ]);

  return { animals, total };
}

export async function getAnimal(identifier: string) {
  if (ObjectId.isValid(identifier)) {
    return collection().findOne({ _id: new ObjectId(identifier) });
  }
  return collection().findOne({ slug: identifier });
}

export async function getAnimalBySlug(slug: string) {
  return collection().findOne({ slug });
}

export async function createAnimal(data: CreateAnimalData) {
  const now = new Date();
  const slug = data.slug || data.commonName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const document: AnimalDocument = {
    commonName: data.commonName,
    scientificName: data.scientificName || "",
    slug,
    animalClass: data.animalClass || "mammal",
    conservationStatus: data.conservationStatus || "least_concern",
    habitat: data.habitat || "",
    diet: data.diet || "",
    description: data.description || "",
    imageUrl: data.imageUrl ?? null,
    metadata: data.metadata || {},
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection().insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateAnimal(identifier: string, data: Partial<CreateAnimalData>) {
  const filter = ObjectId.isValid(identifier)
    ? { _id: new ObjectId(identifier) }
    : { slug: identifier };

  const result = await collection().findOneAndUpdate(
    filter,
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result;
}

export async function deleteAnimal(identifier: string) {
  const filter = ObjectId.isValid(identifier)
    ? { _id: new ObjectId(identifier) }
    : { slug: identifier };
  return collection().deleteOne(filter);
}
