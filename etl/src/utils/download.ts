/**
 * File download utility with caching
 *
 * Downloads files from URLs with caching support to avoid
 * repeated downloads during development/testing.
 */

import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { etlConfig } from '../config/etl.config';
import { logger } from './logger';

/**
 * Download options
 */
export interface DownloadOptions {
  /** Force download even if cached */
  force?: boolean;
  /** Expected encoding (for text files) */
  encoding?: BufferEncoding;
  /** Request timeout in ms */
  timeout?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Download result
 */
export interface DownloadResult {
  /** Local file path */
  filePath: string;
  /** Whether the file was downloaded or served from cache */
  fromCache: boolean;
  /** File size in bytes */
  size: number;
  /** Download duration in ms (0 if from cache) */
  downloadMs: number;
}

/**
 * Generate cache key from URL
 */
function getCacheKey(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const urlObj = new URL(url);
  const ext = path.extname(urlObj.pathname) || '.dat';
  return `${hash}${ext}`;
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): string {
  const cacheDir = etlConfig.cacheDir;
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    logger.debug(`Created cache directory: ${cacheDir}`);
  }
  return cacheDir;
}

/**
 * Check if cached file is still valid
 */
function isCacheValid(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    const age = Date.now() - stats.mtime.getTime();
    return age < etlConfig.cacheMaxAge;
  } catch {
    return false;
  }
}

/**
 * Download a file with caching support
 */
export async function downloadFile(
  url: string,
  options: DownloadOptions = {},
): Promise<DownloadResult> {
  const cacheDir = ensureCacheDir();
  const cacheKey = getCacheKey(url);
  const filePath = path.join(cacheDir, cacheKey);

  // Check cache
  if (!options.force && isCacheValid(filePath)) {
    logger.debug(`Using cached file: ${filePath}`);
    const stats = fs.statSync(filePath);
    return {
      filePath,
      fromCache: true,
      size: stats.size,
      downloadMs: 0,
    };
  }

  // Download file
  logger.info(`Downloading: ${url}`);
  const startTime = Date.now();

  try {
    const response: AxiosResponse<Buffer> = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: options.timeout || etlConfig.requestTimeout,
      headers: options.headers,
      maxRedirects: 5,
    });

    // Save to cache
    fs.writeFileSync(filePath, response.data);
    const downloadMs = Date.now() - startTime;

    logger.info(`Downloaded ${response.data.length} bytes in ${downloadMs}ms`);

    return {
      filePath,
      fromCache: false,
      size: response.data.length,
      downloadMs,
    };
  } catch (error) {
    logger.error(`Download failed: ${url}`, error);
    throw new Error(`Failed to download ${url}: ${error}`);
  }
}

/**
 * Download and read file content as string
 */
export async function downloadText(
  url: string,
  options: DownloadOptions = {},
): Promise<string> {
  const result = await downloadFile(url, options);
  const encoding = options.encoding || 'utf-8';
  return fs.readFileSync(result.filePath, { encoding });
}

/**
 * Download and parse JSON
 */
export async function downloadJson<T = unknown>(
  url: string,
  options: DownloadOptions = {},
): Promise<T> {
  const content = await downloadText(url, options);
  return JSON.parse(content) as T;
}

/**
 * Clear the download cache
 */
export function clearCache(): void {
  const cacheDir = etlConfig.cacheDir;
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    logger.info(`Cleared cache directory: ${cacheDir}`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { fileCount: number; totalSize: number } {
  const cacheDir = etlConfig.cacheDir;
  if (!fs.existsSync(cacheDir)) {
    return { fileCount: 0, totalSize: 0 };
  }

  const files = fs.readdirSync(cacheDir);
  let totalSize = 0;

  for (const file of files) {
    const stats = fs.statSync(path.join(cacheDir, file));
    totalSize += stats.size;
  }

  return { fileCount: files.length, totalSize };
}
