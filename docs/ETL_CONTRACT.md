# ETL Contract Specification

> Task 3.10: Document ETL contract (required methods per dataset)

This document defines the contract that all ETL pipeline implementations must follow. It provides the required interfaces, methods, and patterns for developing new data pipelines in BeWhere.

---

## Architecture Overview

The BeWhere ETL system follows a classic **Extract-Transform-Load** pattern with four core components:

```
┌─────────────┐    ┌───────────────┐    ┌────────────┐    ┌────────────────┐
│  Extractor  │───►│  Transformer  │───►│   Loader   │───►│   Database     │
│  (source)   │    │  (normalize)  │    │  (upsert)  │    │   (PostGIS)    │
└─────────────┘    └───────────────┘    └────────────┘    └────────────────┘
       │                   │                  │                    │
       └───────────────────┴──────────────────┴────────────────────┘
                                    │
                              ┌─────▼─────┐
                              │  Pipeline │  (orchestration + logging)
                              └───────────┘
```

### Component Responsibilities

| Component | Responsibility | Input | Output |
|-----------|---------------|-------|--------|
| **Extractor** | Download/read source data, parse format, validate structure | URL or file path | `ExtractionResult<TRaw>` |
| **Transformer** | Map to canonical schema, resolve foreign keys, calculate derived fields | Raw data array | `TransformationResult<TTransformed>` |
| **Loader** | Insert/upsert to database, handle conflicts, batch operations | Transformed data | `LoadResult` |
| **Pipeline** | Orchestrate ETL stages, track run status, handle errors | Options | `PipelineResult` |

---

## Base Class Contracts

### 1. BaseExtractor<TRaw>

**File:** `etl/src/core/extractor.ts`

Every extractor must extend `BaseExtractor<TRaw>` and implement these abstract methods:

```typescript
abstract class BaseExtractor<TRaw> {
  // REQUIRED: Extract data from source
  abstract extract(): Promise<ExtractionResult<TRaw>>;

  // REQUIRED: Validate source before extraction
  abstract validate(): Promise<boolean>;
}
```

#### Required Method: `extract()`

**Purpose:** Download/read and parse the source data.

**Returns:** `ExtractionResult<TRaw>`

```typescript
interface ExtractionResult<T> {
  data: T[];              // Extracted data rows
  source: string;         // Source URL or file path
  rowCount: number;       // Number of rows extracted
  extractedAt: Date;      // Extraction timestamp
  warnings: string[];     // Any warnings during extraction
  encoding?: string;      // Source file encoding (if applicable)
}
```

**Responsibilities:**
- Download from URL or read local file
- Handle file encoding (Latin-1 for French government data)
- Parse file format (CSV, JSON, GeoJSON, XML)
- Validate structure (required columns, minimum rows)
- Generate warnings for anomalies

#### Required Method: `validate()`

**Purpose:** Pre-validate the source before extraction.

**Returns:** `boolean` - `true` if source is valid and accessible

**Responsibilities:**
- Check file exists (for local files)
- Verify URL is accessible (for remote sources)
- Validate file size is reasonable
- Check file format/extension

---

### 2. BaseTransformer<TRaw, TTransformed>

**File:** `etl/src/core/transformer.ts`

Every transformer must extend `BaseTransformer<TRaw, TTransformed>` and implement:

```typescript
abstract class BaseTransformer<TRaw, TTransformed> {
  // REQUIRED: Transform a single row
  protected abstract transformRow(row: TRaw, index: number): Promise<TTransformed | null>;

  // REQUIRED: Validate transformer configuration
  abstract validate(): Promise<boolean>;

  // PROVIDED: Batch transform (calls transformRow for each row)
  async transform(rawData: TRaw[]): Promise<TransformationResult<TTransformed>>;
}
```

#### Required Method: `transformRow()`

**Purpose:** Transform a single raw record to the target format.

**Parameters:**
- `row: TRaw` - Raw data row from extractor
- `index: number` - Row index (0-based) for error reporting

**Returns:** `TTransformed | null` - Transformed record, or `null` to skip

**Responsibilities:**
- Map source fields to target schema
- Resolve foreign keys (département → area_id, source category → canonical category)
- Calculate derived fields (rate_per_100k)
- Validate data integrity
- Return `null` to skip invalid rows

#### Required Method: `validate()`

**Purpose:** Validate transformer configuration and dependencies.

**Returns:** `boolean` - `true` if transformer is properly configured

**Responsibilities:**
- Verify lookup tables are loaded (category mappings, area IDs)
- Check database connection (if needed for FK lookups)
- Validate configuration options

