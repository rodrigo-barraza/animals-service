// ─── Configuration ──────────────────────────────────────────

const CONFIG = {
  ANIMALS_SERVICE_PORT: parseInt(process.env.ANIMALS_SERVICE_PORT as string, 10),
  MONGODB_URI: process.env.MONGO_URI as string,
  MONGODB_DB_NAME: process.env.ANIMALS_SERVICE_MONGO_DB_NAME as string || "animals",
};

export default CONFIG;
