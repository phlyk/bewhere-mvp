# BeWhere MVP Progress

Last Updated: February 1, 2026

---

## Current Phase

**Phase 1: Infrastructure Setup** (Phase 0 tasks 0.3, 0.4, 0.6 deferred)

## Completed Tasks

**Planning Phase:**
- ✅ Created PLAN.md with MVP scope and architecture
- ✅ Created TASKS.md with granular implementation breakdown
- ✅ Created DESIGN_DECISIONS.md with finalized decisions
- ✅ Analyzed French data structure:
  - `datagouv-juin-2012-*.csv`: Département-level, 47+ crime categories, 111 rows
  - `datagouv-serieschrono.csv`: Time series, monthly data (2016+), 36,715 rows

**Phase 0 - Foundation & Research:**
- ✅ **Task 0.5**: Document French dataset structure → [docs/FRENCH_DATASETS.md](docs/FRENCH_DATASETS.md)
  - Documented État 4001 structure: 107 crime indices (95 active), 96 département columns
  - Documented Time Series structure: 15 columns, 36,716 rows, 2016-2025 coverage
  - Catalogued all crime category indices with French→English translations
  - Identified mapping strategy: État 4001 categories → canonical taxonomy
  - Documented ETL considerations (encoding, parsing, decimal handling)

- ✅ **Task 0.1**: Define canonical crime category taxonomy → [docs/CRIME_TAXONOMY.md](docs/CRIME_TAXONOMY.md)
  - Defined 20 canonical categories (HOMICIDE through OTHER)
  - Documented category definitions with includes/excludes
  - Established severity levels (Critical, High, Medium, Low)
  - Created category hierarchy (Violent Crimes, Property Crimes, Drug Offenses, etc.)
  - Provided database schema and API response examples
  - Aligned with international standards (UNODC ICCS, Eurostat, FBI UCR)

- ✅ **Task 0.2**: Map French crime categories to canonical taxonomy → [docs/CATEGORY_MAPPINGS.md](docs/CATEGORY_MAPPINGS.md)
  - Mapped all 95 active État 4001 indices to 20 canonical categories
  - Documented 4 unused indices (96, 97, 99, 100) for ETL skip logic
  - Created time series indicator mappings with sub-indicator handling
  - Provided TypeScript ETL implementation code (lookup tables)
  - Documented mapping rationale and design decisions
  - Coverage: 100% of active indices mapped, 19/20 categories populated (DOMESTIC_VIOLENCE has no direct mapping due to historical data limitations)

**Phase 1 - Infrastructure Setup:**
- ✅ **Task 1.1**: Initialize Docker Compose with postgres:16-postgis service
  - Created `docker-compose.yml` with `postgis/postgis:16-3.4` image
  - Configured environment variables with sensible defaults (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT)
  - Added healthcheck for container readiness monitoring
  - Created `db/init/01-extensions.sql` to auto-enable PostGIS and postgis_topology extensions
  - Updated `.env.example` with database configuration section
  - Updated `.gitignore` with Docker and Node.js patterns

- ✅ **Task 1.2**: Create NestJS project scaffold
  - Created `api/` directory with full NestJS structure
  - Configured `nest-cli.json`, `tsconfig.json`, `eslint.config.mjs`
  - Created `main.ts` application entry point
  - Created `app.module.ts` with ConfigModule and TypeOrmModule
  - Created `HealthModule` with health check endpoint
  - Created feature module structure (`areas/`, `common/`, `config/`, `health/`)

- ✅ **Task 1.3**: Configure TypeORM with PostGIS types
  - Configured TypeOrmModule.forRootAsync with dynamic config loading
  - Created `database.config.ts` and `app.config.ts` configuration files
  - Created PostGIS utilities in `common/postgis/`:
    - `geometry.types.ts` - Point, Polygon, MultiPolygon type definitions
    - `geometry.columns.ts` - TypeORM column helpers for geometry types
    - `geometry.transformer.ts` - GeoJSON ↔ PostGIS transformers
  - Configured synchronize: false for migration-based schema management

- ✅ **Task 1.5**: Configure environment variables (.env.example)
  - Database config: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT
  - API config: NODE_ENV, API_PORT, CORS_ORIGIN
  - External APIs: MAPBOX_API_TOKEN placeholder
  - Full DATABASE_URL connection string template

