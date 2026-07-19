# Animals Service

Animals backend — adoption listings, shelters & rescues, worldwide giving, plus the original species/sightings catalog.

The platform is an **aggregator + giving layer**: adoptable-animal listings are synced from external sources (Petfinder, RescueGroups) into a local cache, charity discovery proxies Every.org and GlobalGiving, and actual donations always happen on the provider's site (they handle payment, receipts, and disbursement — this service never processes third-party charity money).

## Quick Start

```bash
# Secrets are resolved from vault-service automatically.
npm install
npm run dev
npm run seed   # optional: sample listings/orgs so the client is demoable without API keys
```

## API Endpoints

### Adoption listings

| Method | Path | Purpose |
|---|---|---|
| GET | `/listings` | Browse/search adoptable animals — `species`, `age`, `sex`, `size`, `status` (`any` disables), `source`, `country`, `organizationSourceId`, `search`, `lat`+`lng`+`radiusKm` (geo), `limit`/`offset` |
| GET | `/listings/stats` | Adoptable counts by species/status/source |
| GET | `/listings/:id` | Single listing |
| POST | `/listings` | Create a direct listing 🔒 |
| PATCH | `/listings/:id` | Update a listing 🔒 |
| DELETE | `/listings/:id` | Delete a listing 🔒 |
| GET | `/organizations` | List/search shelters & rescues (`source`, `country`, `search`) |
| GET | `/organizations/:id` | Org profile + its adoptable listings (accepts Mongo id or source id) |

### Giving

| Method | Path | Purpose |
|---|---|---|
| GET | `/charities/collections` | Curated giving collections (work with zero API keys) |
| GET | `/charities/collections/:slug` | One curated collection |
| GET | `/charities/search?q=` | Live search across configured providers (Every.org, GlobalGiving); falls back to curated data |
| GET | `/donations/stats` | Collective-impact numbers |
| POST | `/donations/webhooks/everyorg?token=` | Every.org partner donation webhook |

### Shelter self-serve

| Method | Path | Purpose |
|---|---|---|
| POST | `/submissions` | Shelter/rescue interest form (public, honeypot-protected) |
| GET | `/submissions` | Review inbox 🔒 |
| PATCH | `/submissions/:id` | Approve/reject 🔒 |

### Sync

| Method | Path | Purpose |
|---|---|---|
| GET | `/sync/status` | Source configuration + recent runs |
| POST | `/sync` | Trigger an ingest run 🔒 |

🔒 = requires `x-api-secret: $ANIMALS_SERVICE_API_SECRET` (guard disabled when the secret is unset).

### Species catalog (legacy)

`/animals` and `/sightings` CRUD — the original species-encyclopedia endpoints, unchanged.

## External data sources

All config-gated: unconfigured sources are skipped and endpoints degrade gracefully.

| Provider | Env vars | Notes |
|---|---|---|
| [Petfinder API v2](https://www.petfinder.com/developers/v2/docs/) | `PETFINDER_API_KEY`, `PETFINDER_API_SECRET` | US/CA adoptable pets. Terms restrict long-term storage — data is a synced cache; stale listings are marked `removed` after 14 days unseen. |
| [RescueGroups v5](https://rescuegroups.org/services/adoptable-pet-data-api/) | `RESCUEGROUPS_API_KEY` | Free, no request caps. |
| [Every.org](https://docs.every.org/docs/intro) | `EVERYORG_PUBLIC_KEY`, `EVERYORG_WEBHOOK_TOKEN` | 1M+ US 501(c)(3) search + donate links + donation webhooks. |
| [GlobalGiving](https://www.globalgiving.org/api/) | `GLOBALGIVING_API_KEY` | Vetted projects in 160+ countries. |

Sync runs on a cron (`ANIMALS_SYNC_INTERVAL_MINUTES`, default 360) when at least one source is configured, page-capped by `ANIMALS_SYNC_MAX_PAGES` (default 5) per source per run.

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Framework:** Express 5
- **Database:** MongoDB (text + 2dsphere indexes on listings/organizations)
- **Secrets:** Vault service

## Scripts

```bash
npm run start         # Start server
npm run dev           # Start with auto-reload (tsx watch)
npm run seed          # Insert sample listings/organizations (idempotent)
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm test              # Run tests (Vitest)
npm run test:watch    # Run tests in watch mode
npm run deploy        # Deploy to production
npm run deploy:dry    # Validate deployment without deploying
```
