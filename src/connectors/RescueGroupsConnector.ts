// ─── RescueGroups Connector ─────────────────────────────────
// RescueGroups.org API v5 public endpoints (JSON:API format).
// https://api.rescuegroups.org/v5/public/ — API key in the
// Authorization header. Free tier has no request caps.
// ─────────────────────────────────────────────────────────────

import { ApiError, createApiClient } from "@rodrigo-barraza/utilities-library/http";

import CONFIG from "../config.ts";
import logger from "../logger.ts";
import { LISTING_SOURCE, LISTING_STATUS } from "../constants.ts";
import type { GeoPoint, ListingDocument, OrganizationDocument } from "../types.ts";

const API_BASE = "https://api.rescuegroups.org/v5/public";
const PAGE_LIMIT = 250;

export function isRescueGroupsConfigured(): boolean {
  return Boolean(CONFIG.RESCUEGROUPS_API_KEY);
}

// Header factory so the API key is read per request (matches the old
// per-call CONFIG read under vault hot-reload).
const api = createApiClient(API_BASE, {
  headers: () => ({
    Authorization: CONFIG.RESCUEGROUPS_API_KEY,
    "Content-Type": "application/vnd.api+json",
  }),
});

async function apiGet(path: string): Promise<Record<string, unknown>> {
  try {
    return await api.get<Record<string, unknown>>(path);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`RescueGroups GET ${path} failed: ${error.status}`);
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
  "small animal": "small_pet",
  reptile: "reptile",
  amphibian: "reptile",
  "farm-type animal": "barnyard",
};

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEnum(value: unknown): string {
  return normalize(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function toPoint(lat: unknown, lon: unknown): GeoPoint | null {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { type: "Point", coordinates: [longitude, latitude] };
}

interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Record<string, any>;
  relationships?: Record<string, { data?: Array<{ type: string; id: string }> }>;
}

function relatedIds(resource: JsonApiResource, relation: string): string[] {
  const data = resource.relationships?.[relation]?.data;
  return Array.isArray(data) ? data.map((entry) => String(entry.id)) : [];
}

const AGE_MAP: Record<string, string> = {
  baby: "baby",
  young: "young",
  adult: "adult",
  senior: "senior",
};

const SIZE_MAP: Record<string, string> = {
  small: "small",
  medium: "medium",
  large: "large",
  "x_large": "xlarge",
  xlarge: "xlarge",
};

export function mapRescueGroupsAnimal(
  resource: JsonApiResource,
  included: { speciesNames: Map<string, string>; pictures: Map<string, string>; orgCoordinates: Map<string, GeoPoint | null>; orgLocations: Map<string, { city: string; state: string; postcode: string; country: string }> },
  now: Date,
): ListingDocument {
  const attrs = resource.attributes || {};
  const speciesId = relatedIds(resource, "species")[0];
  const speciesName = (speciesId && included.speciesNames.get(speciesId)) || normalize(attrs.speciesName) || "";
  const orgId = relatedIds(resource, "orgs")[0] || "";
  const photos = relatedIds(resource, "pictures")
    .map((id) => included.pictures.get(id))
    .filter((url): url is string => Boolean(url));
  const orgLocation = (orgId && included.orgLocations.get(orgId)) || { city: "", state: "", postcode: "", country: "" };

  return {
    source: LISTING_SOURCE.RESCUEGROUPS,
    sourceId: String(resource.id),
    name: normalize(attrs.name) || "Unnamed friend",
    species: SPECIES_MAP[speciesName.toLowerCase()] || "other",
    breed: normalize(attrs.breedPrimary),
    breedSecondary: normalize(attrs.breedSecondary),
    mixedBreed: Boolean(attrs.isBreedMixed),
    age: AGE_MAP[normalizeEnum(attrs.ageGroup)] || "unknown",
    sex: normalizeEnum(attrs.sex) || "unknown",
    size: SIZE_MAP[normalizeEnum(attrs.sizeGroup)] || "unknown",
    status: LISTING_STATUS.ADOPTABLE, // public search endpoint returns available animals only
    description: normalize(attrs.descriptionText),
    photos,
    attributes: {
      spayedNeutered: attrs.isAltered ?? null,
      houseTrained: attrs.isHousetrained ?? null,
      specialNeeds: attrs.isSpecialNeeds ?? null,
      shotsCurrent: attrs.isCurrentVaccinations ?? null,
      goodWithChildren: attrs.isKidsOk ?? null,
      goodWithDogs: attrs.isDogsOk ?? null,
      goodWithCats: attrs.isCatsOk ?? null,
    },
    organizationSourceId: orgId,
    location: {
      city: orgLocation.city,
      state: orgLocation.state,
      postcode: orgLocation.postcode,
      country: orgLocation.country || "US",
      coordinates: (orgId && included.orgCoordinates.get(orgId)) || null,
    },
    url: normalize(attrs.url) || null,
    publishedAt: attrs.createdDate ? new Date(attrs.createdDate) : null,
    syncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapRescueGroupsOrganization(resource: JsonApiResource, now: Date): OrganizationDocument {
  const attrs = resource.attributes || {};
  return {
    source: LISTING_SOURCE.RESCUEGROUPS,
    sourceId: String(resource.id),
    name: normalize(attrs.name) || "Unknown organization",
    slug: normalize(attrs.name).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || String(resource.id),
    email: normalize(attrs.email),
    phone: normalize(attrs.phone),
    website: normalize(attrs.url) || null,
    url: normalize(attrs.facebookUrl) || null,
    description: normalize(attrs.about),
    photos: [],
    address: {
      street: normalize(attrs.street),
      city: normalize(attrs.city),
      state: normalize(attrs.state),
      postcode: normalize(attrs.postalcode),
      country: normalize(attrs.country) || "US",
    },
    coordinates: toPoint(attrs.lat, attrs.lon),
    verified: false,
    syncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Fetchers ───────────────────────────────────────────────

export function parseRescueGroupsPage(data: Record<string, unknown>, now: Date): {
  listings: ListingDocument[];
  organizations: OrganizationDocument[];
  totalPages: number;
} {
  const resources = Array.isArray(data.data) ? (data.data as JsonApiResource[]) : [];
  const included = Array.isArray(data.included) ? (data.included as JsonApiResource[]) : [];
  const meta = (data.meta || {}) as Record<string, unknown>;

  const speciesNames = new Map<string, string>();
  const pictures = new Map<string, string>();
  const orgCoordinates = new Map<string, GeoPoint | null>();
  const orgLocations = new Map<string, { city: string; state: string; postcode: string; country: string }>();
  const organizations: OrganizationDocument[] = [];

  for (const resource of included) {
    const attrs = resource.attributes || {};
    if (resource.type === "species") {
      speciesNames.set(String(resource.id), normalize(attrs.singular || attrs.name));
    } else if (resource.type === "pictures") {
      const url = attrs.large?.url || attrs.original?.url || attrs.small?.url;
      if (url) pictures.set(String(resource.id), String(url));
    } else if (resource.type === "orgs") {
      const org = mapRescueGroupsOrganization(resource, now);
      organizations.push(org);
      orgCoordinates.set(String(resource.id), org.coordinates);
      orgLocations.set(String(resource.id), {
        city: org.address.city,
        state: org.address.state,
        postcode: org.address.postcode,
        country: org.address.country,
      });
    }
  }

  const listings = resources.map((resource) =>
    mapRescueGroupsAnimal(resource, { speciesNames, pictures, orgCoordinates, orgLocations }, now),
  );

  return { listings, organizations, totalPages: Number(meta.pages) || 1 };
}

export async function fetchRescueGroupsPage(page: number): Promise<{
  listings: ListingDocument[];
  organizations: OrganizationDocument[];
  totalPages: number;
}> {
  const data = await apiGet(
    `/animals/search/available?limit=${PAGE_LIMIT}&page=${page}&include=pictures,orgs,species`,
  );
  const parsed = parseRescueGroupsPage(data, new Date());
  logger.info(`RescueGroups page ${page}: ${parsed.listings.length} animals, ${parsed.organizations.length} orgs`);
  return parsed;
}
