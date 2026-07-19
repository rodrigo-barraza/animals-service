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

// ─── Adoption Listings ──────────────────────────────────────

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ListingLocation {
  city: string;
  state: string;
  postcode: string;
  country: string;
  coordinates: GeoPoint | null;
}

export interface ListingAttributes {
  spayedNeutered: boolean | null;
  houseTrained: boolean | null;
  specialNeeds: boolean | null;
  shotsCurrent: boolean | null;
  goodWithChildren: boolean | null;
  goodWithDogs: boolean | null;
  goodWithCats: boolean | null;
}

export interface ListingDocument {
  _id?: ObjectId;
  source: string; // LISTING_SOURCE
  sourceId: string; // unique per source
  name: string;
  species: string; // LISTING_SPECIES
  breed: string;
  breedSecondary: string;
  mixedBreed: boolean;
  age: string; // LISTING_AGE
  sex: string; // LISTING_SEX
  size: string; // LISTING_SIZE
  status: string; // LISTING_STATUS
  description: string;
  photos: string[];
  attributes: ListingAttributes;
  organizationSourceId: string; // source-scoped org id
  location: ListingLocation;
  url: string | null; // canonical listing page at the source
  publishedAt: Date | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListListingsFilter {
  species?: string;
  age?: string;
  sex?: string;
  size?: string;
  status?: string;
  source?: string;
  country?: string;
  organizationSourceId?: string;
  search?: string;
  near?: { longitude: number; latitude: number; radiusKm: number };
  skip?: number;
  limit?: number;
}

// ─── Organizations ──────────────────────────────────────────

export interface OrganizationDocument {
  _id?: ObjectId;
  source: string; // LISTING_SOURCE
  sourceId: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: string | null;
  url: string | null; // profile page at the source
  description: string;
  photos: string[];
  address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  coordinates: GeoPoint | null;
  verified: boolean; // true for direct partner organizations
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOrganizationsFilter {
  source?: string;
  country?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

// ─── Charities ──────────────────────────────────────────────

export interface CharityResult {
  provider: "everyorg" | "globalgiving" | "curated";
  id: string;
  name: string;
  description: string;
  country: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  donateUrl: string;
}

export interface CharityCollection {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  charities: CharityResult[];
}

// ─── Donations ──────────────────────────────────────────────

export interface DonationDocument {
  _id?: ObjectId;
  provider: string; // "everyorg"
  chargeId: string;
  partnerDonationId: string | null;
  nonprofitSlug: string;
  amount: number | null;
  currency: string;
  frequency: string;
  raw: Record<string, unknown>;
  createdAt: Date;
}

// ─── Shelter Submissions ────────────────────────────────────

export interface SubmissionDocument {
  _id?: ObjectId;
  organizationName: string;
  contactName: string;
  email: string;
  website: string;
  country: string;
  city: string;
  message: string;
  status: string; // SUBMISSION_STATUS
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubmissionData {
  organizationName: string;
  contactName?: string;
  email: string;
  website?: string;
  country?: string;
  city?: string;
  message?: string;
}

// ─── Sync ───────────────────────────────────────────────────

export interface SyncSourceResult {
  source: string;
  configured: boolean;
  listingsUpserted: number;
  organizationsUpserted: number;
  pagesFetched: number;
  error: string | null;
}

export interface SyncRunDocument {
  _id?: ObjectId;
  trigger: "manual" | "cron";
  startedAt: Date;
  finishedAt: Date | null;
  results: SyncSourceResult[];
  staleRemoved: number;
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
