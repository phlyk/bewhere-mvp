/**
 * French Département Geometry Transformer
 *
 * Transforms GeoJSON features into database-ready records for the
 * administrative_areas table.
 */

import {
    BaseTransformer,
    TransformerOptions,
} from '../../core/transformer';
import { logger } from '../../utils/logger';
import {
    DEPARTEMENT_TO_REGION,
    DepartementGeoJsonFeature,
    DepartementRecord,
    FRENCH_REGIONS,
} from './departements.types';

/**
 * Transformer options specific to département data
 */
export interface DepartementsTransformerOptions extends TransformerOptions {
  /** Skip validation of geometry */
  skipGeometryValidation?: boolean;
}

/**
 * Département Geometry Transformer
 *
 * Converts GeoJSON features to AdministrativeArea records:
 * - Extracts code and name from properties
 * - Converts geometry to WKT format for PostGIS
 * - Resolves parent region code
 * - Sets standard metadata (level, countryCode)
 */
export class DepartementsTransformer extends BaseTransformer<
  DepartementGeoJsonFeature,
  DepartementRecord
> {
  protected transformerOptions: DepartementsTransformerOptions;

  constructor(options: DepartementsTransformerOptions = {}) {
    super(options);
    this.transformerOptions = {
      skipGeometryValidation: false,
      ...options,
    };
  }

  /**
   * Transform a single GeoJSON feature to a database record
   */
  protected async transformRow(
    feature: DepartementGeoJsonFeature,
    index: number,
  ): Promise<DepartementRecord | null> {
    const { properties, geometry } = feature;

    // Validate required fields
    if (!properties.code) {
      this.addError(index, 'Missing département code', 'code');
      throw new Error('Missing département code');
    }

    if (!properties.nom) {
      this.addError(index, 'Missing département name', 'nom');
      throw new Error('Missing département name');
    }

    // Validate geometry
    if (!this.transformerOptions.skipGeometryValidation) {
      if (!this.isValidGeometry(geometry, index)) {
        throw new Error(`Invalid geometry for département ${properties.code}`);
      }
    }

    // Convert geometry to WKT
    const wkt = this.geometryToWkt(geometry);

    // Resolve parent region
    const parentCode = this.resolveParentRegion(properties);

    // Create the record
    const record: DepartementRecord = {
      code: properties.code,
      name: properties.nom,
      nameEn: null, // French département names are typically not translated
      level: 'department',
      parentCode,
      countryCode: 'FR',
      geometry: wkt,
      geojson: geometry,
    };

    return record;
  }

  /**
   * Validate transformer configuration
   */
  async validate(): Promise<boolean> {
    // No special validation needed for this transformer
    return true;
  }

  /**
   * Validate a GeoJSON geometry
   */
  private isValidGeometry(
    geometry: DepartementGeoJsonFeature['geometry'],
    index: number,
  ): boolean {
    if (!geometry) {
      this.addError(index, 'Geometry is null or undefined', 'geometry');
      return false;
    }

    const geomType = geometry.type;
    if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') {
      this.addError(
        index,
        `Invalid geometry type: ${geomType}`,
        'geometry.type',
        geomType,
      );
      return false;
    }

    if (!geometry.coordinates || geometry.coordinates.length === 0) {
      this.addError(index, 'Geometry has no coordinates', 'geometry.coordinates');
      return false;
    }

    return true;
  }

  /**
   * Convert GeoJSON geometry to WKT (Well-Known Text) format
   *
   * PostGIS can ingest WKT directly using ST_GeomFromText()
   */
  private geometryToWkt(geometry: DepartementGeoJsonFeature['geometry']): string {
    const geomType = geometry.type;
    if (geomType === 'Polygon') {
      return this.polygonToWkt(geometry.coordinates as number[][][]);
    } else if (geomType === 'MultiPolygon') {
      return this.multiPolygonToWkt(geometry.coordinates as number[][][][]);
    }
    throw new Error(`Unsupported geometry type: ${geomType}`);
  }

  /**
   * Convert a Polygon to WKT
   */
  private polygonToWkt(coordinates: number[][][]): string {
    const rings = coordinates.map((ring) => {
      const points = ring.map((coord) => `${coord[0]} ${coord[1]}`).join(', ');
      return `(${points})`;
    });
    return `POLYGON(${rings.join(', ')})`;
  }

  /**
   * Convert a MultiPolygon to WKT
   */
  private multiPolygonToWkt(coordinates: number[][][][]): string {
    const polygons = coordinates.map((polygon) => {
      const rings = polygon.map((ring) => {
        const points = ring.map((coord) => `${coord[0]} ${coord[1]}`).join(', ');
        return `(${points})`;
      });
      return `(${rings.join(', ')})`;
    });
    return `MULTIPOLYGON(${polygons.join(', ')})`;
  }

  /**
   * Resolve the parent region code for a département
   *
   * Uses the region property if available, otherwise falls back to
   * the DEPARTEMENT_TO_REGION mapping.
   */
  private resolveParentRegion(properties: DepartementGeoJsonFeature['properties']): string | null {
    // First, try to use the region property from the GeoJSON
    if (properties.region) {
      // The GeoJSON might have the region code or region name
      const regionCode = properties.region;

      // If it's a 2-digit code, convert to our 3-letter abbreviation
      if (FRENCH_REGIONS[regionCode]) {
        return FRENCH_REGIONS[regionCode];
      }

      // Return as-is if it's already a code we can use
      return regionCode;
    }

    // Fall back to our static mapping
    const deptCode = properties.code;
    if (DEPARTEMENT_TO_REGION[deptCode]) {
      const regionCode = DEPARTEMENT_TO_REGION[deptCode];
      return FRENCH_REGIONS[regionCode] || regionCode;
    }

    // Log warning if no region found
    logger.warn(`Could not resolve parent region for département ${deptCode}`);
    return null;
  }
}

/**
 * Factory function to create a département transformer
 */
export function createDepartementsTransformer(
  options: DepartementsTransformerOptions = {},
): DepartementsTransformer {
  return new DepartementsTransformer(options);
}
