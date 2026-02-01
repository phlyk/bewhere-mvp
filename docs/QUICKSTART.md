# BeWhere Quick Start Guide

Get BeWhere running locally with Docker Compose in under 5 minutes.

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.0+ | `git --version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |

## Quick Start (5 Minutes)

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd be-where

# Create environment file from template
cp .env.example .env
```

**Optional**: Edit `.env` to customize ports or credentials (defaults work fine for local development).

### Step 2: Start the Database

```bash
# Start PostgreSQL with PostGIS
docker compose up -d db

# Wait for database to be healthy (usually 10-15 seconds)
docker compose ps
```

You should see:
```
NAME           STATUS                   PORTS
bewhere-db     running (healthy)        0.0.0.0:5432->5432/tcp
```

### Step 3: Run Database Migrations

```bash
cd api
npm install
npm run migration:run
cd ..
```

Expected output:
```
Migration CreateAdministrativeAreas has been executed successfully.
Migration CreatePopulation has been executed successfully.
Migration CreateCrimeCategories has been executed successfully.
...
```

### Step 4: Load Initial Data (ETL)

```bash
cd etl
npm install

# Load French départements (must run first - ~10 seconds)
npm run etl:departements

# Load population data 2016-2024 (~5 seconds)
npm run etl:population

cd ..
```

Expected output:
```
✓ Extracted 101 départements from geo.api.gouv.fr
✓ Loaded 101 administrative areas
✓ Loaded 909 population records (101 départements × 9 years)
```

### Step 5: Start the API

```bash
cd api
npm run start:dev
```

The API will be available at:
- **Health check**: http://localhost:3000/health
- **Swagger docs**: http://localhost:3000/api-docs
- **Areas**: http://localhost:3000/areas
- **Categories**: http://localhost:3000/categories

### Step 6: Start the Frontend (Optional)

```bash
# In a new terminal
cd web
npm install
npm run dev
```

The web app will be available at: http://localhost:5173

> **Note**: You'll need a Mapbox token for the map. Add `VITE_MAPBOX_TOKEN=your_token_here` to `web/.env`.

---

## Full Stack with Docker Compose

Run all services together without manual setup:

```bash
# Start database and API (builds API image)
docker compose up -d

# View logs
docker compose logs -f api
```

### Running ETL in Docker

The ETL service runs as a one-off job:

```bash
# Run all ETL pipelines
docker compose run --rm etl npm run etl:all

# Or run specific pipelines
docker compose run --rm etl npm run etl:departements
docker compose run --rm etl npm run etl:population
docker compose run --rm etl npm run etl:france-monthly
```

---

## Service Ports

| Service | Default Port | Environment Variable |
|---------|--------------|----------------------|
| PostgreSQL | 5432 | `POSTGRES_PORT` |
| NestJS API | 3000 | `API_PORT` |
| Vite Dev Server | 5173 | N/A |

---

## Verifying the Installation

### 1. Check Database Connection

```bash
docker compose exec db psql -U bewhere -d bewhere -c "SELECT COUNT(*) FROM administrative_areas;"
```

Expected: `101` (départements)

### 2. Check API Health

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 3. Check Data Loaded

```bash
# Départements
curl -s http://localhost:3000/areas | jq '.meta.total'
# Expected: 101

# Crime categories
curl -s http://localhost:3000/categories | jq '.meta.total'
# Expected: 20
```

---

## Common Commands

### Database

```bash
# Start database
docker compose up -d db

# Stop all services
docker compose down

# Reset database (delete all data)
docker compose down -v

# Connect to database CLI
docker compose exec db psql -U bewhere -d bewhere

# View database logs
docker compose logs -f db
```

### API

```bash
# Development mode (with hot reload)
cd api && npm run start:dev

# Production build
cd api && npm run build && npm run start:prod

# Run tests
cd api && npm test

# Run E2E tests
cd api && npm run test:e2e

# View API logs (Docker)
docker compose logs -f api
```

### ETL

```bash
# Run all pipelines
npm run etl:all

# Run specific pipeline
npm run etl:departements
npm run etl:population
npm run etl:france-monthly

# Run with Docker
docker compose run --rm etl npm run etl:all
```

### Frontend

```bash
cd web

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run E2E tests
npm run test:e2e
```

---