---

### 3. BaseLoader<T>

**File:** `etl/src/core/loader.ts`

Every loader must extend `BaseLoader<T>` and implement:

```typescript
abstract class BaseLoader<T> {
  // REQUIRED: Load a batch of data
  protected abstract loadBatch(
    queryRunner: QueryRunner,
    batch: T[],
    startIndex: number,
  ): Promise<{ inserted: number; updated: number; skipped: number }>;

  // REQUIRED: Build INSERT column values
  protected abstract buildInsertValues(row: T): Record<string, unknown>;

  // REQUIRED: Validate loader configuration
  abstract validate(): Promise<boolean>;

  // PROVIDED: Load all data with batching and transactions
  async load(data: T[]): Promise<LoadResult>;
}
```

#### Required Method: `loadBatch()`

**Purpose:** Load a batch of records into the database.

**Parameters:**
- `queryRunner: QueryRunner` - TypeORM query runner (for transactions)
- `batch: T[]` - Batch of transformed records
- `startIndex: number` - Starting index for error reporting

**Returns:** `{ inserted: number; updated: number; skipped: number }`

**Responsibilities:**
- Build INSERT/UPSERT queries
- Execute within transaction
- Handle conflicts (ON CONFLICT DO UPDATE)
- Count inserted/updated/skipped rows

#### Required Method: `buildInsertValues()`

**Purpose:** Build column values for INSERT statement.

**Returns:** `Record<string, unknown>` - Column name → value mapping

**Responsibilities:**
- Map record properties to database columns
- Handle null/undefined values
- Convert TypeScript types to PostgreSQL types
- Handle geometry columns (for spatial data)

---

### 4. BasePipeline<TRaw, TTransformed>

**File:** `etl/src/core/pipeline.ts`

Every pipeline must extend `BasePipeline<TRaw, TTransformed>` and implement:

```typescript
abstract class BasePipeline<TRaw, TTransformed> {
  // REQUIRED: Initialize pipeline components
  protected abstract initialize(): Promise<void>;

  // REQUIRED: Get data source ID for run tracking
  protected abstract getDataSourceId(): string | undefined;

  // REQUIRED: Get source URL being processed
  protected abstract getSourceUrl(): string;

  // PROVIDED: Run the complete ETL pipeline
  async run(options?: PipelineOptions): Promise<PipelineResult>;

  // PROVIDED: Validate all components
  async validate(): Promise<boolean>;
}
```

#### Required Method: `initialize()`

**Purpose:** Create and configure extractor, transformer, and loader instances.

**Responsibilities:**
- Instantiate `this.extractor` with appropriate options
- Instantiate `this.transformer` with database connection (if needed)
- Instantiate `this.loader` with target table configuration

```typescript
protected async initialize(): Promise<void> {
  this.extractor = new MyExtractor(extractorOptions);
  this.transformer = new MyTransformer(this.dataSource, transformerOptions);
  this.loader = new MyLoader(this.dataSource, loaderOptions);
}
```

#### Required Method: `getDataSourceId()`

**Purpose:** Return the UUID of the `data_sources` table record for this pipeline.

**Returns:** `string | undefined` - Data source ID, or `undefined` if not yet seeded

**Usage:** Used by `EtlRunLogger` to track ETL runs by data source.

#### Required Method: `getSourceUrl()`

**Purpose:** Return the URL/path being processed.

**Returns:** `string` - Source URL for run tracking and logging

---

## Pipeline Implementation Checklist

When implementing a new ETL pipeline, complete these steps:

### Step 1: Define Types (`pipeline.types.ts`)

```typescript
// Raw data structure from source
export interface MyRawRecord {
  // Fields as they appear in the source file
}

// Transformed record for database
export interface MyRecord {
  // Fields matching the target table schema
}

// Expected counts for validation
export const EXPECTED_COUNTS = {
  minRows: 100,
  maxRows: 50000,
};
```

### Step 2: Implement Extractor (`pipeline.extractor.ts`)

```typescript
export class MyExtractor extends BaseExtractor<MyRawRecord> {
  async extract(): Promise<ExtractionResult<MyRawRecord>> {
    // 1. Download/read source file
    // 2. Parse content (CSV, JSON, etc.)
    // 3. Validate structure
    // 4. Return extraction result
  }

  async validate(): Promise<boolean> {
    // 1. Check source accessibility
    // 2. Validate file format
    return true;
  }
}
```

### Step 3: Implement Transformer (`pipeline.transformer.ts`)

