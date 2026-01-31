# BeWhere MVP Design Decisions

## Status: ✅ Finalized

This document tracks design decisions made for the MVP implementation.

---

## 1. Target Countries & Datasets

**Decision:** France only for MVP

**Rationale:**
- French data.gouv.fr provides highest quality data (département-level granularity)
- Monthly time series data available (aggregate to yearly)
- Rich category breakdown (47+ categories in source data)
- Well-structured CSV format

**Primary Datasets:**
- `datagouv-juin-2012-*.csv` - Département-level monthly snapshots
- `datagouv-serieschrono.csv` - Time series data (2016-present)

**Future Expansion:** UK, EU-wide datasets after MVP validation

---

## 2. Canonical Crime Category Taxonomy

**Decision:** Medium granularity (15-20 categories)

**Canonical Categories:**
1. Homicide & Manslaughter
2. Assault & Battery
3. Sexual Offenses
4. Kidnapping & Sequestration
5. Threats & Extortion
6. Armed Robbery
7. Burglary (Residential)
8. Burglary (Commercial)
9. Vehicle Theft
10. Theft from Vehicles
11. Pickpocketing
12. Shoplifting
13. Other Theft
14. Fraud & Financial Crime
15. Drug Offenses
16. Vandalism & Property Damage
17. Cybercrime
18. Other Offenses

**Mapping Strategy:** Create `category_mappings` table to map 47+ French categories → 15-20 canonical

---

## 3. Administrative Boundary Levels

**Decision:** NUTS-3 level (French départements) + Country

**Supported Levels:**
- Country: France (NUTS-0)
- Région: French regions (NUTS-2) - optional aggregation
- Département: French départements (NUTS-3) - **primary granularity**

**Admin Boundary Source:**
- Research Mapbox Boundaries API for on-the-fly storage
- Fallback: French government GeoJSON files (data.gouv.fr)
- 96 départements in metropolitan France + 5 overseas

**Note:** NUTS-1 data considered too coarse; prefer département-level precision

---

## 4. Population Data for Rate Calculation

**Decision:** Store BOTH total counts AND rates per 100k

**Schema Updates:**
- `crime_observations` table includes:
  - `count` (raw total)
  - `rate_per_100k` (calculated)
- `administrative_areas` table includes:
  - `population` (by year via separate table)

**Data Normalization:**
- Some datasets provide totals only → calculate rate using population
- Some datasets provide per 1k → convert to per 100k
- Store both values for user preference

**Population Source:** INSEE (French national statistics) - annual département populations

---

## 5. Time Range for MVP

**Decision:** Maximum available history (2016+ for French data, potentially back to 1950s for aggregated data)

**Temporal Granularity:**
- **Source data:** Monthly (French datasets)
- **Stored data:** Yearly aggregates ONLY
- Monthly data aggregated during ETL transform stage

**Implementation:**
- Load all available years per dataset
- Focus on completeness over speed for MVP
- ETL can be re-run incrementally for updates

---

## 6. ETL Execution Model

**Decision:** Manual CLI scripts

**Execution:**
- Per-dataset scripts: `npm run etl:france-monthly`
- Orchestrated option: `npm run etl:all`

**ETL Run Logging:**
- Create `etl_runs` table with:
  - `id`, `dataset_name`, `source_url`, `started_at`, `completed_at`, `status`, `rows_processed`, `errors`
- Store original data URL for debugging/re-running
- Enable audit trail for data provenance

---

## 7. Frontend Framework Details

**Decision:** RTK Query + MUI

**Stack:**
- **State Management:** Redux Toolkit Query (RTK Query) for API calls and caching
- **Component Library:** Material-UI (MUI) for UI components
- **Map:** Mapbox GL JS for geospatial visualization

**Rationale:** Familiarity and proven patterns for data-heavy applications

---

## 8. Geometry Simplification

**Decision:** Store non-simplified geometries initially

**Rationale:**
- MVP = learning exercise for GIS performance
- Observe real-world performance bottlenecks before optimizing
- Can add simplification later if needed

**Admin Boundary Source (TO RESEARCH):**
- **Primary:** Investigate Mapbox Boundaries API for on-demand polygon storage
- **Fallback:** French government GeoJSON files (IGN/data.gouv.fr)
- Document findings in PROGRESS.md

---

## 9. Data Versioning & Updates

**Decision:** Per-source storage with same-source replacement

**Schema Changes:**
- Add `data_source_id` to `crime_observations` table
- Multiple sources can have different values for same (area, category, year)
- Enables comparison of source discrepancies (e.g., EU data vs French data for same region)

**Update Behavior:**
- Same source + newer data → REPLACE old data
- Different source + same coverage → KEEP both (multi-source comparison)

**ETL Logging:**
- `etl_runs` table tracks:
  - `source_url` - original data URL for re-runs/debugging
  - `loaded_at` - timestamp of ETL execution
  - `row_count` - validation metric

---

## 10. Testing Coverage Targets

**Decision:** Critical path + data validation tests

**Test Requirements:**
- **ETL:** Row count validation, category mapping integrity, spatial join correctness
- **API:** OpenAPI spec compliance (contract testing)
- **Frontend:** Playwright MCP for integration tests (user flows)
- **E2E:** Critical paths only:
  1. Load map → select area → view data
  2. Compare two areas
  3. Year-over-year comparison

**Philosophy:** Test requirements, not implementation
