# BeWhere MVP Progress

Last Updated: February 1, 2026 (Phase 5 API complete, CrimesModule wired up)

---

## Current Phase

**Phase 4: ETL Implementation (French Datasets) - IN PROGRESS**
**Phase 5: Backend API (Read-Only) - COMPLETE**

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

- ✅ **Task 1.6**: Write README with setup instructions
  - Created comprehensive README.md at project root
  - Quick start guide (Docker + local development)
  - Full project structure documentation
  - Database, API, and ETL development workflows
  - Environment variables reference table
  - Database schema diagram (ASCII)
  - API endpoints documentation
  - Links to all documentation files

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

- ✅ **Task 2.11**: Write schema migration tests
  - Created comprehensive unit tests for all 7 schema migrations + 1 seed migration
  - Test files created:
    - `1706745600000-CreateAdministrativeAreas.spec.ts` - Tests PostGIS geometry, GIST index, enum types
    - `1706832000000-CreatePopulation.spec.ts` - Tests FK constraints, unique indexes, cascade delete
    - `1706918400000-CreateCrimeCategories.spec.ts` - Tests severity/group enums, unique code constraint
    - `1707004800000-CreateDataSources.spec.ts` - Tests update frequency enum, JSONB metadata
    - `1707091200000-CreateCrimeObservations.spec.ts` - Tests 3 FKs, composite indexes, time granularity
    - `1707177600000-CreateCategoryMappings.spec.ts` - Tests mapping confidence, partial indexes
    - `1707264000000-CreateEtlRuns.spec.ts` - Tests ETL status enum, JSONB error/warning tracking
    - `1707350400000-SeedCrimeCategories.spec.ts` - Tests all 20 categories seeded correctly
  - **Total: 144 test cases passing** covering:
    - Migration metadata validation (name, MigrationInterface)
    - up() method: table creation, columns, constraints, indexes, comments
    - down() method: proper cleanup order (constraints → indexes → tables → enums)
    - Data integrity: FK relationships, unique constraints, enum values
    - Reversibility: up/down operations are symmetric

**Phase 3 - ETL Pipeline:**
- ✅ **Task 3.1**: Create base ETL classes (Extractor, Transformer, Loader)
  - Created `BaseExtractor<TRaw>` abstract class with extract/validate methods
  - Created `BaseTransformer<TRaw, TTransformed>` with row transformation
  - Created `BaseLoader<T>` with batch insert, upsert, and transaction support
  - Created `BasePipeline<TRaw, TTransformed>` orchestrating E-T-L flow
  - All classes include comprehensive TypeScript interfaces

- ✅ **Task 3.2**: Implement file download utility with caching
  - Created `downloadFile()` function in `etl/src/utils/download.ts`
  - MD5-based cache key generation from URL
  - Configurable cache directory and max age
  - Force download option to bypass cache

- ✅ **Task 3.3**: Implement French département geometry loader
  - Created `departements/` pipeline with Extractor, Transformer, Loader
  - Downloads GeoJSON from geo.api.gouv.fr
  - Transforms to PostGIS-compatible format
  - Loads 96 metropolitan + 5 overseas départements

