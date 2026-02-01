/**
 * French Département Geometry Extractor
 *
 * Downloads GeoJSON boundary data for French départements from data.gouv.fr
 * Uses the official IGN (Institut Géographique National) administrative boundaries.
 */

import * as fs from 'fs';
import {
    BaseExtractor,
    ExtractionResult,
    ExtractorOptions,
} from '../../core/extractor';
import { downloadFile } from '../../utils/download';
import { logger } from '../../utils/logger';
import {
    DepartementGeoJsonFeature,
    DepartementsGeoJson,
} from './departements.types';

/**
 * Official GeoJSON sources for French administrative boundaries
 *
 * Primary: geo.api.gouv.fr (simplified, fast)
 * Alternative: etalab/decoupage-administratif (full resolution)
 */
export const DEPARTEMENTS_GEOJSON_SOURCES = {
  /**
   * geo.api.gouv.fr - Official French government API
   * Provides simplified geometries suitable for web display
   */
  geoApiGouv: 'https://geo.api.gouv.fr/departements?format=geojson&geometry=contour',

  /**
   * Etalab/decoupage-administratif - Raw IGN data
   * Full resolution polygons (larger file, more detail)
   */
  etalabFull:
    'https://raw.githubusercontent.com/etalab/decoupage-administratif/master/data/departements.geojson',

  /**
   * OpenDataSoft - Alternative source
   * Includes additional metadata
   */
  openDataSoft:
    'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-departement/exports/geojson',
};

/**
 * Extractor options specific to département GeoJSON
 */
export interface DepartementsExtractorOptions extends ExtractorOptions {
  /** Include overseas départements (DOM) */
  includeOverseas?: boolean;
  /** Minimum number of features expected (for validation) */
  minFeatures?: number;
}

/**
 * Département GeoJSON Extractor
 *
 * Downloads and parses GeoJSON file containing French département boundaries.
 * Validates the structure and feature count before returning.
 */
export class DepartementsExtractor extends BaseExtractor<DepartementGeoJsonFeature> {
  protected departementOptions: DepartementsExtractorOptions;

  constructor(options: DepartementsExtractorOptions) {
    super(options);
    this.departementOptions = {
      includeOverseas: true,
      minFeatures: 96, // At minimum, expect metropolitan départements
      ...options,
    };
  }

  /**
   * Extract département features from GeoJSON source
   */
  async extract(): Promise<ExtractionResult<DepartementGeoJsonFeature>> {
    const source = this.departementOptions.source;
    const warnings: string[] = [];

    logger.info(`Extracting département geometries from: ${source}`);

    // Download or retrieve from cache
    const downloadResult = await downloadFile(source, {
      timeout: 60000, // 60 seconds for large GeoJSON
    });

    if (downloadResult.fromCache) {
      logger.debug(`Using cached file: ${downloadResult.filePath}`);
    } else {
      logger.debug(
        `Downloaded in ${downloadResult.downloadMs}ms (${downloadResult.size} bytes)`,
      );
    }

    // Read and parse GeoJSON
    const content = fs.readFileSync(downloadResult.filePath, 'utf-8');
    let geojson: DepartementsGeoJson;

    try {
      geojson = JSON.parse(content) as DepartementsGeoJson;
    } catch (error) {
      throw new Error(`Failed to parse GeoJSON: ${error}`);
    }

    // Validate structure
    if (geojson.type !== 'FeatureCollection') {
      throw new Error(`Invalid GeoJSON type: expected FeatureCollection, got ${geojson.type}`);
    }

    if (!Array.isArray(geojson.features)) {
      throw new Error('Invalid GeoJSON: features is not an array');
    }

    // Filter features
    let features = geojson.features.filter((f) => this.isValidFeature(f));

    // Filter out overseas if requested
    if (!this.departementOptions.includeOverseas) {
      const beforeCount = features.length;
      features = features.filter((f) => !this.isOverseas(f));
      const removed = beforeCount - features.length;
      if (removed > 0) {
        warnings.push(`Filtered out ${removed} overseas département(s)`);
      }
    }

    // Apply maxRows if specified
    if (this.departementOptions.maxRows && this.departementOptions.maxRows < features.length) {
      features = features.slice(0, this.departementOptions.maxRows);
      warnings.push(`Limited to ${this.departementOptions.maxRows} features (maxRows)`);
    }

    // Validate minimum feature count
    if (features.length < (this.departementOptions.minFeatures || 96)) {
      warnings.push(
        `Feature count (${features.length}) is below expected minimum (${this.departementOptions.minFeatures})`,
      );
    }

    logger.info(`Extracted ${features.length} département features`);

    return {
      data: features,
      source,
      rowCount: features.length,
      extractedAt: new Date(),
      warnings,
    };
  }

  /**
   * Validate the source URL is accessible
   */
  async validate(): Promise<boolean> {
    const source = this.departementOptions.source;

    if (!source || source.length === 0) {
      logger.error('Source URL is required');
      return false;
    }

    // Check if it's a valid URL
    try {
      new URL(source);
    } catch {
      // Might be a local file path
      if (!fs.existsSync(source)) {
        logger.error(`Source is not a valid URL or file path: ${source}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a GeoJSON feature is a valid département
   */
  private isValidFeature(feature: DepartementGeoJsonFeature): boolean {
    // Must have properties with code
    if (!feature.properties || !feature.properties.code) {
      logger.warn('Skipping feature without code property');
      return false;
    }

    // Must have geometry
    if (!feature.geometry) {
      logger.warn(`Skipping feature ${feature.properties.code}: no geometry`);
      return false;
    }

    // Geometry must be Polygon or MultiPolygon
    const geomType = feature.geometry.type;
    if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') {
      logger.warn(
        `Skipping feature ${feature.properties.code}: invalid geometry type ${geomType}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Check if a département is overseas (DOM)
   */
  private isOverseas(feature: DepartementGeoJsonFeature): boolean {
    const code = feature.properties.code;
    // Overseas départements have codes starting with 97
    return code.startsWith('97');
  }
}

/**
 * Factory function to create a département extractor with default source
 */
export function createDepartementsExtractor(
  options: Partial<DepartementsExtractorOptions> = {},
): DepartementsExtractor {
  return new DepartementsExtractor({
    source: options.source || DEPARTEMENTS_GEOJSON_SOURCES.geoApiGouv,
    ...options,
  });
}
