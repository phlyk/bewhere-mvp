import type { Geometry } from 'geojson';
import { isGeometry } from './geometry.types';

/**
 * Transformer for PostGIS geometry columns.
 *
 * PostGIS stores geometry in a binary format (WKB), but TypeORM's postgres driver
 * with the `geometry` column type automatically handles conversion to/from GeoJSON.
 *
 * This transformer provides additional type safety and handles edge cases like
 * string-encoded GeoJSON (which can happen in some query scenarios).
 */
export const GeometryTransformer = {
  /**
   * Transform GeoJSON to database format.
   * TypeORM + PostGIS accepts GeoJSON objects directly.
   */
  to(value: Geometry | null | undefined): Geometry | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (!isGeometry(value)) {
      throw new Error(`Invalid geometry value: ${JSON.stringify(value)}`);
    }

    return value;
  },

  /**
   * Transform database value to GeoJSON.
   * The postgres driver returns geometry as GeoJSON objects.
   * Handle edge case where value might be a JSON string.
   */
  from(value: unknown): Geometry | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle string-encoded GeoJSON (edge case)
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (isGeometry(parsed)) {
          return parsed;
        }
      } catch {
        throw new Error(`Failed to parse geometry string: ${value}`);
      }
    }

    // Standard case: value is already a GeoJSON object
    if (isGeometry(value)) {
      return value;
    }

    throw new Error(`Invalid geometry value from database: ${JSON.stringify(value)}`);
  },
};

/**
 * Create a GeoJSON Point from longitude and latitude.
 * Note: GeoJSON uses [longitude, latitude] order (not [lat, lon]).
 */
export function createPoint(longitude: number, latitude: number): Geometry {
  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
}

/**
 * Create a GeoJSON Polygon from an array of coordinate rings.
 * First ring is exterior, subsequent rings are holes.
 * Each ring is an array of [longitude, latitude] pairs.
 * First and last coordinate must be identical to close the ring.
 */
export function createPolygon(
  rings: [number, number][][],
): Geometry {
  return {
    type: 'Polygon',
    coordinates: rings,
  };
}

/**
 * Create a GeoJSON MultiPolygon from an array of polygons.
 * Used for administrative areas that consist of multiple disconnected regions.
 */
export function createMultiPolygon(
  polygons: [number, number][][][],
): Geometry {
  return {
    type: 'MultiPolygon',
    coordinates: polygons,
  };
}
