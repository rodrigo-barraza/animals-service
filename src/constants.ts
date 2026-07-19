// ─── Constants ──────────────────────────────────────────────

export const COLLECTIONS = {
  ANIMALS: "animals",
  SIGHTINGS: "sightings",
  LISTINGS: "listings",
  ORGANIZATIONS: "organizations",
  SUBMISSIONS: "submissions",
  DONATIONS: "donations",
  SYNC_RUNS: "sync_runs",
};

// ─── Adoption Platform Enums ────────────────────────────────

export const LISTING_SOURCE = {
  PETFINDER: "petfinder",
  RESCUEGROUPS: "rescuegroups",
  DIRECT: "direct",
  SAMPLE: "sample",
} as const;

export const LISTING_SPECIES = {
  DOG: "dog",
  CAT: "cat",
  RABBIT: "rabbit",
  BIRD: "bird",
  HORSE: "horse",
  SMALL_PET: "small_pet",
  REPTILE: "reptile",
  BARNYARD: "barnyard",
  OTHER: "other",
} as const;

export const LISTING_AGE = {
  BABY: "baby",
  YOUNG: "young",
  ADULT: "adult",
  SENIOR: "senior",
  UNKNOWN: "unknown",
} as const;

export const LISTING_SEX = {
  MALE: "male",
  FEMALE: "female",
  UNKNOWN: "unknown",
} as const;

export const LISTING_SIZE = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  XLARGE: "xlarge",
  UNKNOWN: "unknown",
} as const;

export const LISTING_STATUS = {
  ADOPTABLE: "adoptable",
  PENDING: "pending",
  ADOPTED: "adopted",
  REMOVED: "removed",
} as const;

export const SUBMISSION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Listings from external sources not seen in a sync for this many
// days are marked "removed" (sync runs are page-capped, so absence
// from a single run is not proof of removal).
export const LISTING_STALE_DAYS = 14;

export const CONSERVATION_STATUS = {
  LEAST_CONCERN: "least_concern",
  NEAR_THREATENED: "near_threatened",
  VULNERABLE: "vulnerable",
  ENDANGERED: "endangered",
  CRITICALLY_ENDANGERED: "critically_endangered",
  EXTINCT_IN_WILD: "extinct_in_wild",
  EXTINCT: "extinct",
};

export const ANIMAL_CLASS = {
  MAMMAL: "mammal",
  BIRD: "bird",
  REPTILE: "reptile",
  AMPHIBIAN: "amphibian",
  FISH: "fish",
  INVERTEBRATE: "invertebrate",
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
