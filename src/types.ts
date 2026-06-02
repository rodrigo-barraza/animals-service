// ─── Animals Service — Domain Types ─────────────────────────
// Canonical interfaces for the animals microservice domain.
// ─────────────────────────────────────────────────────────────

import type { ObjectId } from "mongodb";

// ─── Animal ─────────────────────────────────────────────────

export interface AnimalDocument {
  _id?: ObjectId;
  commonName: string;
  scientificName: string;
  slug: string;
  animalClass: string;
  conservationStatus: string;
  habitat: string;
  diet: string;
  description: string;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnimalData {
  commonName: string;
  scientificName?: string;
  slug?: string;
  animalClass?: string;
  conservationStatus?: string;
  habitat?: string;
  diet?: string;
  description?: string;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListAnimalsFilter {
  animalClass?: string;
  conservationStatus?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

// ─── Sighting ───────────────────────────────────────────────

export interface SightingDocument {
  _id?: ObjectId;
  animalId: ObjectId;
  location: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  spottedBy: string;
  spottedAt: Date;
  createdAt: Date;
}

export interface CreateSightingData {
  animalId: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
  spottedBy?: string;
  spottedAt?: string;
}

export interface ListSightingsFilter {
  animalId?: string;
  spottedBy?: string;
  skip?: number;
  limit?: number;
}

// ─── Pagination ─────────────────────────────────────────────

export interface PaginationQuery {
  limit?: string;
  offset?: string;
}

export interface Pagination {
  limit: number;
  offset: number;
  skip: number;
}
