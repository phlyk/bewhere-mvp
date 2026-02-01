# BeWhere MVP Tasks

## Phase 0: Foundation & Research

- [x] 0.1 Define canonical crime category taxonomy (15-20 categories)
- [ ] 0.2 Map French crime categories (47+) to canonical taxonomy
- [ ] 0.3 Source French département boundary data (Mapbox API or data.gouv.fr GeoJSON)
- [ ] 0.4 Source INSEE population data (département-level, yearly)
- [ ] 0.5 Document French dataset structure (`datagouv-juin-2012-*.csv`, `datagouv-serieschrono.csv`)
- [ ] 0.6 Research Mapbox Boundaries API for admin polygon storage

## Phase 1: Infrastructure Setup

- [x] 1.1 Initialize Docker Compose with postgres:16-postgis service
- [x] 1.2 Create NestJS project scaffold
- [x] 1.3 Configure TypeORM with PostGIS types
- [x] 1.4 Set up separate `etl/` directory structure
- [x] 1.5 Configure environment variables (.env.example)
- [x] 1.6 Write README with setup instructions

## Phase 2: Database Schema

- [x] 2.1 Create `administrative_areas` table with PostGIS geometry column
- [x] 2.2 Create `population` table (area_id, year, population_count)
- [x] 2.3 Create `crime_categories` table with canonical names
- [x] 2.4 Create `data_sources` table (name, url, description, update_frequency)
- [x] 2.5 Create `crime_observations` table with foreign keys (includes data_source_id, count, rate_per_100k)
- [x] 2.6 Create `category_mappings` table (data_source_id, source_category, canonical_category_id)
- [x] 2.7 Create `etl_runs` table (dataset_name, source_url, started_at, completed_at, status, rows_processed, errors)
- [x] 2.8 Add spatial indexes on geometry columns
- [x] 2.9 Add composite indexes on (area_id, category_id, year, data_source_id)
- [x] 2.10 Seed canonical crime categories (15-20 categories)
- [x] 2.11 Write schema migration tests

## Phase 3: ETL Pipeline (Template)

- [x] 3.1 Create base ETL classes (Extractor, Transformer, Loader)
- [x] 3.2 Implement file download utility with caching
- [x] 3.3 Implement French département geometry loader (GeoJSON → PostGIS)
- [x] 3.4 Implement INSEE population data loader (département + year)
- [x] 3.5 Implement monthly-to-yearly aggregation utility
- [x] 3.6 Implement rate_per_100k calculation utility (count / population * 100000)
- [x] 3.7 Create validation utility (row counts, sanity checks)
- [x] 3.8 Create ETL run logger (records to `etl_runs` table)
- [x] 3.9 Write ETL logging/reporting formatter
- [x] 3.10 Document ETL contract (required methods per dataset)

## Phase 4: ETL Implementation (French Datasets)

### Dataset 1: Département Monthly Snapshots (`datagouv-juin-2012-*.csv`)

- [ ] 4.1.1 Create CSV extractor (handle encoding, département columns)
- [ ] 4.1.2 Implement category mapper (47+ French categories → 15-20 canonical)
- [ ] 4.1.3 Implement département resolver (column name → area_id)
- [ ] 4.1.4 Aggregate monthly data to yearly totals
- [ ] 4.1.5 Calculate rate_per_100k using INSEE population
- [ ] 4.1.6 Write loader with upsert logic (same source = replace)
- [ ] 4.1.7 Create dataset validation tests
- [ ] 4.1.8 Run full pipeline and verify row counts

### Dataset 2: Time Series (`datagouv-serieschrono.csv`)

- [ ] 4.2.1 Create time series CSV extractor (parse `Unite_temps` for year/month)
- [ ] 4.2.2 Map `Indicateur` + `Sous_indicateur` to canonical categories
- [ ] 4.2.3 Parse `Zone_geographique` to area_id
- [ ] 4.2.4 Aggregate monthly to yearly
- [ ] 4.2.5 Calculate rate_per_100k
- [ ] 4.2.6 Write loader with upsert logic
- [ ] 4.2.7 Validate against Dataset 1 for overlap periods
- [ ] 4.2.8 Document data quality notes

## Phase 5: Backend API (Read-Only)

- [x] 5.1 Create `AreasController` with GET endpoints
  - [x] 5.1.1 `GET /areas` (list départements, filter by région)
  - [x] 5.1.2 `GET /areas/:id` (with geometry)
