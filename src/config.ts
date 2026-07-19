// ─── Configuration ──────────────────────────────────────────

const CONFIG = {
  ANIMALS_SERVICE_PORT: parseInt(process.env.ANIMALS_SERVICE_PORT as string, 10),
  MONGODB_URI: process.env.MONGO_URI as string,
  MONGODB_DB_NAME: process.env.ANIMALS_SERVICE_MONGO_DB_NAME as string || "animals",

  // Guards write/admin endpoints (sync trigger, direct listing writes,
  // submission review). Empty secret = guard disabled (dev).
  ANIMALS_SERVICE_API_SECRET: process.env.ANIMALS_SERVICE_API_SECRET || "",

  // ── Adoption data sources (config-gated; sync skips unconfigured) ──
  PETFINDER_API_KEY: process.env.PETFINDER_API_KEY || "",
  PETFINDER_API_SECRET: process.env.PETFINDER_API_SECRET || "",
  RESCUEGROUPS_API_KEY: process.env.RESCUEGROUPS_API_KEY || "",

  // ── Giving providers ──
  EVERYORG_PUBLIC_KEY: process.env.EVERYORG_PUBLIC_KEY || "",
  EVERYORG_WEBHOOK_TOKEN: process.env.EVERYORG_WEBHOOK_TOKEN || "",
  GLOBALGIVING_API_KEY: process.env.GLOBALGIVING_API_KEY || "",

  // ── Sync tuning ──
  ANIMALS_SYNC_INTERVAL_MINUTES: parseInt(process.env.ANIMALS_SYNC_INTERVAL_MINUTES || "360", 10),
  ANIMALS_SYNC_MAX_PAGES: parseInt(process.env.ANIMALS_SYNC_MAX_PAGES || "5", 10),
};

export default CONFIG;
