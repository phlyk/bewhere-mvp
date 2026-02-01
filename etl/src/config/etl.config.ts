/**
 * ETL Pipeline configuration
 */

import * as dotenv from 'dotenv';

dotenv.config();

export interface EtlConfig {
  /** Cache directory for downloaded files */
  cacheDir: string;
  /** Maximum age of cached files in milliseconds */
  cacheMaxAge: number;
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Maximum retries for failed requests */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** Batch size for database inserts */
  batchSize: number;
  /** Enable dry run mode (validate without loading) */
  dryRun: boolean;
}

/**
 * Default ETL configuration
 */
export const etlConfig: EtlConfig = {
  cacheDir: process.env.ETL_CACHE_DIR || './cache',
  cacheMaxAge: parseInt(process.env.ETL_CACHE_MAX_AGE || String(7 * 24 * 60 * 60 * 1000), 10), // 7 days
  requestTimeout: parseInt(process.env.ETL_REQUEST_TIMEOUT || '30000', 10),
  maxRetries: parseInt(process.env.ETL_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.ETL_RETRY_DELAY || '1000', 10),
  batchSize: parseInt(process.env.ETL_BATCH_SIZE || '1000', 10),
  dryRun: process.env.ETL_DRY_RUN === 'true',
};