**Phase 2 - Database Schema:**
- ✅ **Task 2.1**: Create `administrative_areas` table with PostGIS geometry column
  - Created `AdministrativeArea` entity with UUID primary key
  - Defined `AdminLevel` enum (country, region, department)
  - Added PostGIS MultiPolygon geometry column (SRID 4326)
  - Created migration `1706745600000-CreateAdministrativeAreas.ts`
  - Added spatial index on geometry column (GIST)
  - Added indexes on code+level (unique), level, parentCode, countryCode
  - Created comprehensive unit tests

- ✅ **Task 2.2**: Create `population` table (area_id, year, population_count)
  - Created `Population` entity with UUID primary key
  - Foreign key relationship to `AdministrativeArea` (cascade delete)
  - Unique constraint on (areaId, year) to prevent duplicates
  - BigInt for population count (supports national-level values)
  - Source tracking (INSEE, Eurostat, etc.) and notes fields
  - Created migration `1706832000000-CreatePopulation.ts`
  - Added indexes on year and areaId for efficient queries
  - Created comprehensive unit tests

- ✅ **Task 2.3**: Create `crime_categories` table with canonical names
  - Created `CrimeCategory` entity with UUID primary key
  - Created new `crimes/` module structure for crime-related entities
  - Defined `CrimeSeverity` enum (critical, high, medium, low)
  - Defined `CrimeCategoryGroup` enum (violent_crimes, property_crimes, drug_offenses, other_offenses)
  - Added French localization support (nameFr column)
  - Added sortOrder for consistent UI display ordering
  - Added isActive flag for soft-deprecation support
  - Created migration `1706918400000-CreateCrimeCategories.ts`
  - Added indexes on code (unique), severity, categoryGroup, sortOrder
  - Created comprehensive unit tests (17 test cases)
  - Registered CrimesModule in AppModule

- ✅ **Task 2.4**: Create `data_sources` table (name, url, description, update_frequency)
  - Created `DataSource` entity with UUID primary key
  - Defined `UpdateFrequency` enum (realtime, daily, weekly, monthly, quarterly, yearly, irregular, historical)
  - Added comprehensive metadata fields: code, name, nameFr, description, url, apiEndpoint
  - Added provider, license, attribution fields for data provenance
  - Added countryCode, dataStartYear, dataEndYear for data coverage tracking
  - Added isActive flag and lastImportedAt timestamp for ETL scheduling
  - Added JSONB metadata column for source-specific configuration
  - Created migration `1707004800000-CreateDataSources.ts`
  - Added indexes on code (unique), updateFrequency, countryCode, isActive
  - Created comprehensive unit tests (18 test cases)
  - Registered entity in EtlModule

- ✅ **Task 2.5**: Create `crime_observations` table with foreign keys
  - Created `CrimeObservation` entity with UUID primary key
  - Defined `TimeGranularity` enum (monthly, quarterly, yearly)
  - Added foreign keys to `administrative_areas`, `crime_categories`, `data_sources` (cascade delete)
  - Added temporal fields: year, month (nullable for yearly data)
  - Added crime statistics: count (integer), ratePer100k (decimal 12,4)
  - Added audit fields: populationUsed, isValidated, notes
  - Created migration `1707091200000-CreateCrimeObservations.ts`
  - Added composite unique constraint on (areaId, categoryId, dataSourceId, year, month)
  - Added individual indexes on areaId, categoryId, dataSourceId, year
  - Added composite index for common queries (areaId, categoryId, year, dataSourceId)
  - Added time series index (year, month)
  - Added partial index for unvalidated records (isValidated = false)
  - Created comprehensive unit tests (27 test cases)
  - Registered entity in CrimesModule

- ✅ **Task 2.7**: Create `etl_runs` table for ETL audit logging
  - Created `EtlRun` entity with UUID primary key
  - Defined `EtlRunStatus` enum (running, completed, completed_with_warnings, failed, cancelled)
  - Added foreign key to `data_sources` (cascade delete)
  - Added run metadata: runName, sourceUrl for debugging/re-runs
  - Added timestamps: startedAt, completedAt, durationMs (computed)
  - Added row counters: rowsExtracted, rowsTransformed, rowsLoaded, rowsSkipped
  - Added error tracking: errorCount, warningCount, errorMessages (JSONB), warningMessages (JSONB)
  - Added JSONB metadata column for extensibility
  - Created migration `1707264000000-CreateEtlRuns.ts`
  - Added composite index on (dataSourceId, startedAt) for source run history
  - Added indexes on status, startedAt for filtering
  - Added partial indexes on running/failed runs for monitoring
  - Created comprehensive unit tests (46 test cases)
  - Registered entity in EtlModule

