/**
 * French Département Resolver (État 4001)
 *
 * Resolves département codes from CSV column headers to database area_id (UUID).
 * Provides caching and batch resolution for efficient ETL processing.
 *
 * @see docs/FRENCH_DATASETS.md for département code formats
 */

import { DataSource } from 'typeorm';
import { logger } from '../../utils/logger';
import { DEPARTEMENT_NAME_TO_CODE } from './france-monthly.types';

/**
 * Département resolution result
 */
export interface DepartementResolution {
  /** Standardized département code (01-95, 2A, 2B, 971-976) */
  departementCode: string;
  /** Database area_id (UUID) or null if not found */
  areaId: string | null;
  /** Département name from database */
  name: string | null;
  /** Whether the département was found in the database */
  found: boolean;
}

/**
 * Batch resolution result
 */
export interface BatchResolutionResult {
  /** Map of département code to area_id */
  codeToAreaId: Map<string, string>;
  /** Map of area_id to département code (reverse lookup) */
  areaIdToCode: Map<string, string>;
  /** Successfully resolved départements */
  resolved: DepartementResolution[];
  /** Codes that could not be resolved */
  unresolved: string[];
  /** Total count of résolutions */
  totalCount: number;
  /** Successfully resolved count */
  resolvedCount: number;
}

/**
 * Resolver statistics
 */
export interface ResolverStatistics {
  /** Total lookup calls */
  lookupCount: number;
  /** Cache hit count */
  cacheHits: number;
  /** Cache miss count */
  cacheMisses: number;
  /** Database query count */
  dbQueryCount: number;
  /** Unresolved codes encountered */
  unresolvedCodes: string[];
}

/**
 * Resolver options
 */
export interface DepartementResolverOptions {
  /** Admin level to filter by (default: 'department') */
  adminLevel?: string;
  /** Country code to filter by (default: 'FR') */
  countryCode?: string;
  /** Whether to preload all départements on init (default: true) */
  preload?: boolean;
}

/**
 * Administrative area record from database
 */
interface AdministrativeAreaRecord {
  id: string;
  code: string;
  name: string;
  level: string;
}

/**
 * Département Resolver
 *
 * Resolves département codes to database area_id values.
 * Uses caching for efficient repeated lookups.
 */
export class Etat4001DepartementResolver {
  private dataSource: DataSource;
  private options: Required<DepartementResolverOptions>;

  /** Cache: département code → area_id */
  private codeToAreaId: Map<string, string> = new Map();
  /** Cache: département code → full record */
  private codeToRecord: Map<string, AdministrativeAreaRecord> = new Map();
  /** Cache: area_id → département code */
  private areaIdToCode: Map<string, string> = new Map();

  /** Statistics tracking */
  private stats: ResolverStatistics = {
    lookupCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    dbQueryCount: 0,
    unresolvedCodes: [],
  };

  /** Whether cache has been initialized */
  private initialized = false;

  constructor(dataSource: DataSource, options: DepartementResolverOptions = {}) {
    this.dataSource = dataSource;
    this.options = {
      adminLevel: options.adminLevel ?? 'department',
      countryCode: options.countryCode ?? 'FR',
      preload: options.preload ?? true,
    };
  }

  /**
   * Initialize the resolver by preloading all départements from database
   */
  async initialize(): Promise<void> {
    if (this.initialized && !this.options.preload) {
      return;
    }

    logger.debug('Initializing département resolver...');

    try {
      const areas = await this.queryAllDepartements();

      // Build cache
      for (const area of areas) {
        this.codeToAreaId.set(area.code, area.id);
        this.codeToRecord.set(area.code, area);
        this.areaIdToCode.set(area.id, area.code);
      }

      this.initialized = true;
      logger.info(`Département resolver initialized with ${areas.length} départements`);
    } catch (error) {
      logger.error('Failed to initialize département resolver:', error);
      throw error;
    }
  }

