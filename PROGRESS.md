# BeWhere MVP Progress

Last Updated: January 31, 2026

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

---

## In Progress

_Phase 0 tasks starting next_

---

## Blockers

_No blockers_

---

## Research Findings

### French Data Structure

**Dataset 1: D\u00e9partement Monthly Snapshots** (`datagouv-juin-2012-*.csv`)
- Columns: D\u00e9partement names as headers (Ain, Aisne, Allier, etc.)
- Rows: 47+ crime categories (R\u00e8glements de compte, Homicides, Vols, etc.)
- Granularity: Monthly snapshots, country-wide coverage
- Encoding: Latin-1 (accented characters)

**Dataset 2: Time Series** (`datagouv-serieschrono.csv`)
- Columns: `Valeurs`, `Unite_temps` (YYYYMXX format), `Indicateur`, `Sous_indicateur`, `Zone_geographique`
- Rows: 36k+ time series entries
- Granularity: Monthly, France-wide aggregates
- Note: "CVS-CJO" = seasonally adjusted data

### Action Items from Research
- [ ] Investigate Mapbox Boundaries API for French d\u00e9partement polygons
- [ ] Source INSEE population data (d\u00e9partement-level, yearly 2016-2025)
- [ ] Determine if `datagouv-serieschrono.csv` provides d\u00e9partement breakdowns or only national totals

---

## Notes

<!-- - Use this file to track high-level progress
- Update after completing each phase or significant milestone
- Sub-agents should add notes about decisions made during implementation
- Keep entries brief and factual -->


- France-only MVP provides highest data quality (d\u00e9partement-level)
- Will need robust encoding handling (Latin-1 \u2192 UTF-8)
- Monthly \u2192 yearly aggregation required in ETL transform stage
- Category mapping will be key challenge (47+ \u2192 15-20 canonical)