// ─── Petfinder Connector ────────────────────────────────────
// Petfinder API v2 (https://www.petfinder.com/developers/v2/docs/).
// OAuth2 client-credentials flow; tokens last ~1 hour and are cached.
// Petfinder's terms restrict long-term storage — ingested listings are
// a synced cache (stale entries are marked removed, see SyncService).
// ─────────────────────────────────────────────────────────────

import { TokenManager } from "@rodrigo-barraza/utilities-library/node";
import { ApiError, createApiClient } from "@rodrigo-barraza/utilities-library/http";

import CONFIG from "../config.ts";
import logger from "../logger.ts";
import { LISTING_SOURCE, LISTING_STATUS } from "../constants.ts";
import type { ListingDocument, OrganizationDocument } from "../types.ts";

const API_BASE = "https://api.petfinder.com/v2";
const PAGE_LIMIT = 100;

export function isPetfinderConfigured(): boolean {
  return Boolean(CONFIG.PETFINDER_API_KEY && CONFIG.PETFINDER_API_SECRET);
}

// Tokens last ~1 hour; the old cache refreshed 60s early, which lives in
// expiresInMilliseconds here (TokenManager holds a token until exactly
// fetchTime + expiresInMilliseconds).
const tokenManager = new TokenManager(async () => {
  const response = await fetch(`${API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CONFIG.PETFINDER_API_KEY,
      client_secret: CONFIG.PETFINDER_API_SECRET,
    }),
  });
  if (!response.ok) {
    throw new Error(`Petfinder token request failed: ${response.status}`);
  }
  const data = (await response.json()) as { access_token: string; expires_in: number };
  return { token: data.access_token, expiresInMilliseconds: data.expires_in * 1000 - 60_000 };
});

const api = createApiClient(API_BASE);

async function apiGet(path: string): Promise<Record<string, unknown>> {
  const token = await tokenManager.getToken();
  try {
    return await api.get<Record<string, unknown>>(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Petfinder GET ${path} failed: ${error.status}`);
    }
    throw error;
  }
}

// ─── Mappers (exported for tests) ───────────────────────────

const SPECIES_MAP: Record<string, string> = {
  dog: "dog",
  cat: "cat",
  rabbit: "rabbit",
  bird: "bird",
  horse: "horse",
  "small-furry": "small_pet",
  "scales-fins-other": "reptile",
  barnyard: "barnyard",
};

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEnum(value: unknown): string {
  return normalize(value).toLowerCase().replace(/[\s-]+/g, "_");
}

export function mapPetfinderAnimal(animal: Record<string, any>, now: Date): ListingDocument {
  const breeds = animal.breeds || {};
  const attributes = animal.attributes || {};
  const environment = animal.environment || {};
  const contact = animal.contact || {};
  const address = contact.address || {};
  const photos: string[] = Array.isArray(animal.photos)
    ? animal.photos.map((p: Record<string, string>) => p.large || p.medium || p.full || p.small).filter(Boolean)
    : [];

  // "Small & Furry" → "small-furry", "Scales, Fins & Other" → "scales-fins-other"
  const canonicalType = normalize(animal.type).toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  return {
    source: LISTING_SOURCE.PETFINDER,
    sourceId: String(animal.id),
    name: normalize(animal.name) || "Unnamed friend",
    species: SPECIES_MAP[canonicalType] || "other",
    breed: normalize(breeds.primary),
    breedSecondary: normalize(breeds.secondary),
    mixedBreed: Boolean(breeds.mixed),
    age: normalizeEnum(animal.age) || "unknown",
    sex: normalizeEnum(animal.gender) || "unknown",
    size: normalizeEnum(animal.size) || "unknown",
    status: normalizeEnum(animal.status) || LISTING_STATUS.ADOPTABLE,
    description: normalize(animal.description),
    photos,
    attributes: {
      spayedNeutered: attributes.spayed_neutered ?? null,
      houseTrained: attributes.house_trained ?? null,
      specialNeeds: attributes.special_needs ?? null,
      shotsCurrent: attributes.shots_current ?? null,
      goodWithChildren: environment.children ?? null,
      goodWithDogs: environment.dogs ?? null,
      goodWithCats: environment.cats ?? null,
    },
    organizationSourceId: normalize(animal.organization_id),
    location: {
      city: normalize(address.city),
      state: normalize(address.state),
      postcode: normalize(address.postcode),
      country: normalize(address.country) || "US",
      coordinates: null, // Petfinder exposes org-level location only; backfilled from the org during sync
    },
    url: normalize(animal.url) || null,
    publishedAt: animal.published_at ? new Date(animal.published_at) : null,
    syncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapPetfinderOrganization(org: Record<string, any>, now: Date): OrganizationDocument {
  const address = org.address || {};
  const photos: string[] = Array.isArray(org.photos)
    ? org.photos.map((p: Record<string, string>) => p.large || p.medium || p.full || p.small).filter(Boolean)
    : [];
  return {
    source: LISTING_SOURCE.PETFINDER,
    sourceId: normalize(org.id),
    name: normalize(org.name) || "Unknown organization",
    slug: normalize(org.id).toLowerCase(),
    email: normalize(org.email),
    phone: normalize(org.phone),
    website: normalize(org.website) || null,
    url: normalize(org.url) || null,
    description: normalize(org.mission_statement),
    photos,
    address: {
      street: normalize(address.address1),
      city: normalize(address.city),
      state: normalize(address.state),
      postcode: normalize(address.postcode),
      country: normalize(address.country) || "US",
    },
    coordinates: null,
    verified: false,
    syncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Fetchers ───────────────────────────────────────────────

export async function fetchPetfinderAnimalsPage(page: number): Promise<{ listings: ListingDocument[]; totalPages: number }> {
  const now = new Date();
  const data = await apiGet(`/animals?status=adoptable&limit=${PAGE_LIMIT}&page=${page}`);
  const animals = Array.isArray(data.animals) ? (data.animals as Record<string, unknown>[]) : [];
  const paginationInfo = (data.pagination || {}) as Record<string, unknown>;
  logger.info(`Petfinder page ${page}: ${animals.length} animals`);
  return {
    listings: animals.map((animal) => mapPetfinderAnimal(animal, now)),
    totalPages: Number(paginationInfo.total_pages) || page,
  };
}

export async function fetchPetfinderOrganizationsPage(page: number): Promise<{ organizations: OrganizationDocument[]; totalPages: number }> {
  const now = new Date();
  const data = await apiGet(`/organizations?limit=${PAGE_LIMIT}&page=${page}`);
  const orgs = Array.isArray(data.organizations) ? (data.organizations as Record<string, unknown>[]) : [];
  const paginationInfo = (data.pagination || {}) as Record<string, unknown>;
  return {
    organizations: orgs.map((org) => mapPetfinderOrganization(org, now)),
    totalPages: Number(paginationInfo.total_pages) || page,
  };
}
