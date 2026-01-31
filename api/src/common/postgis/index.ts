/**
 * PostGIS type definitions and utilities for TypeORM entities.
 *
 * TypeORM has built-in support for PostGIS geometry types through the 'geometry' column type.
 * This module provides TypeScript type definitions and GeoJSON transformers for working
 * with spatial data in the BeWhere application.
 *
 * Usage example:
 * ```typescript
 * import { multiPolygonColumn, PostGISMultiPolygon } from '@/common/postgis';
 *
 * @Entity('administrative_areas')
 * export class AdministrativeAreaEntity {
 *   @Column(multiPolygonColumn())
 *   boundary: PostGISMultiPolygon;
 * }
 * ```
 */

export * from './geometry.columns';
export * from './geometry.transformer';
export * from './geometry.types';

