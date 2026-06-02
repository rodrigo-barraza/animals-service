# Animals Service

Animals backend — species catalog, sightings, habitats, tracking.

## Quick Start

```bash
# Secrets are resolved from vault-service automatically.
npm install
npm run dev
```

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/animals` | List/search animals |
| GET | `/animals/:id` | Single animal |
| POST | `/animals` | Create animal |
| PATCH | `/animals/:id` | Update animal |
| DELETE | `/animals/:id` | Delete animal |
| GET | `/sightings` | List sightings |
| GET | `/sightings/:id` | Single sighting |
| POST | `/sightings` | Record a sighting |
| DELETE | `/sightings/:id` | Delete sighting |
| GET | `/health` | Health check |

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Framework:** Express 5
- **Database:** MongoDB
- **Secrets:** Vault service

## Scripts

```bash
npm run start         # Start server
npm run dev           # Start with auto-reload (tsx watch)
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm test              # Run tests (Vitest)
npm run test:watch    # Run tests in watch mode
npm run deploy        # Deploy to production
npm run deploy:dry    # Validate deployment without deploying
```
