/**
 * France Monthly Crime Observation Loader
 *
 * Loads enriched crime records into the crime_observations table.
 * Supports upsert logic - same source + area + category + year = replace.
 *
 * This loader:
 * 1. Takes enriched crime records from the rate enricher
 * 2. Resolves areaId from département codes via administrative_areas
 * 3. Resolves categoryId from canonical category codes via crime_categories
 * 4. Upserts to crime_observations (same area+category+year+source = update)
 *
 * @see Task 4.1.6: Write loader with upsert logic
 */

import { DataSource, QueryRunner } from 'typeorm';
import { BaseLoader, LoaderOptions } from '../../core/loader';
import { logger } from '../../utils/logger';
import { CanonicalCategoryCode } from './france-monthly.category-mapper';
import { EnrichedCrimeRecord } from './france-monthly.rate-enricher';

/**
 * Record ready for database insertion
 */
export interface CrimeObservationRecord {
  /** Administrative area UUID */
  areaId: string;
  /** Crime category UUID */
  categoryId: string;
  /** Data source UUID */
  dataSourceId: string;
  /** Observation year */
  year: number;
  /** Observation month (null for yearly data) */
  month: number | null;
  /** Time granularity */
  granularity: 'monthly' | 'quarterly' | 'yearly';
  /** Raw crime count */
  count: number;
  /** Crime rate per 100,000 population */
  ratePer100k: number | null;
  /** Population used for rate calculation */
  populationUsed: number | null;
  /** Data validation flag */
  isValidated: boolean;
  /** Notes about the record */
  notes: string | null;
}

/**
 * Loader options specific to france-monthly data
 */
export interface FranceMonthlyLoaderOptions extends Omit<LoaderOptions, 'tableName'> {
  /** Data source ID (required for upsert conflict resolution) */
  dataSourceId: string;
  /** Delete existing data for this source before loading */
  deleteExistingSource?: boolean;
  /** Skip records that fail FK resolution (default: false) */
  skipUnresolvedRecords?: boolean;
}

/**
 * FK resolution result
 */
interface ResolvedIds {
  /** Map of département code to area UUID */
  areaIds: Map<string, string>;
  /** Map of canonical category code to category UUID */
  categoryIds: Map<string, string>;
  /** Départements that couldn't be resolved */
  unresolvedDepartements: string[];
  /** Categories that couldn't be resolved */
  unresolvedCategories: string[];
}

/**
 * Loader statistics
 */
export interface FranceMonthlyLoaderStats {
  /** Total records received */
  totalRecords: number;
  /** Records successfully inserted */
  inserted: number;
  /** Records updated (same key, new data) */
  updated: number;
  /** Records skipped (same data already exists) */
  skipped: number;
  /** Records failed (FK resolution or other errors) */
  failed: number;
  /** Unique départements loaded */
  departements: number;
  /** Unique categories loaded */
  categories: number;
  /** Unique years loaded */
  years: number[];
  /** Unresolved département codes */
  unresolvedDepartements: string[];
  /** Unresolved category codes */
  unresolvedCategories: string[];
}

/**
 * France Monthly Crime Observation Loader
 *
 * Loads enriched crime records into the crime_observations table.
 */
export class FranceMonthlyLoader extends BaseLoader<EnrichedCrimeRecord> {
  protected loaderOptions: FranceMonthlyLoaderOptions;
  private resolvedIds: ResolvedIds | null = null;
  private stats: FranceMonthlyLoaderStats;

  constructor(dataSource: DataSource, options: FranceMonthlyLoaderOptions) {
    super(dataSource, {
      tableName: 'crime_observations',
      batchSize: 500,
      upsert: true,
      conflictColumns: ['areaId', 'categoryId', 'dataSourceId', 'year', 'month'],
      useTransaction: true,
      ...options,
    });

    if (!options.dataSourceId) {
      throw new Error('dataSourceId is required for FranceMonthlyLoader');
    }

    this.loaderOptions = {
      deleteExistingSource: false,
      skipUnresolvedRecords: false,
      ...options,
    };

    this.stats = this.initializeStats();
  }

  /**
   * Initialize statistics tracking
   */
  private initializeStats(): FranceMonthlyLoaderStats {
    return {
      totalRecords: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      departements: 0,
      categories: 0,
      years: [],
      unresolvedDepartements: [],
      unresolvedCategories: [],
    };
  }

  /**
   * Get current loader statistics
   */
  getStats(): FranceMonthlyLoaderStats {
    return { ...this.stats };
  }

