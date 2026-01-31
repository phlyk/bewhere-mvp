# BeWhere MVP Progress

Last Updated: February 1, 2026

---

## Current Phase

**Phase 0: Foundation & Research**

## Completed Tasks

**Planning Phase:**
- ✅ Created PLAN.md with MVP scope and architecture
- ✅ Created TASKS.md with granular implementation breakdown
- ✅ Created DESIGN_DECISIONS.md with finalized decisions
- ✅ Analyzed French data structure:
  - `datagouv-juin-2012-*.csv`: D\u00e9partement-level, 47+ crime categories, 111 rows
  - `datagouv-serieschrono.csv`: Time series, monthly data (2016+), 36,715 rows

**Phase 0 - Foundation & Research:**
- ✅ **Task 0.5**: Document French dataset structure → [docs/FRENCH_DATASETS.md](docs/FRENCH_DATASETS.md)
  - Documented État 4001 structure: 107 crime indices (95 active), 96 département columns
  - Documented Time Series structure: 15 columns, 36,716 rows, 2016-2025 coverage
  - Catalogued all crime category indices with French→English translations
  - Identified mapping strategy: État 4001 categories → canonical taxonomy
  - Documented ETL considerations (encoding, parsing, decimal handling)

---

## In Progress

_Task 0.1 (Define canonical taxonomy) ready to start_

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