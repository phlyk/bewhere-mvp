/**
 * French Monthly Crime CSV Extractor (État 4001)
 *
 * Extracts crime statistics from French État 4001 CSV files.
 * Handles Latin-1 encoding, semicolon delimiters, and département columns.
 *
 * Data source: data.gouv.fr (Ministère de l'Intérieur)
 */

import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import * as path from 'path';
import {
    BaseExtractor,
    ExtractionResult,
    ExtractorOptions,
} from '../../core/extractor';
import { downloadFile } from '../../utils/download';
import { logger } from '../../utils/logger';
import {
    DEPARTEMENT_NAME_TO_CODE,
    DepartementColumnMapping,
    ETAT4001_COLUMN_STRUCTURE,
    Etat4001ParsedRow,
    FranceMonthlyMetadata,
    isUnusedIndex
} from './france-monthly.types';

/**
 * URL template for État 4001 monthly data
 * Replace {year} and {month} with actual values
 */
export const ETAT4001_URL_TEMPLATE =
  'https://www.data.gouv.fr/fr/datasets/r/{resource_id}';

/**
 * Known resource IDs for État 4001 files on data.gouv.fr
 */
export const ETAT4001_RESOURCES: Record<string, string> = {
  // Sample/test resource
  'sample': 'local',
};

/**
 * Extractor options for France monthly crime data
 */
export interface FranceMonthlyExtractorOptions extends ExtractorOptions {
  /** Expected file encoding (default: latin1) */
  encoding?: BufferEncoding | string;
  /** CSV delimiter (default: semicolon) */
  delimiter?: string;
  /** Number of header rows to skip (default: 2) */
  headerRowsToSkip?: number;
  /** Year of the data (extracted from filename if not provided) */
  year?: number;
  /** Month of the data (extracted from filename if not provided) */
  month?: number;
  /** Minimum expected crime category rows */
  minRows?: number;
  /** Minimum expected départements */
  minDepartements?: number;
}

/**
 * France Monthly Crime CSV Extractor
 *
 * Handles the specific format of État 4001 CSV files:
 * - Latin-1 encoding (common in French government data)
 * - Semicolon delimiter
 * - First two rows are title/header
 * - Third row contains column headers with département names
 * - Subsequent rows are crime categories with counts
 */
export class FranceMonthlyExtractor extends BaseExtractor<Etat4001ParsedRow> {
  protected monthlyOptions: FranceMonthlyExtractorOptions;
  private departementMappings: DepartementColumnMapping[] = [];
  private metadata: FranceMonthlyMetadata | null = null;

  constructor(options: FranceMonthlyExtractorOptions) {
    super(options);
    this.monthlyOptions = {
      encoding: 'latin1',
      delimiter: ';',
      headerRowsToSkip: 2,
      minRows: 90, // At least 90 active crime categories
      minDepartements: 90, // At least 90 départements
      ...options,
    };
  }

  /**
   * Validate the source before extraction
   */
  async validate(): Promise<boolean> {
    const source = this.monthlyOptions.source;

    // Check if it's a local file
    if (fs.existsSync(source)) {
      const stats = fs.statSync(source);
      if (stats.size < 1000) {
        logger.error(`File too small: ${source} (${stats.size} bytes)`);
        return false;
      }
      return true;
    }

    // Check if it's a URL
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return true; // Will validate after download
    }

