# BeWhere API Documentation

The BeWhere API provides read-only access to French crime statistics data. All data is normalized to a canonical schema enabling consistent analysis across 101 French départements.

## Base URL

```
http://localhost:3000
```

## Interactive Documentation

Swagger UI is available at:
```
http://localhost:3000/api/docs
```

## Authentication

No authentication required. The API is designed for local-first deployment.

## Response Format

All successful responses return JSON. List endpoints return paginated results with metadata.

### Standard List Response
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1920,
    "totalPages": 39,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": ["validation error details"],
  "error": "Bad Request"
}
```

---

## Endpoints

### Health Check

#### `GET /health`

Basic health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "service": "bewhere-api",
  "version": "0.1.0"
}
```

#### `GET /health/ready`

Readiness check including database connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "service": "bewhere-api",
  "version": "0.1.0",
  "checks": {
    "database": "ok",
    "postgis": "ok"
  }
}
```

---

### Administrative Areas

#### `GET /areas`

List administrative areas (départements, regions, countries).

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `level` | enum | Filter by level: `department`, `region`, `country` | - |
| `parentCode` | string | Filter by parent area code (e.g., region code) | - |
| `countryCode` | string | Filter by country (ISO 3166-1 alpha-2) | `FR` |

**Example Request:**
```bash
# Get all French départements
curl "http://localhost:3000/areas?level=department"

# Get départements in Île-de-France region
curl "http://localhost:3000/areas?parentCode=IDF"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "75",
      "name": "Paris",
      "nameEn": "Paris",
      "level": "department",
      "parentCode": "IDF",
      "countryCode": "FR",
      "areaKm2": 105.4
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "code": "92",
      "name": "Hauts-de-Seine",
      "nameEn": "Hauts-de-Seine",
      "level": "department",
      "parentCode": "IDF",
      "countryCode": "FR",
      "areaKm2": 176.0
    }
  ],
  "total": 101
}
```

#### `GET /areas/geojson`

Get areas as GeoJSON FeatureCollection (includes geometry).

**Query Parameters:** Same as `GET /areas`

**Example Request:**
```bash
curl "http://localhost:3000/areas/geojson?level=department"
```

**Example Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[2.22, 48.81], [2.47, 48.81], [2.47, 48.90], [2.22, 48.90], [2.22, 48.81]]]]
      },
      "properties": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "75",
        "name": "Paris",
        "level": "department"
      }
    }
  ]
}
```

#### `GET /areas/:id`

Get a single area by ID (includes geometry).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Area unique identifier |

**Example Request:**
```bash
curl "http://localhost:3000/areas/550e8400-e29b-41d4-a716-446655440000"
```

---

### Crime Categories

#### `GET /categories`

List canonical crime categories.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `severity` | enum | Filter by severity: `critical`, `high`, `medium`, `low` | - |
| `categoryGroup` | enum | Filter by group (see below) | - |
| `isActive` | boolean | Filter by active status | `true` |

**Category Groups:**
- `violent_crimes` - Homicide, assault, sexual offenses
- `property_crimes` - Burglary, theft, vandalism
- `drug_offenses` - Drug-related crimes
- `fraud_economic` - Fraud and economic crimes
- `public_order` - Public order offenses
- `traffic_offenses` - Road and traffic violations
- `other_crimes` - Other categories

**Example Request:**
```bash
# Get all categories
curl "http://localhost:3000/categories"

# Get high-severity violent crimes
curl "http://localhost:3000/categories?severity=high&categoryGroup=violent_crimes"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "code": "HOMICIDE",
      "name": "Homicide",
      "nameFr": "Homicide",
      "description": "Intentional killing including criminal settlements",
      "severity": "critical",
      "categoryGroup": "violent_crimes",
      "sortOrder": 1,
      "isActive": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "code": "ASSAULT",
      "name": "Assault",
      "nameFr": "Coups et blessures volontaires",
      "description": "Physical violence causing bodily harm",
      "severity": "high",
      "categoryGroup": "violent_crimes",
      "sortOrder": 2,
      "isActive": true
    }
  ],
  "total": 20
}
```

#### `GET /categories/:id`

Get a single category by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Category unique identifier |

---

### Crime Observations

#### `GET /observations`

Query crime observations with filtering and pagination.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `areaId` | UUID | Filter by area ID | - |
| `areaCode` | string | Filter by area code (e.g., `75` for Paris) | - |
| `categoryId` | UUID | Filter by category ID | - |
| `categoryCode` | string | Filter by category code (e.g., `HOMICIDE`) | - |
| `dataSourceId` | UUID | Filter by data source ID | - |
| `dataSourceCode` | string | Filter by data source code | - |
| `year` | integer | Filter by exact year | - |
| `yearFrom` | integer | Filter by start year (inclusive) | - |
| `yearTo` | integer | Filter by end year (inclusive) | - |
| `page` | integer | Page number (1-indexed) | `1` |
| `limit` | integer | Items per page (1-1000) | `50` |