  /**
   * Query all départements from the database
   */
  private async queryAllDepartements(): Promise<AdministrativeAreaRecord[]> {
    this.stats.dbQueryCount++;

    const query = `
      SELECT id, code, name, level
      FROM administrative_areas
      WHERE level = $1
        AND country_code = $2
        AND is_active = true
      ORDER BY code
    `;

    const result = await this.dataSource.query(query, [
      this.options.adminLevel,
      this.options.countryCode,
    ]);

    return result.map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      level: row.level,
    }));
  }

  /**
   * Resolve a single département code to area_id
   */
  async resolve(departementCode: string): Promise<DepartementResolution> {
    this.stats.lookupCount++;

    // Normalize code
    const normalizedCode = this.normalizeCode(departementCode);

    // Check cache first
    if (this.codeToAreaId.has(normalizedCode)) {
      this.stats.cacheHits++;
      const record = this.codeToRecord.get(normalizedCode)!;
      return {
        departementCode: normalizedCode,
        areaId: record.id,
        name: record.name,
        found: true,
      };
    }

    this.stats.cacheMisses++;

    // If not preloaded, query database
    if (!this.options.preload) {
      const record = await this.queryDepartementByCode(normalizedCode);
      if (record) {
        // Add to cache
        this.codeToAreaId.set(normalizedCode, record.id);
        this.codeToRecord.set(normalizedCode, record);
        this.areaIdToCode.set(record.id, normalizedCode);

        return {
          departementCode: normalizedCode,
          areaId: record.id,
          name: record.name,
          found: true,
        };
      }
    }

    // Not found
    if (!this.stats.unresolvedCodes.includes(normalizedCode)) {
      this.stats.unresolvedCodes.push(normalizedCode);
      logger.warn(`Département code not found: ${normalizedCode}`);
    }

    return {
      departementCode: normalizedCode,
      areaId: null,
      name: null,
      found: false,
    };
  }

  /**
   * Query a single département by code
   */
  private async queryDepartementByCode(
    code: string,
  ): Promise<AdministrativeAreaRecord | null> {
    this.stats.dbQueryCount++;

    const query = `
      SELECT id, code, name, level
      FROM administrative_areas
      WHERE code = $1
        AND level = $2
        AND country_code = $3
        AND is_active = true
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [
      code,
      this.options.adminLevel,
      this.options.countryCode,
    ]);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      level: row.level,
    };
  }

  /**
   * Resolve multiple département codes in batch
   */
  async resolveBatch(departementCodes: string[]): Promise<BatchResolutionResult> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    const codeToAreaId = new Map<string, string>();
    const areaIdToCode = new Map<string, string>();
    const resolved: DepartementResolution[] = [];
    const unresolved: string[] = [];

    for (const code of departementCodes) {
      const result = await this.resolve(code);
      resolved.push(result);

      if (result.found && result.areaId) {
        codeToAreaId.set(result.departementCode, result.areaId);
        areaIdToCode.set(result.areaId, result.departementCode);
      } else {
        unresolved.push(result.departementCode);
      }
    }

    return {
      codeToAreaId,
      areaIdToCode,
      resolved,
      unresolved,
      totalCount: departementCodes.length,
      resolvedCount: departementCodes.length - unresolved.length,
    };
  }

  /**
   * Resolve a column header name directly to area_id
   * Uses the DEPARTEMENT_NAME_TO_CODE mapping first
   */
  async resolveFromColumnName(columnName: string): Promise<DepartementResolution> {
    // First, try to get the code from the column name
    const code = this.extractCodeFromColumnName(columnName);

    if (!code) {
      return {
        departementCode: columnName,
        areaId: null,
        name: null,
        found: false,
      };
    }

    return this.resolve(code);
  }

  /**
   * Extract département code from column header name
   */
  private extractCodeFromColumnName(columnName: string): string | null {
    // Normalize for lookup
    const normalized = columnName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/['']/g, "'") // Normalize quotes
      .trim();

    // Try direct lookup
    const lookupKeys = [
      normalized,
      normalized.replace(/-/g, ' '),
      normalized.replace(/ /g, '-'),
      columnName.toLowerCase().trim(),
    ];

    for (const key of lookupKeys) {
      const code = DEPARTEMENT_NAME_TO_CODE[key];
      if (code && code !== 'METRO') {
        return code;
      }
    }

    // Try extracting code from format like "01-Ain" or "2A-Corse-du-Sud"
    const codeMatch = columnName.match(/^(\d{1,2}[AB]?)\s*[-–—]\s*(.+)$/i);
    if (codeMatch) {
      let code = codeMatch[1].padStart(2, '0');
      // Handle Corsica special case
      if (code.toUpperCase().endsWith('A') || code.toUpperCase().endsWith('B')) {
        code = '2' + code.charAt(code.length - 1).toUpperCase();
      }
      return code;
    }

    return null;
  }

  /**
   * Get area_id by département code (cached, fast)
   * Returns null if not found
   */
  getAreaId(departementCode: string): string | null {
    const normalizedCode = this.normalizeCode(departementCode);
    return this.codeToAreaId.get(normalizedCode) || null;
  }

  /**
   * Get département code by area_id (cached, fast)
   * Returns null if not found
   */
  getCodeByAreaId(areaId: string): string | null {
    return this.areaIdToCode.get(areaId) || null;
  }

  /**
   * Get the full record for a département code
   */
  getRecord(departementCode: string): AdministrativeAreaRecord | null {
    const normalizedCode = this.normalizeCode(departementCode);
    return this.codeToRecord.get(normalizedCode) || null;
  }

  /**
   * Check if a département code exists in the database
   */
  hasCode(departementCode: string): boolean {
    const normalizedCode = this.normalizeCode(departementCode);
    return this.codeToAreaId.has(normalizedCode);
  }

  /**
   * Get all cached département codes
   */
  getAllCodes(): string[] {
    return Array.from(this.codeToAreaId.keys()).sort();
  }

  /**
   * Get resolver statistics
   */
  getStatistics(): ResolverStatistics {
    return { ...this.stats };
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.codeToAreaId.size;
  }

  /**
   * Check if resolver is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clear cache and reset state
   */
  reset(): void {
    this.codeToAreaId.clear();
    this.codeToRecord.clear();
    this.areaIdToCode.clear();
    this.initialized = false;
    this.stats = {
      lookupCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      dbQueryCount: 0,
      unresolvedCodes: [],
    };
    logger.debug('Département resolver reset');
  }

  /**
   * Normalize a département code
   * - Pads 1-digit codes to 2 digits (1 → 01)
   * - Uppercases Corsica codes (2a → 2A)
   */
  private normalizeCode(code: string): string {
    const trimmed = code.trim();

    // Handle Corsica codes (2A, 2B)
    if (/^2[aAbB]$/.test(trimmed)) {
      return '2' + trimmed.charAt(1).toUpperCase();
    }

    // Pad numeric codes to 2 digits (but not DOM codes like 971)
    const numericMatch = trimmed.match(/^(\d+)$/);
    if (numericMatch) {
      const num = parseInt(numericMatch[1], 10);
      if (num <= 95) {
        return num.toString().padStart(2, '0');
      }
      // DOM codes (971-976) stay as-is
      return trimmed;
    }

    return trimmed;
  }

  /**
   * Validate that all expected départements exist in database
   * Returns validation result with missing codes
   */
  async validateCoverage(): Promise<{
    valid: boolean;
    expectedCount: number;
    foundCount: number;
    missingCodes: string[];
    extraCodes: string[];
  }> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Expected metropolitan département codes (01-95 excluding 20, plus 2A and 2B)
    const expectedCodes: string[] = [];
    for (let i = 1; i <= 95; i++) {
      if (i === 20) {
        // Corsica uses 2A and 2B, not 20
        expectedCodes.push('2A', '2B');
      } else {
        expectedCodes.push(i.toString().padStart(2, '0'));
      }
    }

    const foundCodes = this.getAllCodes();
    const foundSet = new Set(foundCodes);
    const expectedSet = new Set(expectedCodes);

    const missingCodes = expectedCodes.filter((code) => !foundSet.has(code));
    const extraCodes = foundCodes.filter((code) => !expectedSet.has(code));

    return {
      valid: missingCodes.length === 0,
      expectedCount: expectedCodes.length,
      foundCount: foundCodes.length,
      missingCodes,
      extraCodes,
    };
  }

  /**
   * Create lookup map for efficient transformation
   * Returns a function that resolves code → area_id
   */
  createLookupFunction(): (code: string) => string | null {
    return (code: string) => this.getAreaId(code);
  }
}

/**
 * Factory function to create and initialize a resolver
 */
export async function createDepartementResolver(
  dataSource: DataSource,
  options?: DepartementResolverOptions,
): Promise<Etat4001DepartementResolver> {
  const resolver = new Etat4001DepartementResolver(dataSource, options);
  await resolver.initialize();
  return resolver;
}
