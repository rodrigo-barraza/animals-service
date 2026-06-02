import { createService } from "@rodrigo-barraza/service-library";
import CONFIG from "./config.ts";

import { COLLECTIONS } from "./constants.ts";

// ─── Routes ────────────────────────────────────────────────────
import animalRoutes from "./routes/AnimalRoutes.ts";
import sightingRoutes from "./routes/SightingRoutes.ts";

// ─── Service Bootstrap ────────────────────────────────────────

await createService({
  name: "animals-service",
  port: CONFIG.ANIMALS_SERVICE_PORT,
  description: "Animals backend — species catalog, sightings, habitats, tracking",
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
    ]
  },
  routes: [
    { path: "/animals", router: animalRoutes },
    { path: "/sightings", router: sightingRoutes },
  ],

});
