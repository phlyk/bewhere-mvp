# BeWhere MVP Tasks

## Phase 0: Foundation & Research

- [ ] 0.1 Define canonical crime category taxonomy (15-20 categories)
- [ ] 0.2 Map French crime categories (47+) to canonical taxonomy
- [ ] 0.3 Source French département boundary data (Mapbox API or data.gouv.fr GeoJSON)
- [ ] 0.4 Source INSEE population data (département-level, yearly)
- [ ] 0.5 Document French dataset structure (`datagouv-juin-2012-*.csv`, `datagouv-serieschrono.csv`)
- [ ] 0.6 Research Mapbox Boundaries API for admin polygon storage

## Phase 1: Infrastructure Setup

- [ ] 1.1 Initialize Docker Compose with postgres:16-postgis service
- [ ] 1.2 Create NestJS project scaffold
- [ ] 1.3 Configure TypeORM with PostGIS types
- [ ] 1.4 Set up separate `etl/` directory structure
- [ ] 1.5 Configure environment variables (.env.example)
- [ ] 1.6 Write README with setup instructions

## Phase 2: Database Schema

- [ ] 2.1 Create `administrative_areas` table with PostGIS geometry column
- [ ] 2.2 Create `population` table (area_id, year, population_count)
- [ ] 2.3 Create `crime_categories` table with canonical names
- [ ] 2.4 Create `data_sources` table (name, url, description, update_frequency)
- [ ] 2.5 Create `crime_observations` table with foreign keys (includes data_source_id, count, rate_per_100k)
- [ ] 2.6 Create `category_mappings` table (data_source_id, source_category, canonical_category_id)
- [ ] 2.7 Create `etl_runs` table (dataset_name, source_url, started_at, completed_at, status, rows_processed, errors)
- [ ] 2.8 Add spatial indexes on geometry columns
- [ ] 2.9 Add composite indexes on (area_id, category_id, year, data_source_id)
- [ ] 2.10 Seed canonical crime categories (15-20 categories)
- [ ] 2.11 Write schema migration tests

## Phase 3: ETL Pipeline (Template)

- [ ] 3.1 Create base ETL classes (Extractor, Transformer, Loader)
- [ ] 3.2 Implement file download utility with caching
- [ ] 3.3 Implement French département geometry loader (GeoJSON → PostGIS)
- [ ] 3.4 Implement INSEE population data loader (département + year)
- [ ] 3.5 Implement monthly-to-yearly aggregation utility
- [ ] 3.6 Implement rate_per_100k calculation utility (count / population * 100000)
- [ ] 3.7 Create validation utility (row counts, sanity checks)
- [ ] 3.8 Create ETL run logger (records to `etl_runs` table)
- [ ] 3.9 Write ETL logging/reporting formatter
- [ ] 3.10 Document ETL contract (required methods per dataset)

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

- [ ] 5.1 Create `AreasController` with GET endpoints
  - [ ] 5.1.1 `GET /areas` (list départements, filter by région)
  - [ ] 5.1.2 `GET /areas/:id` (with geometry)
- [ ] 5.2 Create `CategoriesController`
  - [ ] 5.2.1 `GET /categories` (list canonical categories)
- [ ] 5.3 Create `ObservationsController`
  - [ ] 5.3.1 `GET /observations` (query by area, category, year, source)
  - [ ] 5.3.2 Add pagination support
  - [ ] 5.3.3 Return both count and rate_per_100k
  - [ ] 5.3.4 Add data_source metadata to response
- [ ] 5.4 Create `ComparisonController`
  - [ ] 5.4.1 `GET /compare/areas` (area A vs B for category/year/source)
  - [ ] 5.4.2 `GET /compare/years` (year X vs Y for area/category/source)
  - [ ] 5.4.3 `GET /compare/sources` (source A vs B for area/category/year)
- [ ] 5.5 Add OpenAPI decorators to all endpoints
- [ ] 5.6 Implement error handling middleware
- [ ] 5.7 Add request validation (DTOs)
- [ ] 5.8 Write API integration tests
- [ ] 5.9 Generate Swagger UI

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

- [ ] 9.1 Add "Compare" mode toggle in UI (MUI Tabs)
- [ ] 9.2 Implement dual area selection (A vs B)
- [ ] 9.3 Display comparison results (delta, percentage change)
- [ ] 9.4 Implement year-over-year comparison for single area
- [ ] 9.5 Implement source comparison (show discrepancies between datasets)
- [ ] 9.6 Add basic chart visualization for comparisons (Chart.js or Recharts)
- [ ] 9.7 Style comparison UI panel (MUI Cards)

## Phase 10: Testing & Validation

- [ ] 10.1 Write Playwright MCP test: load map → select département → view data
- [ ] 10.2 Write Playwright MCP test: compare two départements
- [ ] 10.3 Write Playwright MCP test: toggle count vs rate display
- [ ] 10.4 Verify all ETL pipelines produce expected row counts
- [ ] 10.5 Cross-check sample values against original sources
- [ ] 10.6 Validate category mappings (spot-check 5+ categories)
- [ ] 10.7 Test spatial joins with real département polygons
- [ ] 10.8 Performance test: query times for full dataset

## Phase 11: Documentation & Polish

- [ ] 11.1 Document API endpoints with examples (Swagger + README)
- [ ] 11.2 Create ETL runbook:
  - [ ] How to add new French dataset
  - [ ] How to re-run failed ETL jobs
  - [ ] How to update population data
- [ ] 11.3 Document French category mappings (47+ → 15-20)
- [ ] 11.4 Document known data gaps and limitations
- [ ] 11.5 Add docker-compose quick start guide
- [ ] 11.6 Create demo video or screenshots (département choropleth)
- [ ] 11.7 Clean up console warnings and logs
- [ ] 11.8 Document Mapbox Boundaries API research findings