## Troubleshooting

### Database won't start

**Symptom**: `bewhere-db` status shows "starting" indefinitely.

**Solution**:
```bash
# Check logs
docker compose logs db

# Common fix: port conflict
lsof -i :5432  # Check if port is in use
# Edit .env to use different port: POSTGRES_PORT=5433
```

### Migration fails

**Symptom**: `error: relation "administrative_areas" already exists`

**Solution**:
```bash
# Reset database and re-run migrations
docker compose down -v
docker compose up -d db
# Wait for healthy status
cd api && npm run migration:run
```

### API can't connect to database

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
1. Ensure database is running: `docker compose ps`
2. Check if using Docker for API: Use `POSTGRES_HOST=db` (not `localhost`)
3. Check port mapping matches `.env` settings

### ETL fails to download data

**Symptom**: `ECONNREFUSED` or `ETIMEDOUT` errors

**Solution**:
```bash
# Retry with longer timeout
ETL_REQUEST_TIMEOUT=60000 npm run etl:departements

# Or use cached data if available
# Cache is stored in etl/cache/ by default
```

### Mapbox map doesn't load

**Symptom**: Map shows grey box or "Token missing" error

**Solution**:
1. Get a free Mapbox token from https://mapbox.com
2. Create `web/.env`:
   ```
   VITE_API_URL=http://localhost:3000
   VITE_MAPBOX_TOKEN=pk.your_token_here
   ```
3. Restart the dev server: `npm run dev`

---

## Environment Variables Reference

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `bewhere` | Database username |
| `POSTGRES_PASSWORD` | `bewhere_dev` | Database password |
| `POSTGRES_DB` | `bewhere` | Database name |
| `POSTGRES_HOST` | `localhost` | Database host (`db` in Docker) |
| `POSTGRES_PORT` | `5432` | Database port |

### API

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Node environment |
| `API_PORT` | `3000` | API server port |
| `CORS_ORIGIN` | `http://localhost:5173` | CORS allowed origin |

### ETL

| Variable | Default | Description |
|----------|---------|-------------|
| `ETL_CACHE_DIR` | `./cache` | Downloaded file cache |
| `ETL_BATCH_SIZE` | `1000` | Database insert batch size |
| `ETL_REQUEST_TIMEOUT` | `30000` | HTTP request timeout (ms) |
| `LOG_LEVEL` | `info` | Logging level |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (default: `http://localhost:3000`) |
| `VITE_MAPBOX_TOKEN` | Mapbox GL JS access token |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Docker Compose                                │
├───────────────────┬──────────────────────┬──────────────────────────┤
│   PostgreSQL      │    NestJS API        │     ETL Pipeline         │
│   + PostGIS       │   (REST endpoints)   │   (one-off jobs)         │
│                   │                      │                          │
│  Port: 5432       │  Port: 3000          │  Runs on demand          │
│                   │                      │                          │
│  - Geometries     │  - /health           │  - Départements          │
│  - Population     │  - /areas            │  - Population            │
│  - Crime data     │  - /categories       │  - Crime data            │
│  - ETL logs       │  - /observations     │                          │
│                   │  - /compare/*        │                          │
└───────────────────┴──────────────────────┴──────────────────────────┘
                              ▲
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   React + Vite Frontend                              │
│                                                                      │
│  Port: 5173 (dev)                                                   │
│                                                                      │
│  - Mapbox GL map with choropleth                                    │
│  - Redux Toolkit Query for API calls                                │
│  - Material-UI components                                           │
│  - Compare mode (areas, years, sources)                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

After getting BeWhere running:

1. **Explore the API**: Visit http://localhost:3000/api-docs for Swagger documentation
2. **Load crime data**: Run `npm run etl:france-monthly` to load État 4001 data
3. **View the map**: Open http://localhost:5173 to see the choropleth visualization
4. **Compare areas**: Use the Compare tab to analyze differences between départements

---

## Getting Help

- **Documentation**: See `docs/` folder for detailed documentation
- **Project Plan**: [PLAN.md](../PLAN.md)
- **Task Breakdown**: [TASKS.md](../TASKS.md)
- **Progress**: [PROGRESS.md](../PROGRESS.md)
- **Design Decisions**: [DESIGN_DECISIONS.md](../DESIGN_DECISIONS.md)
