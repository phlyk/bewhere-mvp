import type {
    Geometry,
    GeometryCollection,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point,
    Polygon,
} from 'geojson';

/**
 * PostGIS geometry type as stored in the database.
 * When using TypeORM with PostGIS, geometry columns can be configured to
 * return data in different formats (WKB, WKT, or GeoJSON).
 *
 * We configure our columns to use GeoJSON format for easy frontend consumption.
 */
export type PostGISGeometry = Geometry;
export type PostGISPoint = Point;
export type PostGISMultiPoint = MultiPoint;
export type PostGISLineString = LineString;
export type PostGISMultiLineString = MultiLineString;
export type PostGISPolygon = Polygon;
export type PostGISMultiPolygon = MultiPolygon;
export type PostGISGeometryCollection = GeometryCollection;

/**
 * Supported PostGIS geometry subtypes for TypeORM column definitions.
 * Use these with the @Column decorator's spatialFeatureType option.
 */
export type SpatialFeatureType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon'
  | 'GeometryCollection'
  | 'Geometry';

/**
 * SRID (Spatial Reference System Identifier) constants.
 * EPSG:4326 (WGS84) is the standard for GPS coordinates (lat/lon).
 */
export const SRID = {
  /** WGS84 - Standard GPS coordinates (longitude, latitude) */
  WGS84: 4326,
  /** Web Mercator - Used by most web maps (Mapbox, Google Maps) */
  WEB_MERCATOR: 3857,
} as const;

/**
 * Default SRID for all geometry columns in BeWhere.
 * We use WGS84 (EPSG:4326) for compatibility with GeoJSON and Mapbox.
 */
export const DEFAULT_SRID = SRID.WGS84;

/**
 * Type guard to check if a value is a valid GeoJSON geometry.
 */
export function isGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    [
      'Point',
      'MultiPoint',
      'LineString',
      'MultiLineString',
      'Polygon',
      'MultiPolygon',
      'GeometryCollection',
    ].includes(obj.type)
  );
}

/**
 * Type guard to check if a value is a valid GeoJSON Point.
 */
export function isPoint(value: unknown): value is Point {
  if (!isGeometry(value)) return false;
  return value.type === 'Point';
}

/**
 * Type guard to check if a value is a valid GeoJSON Polygon.
 */
export function isPolygon(value: unknown): value is Polygon {
  if (!isGeometry(value)) return false;
  return value.type === 'Polygon';
}

/**
 * Type guard to check if a value is a valid GeoJSON MultiPolygon.
 */
export function isMultiPolygon(value: unknown): value is MultiPolygon {
  if (!isGeometry(value)) return false;
  return value.type === 'MultiPolygon';
}