  /**
   * Preload foreign key mappings before loading data
   *
   * This is called automatically before loadBatch if not already done.
   * Can be called manually for better error handling.
   *
   * @param records - Records to extract département/category codes from
   */
  async preloadForeignKeys(records: EnrichedCrimeRecord[]): Promise<ResolvedIds> {
    // Extract unique département codes and category codes
    const departementCodes = new Set<string>();
    const categoryCodes = new Set<CanonicalCategoryCode>();

    for (const record of records) {
      departementCodes.add(record.departementCode);
      categoryCodes.add(record.canonicalCategory);
    }

    logger.info(
      `Preloading FKs for ${departementCodes.size} départements and ${categoryCodes.size} categories`,
    );

    // Load area IDs
    const areaIds = await this.loadAreaIds([...departementCodes]);

    // Load category IDs
    const categoryIds = await this.loadCategoryIds([...categoryCodes]);

    // Track unresolved codes
    const unresolvedDepartements: string[] = [];
    for (const code of departementCodes) {
      if (!areaIds.has(code)) {
        unresolvedDepartements.push(code);
      }
    }

    const unresolvedCategories: string[] = [];
    for (const code of categoryCodes) {
      if (!categoryIds.has(code)) {
        unresolvedCategories.push(code);
      }
    }

    if (unresolvedDepartements.length > 0) {
      logger.warn(`Unresolved département codes: ${unresolvedDepartements.join(', ')}`);
    }

    if (unresolvedCategories.length > 0) {
      logger.warn(`Unresolved category codes: ${unresolvedCategories.join(', ')}`);
    }

    this.resolvedIds = {
      areaIds,
      categoryIds,
      unresolvedDepartements,
      unresolvedCategories,
    };

    this.stats.departements = areaIds.size;
    this.stats.categories = categoryIds.size;
    this.stats.unresolvedDepartements = unresolvedDepartements;
    this.stats.unresolvedCategories = unresolvedCategories;

    return this.resolvedIds;
  }

  /**
   * Load area IDs for département codes from administrative_areas table
   */
  private async loadAreaIds(departementCodes: string[]): Promise<Map<string, string>> {
    const areaIds = new Map<string, string>();

    if (departementCodes.length === 0) {
      return areaIds;
    }

    try {
      const query = `
        SELECT id, code 
        FROM administrative_areas 
        WHERE code = ANY($1) AND level = 'department'
      `;

      const results = await this.dataSource.query(query, [departementCodes]);

      for (const row of results) {
        areaIds.set(row.code, row.id);
      }

      logger.debug(`Loaded ${areaIds.size}/${departementCodes.length} area IDs`);
    } catch (error) {
      logger.error('Failed to load area IDs:', error);
      throw error;
    }

    return areaIds;
  }

  /**
   * Load category IDs for canonical category codes from crime_categories table
   */
  private async loadCategoryIds(
    categoryCodes: CanonicalCategoryCode[],
  ): Promise<Map<string, string>> {
    const categoryIds = new Map<string, string>();

    if (categoryCodes.length === 0) {
      return categoryIds;
    }

    try {
      const query = `
        SELECT id, code 
        FROM crime_categories 
        WHERE code = ANY($1)
      `;

      const results = await this.dataSource.query(query, [categoryCodes]);

      for (const row of results) {
        categoryIds.set(row.code, row.id);
      }

      logger.debug(`Loaded ${categoryIds.size}/${categoryCodes.length} category IDs`);
    } catch (error) {
      logger.error('Failed to load category IDs:', error);
      throw error;
    }

    return categoryIds;
  }

  /**
   * Delete existing records for this data source
   * Call before loading to ensure clean slate
   */
  async deleteExistingRecords(): Promise<number> {
    logger.info(`Deleting existing records for data source: ${this.loaderOptions.dataSourceId}`);

    const result = await this.dataSource.query(
      `DELETE FROM crime_observations WHERE "dataSourceId" = $1`,
      [this.loaderOptions.dataSourceId],
    );

    const deletedCount = result.rowCount || result[1] || 0;
    logger.info(`Deleted ${deletedCount} existing records`);

    return deletedCount;
  }

