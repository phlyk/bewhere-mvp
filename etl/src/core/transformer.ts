/**
 * Base Transformer Class
 *
 * Abstract base class for data transformation.
 * Handles mapping, validation, and normalization of extracted data.
 */

import { logger } from '../utils/logger';

/**
 * Transformation result metadata
 */
export interface TransformationResult<T> {
  /** Transformed data rows */
  data: T[];
  /** Number of rows successfully transformed */
  transformedCount: number;
  /** Number of rows skipped */
  skippedCount: number;
  /** Transformation errors */
  errors: TransformationError[];
  /** Any warnings during transformation */
  warnings: string[];
}

/**
 * Transformation error details
 */
export interface TransformationError {
  /** Row index in source data */
  rowIndex: number;
  /** Field that caused the error */
  field?: string;
  /** Error message */
  message: string;
  /** Original value that caused the error */
  originalValue?: unknown;
}

/**
 * Transformer options
 */
export interface TransformerOptions {
  /** Continue on error (skip invalid rows) */
  continueOnError?: boolean;
  /** Maximum errors before aborting */
  maxErrors?: number;
  /** Validate foreign key references */
  validateReferences?: boolean;
}

/**
 * Abstract base class for data transformers
 *
 * @template TRaw - Type of raw input data
 * @template TTransformed - Type of transformed output data
 */
export abstract class BaseTransformer<TRaw, TTransformed> {
  protected options: TransformerOptions;
  protected errors: TransformationError[] = [];
  protected warnings: string[] = [];

  constructor(options: TransformerOptions = {}) {
    this.options = {
      continueOnError: true,
      maxErrors: 100,
      validateReferences: true,
      ...options,
    };
  }

  /**
   * Transform a batch of raw data to the target format
   */
  async transform(rawData: TRaw[]): Promise<TransformationResult<TTransformed>> {
    this.errors = [];
    this.warnings = [];
    const transformed: TTransformed[] = [];

    for (let i = 0; i < rawData.length; i++) {
      try {
        const result = await this.transformRow(rawData[i], i);
        if (result !== null) {
          transformed.push(result);
        }
      } catch (error) {
        this.addError(i, String(error));

        if (!this.options.continueOnError) {
          throw error;
        }

        if (this.errors.length >= (this.options.maxErrors || 100)) {
          logger.error(`Maximum error count (${this.options.maxErrors}) reached, aborting`);
          throw new Error(`Too many transformation errors: ${this.errors.length}`);
        }
      }
    }

    return {
      data: transformed,
      transformedCount: transformed.length,
      skippedCount: rawData.length - transformed.length,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Transform a single row of data
   * Return null to skip the row
   */
  protected abstract transformRow(row: TRaw, index: number): Promise<TTransformed | null>;

  /**
   * Validate the transformation configuration
   */
  abstract validate(): Promise<boolean>;

  /**
   * Add a transformation error
   */
  protected addError(rowIndex: number, message: string, field?: string, originalValue?: unknown): void {
    this.errors.push({ rowIndex, message, field, originalValue });
    logger.warn(`Transform error at row ${rowIndex}: ${message}`);
  }

  /**
   * Add a warning
   */
  protected addWarning(message: string): void {
    this.warnings.push(message);
    logger.warn(`Transform warning: ${message}`);
  }
}