- ✅ **Task 2.6**: Create `category_mappings` table (already completed)
  - Created `CategoryMapping` entity with UUID primary key
  - Foreign keys to `data_sources` and `crime_categories` (cascade delete)
  - Composite unique constraint on (dataSourceId, sourceCategory)
  - Source metadata fields: sourceCategory, sourceCategoryName, confidence
  - Created migration `1707177600000-CreateCategoryMappings.ts`
  - Added indexes on composite lookup, canonicalCategoryId, sourceCategory
  - Created comprehensive unit tests

- ✅ **Task 2.8**: Add spatial indexes on geometry columns (already in 2.1)
  - Spatial index `IDX_administrative_areas_geometry` already created in migration
  - Uses GIST index for efficient PostGIS geometric queries

- ✅ **Task 2.9**: Add composite indexes on (area_id, category_id, year, data_source_id) (already in 2.5)
  - Composite index `IDX_crime_observations_composite` already created in migration
  - Covers primary API query patterns (area + category + year + source)

- ✅ **Task 2.10**: Seed canonical crime categories (20 categories)
  - Created seed migration `1707350400000-SeedCrimeCategories.ts`
  - Seeded 20 canonical categories aligned with docs/CRIME_TAXONOMY.md
  - Categories grouped into: violent_crimes (8), property_crimes (7), drug_offenses (2), other_offenses (3)
  - Severity levels: critical (6), high (6), medium (4), low (4)
  - French translations (nameFr) included for localization
  - sortOrder 1-20 for consistent UI display
  - All categories set as isActive = true
  - Created comprehensive unit tests (20 test cases)

---

## In Progress

_Task 2.11 (Write schema migration tests) ready to start_

---

## Blockers

_No blockers_

---

## Research Findings

### French Data Structure

See [docs/FRENCH_DATASETS.md](docs/FRENCH_DATASETS.md) for comprehensive documentation.

**Dataset 1: État 4001 Monthly Snapshots** (`datagouv-juin-2012-*.csv`)
- Columns: 96 département columns (01-Ain through 95-Val-d'Oise) + Métropole total
- Rows: 107 crime category indices (95 active, 4 unused)
- Granularity: Monthly snapshots, metropolitan France only (no DOM-TOM)
- Encoding: Latin-1 (semicolon-delimited)

**Dataset 2: Time Series** (`datagouv-serieschrono.csv`)
- Columns: 15 fields including `Valeurs`, `Unite_temps`, `Indicateur`, `Zone_geographique`
- Rows: 36,716 time series entries
- Granularity: Monthly national (CVS-CJO adjusted) + Annual département-level
- Geographic: Includes both France national AND département-level data (including DOM-TOM)
- Time range: 2016M01 to 2025M06

### Key Findings from Task 0.5
- ✅ Time series DOES contain département breakdowns (annual data, not just national)
- Time series includes overseas territories (971-976); État 4001 does not
- Monthly CVS-CJO data is national only; département data is annual raw counts
- Population rates require separate INSEE data source

### Action Items from Research
- [ ] Investigate Mapbox Boundaries API for French département polygons
- [ ] Source INSEE population data (département-level, yearly 2016-2025)
- [x] ~~Determine if `datagouv-serieschrono.csv` provides département breakdowns~~ → **YES, annual data**

---

## Notes

<!-- - Use this file to track high-level progress
- Update after completing each phase or significant milestone
- Sub-agents should add notes about decisions made during implementation
- Keep entries brief and factual -->


- France-only MVP provides highest data quality (d\u00e9partement-level)
- Will need robust encoding handling (Latin-1 \u2192 UTF-8)
- Monthly \u2192 yearly aggregation required in ETL transform stage
- Category mapping will be key challenge (107 État 4001 indices → 15-20 canonical)
- Time series provides both raw counts AND per-1000-habitants rates for département data