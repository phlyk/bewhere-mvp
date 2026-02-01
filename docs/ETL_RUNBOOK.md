# ETL Runbook

> **Task 11.2**: Comprehensive operational guide for the BeWhere ETL system

This runbook provides step-by-step procedures for common ETL operations including running pipelines, handling failures, adding new datasets, and updating population data.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Daily Operations](#daily-operations)
3. [Running ETL Pipelines](#running-etl-pipelines)
4. [Re-running Failed Jobs](#re-running-failed-jobs)
5. [Adding a New Dataset](#adding-a-new-dataset)
6. [Updating Population Data](#updating-population-data)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
8. [Common Issues & Solutions](#common-issues--solutions)

---

## Quick Reference

### Essential Commands

```bash
# Run all pipelines (production)
docker compose run --rm etl npm run etl:all

# Run specific pipeline
docker compose run --rm etl npm run etl:departements
docker compose run --rm etl npm run etl:population
docker compose run --rm etl npm run etl:france-monthly

# Check pipeline status
docker compose run --rm etl npm run etl status

# Force re-run (overwrites existing data)
docker compose run --rm etl npm run etl:all -- --force

# Dry run (validate without loading)
docker compose run --rm etl npm run etl:all -- --dry-run
```

### Pipeline Execution Order

Pipelines have dependencies and **must be run in this order**:

```
1. departements  → Provides area_id references (geometry data)
2. population    → Provides population for rate calculation
3. france-monthly → Crime data from État 4001
4. france-timeseries → Time series crime data (optional)
```

---

## Daily Operations

### Checking ETL Status

View the status of recent ETL runs:

```bash
# Show last 10 runs
docker compose run --rm etl npm run etl status

# Show status for specific dataset
docker compose run --rm etl npm run etl status -- --dataset france-monthly

# Show more history
docker compose run --rm etl npm run etl status -- --limit 50
```

### Viewing Logs

```bash
# View ETL container logs
docker compose logs etl

# Follow logs in real-time
docker compose logs -f etl

# View logs from disk (inside container)
docker compose exec etl cat /app/logs/etl.log
```

### Verifying Data Integrity

```bash
# Check row counts in database
docker compose exec db psql -U postgres -d bewhere -c "
  SELECT 'administrative_areas' as table_name, COUNT(*) as rows FROM administrative_areas
  UNION ALL
  SELECT 'population', COUNT(*) FROM population
  UNION ALL
  SELECT 'crime_categories', COUNT(*) FROM crime_categories
  UNION ALL
  SELECT 'crime_observations', COUNT(*) FROM crime_observations;
"

# Expected counts:
# administrative_areas: 101 (96 metropolitan + 5 DOM)
# population: 909 (101 départements × 9 years)
# crime_categories: 20 (canonical categories)
# crime_observations: varies by loaded data
```

---

## Running ETL Pipelines

### Full Pipeline Run

For a fresh installation, run all pipelines in order:

```bash
# 1. Ensure database is running
docker compose up -d db

# 2. Wait for database to be ready
docker compose exec db pg_isready -U postgres

# 3. Run all ETL pipelines
docker compose run --rm etl npm run etl:all
```

### Running Individual Pipelines

#### 1. Departements Pipeline (Geometry Data)

```bash
docker compose run --rm etl npm run etl:departements
```

**What it does:**
- Downloads GeoJSON from `geo.api.gouv.fr`
- Loads 101 département geometries (96 metropolitan + 5 DOM)
- Populates `administrative_areas` table with PostGIS geometry

**Expected output:**
```
✓ Extracted 101 départements from geo.api.gouv.fr
✓ Transformed 101 features to PostGIS format
✓ Loaded 101 administrative areas
```

#### 2. Population Pipeline

```bash
docker compose run --rm etl npm run etl:population
```

**What it does:**
- Extracts embedded INSEE population data (2016-2024)
- Resolves département codes to area_id foreign keys
- Loads 909 population records

**Expected output:**
```
✓ Extracted 909 population records
✓ Transformed with département resolution
✓ Loaded 909 population entries
```

#### 3. France Monthly Pipeline (État 4001)

```bash
docker compose run --rm etl npm run etl:france-monthly
```

**What it does:**
- Downloads État 4001 crime snapshots from data.gouv.fr
- Maps 107 French crime indices to 20 canonical categories
- Aggregates monthly data to yearly values
- Calculates crime rates per 100,000 population

**Expected output:**
```
✓ Downloaded État 4001 snapshot (June 2012)
✓ Mapped 95 active indices to 20 categories
✓ Aggregated to yearly granularity
✓ Calculated rates for 96 départements
✓ Loaded X crime observations
```

### Using Options

#### Dry Run (Validate Only)

Test without writing to database:

```bash
docker compose run --rm etl npm run etl:all -- --dry-run
```

This will:
- Download and parse source data
- Validate data structure and mappings
- Report any errors or warnings
- **NOT** write to database

#### Force Re-run

Overwrite existing data:

```bash
docker compose run --rm etl npm run etl:france-monthly -- --force
```

Use `--force` when:
- Source data has been updated
- Previous run had data quality issues
- You need to reload after fixing mappings

---

## Re-running Failed Jobs

### Identifying the Failure

1. **Check ETL run status:**

```bash
docker compose run --rm etl npm run etl status
```

Look for runs with `status: failed`.

2. **Check logs for details:**

```bash
docker compose logs etl | grep -A 20 "ERROR"
```

3. **Check database for partial data:**

```bash
docker compose exec db psql -U postgres -d bewhere -c "
  SELECT dataset, status, started_at, error_message 
  FROM etl_runs 
  ORDER BY started_at DESC 
  LIMIT 5;
"
```

### Recovery Procedures

#### Scenario 1: Network/Download Failure

**Symptoms:** "ECONNRESET", "timeout", "ENOTFOUND"

**Solution:**
```bash
# 1. Check network connectivity
curl -I https://geo.api.gouv.fr/departements?format=geojson

# 2. Re-run the failed pipeline
docker compose run --rm etl npm run etl:departements

# 3. If timeout persists, increase timeout in config
export ETL_DOWNLOAD_TIMEOUT=60000
docker compose run --rm etl npm run etl:departements
```

#### Scenario 2: Database Connection Failure

**Symptoms:** "connection refused", "ECONNREFUSED"

**Solution:**
```bash
# 1. Ensure database is running
docker compose up -d db

# 2. Wait for it to be ready
docker compose exec db pg_isready -U postgres

# 3. Re-run pipeline
docker compose run --rm etl npm run etl:all
```

#### Scenario 3: Foreign Key Constraint Error

**Symptoms:** "violates foreign key constraint", "area_id does not exist"

**Solution:**
```bash
# Dependencies not loaded. Run pipelines in order:
docker compose run --rm etl npm run etl:departements  # First
docker compose run --rm etl npm run etl:population    # Second
docker compose run --rm etl npm run etl:france-monthly # Third
```

#### Scenario 4: Partial Load (Interrupted Run)

**Symptoms:** Some data loaded, run interrupted

**Solution:**
```bash
# Force re-run to overwrite partial data
docker compose run --rm etl npm run etl:france-monthly -- --force
```

#### Scenario 5: Data Quality Issues

**Symptoms:** "validation failed", "unexpected column"

**Solution:**
```bash
# 1. Validate without loading
docker compose run --rm etl npm run etl validate -- --dataset france-monthly

# 2. Check source file structure
# Compare against expected schema in docs/FRENCH_DATASETS.md

# 3. If source format changed, update extractor/transformer
# See "Adding a New Dataset" section
```

### Rolling Back Failed Run

If you need to remove data from a failed partial run:

```bash
# Connect to database
docker compose exec db psql -U postgres -d bewhere

# Remove observations from failed run
DELETE FROM crime_observations WHERE data_source_id = (
  SELECT id FROM data_sources WHERE name = 'etat-4001-monthly'
);

# Alternatively, truncate and re-run all
TRUNCATE crime_observations CASCADE;
-- Then re-run ETL
```

---

## Adding a New Dataset

Follow this step-by-step process to add a new French crime dataset.

### Step 1: Analyze the Source Data

```bash
# Download sample data
curl -o sample.csv "https://example.com/new-dataset.csv"

# Check encoding
file -I sample.csv
# French government files are often Latin-1 (ISO-8859-1)

# Preview structure
head -20 sample.csv
```

Document findings in `docs/FRENCH_DATASETS.md`:
- Column names and types
- Row structure
- Date format
- Geographic identifiers
- Crime category format

### Step 2: Create Pipeline Directory

```bash
mkdir -p etl/src/pipelines/new-dataset
touch etl/src/pipelines/new-dataset/index.ts
touch etl/src/pipelines/new-dataset/extractor.ts
touch etl/src/pipelines/new-dataset/transformer.ts
touch etl/src/pipelines/new-dataset/loader.ts
touch etl/src/pipelines/new-dataset/pipeline.ts
touch etl/src/pipelines/new-dataset/types.ts
```

### Step 3: Implement Extractor

Create `extractor.ts`:

```typescript
import { BaseExtractor, ExtractionResult } from '../../core/extractor';
import { download, parseCSV } from '../../utils';
import { NewDatasetRaw } from './types';

export class NewDatasetExtractor extends BaseExtractor<NewDatasetRaw> {
  private readonly sourceUrl = 'https://example.com/dataset.csv';

  async extract(): Promise<ExtractionResult<NewDatasetRaw>> {
    // 1. Download file (handle encoding)
    const content = await download(this.sourceUrl, { 
      encoding: 'latin1' // French government files
    });

    // 2. Parse CSV/JSON
    const data = await parseCSV<NewDatasetRaw>(content, {
      delimiter: ';',
      skipLines: 1
    });

    // 3. Return result
    return {
      data,
      source: this.sourceUrl,
      rowCount: data.length,
      extractedAt: new Date(),
      warnings: []
    };
  }

  async validate(): Promise<boolean> {
    // Check URL is accessible
    // Validate expected columns exist
    return true;
  }
}
```

### Step 4: Implement Transformer

Create `transformer.ts`:

```typescript
import { BaseTransformer, TransformationResult } from '../../core/transformer';
import { CrimeObservation } from '../../../api/src/entities';
import { NewDatasetRaw, NewDatasetTransformed } from './types';

export class NewDatasetTransformer extends BaseTransformer<
  NewDatasetRaw, 
  NewDatasetTransformed
> {
  async transform(raw: NewDatasetRaw[]): Promise<TransformationResult<NewDatasetTransformed>> {
    const transformed: NewDatasetTransformed[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const row of raw) {
      try {
        // 1. Map to canonical category
        const category = this.mapCategory(row.index);
        
        // 2. Resolve département to area_id
        const areaId = await this.resolveArea(row.departement);
        
        // 3. Parse date
        const year = this.parseYear(row.period);
        
        // 4. Build transformed record
        transformed.push({
          areaId,
          categoryId: category.id,
          year,
          count: parseInt(row.value, 10),
          // ...
        });
      } catch (e) {
        errors.push(`Row ${row.index}: ${e.message}`);
      }
    }

    return {
      data: transformed,
      inputCount: raw.length,
      outputCount: transformed.length,
      errors,
      warnings
    };
  }

  async validate(raw: NewDatasetRaw[]): Promise<boolean> {
    // Validate structure, required fields, etc.
    return true;
  }
}
```

### Step 5: Implement Loader

Create `loader.ts`:

```typescript
import { BaseLoader, LoadResult } from '../../core/loader';
import { AppDataSource } from '../../config/database';
import { CrimeObservation } from '../../../api/src/entities';
import { NewDatasetTransformed } from './types';

export class NewDatasetLoader extends BaseLoader<NewDatasetTransformed> {
  async load(data: NewDatasetTransformed[]): Promise<LoadResult> {
    const repo = AppDataSource.getRepository(CrimeObservation);
    
    // Batch upsert
    const result = await repo.upsert(data, {
      conflictPaths: ['area_id', 'category_id', 'year'],
      skipUpdateIfNoValuesChanged: true
    });

    return {
      insertedCount: result.raw.length,
      updatedCount: 0,
      errors: []
    };
  }
}
```

### Step 6: Create Pipeline Orchestrator

Create `pipeline.ts`:

```typescript
import { BasePipeline, PipelineResult } from '../../core/pipeline';
import { NewDatasetExtractor } from './extractor';
import { NewDatasetTransformer } from './transformer';
import { NewDatasetLoader } from './loader';

export class NewDatasetPipeline extends BasePipeline {
  readonly name = 'new-dataset';
  
  async run(options: RunOptions = {}): Promise<PipelineResult> {
    // Initialize components
    const extractor = new NewDatasetExtractor();
    const transformer = new NewDatasetTransformer();
    const loader = new NewDatasetLoader();

    // Execute pipeline
    const extracted = await extractor.extract();
    const transformed = await transformer.transform(extracted.data);
    
    if (!options.dryRun) {
      const loaded = await loader.load(transformed.data);
    }

    return {
      status: 'success',
      dataset: this.name,
      rowsProcessed: extracted.rowCount,
      // ...
    };
  }
}
```

### Step 7: Register Pipeline

Update `etl/src/pipelines/index.ts`:

```typescript
export * from './new-dataset';
```

Update `etl/src/orchestrator.ts`:

```typescript
const PIPELINE_ORDER: DatasetName[] = [
  'departements',
  'population',
  'france-monthly',
  'france-timeseries',
  'new-dataset',  // Add here
];
```

### Step 8: Add CLI Commands

Update `etl/package.json`:

```json
{
  "scripts": {
    "etl:new-dataset": "ts-node src/cli.ts run --dataset new-dataset"
  }
}
```

### Step 9: Add Category Mappings

If the dataset has new crime categories, update:

1. `docs/CATEGORY_MAPPINGS.md` - Document the mapping
2. Database seed - Add new mappings:

```sql
INSERT INTO category_mappings (source, source_index, canonical_category_id)
VALUES 
  ('new-dataset', 'IDX001', 1),
  ('new-dataset', 'IDX002', 2);
```

### Step 10: Test

```bash
# Run unit tests
cd etl && npm test

# Validate without loading
docker compose run --rm etl npm run etl:new-dataset -- --dry-run

# Full test run
docker compose run --rm etl npm run etl:new-dataset
```

---

## Updating Population Data

Population data is required for calculating crime rates per 100,000 population.

### When to Update

- **Annually**: INSEE releases new population estimates
- **Source**: https://www.insee.fr/fr/statistiques/1893198

### Step 1: Download New Data

```bash
# Download from INSEE
curl -o insee_population_2025.xlsx "https://insee.fr/..."
```

### Step 2: Extract and Format

Convert to the embedded format in `etl/src/pipelines/population/data.ts`:

```typescript
export const POPULATION_DATA: PopulationRecord[] = [
  { code: '01', year: 2025, population: 660000 },
  { code: '02', year: 2025, population: 527000 },
  // ... all 101 départements
];
```

### Step 3: Run Population Pipeline

```bash
# Force update to add new year
docker compose run --rm etl npm run etl:population -- --force
```

### Step 4: Verify

```bash
docker compose exec db psql -U postgres -d bewhere -c "
  SELECT year, COUNT(*) as departements, SUM(population) as total_pop
  FROM population
  GROUP BY year
  ORDER BY year DESC;
"
```

### Future Enhancement: Automatic Updates

For automatic population updates, the pipeline could be enhanced to:

1. Fetch from INSEE API directly
2. Parse Excel files using `xlsx` package
3. Detect new years automatically

---

## Monitoring & Troubleshooting

### Health Checks

```bash
# ETL service health
docker compose run --rm etl npm run etl status

# Database connectivity
docker compose exec db pg_isready -U postgres

# API can reach data
curl http://localhost:3000/api/health
```

### Performance Monitoring

```bash
# Check ETL run durations
docker compose exec db psql -U postgres -d bewhere -c "
  SELECT 
    dataset,
    status,
    rows_processed,
    EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
  FROM etl_runs
  ORDER BY started_at DESC
  LIMIT 10;
"
```

### Expected Run Times

| Pipeline | Expected Duration | Rows |
|----------|------------------|------|
| departements | ~5 seconds | 101 |
| population | ~2 seconds | 909 |
| france-monthly | ~30 seconds | ~5000 |
| france-timeseries | ~60 seconds | ~15000 |

---

## Common Issues & Solutions

### Issue: "Latin-1 encoding error"

```
Error: Invalid character at position X
```

**Cause:** File encoding mismatch

**Solution:**
```typescript
// In extractor, specify encoding
await download(url, { encoding: 'latin1' });
```

### Issue: "Département not found: 2A"

**Cause:** Corsica uses 2A/2B instead of numeric codes

**Solution:** Ensure département resolver handles Corsican codes:
```typescript
const normalizeCode = (code: string) => {
  if (code === '2A' || code === '2B') return code;
  return code.padStart(2, '0');
};
```

### Issue: "Duplicate key violates unique constraint"

**Cause:** Running pipeline multiple times without `--force`

**Solution:**
```bash
docker compose run --rm etl npm run etl:france-monthly -- --force
```

### Issue: "Out of memory"

**Cause:** Loading too much data at once

**Solution:** Implement batched loading:
```typescript
// In loader
const BATCH_SIZE = 1000;
for (let i = 0; i < data.length; i += BATCH_SIZE) {
  await repo.save(data.slice(i, i + BATCH_SIZE));
}
```

### Issue: "Rate calculation returns NULL"

**Cause:** Missing population data for the year

**Solution:**
```bash
# Check population coverage
docker compose exec db psql -U postgres -d bewhere -c "
  SELECT DISTINCT year FROM population ORDER BY year;
"

# Update population data if needed
docker compose run --rm etl npm run etl:population -- --force
```

---

## Appendix

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@db:5432/bewhere` |
| `ETL_DOWNLOAD_TIMEOUT` | Download timeout in ms | `30000` |
| `ETL_BATCH_SIZE` | Database batch size | `1000` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### File Locations

| Path | Description |
|------|-------------|
| `etl/src/pipelines/` | Pipeline implementations |
| `etl/src/core/` | Base classes (extractor, transformer, loader) |
| `etl/src/utils/` | Shared utilities |
| `etl/logs/` | ETL log files |
| `docs/ETL_CONTRACT.md` | Developer contract specification |
| `docs/CATEGORY_MAPPINGS.md` | Crime category mappings |
| `docs/FRENCH_DATASETS.md` | Source data documentation |

### Related Documentation

- [ETL Contract](ETL_CONTRACT.md) - Developer reference for pipeline implementation
- [French Datasets](FRENCH_DATASETS.md) - Source data documentation
- [Category Mappings](CATEGORY_MAPPINGS.md) - Crime category mapping reference
- [Quick Start](QUICKSTART.md) - Getting started guide
