import { createService } from "@rodrigo-barraza/utilities-library/service";
import CONFIG from "./config.ts";

import { COLLECTIONS } from "./constants.ts";

// ─── Routes ────────────────────────────────────────────────────
import animalRoutes from "./routes/AnimalRoutes.ts";
import sightingRoutes from "./routes/SightingRoutes.ts";
import listingRoutes from "./routes/ListingRoutes.ts";
import organizationRoutes from "./routes/OrganizationRoutes.ts";
import charityRoutes from "./routes/CharityRoutes.ts";
import donationRoutes from "./routes/DonationRoutes.ts";
import submissionRoutes from "./routes/SubmissionRoutes.ts";
import syncRoutes from "./routes/SyncRoutes.ts";
import { runSync, isAnySourceConfigured } from "./services/SyncService.ts";

// ─── Service Bootstrap ────────────────────────────────────────

await createService({
  name: "animals-service",
  port: CONFIG.ANIMALS_SERVICE_PORT,
  description: "Animals backend — adoption listings, shelters & rescues, giving, and species tracking",
  mongo: {
    uri: CONFIG.MONGODB_URI,
    dbName: CONFIG.MONGODB_DB_NAME,
    indexes: [
      {
        collection: COLLECTIONS.ANIMALS,
        indexes: [
          { key: { slug: 1 }, options: { unique: true } },
          { key: { animalClass: 1 } },
          { key: { conservationStatus: 1 } },
          { key: { createdAt: -1 } },
          { key: { commonName: "text", scientificName: "text", description: "text" }, options: { weights: { commonName: 10, scientificName: 8, description: 2 }, name: "animals_text" } },
        ]
      },
      {
        collection: COLLECTIONS.SIGHTINGS,
        indexes: [
          { key: { animalId: 1 } },
          { key: { spottedAt: -1 } },
          { key: { spottedBy: 1 } },
          { key: { createdAt: -1 } },
        ]
      },
      {
        collection: COLLECTIONS.LISTINGS,
        indexes: [
          { key: { source: 1, sourceId: 1 }, options: { unique: true } },
          { key: { status: 1, species: 1 } },
          { key: { organizationSourceId: 1 } },
          { key: { "location.country": 1 } },
          { key: { publishedAt: -1 } },
          { key: { syncedAt: -1 } },
          { key: { "location.coordinates": "2dsphere" } },
          { key: { name: "text", breed: "text", description: "text" }, options: { weights: { name: 10, breed: 6, description: 2 }, name: "listings_text" } },
        ]
      },
      {
        collection: COLLECTIONS.ORGANIZATIONS,
        indexes: [
          { key: { source: 1, sourceId: 1 }, options: { unique: true } },
          { key: { "address.country": 1 } },
          { key: { coordinates: "2dsphere" } },
          { key: { name: "text", description: "text" }, options: { weights: { name: 10, description: 2 }, name: "organizations_text" } },
        ]
      },
      {
        collection: COLLECTIONS.SUBMISSIONS,
        indexes: [
          { key: { status: 1, createdAt: -1 } },
        ]
      },
      {
        collection: COLLECTIONS.DONATIONS,
        indexes: [
          { key: { provider: 1, chargeId: 1 } },
          { key: { nonprofitSlug: 1 } },
          { key: { createdAt: -1 } },
        ]
      },
      {
        collection: COLLECTIONS.SYNC_RUNS,
        indexes: [
          { key: { startedAt: -1 } },
        ]
      },
    ]
  },
  routes: [
    { path: "/animals", router: animalRoutes },
    { path: "/sightings", router: sightingRoutes },
    { path: "/listings", router: listingRoutes },
    { path: "/organizations", router: organizationRoutes },
    { path: "/charities", router: charityRoutes },
    { path: "/donations", router: donationRoutes },
    { path: "/submissions", router: submissionRoutes },
    { path: "/sync", router: syncRoutes },
  ],
  cron: isAnySourceConfigured()
    ? [
        {
          name: "adoption-listings-sync",
          intervalMs: CONFIG.ANIMALS_SYNC_INTERVAL_MINUTES * 60 * 1000,
          fn: async () => {
            await runSync("cron");
          },
          immediate: true,
        },
      ]
    : [],

});