- ✅ **Task 3.4**: Implement INSEE population data loader
  - Created `population/` pipeline with full ETL implementation
  - Embedded INSEE population data (2016-2024) for MVP
  - Resolves département codes to area_id via database lookup
  - Loads 909 records (101 départements × 9 years)
  - Includes comprehensive unit tests (extractor, transformer, loader, pipeline)
  - Population stored in thousands, converted to actual values during extraction
  - Source: INSEE Estimations de population (https://www.insee.fr/fr/statistiques/1893198)

- ✅ **Task 3.5**: Implement monthly-to-yearly aggregation utility
  - Created `aggregateMonthlyToYearly()` in `etl/src/utils/aggregation.ts`
  - Supports SUM, AVERAGE, LAST, MAX, MIN strategies
  - Handles partial years with extrapolation option
  - Tracks missing months and generates warnings

- ✅ **Task 3.6**: Implement rate_per_100k calculation utility
  - Created `calculateRatePer100k()` in `etl/src/utils/rate-calculator.ts`
  - Added `convertPer1kTo100k()` for French data sources
  - Added `calculatePercentageChange()` for year-over-year analysis

- ✅ **Task 3.7**: Create validation utility
  - Created validation functions in `etl/src/utils/validation.ts`
  - `validateRowCount()` with tolerance parameter
  - `validateRequiredFields()` for row completeness
  - `validateNumericRange()` for value bounds checking

- ✅ **Task 3.8**: Create ETL run logger
  - Created `EtlRunLogger` class in `etl/src/utils/etl-run-logger.ts`
  - Records to `etl_runs` table with full metadata tracking
  - Supports start, update, and complete run lifecycle
  - Tracks rows extracted/transformed/loaded/skipped

- ✅ **Task 3.9**: Write ETL logging/reporting formatter
  - Created `report-formatter.ts` in `etl/src/utils/` (823 lines)
  - Console-friendly summaries with ANSI color coding
  - Status icons and labels (✓, ⚠, ✗) for pipeline results
  - Detailed text reports for logging
  - JSON reports for programmatic consumption
  - Duration and row count formatting utilities
  - Batch summary for multi-pipeline runs
  - Progress bar visualization
  - Run history table formatting
  - Log entry formatting with timestamps
  - Strip colors utility for file output
  - Created comprehensive unit tests (610 lines, 50+ test cases)

- ✅ **Task 3.10**: Document ETL contract (required methods per dataset)
  - Created comprehensive ETL contract documentation → [docs/ETL_CONTRACT.md](docs/ETL_CONTRACT.md)
  - Documented all 4 base class contracts (Extractor, Transformer, Loader, Pipeline)
  - Listed required abstract methods with signatures and responsibilities
  - Provided pipeline implementation checklist (8 steps)
  - Documented dataset-specific requirements (État 4001, Time Series)
  - Included utility function usage guides (download, aggregation, rate calculation)
  - Added error handling strategies by component
  - Documented pipeline execution order and dependencies
  - Provided CLI interface documentation
  - Added testing guidelines with example code

---

## In Progress

**Phase 4: ETL Implementation (French Datasets)**

### Dataset 1 (État 4001):
- ✅ **Task 4.1.1**: Implement CSV extractor for État 4001
  - Created `france-monthly.extractor.ts` with full extraction logic
  - Handles Latin-1 encoding, semicolon delimiters
  - Parses 96 département column headers to standardized codes
  - Extracts year/month from filename patterns
  - Comprehensive unit tests (93 test cases passing)

- ✅ **Task 4.1.2**: Implement category mapper (107 French categories → 20 canonical)
  - Created `france-monthly.category-mapper.ts` with complete mapping
  - Maps all 103 active État 4001 indices to 20 canonical categories
  - 4 unused indices (96, 97, 99, 100) properly handled
  - O(1) lookup via Map-based caching
  - Includes reverse lookup (canonical → source indices)
  - Comprehensive unit tests (155 test cases passing)

- ✅ **Task 4.1.3**: Implement département resolver (column name → area_id)
  - Created `france-monthly.departement-resolver.ts` with database lookup
  - Preloads all départements from `administrative_areas` table
  - Normalizes codes (single-digit padding, Corsica codes 2A/2B)
  - Resolves column names via `DEPARTEMENT_NAME_TO_CODE` mapping
  - Provides batch resolution and lookup functions for efficiency
  - Includes validation coverage check for expected départements
  - Comprehensive unit tests (58 test cases passing)

- ✅ **Task 4.1.4**: Aggregate monthly data to yearly totals
  - Created `france-monthly.aggregator.ts` with `aggregateToYearly()` function
  - Aggregates by (département_code, canonical_category, year) → sum counts
  - Maps 107 État 4001 indices to 20 canonical categories during aggregation
  - Handles partial years with optional extrapolation (12/N scaling)
  - Tracks missing months and data completeness per aggregation key
  - Includes helper functions: `getCategorySummary()`, `getDepartementSummary()`, `getYearSummary()`, `filterAggregatedData()`
  - Comprehensive unit tests (31 test cases passing)

- ✅ **Task 4.1.5**: Calculate rate_per_100k using INSEE population
  - Created `france-monthly.rate-enricher.ts` (518 lines)
  - Enriches yearly aggregates with rate calculations using embedded INSEE population data
  - Creates `EnrichedCrimeRecord` with ratePer100k, populationUsed, and metadata
  - Comprehensive unit tests

- ✅ **Task 4.1.6**: Write loader with upsert logic
  - Created `france-monthly.loader.ts` (642 lines)
  - Extends BaseLoader for crime_observations table
  - Upsert logic: same source + area + category + year = replace
  - Batch processing with transaction support
  - Comprehensive unit tests

- [ ] 4.1.7 Create dataset validation tests
- [ ] 4.1.8 Run full pipeline and verify row counts

### Dataset 2 (Time Series):
- Tasks 4.2.1-4.2.8 remaining

**Phase 5: Backend API (Read-Only) - COMPLETE**

- ✅ **Task 5.1**: Create `AreasController` with GET endpoints
  - Created `AreasController` with `GET /areas`, `GET /areas/geojson`, `GET /areas/:id`
  - Created `AreasService` with `findAll()`, `findOne()`, `findByCode()`, `findAllAsGeoJson()`
  - DTOs: `AreaListQueryDto`, `AreaResponseDto`, `AreaDetailResponseDto`, `AreaListResponseDto`
  - Filter support: `level`, `parentCode`, `countryCode`
  - GeoJSON endpoint returns `FeatureCollection` for choropleth map visualization

- ✅ **Task 5.2**: Create `CategoriesController`
  - Created `CategoriesController` with `GET /categories`, `GET /categories/:id`
  - Created `CategoriesService` with `findAll()`, `findOne()`, `findByCode()`
  - DTOs: `CategoryListQueryDto`, `CategoryResponseDto`, `CategoryListResponseDto`
  - Filter support: `severity`, `categoryGroup`, `isActive`
  - Returns all 20 canonical categories with French translations

- ✅ **Task 5.3**: Create `ObservationsController`
  - Created `ObservationsController` with `GET /observations`, `GET /observations/:id`
  - Created `ObservationsService` with `findAll()`, `findOne()`, `findByAreaAndYear()`
  - DTOs: `ObservationListQueryDto`, `ObservationResponseDto`, `PaginationMetaDto`, `ObservationListResponseDto`
  - Filter support: `areaId/areaCode`, `categoryId/categoryCode`, `dataSourceId/dataSourceCode`, `year/yearFrom/yearTo`
  - Pagination support: `page`, `limit` with full metadata (`total`, `totalPages`, `hasNextPage`, `hasPrevPage`)
  - Returns both `count` and `ratePer100k` with `populationUsed`

- ✅ **Task 5.4**: Create `ComparisonController`
  - Created `ComparisonController` with `GET /compare/areas`, `GET /compare/years`, `GET /compare/sources`
  - Created `ComparisonService` with `compareAreas()`, `compareYears()`, `compareSources()`
  - DTOs: `CompareAreasQueryDto`, `CompareYearsQueryDto`, `CompareSourcesQueryDto`, `ComparisonItemDto`, response DTOs
  - Returns per-category: `countA/B`, `rateA/B`, `countDiff`, `rateDiff`, `countPctChange`, `ratePctChange`

- ✅ **Task 5.5**: Add OpenAPI decorators to all endpoints
  - All controllers decorated with `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiParam`
  - All DTOs have `@ApiProperty` decorators with examples and descriptions

- ✅ **Task 5.6**: Implement error handling middleware
  - NestJS built-in exception filters handle 400 (validation), 404 (not found) errors
  - `NotFoundException` thrown by services for missing resources

- ✅ **Task 5.7**: Add request validation (DTOs)
  - All query DTOs use `class-validator` decorators (`@IsOptional`, `@IsEnum`, `@IsInt`, `@Min`, `@Max`, etc.)
  - `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` enabled

- ✅ **Task 5.8**: Write API integration tests
  - Created comprehensive e2e test suite in `api/test/api.e2e-spec.ts` (801 lines)
  - Tests all endpoints: AreasController, CategoriesController, ObservationsController, ComparisonController
  - Covers success cases, filtering, pagination, 404 errors, 400 validation errors
  - Uses test database with setup/teardown fixtures

- ✅ **Task 5.9**: Generate Swagger UI
  - Main.ts configures `SwaggerModule` with full API metadata
  - Available at `/api-docs` when API server is running

- ✅ **Module Wiring**: CrimesModule updated
  - Registered `CategoriesController`, `ObservationsController`, `ComparisonController`
  - Registered `CategoriesService`, `ObservationsService`, `ComparisonService`
  - Added `AdministrativeArea`, `DataSource` entities for repository injection

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
- [x] ~~Investigate Mapbox Boundaries API for French département polygons~~ → Using geo.api.gouv.fr
- [x] ~~Source INSEE population data (département-level, yearly 2016-2025)~~ → Embedded in ETL
- [x] ~~Determine if `datagouv-serieschrono.csv` provides département breakdowns~~ → **YES, annual data**

---

## Notes

<!-- - Use this file to track high-level progress
- Update after completing each phase or significant milestone
- Sub-agents should add notes about decisions made during implementation
- Keep entries brief and factual -->


- France-only MVP provides highest data quality (département-level)
- Will need robust encoding handling (Latin-1 → UTF-8)
- Monthly → yearly aggregation required in ETL transform stage
- Category mapping will be key challenge (107 État 4001 indices → 15-20 canonical)
- Time series provides both raw counts AND per-1000-habitants rates for département data