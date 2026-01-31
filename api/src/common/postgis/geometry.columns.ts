/**
 * Column definition helpers for PostGIS geometry types in TypeORM.
 *
 * These functions return ColumnOptions that can be spread into @Column decorators
 * to properly configure PostGIS geometry columns with correct SRID and type.
 *
 * Usage:
 * ```typescript
 * @Column(polygonColumn())
 * boundary: PostGISPolygon;
 *
 * @Column(multiPolygonColumn())
 * geometry: PostGISMultiPolygon;
 * ```
 */

import { ColumnOptions } from 'typeorm';
import { GeometryTransformer } from './geometry.transformer';
import { DEFAULT_SRID } from './geometry.types';

export interface GeometryColumnOptions {
  /** Spatial Reference System ID. Defaults to 4326 (WGS84). */
  srid?: number;
  /** Whether the column can be null. Defaults to false. */
  nullable?: boolean;
}

/**
 * Create column options for a PostGIS Point column.
 */
export function pointColumn(options: GeometryColumnOptions = {}): ColumnOptions {
  return {
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: options.srid ?? DEFAULT_SRID,
    nullable: options.nullable ?? false,
    transformer: GeometryTransformer,
  };
}

/**
 * Create column options for a PostGIS Polygon column.
 */
export function polygonColumn(options: GeometryColumnOptions = {}): ColumnOptions {
  return {
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: options.srid ?? DEFAULT_SRID,
    nullable: options.nullable ?? false,
    transformer: GeometryTransformer,
  };
}

/**
 * Create column options for a PostGIS MultiPolygon column.
 * This is the typical type for administrative boundaries (départements, régions).
 */
export function multiPolygonColumn(options: GeometryColumnOptions = {}): ColumnOptions {
  return {
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: options.srid ?? DEFAULT_SRID,
    nullable: options.nullable ?? false,
    transformer: GeometryTransformer,
  };
}

/**
 * Create column options for a generic PostGIS Geometry column.
 * Use this when the geometry type may vary (Point, Polygon, etc.).
 */
export function geometryColumn(options: GeometryColumnOptions = {}): ColumnOptions {
  return {
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: options.srid ?? DEFAULT_SRID,
    nullable: options.nullable ?? false,
    transformer: GeometryTransformer,
  };
}