**Example Requests:**
```bash
# Get all observations for Paris in 2023
curl "http://localhost:3000/observations?areaCode=75&year=2023"

# Get homicide observations for 2018-2023
curl "http://localhost:3000/observations?categoryCode=HOMICIDE&yearFrom=2018&yearTo=2023"

# Paginated results
curl "http://localhost:3000/observations?page=2&limit=100"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "area": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "75",
        "name": "Paris"
      },
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "code": "HOMICIDE",
        "name": "Homicide",
        "nameFr": "Homicide"
      },
      "dataSource": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "code": "ETAT4001_MONTHLY",
        "name": "État 4001 Monthly Snapshots"
      },
      "year": 2023,
      "month": null,
      "granularity": "yearly",
      "count": 67,
      "ratePer100k": 3.14,
      "populationUsed": 2133111
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### `GET /observations/:id`

Get a single observation by ID.

---

### Comparison Endpoints

#### `GET /compare/areas`

Compare crime statistics between two areas for a given year.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `areaCodeA` | string | ✓ | First area code |
| `areaCodeB` | string | ✓ | Second area code |
| `year` | integer | ✓ | Year to compare |
| `categoryCode` | string | | Specific category (all if omitted) |
| `dataSourceCode` | string | | Specific data source |

**Example Request:**
```bash
# Compare Paris (75) vs Marseille (13) in 2023
curl "http://localhost:3000/compare/areas?areaCodeA=75&areaCodeB=13&year=2023"

# Compare specific category
curl "http://localhost:3000/compare/areas?areaCodeA=75&areaCodeB=13&year=2023&categoryCode=BURGLARY_RESIDENTIAL"
```

**Example Response:**
```json
{
  "areaA": {
    "id": "...",
    "code": "75",
    "name": "Paris"
  },
  "areaB": {
    "id": "...",
    "code": "13",
    "name": "Bouches-du-Rhône"
  },
  "year": 2023,
  "dataSource": null,
  "comparisons": [
    {
      "category": {
        "id": "...",
        "code": "BURGLARY_RESIDENTIAL",
        "name": "Residential Burglary",
        "nameFr": "Cambriolages de résidence"
      },
      "countA": 15234,
      "countB": 12456,
      "rateA": 714.2,
      "rateB": 623.8,
      "countDiff": -2778,
      "rateDiff": -90.4,
      "countPctChange": -18.23,
      "ratePctChange": -12.66
    }
  ]
}
```

#### `GET /compare/years`

Compare crime statistics between two years for a given area.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `areaCode` | string | ✓ | Area code |
| `yearA` | integer | ✓ | First year |
| `yearB` | integer | ✓ | Second year |
| `categoryCode` | string | | Specific category (all if omitted) |
| `dataSourceCode` | string | | Specific data source |

**Example Request:**
```bash
# Year-over-year comparison for Paris
curl "http://localhost:3000/compare/years?areaCode=75&yearA=2022&yearB=2023"
```

**Example Response:**
```json
{
  "area": {
    "id": "...",
    "code": "75",
    "name": "Paris"
  },
  "yearA": 2022,
  "yearB": 2023,
  "dataSource": null,
  "comparisons": [
    {
      "category": {
        "id": "...",
        "code": "HOMICIDE",
        "name": "Homicide",
        "nameFr": "Homicide"
      },
      "countA": 72,
      "countB": 67,
      "rateA": 3.38,
      "rateB": 3.14,
      "countDiff": -5,
      "rateDiff": -0.24,
      "countPctChange": -6.94,
      "ratePctChange": -7.10
    }
  ]
}
```

#### `GET /compare/sources`

Compare crime statistics from two different data sources.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sourceCodeA` | string | ✓ | First data source code |
| `sourceCodeB` | string | ✓ | Second data source code |
| `areaCode` | string | ✓ | Area code |
| `year` | integer | ✓ | Year to compare |
| `categoryCode` | string | | Specific category (all if omitted) |

**Example Request:**
```bash
curl "http://localhost:3000/compare/sources?sourceCodeA=ETAT4001_MONTHLY&sourceCodeB=EUROSTAT&areaCode=75&year=2023"
```

---

## Data Types

### Admin Levels

| Value | Description |
|-------|-------------|
| `country` | Country level (France) |
| `region` | Region level (18 regions) |
| `department` | Department level (101 départements) |

### Crime Severity

| Value | Description |
|-------|-------------|
| `critical` | Most severe (homicide) |
| `high` | Serious crimes (assault, robbery) |
| `medium` | Moderate crimes (burglary, theft) |
| `low` | Minor offenses |

### Time Granularity

| Value | Description |
|-------|-------------|
| `yearly` | Annual aggregated data |
| `monthly` | Monthly data (month field populated) |

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

No rate limiting is applied for local deployment.

---

## Examples

### Get crime trends for a département

```bash
# Get all observations for Paris (75) from 2018-2023
curl "http://localhost:3000/observations?areaCode=75&yearFrom=2018&yearTo=2023" | jq

# Count observations
curl -s "http://localhost:3000/observations?areaCode=75" | jq '.meta.total'
```

### Build a choropleth map

```bash
# 1. Get GeoJSON geometries
curl "http://localhost:3000/areas/geojson?level=department" > areas.geojson

# 2. Get crime rates for a category and year
curl "http://localhost:3000/observations?categoryCode=BURGLARY_RESIDENTIAL&year=2023&limit=1000" > observations.json

# 3. Join by area code in your frontend
```

### Compare regions

```bash
# Compare Paris vs Lyon region (Rhône)
curl "http://localhost:3000/compare/areas?areaCodeA=75&areaCodeB=69&year=2023"
```

---

## See Also

- [Swagger UI](http://localhost:3000/api/docs) - Interactive API documentation
- [Crime Taxonomy](CRIME_TAXONOMY.md) - Canonical category definitions
- [Category Mappings](CATEGORY_MAPPINGS.md) - French to canonical mappings
- [Quick Start](QUICKSTART.md) - Getting started guide