    logger.error(`Invalid source: ${source} (not a file or URL)`);
    return false;
  }

  /**
   * Extract crime statistics from État 4001 CSV
   */
  async extract(): Promise<ExtractionResult<Etat4001ParsedRow>> {
    const source = this.monthlyOptions.source;
    const warnings: string[] = [];

    logger.info(`Extracting France monthly crime data from: ${source}`);

    // Get file content (download if URL, read if local)
    let fileContent: Buffer;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      const downloadResult = await downloadFile(source, {
        timeout: 60000,
      });

      if (downloadResult.fromCache) {
        logger.debug(`Using cached file: ${downloadResult.filePath}`);
      } else {
        logger.debug(
          `Downloaded in ${downloadResult.downloadMs}ms (${downloadResult.size} bytes)`,
        );
      }

      fileContent = fs.readFileSync(downloadResult.filePath);
    } else {
      logger.debug(`Reading local file: ${source}`);
      fileContent = fs.readFileSync(source);
    }

    // Decode content (handle Latin-1 encoding)
    const encoding = this.monthlyOptions.encoding || 'latin1';
    let textContent: string;

    try {
      if (encoding === 'latin1' || encoding === 'iso-8859-1') {
        // Use iconv-lite for proper Latin-1 decoding
        textContent = iconv.decode(fileContent, 'iso-8859-1');
      } else {
        textContent = fileContent.toString(encoding as BufferEncoding);
      }
    } catch (error) {
      // Fallback to UTF-8
      logger.warn(`Failed to decode as ${encoding}, falling back to UTF-8`);
      textContent = fileContent.toString('utf-8');
      warnings.push(`Encoding fallback: ${encoding} → UTF-8`);
    }

    // Parse CSV
    const allRows = this.parseCSV(textContent);
    logger.debug(`Parsed ${allRows.length} total rows from CSV`);

    // Skip header rows and extract département column mappings
    const { headerRow, dataRows, skippedTitleRows } = this.splitHeaderAndData(allRows);

    // Log skipped title rows for debugging
    if (skippedTitleRows.length > 0) {
      logger.debug(`Skipped ${skippedTitleRows.length} title/header rows`);
    }

    // Parse département column headers
    this.departementMappings = this.parseDepartementHeaders(headerRow);
    logger.info(`Found ${this.departementMappings.length} département columns`);

    if (this.departementMappings.length < (this.monthlyOptions.minDepartements || 90)) {
      warnings.push(
        `Low département count: ${this.departementMappings.length} (expected ≥${this.monthlyOptions.minDepartements})`,
      );
    }

    // Extract year/month from source filename if not provided
    const { year, month } = this.extractDateFromSource(source);

    // Parse data rows
    const parsedRows: Etat4001ParsedRow[] = [];
    let skippedCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + this.monthlyOptions.headerRowsToSkip! + 2; // +2 for 1-based and header row

      try {
        const parsed = this.parseDataRow(row, rowNum);

        if (parsed === null) {
          skippedCount++;
          continue;
        }

        // Add source date if available
        if (year && month) {
          parsed.sourceDate = { year, month };
        }

        parsedRows.push(parsed);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`Row ${rowNum}: ${message}`);
        skippedCount++;
      }
    }

    logger.info(
      `Extracted ${parsedRows.length} crime categories, skipped ${skippedCount} rows`,
    );

    // Store metadata
    this.metadata = {
      source,
      encoding: encoding as string,
      reportMonth: month,
      reportYear: year,
      departementCount: this.departementMappings.length,
      categoryCount: parsedRows.length,
      departementOrder: this.departementMappings.map((m) => m.departementCode),
    };

    // Validate row count
    if (parsedRows.length < (this.monthlyOptions.minRows || 90)) {
      warnings.push(
        `Low category count: ${parsedRows.length} (expected ≥${this.monthlyOptions.minRows})`,
      );
    }

    return {
      data: parsedRows,
      source,
      rowCount: parsedRows.length,
      extractedAt: new Date(),
      warnings,
      encoding: encoding as string,
    };
  }

  /**
   * Get metadata from the last extraction
   */
  getMetadata(): FranceMonthlyMetadata | null {
    return this.metadata;
  }

  /**
   * Get département column mappings from the last extraction
   */
  getDepartementMappings(): DepartementColumnMapping[] {
    return this.departementMappings;
  }

  /**
   * Parse CSV content into rows
   */
  private parseCSV(content: string): string[][] {
    const delimiter = this.monthlyOptions.delimiter || ';';

    // Use csv-parse in sync mode
    const records = parse(content, {
      delimiter,
      relax_column_count: true, // Allow varying column counts
      relax_quotes: true, // Handle malformed quotes
      skip_empty_lines: false, // Keep track of line numbers
      trim: false, // Preserve whitespace (trim manually)
    }) as string[][];

    return records;
  }

  /**
   * Split rows into header row and data rows
   */
  private splitHeaderAndData(allRows: string[][]): {
    headerRow: string[];
    dataRows: string[][];
    skippedTitleRows: string[][];
  } {
    const skipCount = this.monthlyOptions.headerRowsToSkip || 2;

    // Find the actual header row (contains "N°Index" or département names)
    let headerRowIndex = skipCount;

    for (let i = 0; i < Math.min(allRows.length, skipCount + 3); i++) {
      const row = allRows[i];
      const firstCell = (row[0] || '').toLowerCase().trim();
      const secondCell = (row[1] || '').toLowerCase().trim();

      // Header row detection heuristics
      if (
        firstCell.includes('index') ||
        firstCell === 'n°index' ||
        secondCell.includes('index') ||
        secondCell.includes('etat 4001')
      ) {
        headerRowIndex = i;
        break;
      }
    }

    const skippedTitleRows = allRows.slice(0, headerRowIndex);
    const headerRow = allRows[headerRowIndex] || [];
    const dataRows = allRows.slice(headerRowIndex + 1);

    return { headerRow, dataRows, skippedTitleRows };
  }

  /**
   * Parse département column headers and create mappings
   */
  private parseDepartementHeaders(headerRow: string[]): DepartementColumnMapping[] {
    const mappings: DepartementColumnMapping[] = [];
    const { FIRST_DEPARTEMENT_COLUMN } = ETAT4001_COLUMN_STRUCTURE;

    for (let i = FIRST_DEPARTEMENT_COLUMN; i < headerRow.length; i++) {
      const headerText = (headerRow[i] || '').trim();

      if (!headerText) {
        continue;
      }

      const mapping = this.parseDepartementHeader(headerText, i);

      if (mapping) {
        mappings.push(mapping);
      } else {
        logger.warn(`Unrecognized département header at column ${i}: "${headerText}"`);
      }
    }

    return mappings;
  }

  /**
   * Parse a single département header to extract code and name
   */
  private parseDepartementHeader(
    headerText: string,
    columnIndex: number,
  ): DepartementColumnMapping | null {
    // Normalize header text
    const normalized = headerText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/['']/g, "'") // Normalize quotes
      .trim();

    // Try direct lookup with various formats
    const lookupKeys = [
      normalized,
      normalized.replace(/-/g, ' '),
      normalized.replace(/ /g, '-'),
      headerText.toLowerCase().trim(),
    ];

    for (const key of lookupKeys) {
      const code = DEPARTEMENT_NAME_TO_CODE[key];
      if (code && code !== 'METRO') {
        return {
          columnIndex,
          headerText,
          departementCode: code,
          departementName: headerText,
        };
      }
    }

    // Try extracting code from format like "01-Ain" or "2A-Corse-du-Sud"
    const codeMatch = headerText.match(/^(\d{1,2}[AB]?)\s*[-–—]\s*(.+)$/i);
    if (codeMatch) {
      let code = codeMatch[1].padStart(2, '0');
      // Handle Corsica special case
      if (code.toUpperCase().endsWith('A') || code.toUpperCase().endsWith('B')) {
        code = '2' + code.charAt(code.length - 1).toUpperCase();
      }
      return {
        columnIndex,
        headerText,
        departementCode: code,
        departementName: codeMatch[2].trim(),
      };
    }

    // Skip known non-département columns
    if (
      normalized === 'metropole' ||
      normalized === 'france metropolitaine' ||
      normalized === '' ||
      normalized.includes('total')
    ) {
      return null;
    }

    return null;
  }

  /**
   * Parse a data row into a structured crime category
   */
  private parseDataRow(row: string[], rowNum: number): Etat4001ParsedRow | null {
    const { INDEX_COLUMN, CATEGORY_COLUMN, METROPOLE_COLUMN } = ETAT4001_COLUMN_STRUCTURE;

    // Skip empty rows
    if (!row || row.length < 3) {
      return null;
    }

    // Parse index
    const indexStr = (row[INDEX_COLUMN] || '').trim();
    if (!indexStr || indexStr === '') {
      return null;
    }

    // Extract numeric index (handle formats like "01", "1", "107")
    const indexMatch = indexStr.match(/^(\d+)/);
    if (!indexMatch) {
      logger.debug(`Row ${rowNum}: Non-numeric index "${indexStr}", skipping`);
      return null;
    }

    const index = parseInt(indexMatch[1], 10);

    // Skip unused indices
    if (isUnusedIndex(index)) {
      logger.debug(`Row ${rowNum}: Skipping unused index ${index}`);
      return null;
    }

    // Parse category name
    const categoryName = (row[CATEGORY_COLUMN] || '').trim();
    if (!categoryName) {
      logger.debug(`Row ${rowNum}: Empty category name, skipping`);
      return null;
    }

    // Parse metropolitan total
    const metropoleTotal = this.parseNumericValue(row[METROPOLE_COLUMN] || '0');

    // Parse département counts
    const departementCounts: Record<string, number> = {};

    for (const mapping of this.departementMappings) {
      const value = row[mapping.columnIndex];
      const count = this.parseNumericValue(value || '0');
      departementCounts[mapping.departementCode] = count;
    }

    return {
      index,
      categoryName,
      metropoleTotal,
      departementCounts,
    };
  }

  /**
   * Parse numeric value from French number format
   * Handles: "1 234", "1,234", "1234", ""
   */
  private parseNumericValue(value: string): number {
    if (!value || value.trim() === '') {
      return 0;
    }

    // Remove spaces (French thousand separator)
    // Remove any non-digit characters except for decimal separators
    const cleaned = value
      .replace(/\s+/g, '') // Remove spaces
      .replace(/[^\d,.-]/g, '') // Keep digits, comma, period, minus
      .replace(/,/g, '.'); // Convert comma to period for decimals

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num); // Crime counts are integers
  }

  /**
   * Extract year and month from source filename or URL
   */
  private extractDateFromSource(source: string): { year?: number; month?: number } {
    // If explicitly provided, use those
    if (this.monthlyOptions.year && this.monthlyOptions.month) {
      return {
        year: this.monthlyOptions.year,
        month: this.monthlyOptions.month,
      };
    }

    // Try to extract from filename
    const filename = path.basename(source);

    // Pattern: juin-2012, janvier-2020, etc.
    const frenchMonthPattern =
      /(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)[_-]?(\d{4})/i;
    const frenchMatch = filename.match(frenchMonthPattern);

    if (frenchMatch) {
      const monthName = frenchMatch[1].toLowerCase();
      const year = parseInt(frenchMatch[2], 10);
      const month = FRENCH_MONTH_NAMES[monthName];

      if (month) {
        logger.debug(`Extracted date from filename: ${month}/${year}`);
        return { year, month };
      }
    }

    // Pattern: 2012-06, 06-2012, 202012, etc.
    const numericPattern = /(\d{4})[_-]?(\d{2})|(\d{2})[_-]?(\d{4})/;
    const numericMatch = filename.match(numericPattern);

    if (numericMatch) {
      if (numericMatch[1]) {
        // Format: YYYY-MM
        const year = parseInt(numericMatch[1], 10);
        const month = parseInt(numericMatch[2], 10);
        if (month >= 1 && month <= 12) {
          return { year, month };
        }
      } else if (numericMatch[3]) {
        // Format: MM-YYYY
        const month = parseInt(numericMatch[3], 10);
        const year = parseInt(numericMatch[4], 10);
        if (month >= 1 && month <= 12) {
          return { year, month };
        }
      }
    }

    logger.debug(`Could not extract date from source: ${source}`);
    return {};
  }
}

/**
 * French month name to number mapping
 */
const FRENCH_MONTH_NAMES: Record<string, number> = {
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
};
