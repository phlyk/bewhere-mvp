# Mapbox Boundaries API Research

## Document Purpose

This document summarizes research conducted for the BeWhere MVP regarding Mapbox Boundaries API as a potential source for administrative boundary polygons. The research was performed to evaluate alternatives to storing geometries locally in PostGIS.

**Decision Summary:** geo.api.gouv.fr was chosen over Mapbox Boundaries API for the MVP.

---

## Table of Contents

1. [What is Mapbox Boundaries API?](#what-is-mapbox-boundaries-api)
2. [Comparison with geo.api.gouv.fr](#comparison-with-geoapigouvfr)
3. [Why geo.api.gouv.fr Was Chosen](#why-geoapigouvfr-was-chosen)
4. [When Mapbox Boundaries Might Be Useful](#when-mapbox-boundaries-might-be-useful)
5. [Technical Details](#technical-details)
6. [Cost Analysis](#cost-analysis)
7. [Recommendations for Future Expansion](#recommendations-for-future-expansion)

---

## What is Mapbox Boundaries API?

[Mapbox Boundaries](https://www.mapbox.com/boundaries) is a commercial product that provides ready-to-use administrative boundary polygons for global coverage. It's designed to integrate seamlessly with Mapbox GL JS and other Mapbox products.

### Key Features

| Feature | Description |
|---------|-------------|
| **Global Coverage** | Administrative boundaries for 200+ countries and territories |
| **Multiple Levels** | Admin levels 0-4 (country down to municipality/district) |
| **Tileset Integration** | Pre-built vector tiles optimized for Mapbox GL JS |
| **Metadata** | Includes names, ISO codes, and hierarchical relationships |
| **Polygon Lookup** | API to determine which boundary contains a given point |
| **Regular Updates** | Maintained and updated by Mapbox |

### Boundary Levels Relevant to France

| Level | French Equivalent | Count |
|-------|-------------------|-------|
| Admin 0 | Country (France) | 1 |
| Admin 1 | Régions | 18 |
| Admin 2 | Départements | 101 |
| Admin 3 | Arrondissements | ~330 |
| Admin 4 | Communes | ~35,000 |

### Access Methods

1. **Tileset Data** - Vector tiles served from Mapbox APIs for map rendering
2. **Lookup API** - Point-in-polygon queries via REST API
3. **Enterprise Downloads** - Static GeoJSON/Shapefile exports (Enterprise tier)

---

## Comparison with geo.api.gouv.fr

### geo.api.gouv.fr Overview

[geo.api.gouv.fr](https://geo.api.gouv.fr) is the official French government geographic API maintained by Etalab. It provides free access to administrative boundaries derived from IGN (Institut Géographique National) data.

### Feature Comparison

| Feature | Mapbox Boundaries | geo.api.gouv.fr |
|---------|-------------------|-----------------|
| **Cost** | Paid (usage-based) | Free (public API) |
| **Coverage** | Global (200+ countries) | France only |
| **Data Format** | Vector tiles + API | GeoJSON API |
| **Update Frequency** | Quarterly | Near real-time |
| **Auth Required** | Yes (Mapbox token) | No |
| **Rate Limits** | Based on plan | Liberal (no strict limits) |
| **License** | Commercial | Open License (Etalab) |
| **Offline Use** | Enterprise only | Freely downloadable |
| **Geometry Quality** | Optimized for rendering | IGN precision |
| **Metadata** | Names, ISO codes | Names, INSEE codes, population |
| **Historical Data** | No | No |

### API Response Comparison

**geo.api.gouv.fr (used in BeWhere):**
```bash
curl "https://geo.api.gouv.fr/departements?format=geojson&geometry=contour"
```

Response includes:
- `code` - INSEE département code (e.g., "75")
- `nom` - Name in French (e.g., "Paris")
- `geometry` - Full GeoJSON polygon/multipolygon
- `codeRegion` - Parent region code

**Mapbox Boundaries:**
```javascript
// Requires tileset ID and Mapbox token
map.addSource('boundaries', {
  type: 'vector',
  url: 'mapbox://mapbox.boundaries-adm2-v4'
});
```

Response includes:
- `iso_3166_2` - ISO subdivision code
- `name` - Localized name
- Pre-simplified geometries optimized for zoom levels

---

## Why geo.api.gouv.fr Was Chosen

### Primary Reasons

1. **Zero Cost for MVP**
   - geo.api.gouv.fr is completely free with no API key required
   - Mapbox Boundaries requires paid subscription (see [Cost Analysis](#cost-analysis))
   - Budget constraints for MVP development

2. **France-Specific Data Quality**
   - Official IGN source data (French national mapping agency)
   - INSEE codes align directly with crime data sources
   - No translation layer needed between boundary and statistical codes

3. **Simpler Architecture**
   - Direct GeoJSON download, cached locally in ETL
   - Stored in PostGIS for spatial queries (rate calculations, nearest neighbors)
   - No external API dependency at runtime

4. **Offline-First Design**
   - Boundaries stored in PostgreSQL, served from our own API
   - No network calls to external services during user sessions
   - Reduced latency and improved reliability

5. **License Compatibility**
   - Etalab Open License is permissive for any use
   - No restrictions on redistribution or modification
   - Clear data provenance chain

### Secondary Considerations

- **Learning Exercise**: Storing and serving geometries from PostGIS was a project learning goal
- **ETL Simplicity**: Single GeoJSON file download vs. tileset integration
- **Future Flexibility**: Own our data, can switch providers without architectural changes

---

## When Mapbox Boundaries Might Be Useful

### Future Expansion Scenarios

1. **European Expansion**
   - Adding Germany, Spain, UK, Italy, etc.
   - Mapbox Boundaries provides consistent NUTS-3 level data across EU
   - Avoid sourcing country-specific APIs (each with different formats)

2. **Global Coverage**
   - If expanding beyond Europe to North America, Asia, etc.
   - Single API for all countries simplifies ETL

3. **High-Frequency Updates**
   - If boundaries change frequently (e.g., electoral districts)
   - Mapbox maintains updates automatically

4. **Performance at Scale**
   - 35,000+ French communes would strain GeoJSON approach
   - Mapbox vector tiles are optimized for rendering at any zoom level

5. **Point-in-Polygon Lookups**
   - Real-time reverse geocoding ("What département is this coordinate in?")
   - Mapbox Tilequery API handles this natively

### Recommended Evaluation Triggers

Consider re-evaluating Mapbox Boundaries when:
- Adding 3+ additional countries to coverage
- Needing admin levels below département (arrondissements, communes)
- Supporting real-time location-based queries
- Frontend performance issues with large GeoJSON payloads

---

## Technical Details

### Current Implementation (geo.api.gouv.fr)

```
ETL Pipeline (departements.extractor.ts)
    ↓
Download GeoJSON from geo.api.gouv.fr
    ↓
Parse and validate features (101 départements)
    ↓
Transform to PostGIS MultiPolygon (SRID 4326)
    ↓
Store in administrative_areas table
    ↓
Serve via /areas/geojson endpoint
    ↓
Render in Mapbox GL JS as GeoJSON source
```

**File:** [etl/src/pipelines/departements/departements.extractor.ts](../etl/src/pipelines/departements/departements.extractor.ts)

**GeoJSON Source URLs Available:**

| Source | URL | Notes |
|--------|-----|-------|
| geo.api.gouv.fr | `https://geo.api.gouv.fr/departements?format=geojson&geometry=contour` | Primary (simplified) |
| Etalab GitHub | `https://raw.githubusercontent.com/etalab/decoupage-administratif/master/data/departements.geojson` | Full resolution |
| OpenDataSoft | `https://public.opendatasoft.com/api/.../exports/geojson` | Alternative |

### Hypothetical Mapbox Integration

If Mapbox Boundaries were used, the architecture would differ:

```
Frontend (MapContainer.tsx)
    ↓
Add Mapbox Boundaries tileset as source
    ↓
Style layer with choropleth colors
    ↓
Query Mapbox API for boundary metadata
    ↓
Join with our crime data by ISO code
```

**Key Changes Required:**
- Remove PostGIS geometry storage (or keep as backup)
- Add Mapbox tileset layer to frontend
- Map ISO 3166-2 codes ↔ INSEE département codes
- Handle Mapbox token scoping for Boundaries access

---

## Cost Analysis

### geo.api.gouv.fr Costs

| Item | Cost |
|------|------|
| API Access | Free |
| Data Download | Free |
| Redistribution | Free |
| **Total MVP Cost** | **€0** |

### Mapbox Boundaries Pricing (as of 2025)

Mapbox Boundaries is sold separately from standard Mapbox services:

| Tier | Monthly Cost | Included |
|------|--------------|----------|
| Starter | Contact sales | Limited countries |
| Growth | Contact sales | More countries, higher limits |
| Enterprise | Custom | Full data exports, SLA |

**Notes:**
- Pricing is not publicly disclosed; requires sales contact
- Typically starts at $500-1,500/month for small applications
- Enterprise tier (with GeoJSON exports) significantly higher
- Costs scale with map loads and API requests

### Cost Comparison for MVP

| Scenario | geo.api.gouv.fr | Mapbox Boundaries |
|----------|-----------------|-------------------|
| France only, 101 boundaries | €0 | ~$500-1,500/mo |
| 1 year MVP development | €0 | ~$6,000-18,000 |
| European expansion (10 countries) | ~€0* | ~$1,500-3,000/mo |

*Would require sourcing free APIs for each country (varies in difficulty)

---

## Recommendations for Future Expansion

### Short-Term (France MVP)

✅ **Continue with geo.api.gouv.fr**
- Already implemented and working
- Zero cost, excellent data quality
- Fits MVP requirements perfectly

### Medium-Term (European Expansion)

**If adding 2-3 countries:**
- Source country-specific APIs (similar to geo.api.gouv.fr approach)
- UK: ONS Geography API (free)
- Germany: BKG open data (free)
- Spain: IGN España (free)

**If adding 5+ countries:**
- Re-evaluate Mapbox Boundaries for consistency
- Calculate TCO vs. integration cost of multiple APIs
- Consider hybrid: Mapbox for rendering, own data for analytics

### Long-Term (Global Platform)

**Consider Mapbox Boundaries when:**
- Expanding beyond Europe
- Revenue justifies subscription cost
- Need commune/municipality-level granularity
- Building real-time location features

**Alternative Global Sources to Evaluate:**
- GADM (free, global admin boundaries)
- Natural Earth (free, simplified)
- OpenStreetMap (free, varying quality)
- Eurostat GISCO (free, EU only)

---

## References

### Official Documentation
- [Mapbox Boundaries](https://www.mapbox.com/boundaries)
- [Mapbox Boundaries Documentation](https://docs.mapbox.com/data/boundaries/)
- [geo.api.gouv.fr](https://geo.api.gouv.fr)
- [Etalab Open License](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)

### Related Project Files
- [DESIGN_DECISIONS.md](../DESIGN_DECISIONS.md) - Section 8: Geometry Simplification
- [departements.extractor.ts](../etl/src/pipelines/departements/departements.extractor.ts) - Current implementation
- [ETL_RUNBOOK.md](ETL_RUNBOOK.md) - Département pipeline documentation

### Alternative Data Sources Considered
- [GADM - Global Administrative Areas](https://gadm.org/)
- [Natural Earth](https://www.naturalearthdata.com/)
- [Eurostat GISCO](https://ec.europa.eu/eurostat/web/gisco)

---

*Last Updated: February 1, 2026*
*Research conducted for BeWhere MVP, Phase 0 and Phase 11*
