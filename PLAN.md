# BeWhere MVP Plan

## What We're Building

A local-first GIS data exploration tool for comparing historic crime statistics across French administrative regions (départements).

**MVP Scope:** France only. Crime data. Read-heavy, analyst-style interface.

## Core Problem

Open crime data exists in wildly different formats, schemas, and administrative boundaries. France provides high-quality département-level data (NUTS-3), but it requires normalization from 47+ source categories into canonical taxonomy for consistent analysis.

## Solution Approach

### Data Model Philosophy

All crime datasets normalize to a single shape:
```
crime events → aggregated to → administrative polygons → over time
```

This abstraction handles diverse source formats while enabling consistent querying.

### Canonical Schema

1. **AdministrativeArea**: French départements (NUTS-3) + regions (NUTS-2) + country
2. **CrimeCategory**: 15-20 canonical categories mapped from 47+ source categories
3. **CrimeObservation**: Aggregated data per (area, category, year, **source**)
   - Stores BOTH `count` (raw total) AND `rate_per_100k` (calculated)
   - `data_source_id` enables multi-source comparison
4. **DataSource**: Metadata about each dataset (name, URL, update frequency)
5. **ETLRun**: Audit log (source URL, timestamp, row counts, errors)

⚠️ No raw event storage. Monthly data aggregated to yearly during ETL.

### Architecture

**Backend:**
- NestJS + TypeORM
- PostgreSQL + PostGIS
- OpenAPI/Swagger
- Read-only REST API

**Frontend:**
- React + Vite
- Redux Toolkit Query (RTK Query)
- Material-UI (MUI) components
- Mapbox GL JS
- Choropleth visualization
- Minimal UI: map + sidebar selectors

**Data Pipeline:**
- Batch ETL (Extract → Transform → Load)
- Idempotent, re-runnable
- Monthly source data aggregated to yearly
- Per-source storage (enables multi-source comparison)
- ETL run logging with source URLs for audit trail
- No streaming, no orchestration frameworks

**Deployment:**
- Docker Compose (api, db, etl)
- Local-first

## Testing Strategy

**Test requirements, not implementation.**

- ETL: Validate data integrity (row counts, category mappings, spatial joins)
- API: Contract testing (OpenAPI spec compliance)
- Frontend: Integration tests for user flows, not component internals - use the Playwright MCP `microsoft/playwright-mcp`
- E2E: Critical path only (select area → view data → compare)

## Spatial Simplifications

- All spatial joins happen during ETL (not at query time)
- French département boundaries (NUTS-3) from Mapbox API or data.gouv.fr
- Non-simplified geometries initially (evaluate performance)
- Population data per département per year (INSEE) for rate calculation
- Accept "good enough" over perfect spatial accuracy

## Explicitly Out of Scope

- Authentication / user accounts
- Real-time updates
- NLP / free-text search
- Time animations
- Predictive analytics
- Street-level granularity