```typescript
export class MyTransformer extends BaseTransformer<MyRawRecord, MyRecord> {
  protected async transformRow(row: MyRawRecord, index: number): Promise<MyRecord | null> {
    // 1. Map source fields to target fields
    // 2. Resolve foreign keys
    // 3. Calculate derived values
    // 4. Return transformed record (or null to skip)
  }

  async validate(): Promise<boolean> {
    // 1. Verify lookup tables are loaded
    // 2. Check database connection
    return true;
  }
}
```

### Step 4: Implement Loader (`pipeline.loader.ts`)

```typescript
export class MyLoader extends BaseLoader<MyRecord> {
  protected async loadBatch(
    queryRunner: QueryRunner,
    batch: MyRecord[],
    startIndex: number,
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    // 1. Build INSERT/UPSERT query
    // 2. Execute query
    // 3. Return counts
  }

  protected buildInsertValues(row: MyRecord): Record<string, unknown> {
    return {
      column_name: row.property,
      // ...
    };
  }

  async validate(): Promise<boolean> {
    // 1. Check table exists
    // 2. Verify column types match
    return true;
  }
}
```

### Step 5: Implement Pipeline (`pipeline.pipeline.ts`)

```typescript
export class MyPipeline extends BasePipeline<MyRawRecord, MyRecord> {
  protected async initialize(): Promise<void> {
    this.extractor = new MyExtractor(options);
    this.transformer = new MyTransformer(this.dataSource);
    this.loader = new MyLoader(this.dataSource, loaderOptions);
  }

  protected getDataSourceId(): string | undefined {
    return this.dataSourceId;
  }

  protected getSourceUrl(): string {
    return this.options.sourceUrl;
  }
}
```

### Step 6: Write Tests

Each component should have unit tests:
- `pipeline.extractor.spec.ts` - Test parsing, encoding handling
- `pipeline.transformer.spec.ts` - Test mappings, FK resolution
- `pipeline.loader.spec.ts` - Test upsert logic, conflict handling
- `pipeline.pipeline.spec.ts` - Integration test with mock data

---

## Dataset-Specific Requirements

### French Crime Data (État 4001)

**Tasks:** 4.1.1-4.1.8

| Component | Requirements |
|-----------|-------------|
| **Extractor** | Handle Latin-1 encoding, semicolon CSV delimiter, skip 2 header rows, parse 96 département columns |
| **Transformer** | Map 95 active indices → 20 canonical categories, resolve département names → area_id, skip unused indices (96, 97, 99, 100) |
| **Loader** | Upsert to `crime_observations`, conflict on (area_id, category_id, data_source_id, year, month) |

**Required Mappings:**
- `ETAT4001_INDEX_TO_CANONICAL` - 95 indices → 20 categories (see [CATEGORY_MAPPINGS.md](CATEGORY_MAPPINGS.md))
- `DEPARTEMENT_NAME_TO_CODE` - Column headers → département codes (see [france-monthly.types.ts](../etl/src/pipelines/france-monthly/france-monthly.types.ts))

### Time Series Data (Séries Chronologiques)

**Tasks:** 4.2.1-4.2.8

| Component | Requirements |
|-----------|-------------|
| **Extractor** | Parse `Unite_temps` for year/month, handle UTF-8 encoding, comma CSV delimiter |
| **Transformer** | Map `Indicateur` + `Sous_indicateur` → canonical category, parse `Zone_geographique` → area_id |
| **Loader** | Same as État 4001, aggregate monthly → yearly if needed |

### Département Geometries

**Status:** ✅ Complete

**Reference implementation:** `etl/src/pipelines/departements/`

### Population Data (INSEE)

**Status:** ✅ Complete

**Reference implementation:** `etl/src/pipelines/population/`

---

## Utility Functions

All pipelines should use these shared utilities:

### File Download (`utils/download.ts`)

```typescript
import { downloadFile } from '../utils/download';

const result = await downloadFile(url, { timeout: 60000 });
// result.filePath - Local cached file path
// result.fromCache - Whether file was cached
```

### Aggregation (`utils/aggregation.ts`)

```typescript
import { aggregateMonthlyToYearly, AggregationStrategy } from '../utils/aggregation';

const yearly = aggregateMonthlyToYearly(monthlyRecords, {
  strategy: AggregationStrategy.SUM,
  minMonthsRequired: 6,
  extrapolatePartialYears: false,
});
```

### Rate Calculation (`utils/rate-calculator.ts`)

```typescript
import { calculateRatePer100k } from '../utils/rate-calculator';

const rate = calculateRatePer100k(crimeCount, population);
// Returns rate with 4 decimal places
```