- [x] 5.2 Create `CategoriesController`
  - [x] 5.2.1 `GET /categories` (list canonical categories)
- [x] 5.3 Create `ObservationsController`
  - [x] 5.3.1 `GET /observations` (query by area, category, year, source)
  - [x] 5.3.2 Add pagination support
  - [x] 5.3.3 Return both count and rate_per_100k
  - [x] 5.3.4 Add data_source metadata to response
- [x] 5.4 Create `ComparisonController`
  - [x] 5.4.1 `GET /compare/areas` (area A vs B for category/year/source)
  - [x] 5.4.2 `GET /compare/years` (year X vs Y for area/category/source)
  - [x] 5.4.3 `GET /compare/sources` (source A vs B for area/category/year)
- [x] 5.5 Add OpenAPI decorators to all endpoints
- [x] 5.6 Implement error handling middleware
- [x] 5.7 Add request validation (DTOs)
- [x] 5.8 Write API integration tests
- [x] 5.9 Generate Swagger UI

## Phase 6: Frontend Foundation

- [ ] 6.1 Initialize React project (Vite)
- [ ] 6.2 Install and configure RTK Query
- [ ] 6.3 Install Material-UI (MUI) and configure theme
- [ ] 6.4 Install Mapbox GL JS and configure token
- [ ] 6.5 Create basic layout (map container + MUI sidebar)
- [ ] 6.6 Generate RTK Query API slices from OpenAPI spec
- [ ] 6.7 Add error boundary and loading states
- [ ] 6.8 Set up Redux store with RTK Query middleware

## Phase 7: Map Visualization

- [ ] 7.1 Render Mapbox base map
- [ ] 7.2 Load admin area geometries as GeoJSON layer
- [ ] 7.3 Implement choropleth color scale (based on crime rate/count)
- [ ] 7.4 Add hover tooltips (area name + value)
- [ ] 7.5 Add click handler (select area)
- [ ] 7.6 Implement legend component (color scale + labels)
- [ ] 7.7 Add map controls (zoom, pan, reset)

## Phase 8: UI Controls

- [ ] 8.1 Build région/département selector (MUI Autocomplete)
- [ ] 8.2 Build crime category selector (MUI Select)
- [ ] 8.3 Build year range selector (MUI Slider)
- [ ] 8.4 Build data source selector (MUI Chip/Toggle)
- [ ] 8.5 Add count vs rate_per_100k toggle (MUI Switch)
- [ ] 8.6 Wire selectors to RTK Query hooks
- [ ] 8.7 Update map when selections change
- [ ] 8.8 Add loading indicators during data fetch (MUI Skeleton)

## Phase 9: Comparison Features

- [x] 9.1 Add "Compare" mode toggle in UI (MUI Tabs)
- [x] 9.2 Implement dual area selection (A vs B)
- [x] 9.3 Display comparison results (delta, percentage change)
- [x] 9.4 Implement year-over-year comparison for single area
- [x] 9.5 Implement source comparison (show discrepancies between datasets)
- [x] 9.6 Add basic chart visualization for comparisons (Recharts)
- [x] 9.7 Style comparison UI panel (MUI Cards)

## Phase 10: Testing & Validation

- [x] 10.1 Write Playwright MCP test: load map → select département → view data
- [x] 10.2 Write Playwright MCP test: compare two départements
- [x] 10.3 Write Playwright MCP test: toggle count vs rate display
- [x] 10.4 Verify all ETL pipelines produce expected row counts
- [x] 10.5 Cross-check sample values against original sources
- [x] 10.6 Validate category mappings (spot-check 5+ categories)
- [x] 10.7 Test spatial joins with real département polygons
- [x] 10.8 Performance test: query times for full dataset

## Phase 11: Documentation & Polish

- [x] 11.1 Document API endpoints with examples (Swagger + README)
- [x] 11.2 Create ETL runbook:
  - [x] How to add new French dataset
  - [x] How to re-run failed ETL jobs
  - [x] How to update population data
- [x] 11.4 Document known data gaps and limitations
- [ ] 11.6 Create demo video or screenshots (département choropleth) - SKIPPED (requires visual tools)
- [x] 11.7 Clean up console warnings and logs
- [x] 11.8 Document Mapbox Boundaries API research findings