  /**
   * Load a batch of enriched crime records
   */
  protected async loadBatch(
    queryRunner: QueryRunner,
    batch: EnrichedCrimeRecord[],
    startIndex: number,
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // Ensure FKs are preloaded
    if (!this.resolvedIds) {
      throw new Error('Foreign keys not preloaded. Call preloadForeignKeys() first.');
    }

    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      const rowIndex = startIndex + i;

      try {
        // Resolve FKs
        const areaId = this.resolvedIds.areaIds.get(record.departementCode);
        const categoryId = this.resolvedIds.categoryIds.get(record.canonicalCategory);

        if (!areaId || !categoryId) {
          if (this.loaderOptions.skipUnresolvedRecords) {
            skipped++;
            continue;
          }

          const missing: string[] = [];
          if (!areaId) missing.push(`area:${record.departementCode}`);
          if (!categoryId) missing.push(`category:${record.canonicalCategory}`);

          throw new Error(`Unresolved foreign keys: ${missing.join(', ')}`);
        }

        // Build database record
        const dbRecord: CrimeObservationRecord = {
          areaId,
          categoryId,
          dataSourceId: this.loaderOptions.dataSourceId,
          year: record.year,
          month: null, // Yearly aggregated data
          granularity: 'yearly',
          count: record.count,
          ratePer100k: record.ratePer100k,
          populationUsed: record.populationUsed,
          isValidated: record.isComplete, // Mark complete years as validated
          notes: record.notes,
        };

        const result = await this.upsertRecord(queryRunner, dbRecord);

        if (result === 'inserted') {
          inserted++;
        } else if (result === 'updated') {
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        logger.error(`Failed to load record at index ${rowIndex}:`, error);
        this.stats.failed++;

        if (!this.loaderOptions.skipUnresolvedRecords) {
          throw error;
        }
      }
    }

    // Track unique years
    const batchYears = new Set(batch.map((r) => r.year));
    for (const year of batchYears) {
      if (!this.stats.years.includes(year)) {
        this.stats.years.push(year);
      }
    }
    this.stats.years.sort((a, b) => a - b);

    return { inserted, updated, skipped };
  }

  /**
   * Upsert a single crime observation record
   */
  private async upsertRecord(
    queryRunner: QueryRunner,
    record: CrimeObservationRecord,
  ): Promise<'inserted' | 'updated' | 'skipped'> {
    // Check if record exists (using composite unique constraint columns)
    const existingCheck = await queryRunner.query(
      `SELECT id, count, "ratePer100k", "populationUsed", notes
       FROM crime_observations 
       WHERE "areaId" = $1 
         AND "categoryId" = $2 
         AND "dataSourceId" = $3 
         AND year = $4 
         AND COALESCE(month, 0) = COALESCE($5, 0)`,
      [record.areaId, record.categoryId, record.dataSourceId, record.year, record.month],
    );

    if (existingCheck.length > 0) {
      const existing = existingCheck[0];

      // Check if data has changed
      const countChanged = Number(existing.count) !== record.count;
      const rateChanged =
        (existing.ratePer100k === null && record.ratePer100k !== null) ||
        (existing.ratePer100k !== null &&
          record.ratePer100k !== null &&
          Math.abs(Number(existing.ratePer100k) - record.ratePer100k) > 0.0001);
      const populationChanged =
        (existing.populationUsed === null && record.populationUsed !== null) ||
        (existing.populationUsed !== null && record.populationUsed !== null &&
          Number(existing.populationUsed) !== record.populationUsed);

      if (!countChanged && !rateChanged && !populationChanged) {
        return 'skipped';
      }

      // Update existing record
      await queryRunner.query(
        `UPDATE crime_observations 
         SET count = $1, 
             "ratePer100k" = $2, 
             "populationUsed" = $3, 
             "isValidated" = $4,
             notes = $5,
             "updatedAt" = NOW()
         WHERE "areaId" = $6 
           AND "categoryId" = $7 
           AND "dataSourceId" = $8 
           AND year = $9 
           AND COALESCE(month, 0) = COALESCE($10, 0)`,
        [
          record.count,
          record.ratePer100k,
          record.populationUsed,
          record.isValidated,
          record.notes,
          record.areaId,
          record.categoryId,
          record.dataSourceId,
          record.year,
          record.month,
        ],
      );

      return 'updated';
    }

    // Insert new record
    await queryRunner.query(
      `INSERT INTO crime_observations 
       ("areaId", "categoryId", "dataSourceId", year, month, granularity, 
        count, "ratePer100k", "populationUsed", "isValidated", notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        record.areaId,
        record.categoryId,
        record.dataSourceId,
        record.year,
        record.month,
        record.granularity,
        record.count,
        record.ratePer100k,
        record.populationUsed,
        record.isValidated,
        record.notes,
      ],
    );

    return 'inserted';
  }

  /**
   * Build column values for INSERT (required by BaseLoader)
   */
  protected buildInsertValues(row: EnrichedCrimeRecord): Record<string, unknown> {
    // Resolve FKs - this is a fallback, preloadForeignKeys should be called first
    const areaId = this.resolvedIds?.areaIds.get(row.departementCode) || null;
    const categoryId = this.resolvedIds?.categoryIds.get(row.canonicalCategory) || null;

    return {
      areaId,
      categoryId,
      dataSourceId: this.loaderOptions.dataSourceId,
      year: row.year,
      month: null,
      granularity: 'yearly',
      count: row.count,
      ratePer100k: row.ratePer100k,
      populationUsed: row.populationUsed,
      isValidated: row.isComplete,
      notes: row.notes,
    };
  }

  /**
   * Validate loader configuration
   */
  async validate(): Promise<boolean> {
    const errors: string[] = [];

    // Check that crime_observations table exists
    try {
      const tableCheck = await this.dataSource.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'crime_observations'
         )`,
      );
      if (!tableCheck[0].exists) {
        errors.push('crime_observations table does not exist');
      }
    } catch (error) {
      errors.push(`Cannot validate crime_observations table: ${error}`);
    }