### Validation (`utils/validation.ts`)

```typescript
import { validateRowCount, validateRequiredFields } from '../utils/validation';

const result = validateRowCount(actual, expected, 0.1); // 10% tolerance
// result.isValid, result.errors, result.warnings
```

### ETL Run Logging (`utils/etl-run-logger.ts`)

Run tracking is handled automatically by `BasePipeline` when a `dataSourceId` is provided. The logger records:

- Start/end timestamps
- Rows extracted/transformed/loaded/skipped
- Errors and warnings
- Pipeline status (completed, completed_with_warnings, failed)

---

## Error Handling

### Extractor Errors

| Error Type | Handling |
|-----------|----------|
| Network timeout | Retry with exponential backoff |
| File not found | Throw error (fatal) |
| Invalid encoding | Log warning, try UTF-8 fallback |
| Malformed CSV | Skip row, add to warnings |

### Transformer Errors

| Error Type | Handling |
|-----------|----------|
| Missing required field | Skip row, log error |
| Invalid value | Skip row, log error |
| Unknown category | Skip row, log warning |
| Missing FK reference | Skip row, log error |

### Loader Errors

| Error Type | Handling |
|-----------|----------|
| Constraint violation | Rollback transaction, throw error |
| Duplicate key (upsert) | Update existing record |
| Invalid geometry | Skip row, log error |
| Connection lost | Rollback, throw error |

---

## Pipeline Execution Order

Pipelines have dependencies and must run in this order:

```
1. departements   ← Must be first (provides area_id FKs)
2. population     ← Must be before crime data (for rate calculation)
3. crime-data     ← Can run after population
   ├── france-monthly
   └── france-timeseries
```

**Validation:** Each pipeline should check its dependencies:

```typescript
async validate(): Promise<boolean> {
  // Check départements exist
  const areaCount = await this.dataSource.query(
    `SELECT COUNT(*) FROM administrative_areas WHERE level = 'department'`
  );
  if (areaCount[0].count === 0) {
    throw new Error('Run départements pipeline first');
  }
  return true;
}
```

---

## CLI Interface

Pipelines are run via the ETL CLI:

```bash
# Run specific pipeline
npm run etl:departements
npm run etl:population
npm run etl:france-monthly

# Run all pipelines in order
npm run etl:all

# Dry run (extract + transform only)
npm run etl:france-monthly -- --dry-run

# Force re-run (ignore existing data)
npm run etl:france-monthly -- --force
```

The CLI is implemented in `etl/src/cli.ts` and uses the orchestrator from `etl/src/orchestrator.ts`.

---

## Testing Guidelines

### Unit Tests

Each component should have dedicated tests:

```typescript
// extractor.spec.ts
describe('MyExtractor', () => {
  it('should parse CSV with Latin-1 encoding', async () => { ... });
  it('should skip invalid rows', async () => { ... });
  it('should extract date from filename', async () => { ... });
});

// transformer.spec.ts
describe('MyTransformer', () => {
  it('should map source category to canonical', async () => { ... });
  it('should resolve département to area_id', async () => { ... });
  it('should calculate rate_per_100k', async () => { ... });
});

// loader.spec.ts
describe('MyLoader', () => {
  it('should insert new records', async () => { ... });
  it('should update on conflict', async () => { ... });
  it('should handle batch errors', async () => { ... });
});
```

### Integration Tests

Pipeline tests should use a real database:

```typescript
describe('MyPipeline', () => {
  it('should load sample data end-to-end', async () => {
    const pipeline = new MyPipeline(dataSource);
    const result = await pipeline.run({ maxRows: 100 });
    expect(result.status).toBe('completed');
    expect(result.stats.rowsLoaded).toBeGreaterThan(0);
  });
});
```

### Sample Data

Place sample/fixture data in `data_excerpts/` for testing. The ETL should be able to run against these samples with `--sample` flag.

---

## Summary

To implement a new ETL pipeline:

1. ✅ Create types file with raw and transformed interfaces
2. ✅ Implement extractor with `extract()` and `validate()`
3. ✅ Implement transformer with `transformRow()` and `validate()`
4. ✅ Implement loader with `loadBatch()`, `buildInsertValues()`, and `validate()`
5. ✅ Implement pipeline with `initialize()`, `getDataSourceId()`, and `getSourceUrl()`
6. ✅ Write unit and integration tests
7. ✅ Add CLI command in `package.json` scripts
8. ✅ Document in `pipelines/README.md`

Follow the reference implementations in `departements/` and `population/` for working examples.
