# BeWhere

A local-first GIS data exploration tool for comparing historic crime statistics across French administrative regions (départements).

## Overview

BeWhere normalizes French crime data from multiple sources into a canonical schema, enabling consistent analysis and visualization of crime statistics across departments. The MVP focuses on France only, providing:

- **101 départements** (96 metropolitan + 5 overseas DOM)
- **20 canonical crime categories** (mapped from 95+ source categories)
- **Population-normalized rates** (per 100,000 inhabitants)
- **Multi-year coverage** (2016-2024)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                          │
├─────────────────┬──────────────────┬────────────────────────┤
│   PostgreSQL    │    NestJS API    │     ETL Pipeline       │
│   + PostGIS     │   (read-only)    │   (batch processing)   │
│                 │                  │                        │
│  - Geometries   │  - /areas        │  - Départements        │
│  - Population   │  - /categories   │  - Population          │
│  - Crime data   │  - /observations │  - Crime data (FR)     │
│  - ETL logs     │  - /health       │                        │
└─────────────────┴──────────────────┴────────────────────────┘
```

## Prerequisites

- **Docker** & **Docker Compose** (v2.0+)
- **Node.js** 20+ (for local development)
- **npm** 10+

## Quick Start

### 1. Clone and Configure

```bash
git clone <repository-url>
cd be-where

# Copy environment template
cp .env.example .env
```

### 2. Start Database

```bash
# Start PostgreSQL with PostGIS
docker compose up -d db

# Verify database is healthy
docker compose ps
```

### 3. Run Migrations

```bash
cd api
npm install
npm run migration:run
cd ..
```

### 4. Load Initial Data (ETL)

```bash
cd etl
npm install

# Load départements (must run first)
npm run etl:departements

# Load population data
npm run etl:population

cd ..
```

### 5. Start API

```bash
cd api
npm run start:dev
```

The API will be available at `http://localhost:3000`

- Health check: `GET /health`
- Swagger docs: `http://localhost:3000/api` (when implemented)

## Docker Compose (Full Stack)

Run all services together:

```bash
# Start database and API
docker compose up -d

# Run ETL (one-off job)
docker compose run --rm etl npm run etl:all

# View logs
docker compose logs -f api
```

## Project Structure

```
be-where/
├── api/                    # NestJS REST API
│   ├── src/
│   │   ├── areas/          # Administrative areas module
│   │   ├── crimes/         # Crime categories & observations
│   │   ├── health/         # Health check endpoint
│   │   ├── migrations/     # TypeORM migrations
│   │   ├── common/         # Shared utilities (PostGIS)
│   │   └── config/         # Configuration
│   └── test/               # E2E tests
│
├── etl/                    # ETL pipeline
│   ├── src/
│   │   ├── core/           # Base classes (Extractor, Transformer, Loader)
│   │   ├── pipelines/      # Dataset-specific pipelines
│   │   ├── utils/          # Utilities (aggregation, validation)
│   │   └── config/         # ETL configuration
│   └── logs/               # ETL run logs
│
├── db/                     # Database initialization
│   └── init/               # SQL scripts (extensions)
│
├── docs/                   # Documentation
│   ├── CRIME_TAXONOMY.md   # Canonical category definitions
│   ├── CATEGORY_MAPPINGS.md # French → canonical mappings
│   └── FRENCH_DATASETS.md  # Dataset structure docs
│
├── data_excerpts/          # Sample data files
├── docker-compose.yml      # Docker orchestration
├── .env.example            # Environment template
├── PLAN.md                 # Project plan & architecture
├── TASKS.md                # Task breakdown
└── PROGRESS.md             # Implementation progress
```

## Development

### API Development

```bash
cd api

# Install dependencies
npm install

# Run in development mode (with watch)
npm run start:dev

# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint
```

### ETL Development

```bash
cd etl

# Install dependencies
npm install

# Run specific pipeline
npm run etl:departements
npm run etl:population

# Run all pipelines
npm run etl:all

# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

### Database

```bash
# Start database
docker compose up -d db

# Stop database
docker compose down

# Reset database (delete volume)
docker compose down -v

# Connect via psql
docker compose exec db psql -U bewhere -d bewhere
```

### Migrations

```bash
cd api

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate src/migrations/MigrationName
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `bewhere` | Database username |
| `POSTGRES_PASSWORD` | `bewhere_dev` | Database password |
| `POSTGRES_DB` | `bewhere` | Database name |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `NODE_ENV` | `development` | Node environment |
| `API_PORT` | `3000` | API server port |
| `CORS_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `ETL_CACHE_DIR` | `./cache` | ETL file cache directory |
| `ETL_BATCH_SIZE` | `1000` | Database insert batch size |
| `LOG_LEVEL` | `info` | Logging level |

See [.env.example](.env.example) for all options.

## Data Sources

### French Crime Data

- **État 4001** (`datagouv-juin-2012-*.csv`): Monthly snapshots, 95 crime indices
- **Time Series** (`datagouv-serieschrono.csv`): Monthly national + annual département data

### Administrative Boundaries

- **Source**: [geo.api.gouv.fr](https://geo.api.gouv.fr)
- **Coverage**: 101 French départements (GeoJSON → PostGIS)

### Population Data

- **Source**: [INSEE](https://www.insee.fr/fr/statistiques/1893198)
- **Coverage**: 2016-2024, département-level

## Database Schema

```
┌──────────────────────────┐
│  administrative_areas    │
│  (départements, régions) │
│  + PostGIS geometry      │
└───────────┬──────────────┘
            │ 1:n
            ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│      population          │    │    crime_categories      │
│  (area_id, year, count)  │    │  (20 canonical types)    │
└──────────────────────────┘    └───────────┬──────────────┘
                                            │ 1:n
┌──────────────────────────┐                │
│     data_sources         │────────────────┤
│  (name, url, metadata)   │                │
└───────────┬──────────────┘                │
            │ 1:n                           │
            ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    crime_observations                        │
│  (area_id, category_id, data_source_id, year, count, rate)  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│   category_mappings      │    │       etl_runs           │
│  (source → canonical)    │    │  (audit log per import)  │
└──────────────────────────┘    └──────────────────────────┘
```

## Testing

```bash
# API unit tests
cd api && npm test

# API e2e tests
cd api && npm run test:e2e

# ETL unit tests
cd etl && npm test

# All tests with coverage
npm test -- --coverage
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/areas` | List administrative areas |
| GET | `/areas/:id` | Get area with geometry |
| GET | `/categories` | List crime categories |
| GET | `/observations` | Query crime observations |

## License

MIT

## Documentation

- [Project Plan](PLAN.md) - Architecture and scope
- [Task Breakdown](TASKS.md) - Implementation tasks
- [Progress](PROGRESS.md) - Current status
- [Design Decisions](DESIGN_DECISIONS.md) - Technical decisions
- [Crime Taxonomy](docs/CRIME_TAXONOMY.md) - Category definitions
- [Category Mappings](docs/CATEGORY_MAPPINGS.md) - French → canonical
- [French Datasets](docs/FRENCH_DATASETS.md) - Data source documentation