    // Check that data source exists
    try {
      const sourceCheck = await this.dataSource.query(
        `SELECT id FROM data_sources WHERE id = $1`,
        [this.loaderOptions.dataSourceId],
      );
      if (sourceCheck.length === 0) {
        errors.push(`Data source not found: ${this.loaderOptions.dataSourceId}`);
      }
    } catch (error) {
      errors.push(`Cannot validate data source: ${error}`);
    }

    // Check administrative_areas has département records
    try {
      const areaCheck = await this.dataSource.query(
        `SELECT COUNT(*) as count 
         FROM administrative_areas 
         WHERE level = 'department'`,
      );
      if (Number(areaCheck[0].count) === 0) {
        errors.push('No département records in administrative_areas');
      }
    } catch (error) {
      errors.push(`Cannot validate administrative_areas: ${error}`);
    }

    // Check crime_categories has records
    try {
      const categoryCheck = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM crime_categories`,
      );
      if (Number(categoryCheck[0].count) === 0) {
        errors.push('No records in crime_categories');
      }
    } catch (error) {
      errors.push(`Cannot validate crime_categories: ${error}`);
    }

    if (errors.length > 0) {
      for (const error of errors) {
        logger.error(`Validation error: ${error}`);
      }
      return false;
    }

    return true;
  }
}

/**
 * Factory function to create a FranceMonthlyLoader
 */
export function createFranceMonthlyLoader(
  dataSource: DataSource,
  options: FranceMonthlyLoaderOptions,
): FranceMonthlyLoader {
  return new FranceMonthlyLoader(dataSource, options);
}

/**
 * Load enriched crime records with automatic FK resolution
 *
 * Convenience function that handles the full load workflow:
 * 1. Validates configuration
 * 2. Optionally deletes existing records for the source
 * 3. Preloads foreign keys
 * 4. Loads all records with upsert logic
 *
 * @param dataSource - TypeORM data source
 * @param records - Enriched crime records from rate enricher
 * @param options - Loader options
 * @returns Load result with statistics
 */
export async function loadFranceMonthlyCrimeData(
  dataSource: DataSource,
  records: EnrichedCrimeRecord[],
  options: FranceMonthlyLoaderOptions,
): Promise<{
  result: Awaited<ReturnType<FranceMonthlyLoader['load']>>;
  stats: FranceMonthlyLoaderStats;
}> {
  const loader = new FranceMonthlyLoader(dataSource, options);

  // Validate configuration
  const isValid = await loader.validate();
  if (!isValid) {
    throw new Error('Loader validation failed');
  }

  // Delete existing records if requested
  if (options.deleteExistingSource) {
    await loader.deleteExistingRecords();
  }

  // Preload foreign keys
  await loader.preloadForeignKeys(records);

  // Load data
  const result = await loader.load(records);

  // Get final statistics
  const stats = loader.getStats();
  stats.totalRecords = records.length;
  stats.inserted = result.insertedCount;
  stats.updated = result.updatedCount;
  stats.skipped = result.skippedCount;

  return { result, stats };
}
