/**
 * Base Extractor Class
 *
 * Abstract base class for data extraction from various sources.
 * Implementations handle specific file formats (CSV, JSON, GeoJSON, etc.)
 */

import { logger } from '../utils/logger';

/**
 * Extraction result metadata
 */
export interface ExtractionResult<T> {
  /** Extracted data rows */
  data: T[];
  /** Source URL or file path */
  source: string;
  /** Number of rows extracted */
  rowCount: number;
  /** Extraction timestamp */
  extractedAt: Date;
  /** Any warnings during extraction */
  warnings: string[];
  /** Source file encoding (if applicable) */
  encoding?: string;
}

/**
 * Extractor options
 */
export interface ExtractorOptions {
  /** Source URL or file path */
  source: string;
  /** Expected encoding for file sources */
  encoding?: string;
  /** Skip header rows */
  skipRows?: number;
  /** Maximum rows to extract (for testing) */
  maxRows?: number;
}

/**
 * Abstract base class for data extractors
 *
 * @template TRaw - Type of raw extracted data
 */
export abstract class BaseExtractor<TRaw> {
  protected options: ExtractorOptions;

  constructor(options: ExtractorOptions) {
    this.options = options;
  }

  /**
   * Extract data from the source
   */
  abstract extract(): Promise<ExtractionResult<TRaw>>;

  /**
   * Validate the source before extraction
   */
  abstract validate(): Promise<boolean>;

  /**
   * Get the source identifier for logging
   */
  protected getSourceId(): string {
    return this.options.source;
  }

  /**
   * Log extraction progress
   */
  protected logProgress(current: number, total?: number): void {
    if (total) {
      const percent = Math.round((current / total) * 100);
      logger.debug(`Extracting: ${current}/${total} (${percent}%)`);
    } else {
      logger.debug(`Extracting: ${current} rows`);
    }
  }
}
