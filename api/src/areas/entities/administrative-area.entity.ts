import { MultiPolygon } from 'geojson';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { multiPolygonColumn } from '../../common/postgis';

/**
 * Administrative boundary level following NUTS classification.
 * - COUNTRY: National level (NUTS-0) - France
 * - REGION: French regions (NUTS-2) - for optional aggregation
 * - DEPARTMENT: French départements (NUTS-3) - primary granularity
 */
export enum AdminLevel {
  COUNTRY = 'country',
  REGION = 'region',
  DEPARTMENT = 'department',
}

/**
 * Administrative area entity representing geographic regions with boundaries.
 *
 * This is the foundational spatial entity for BeWhere MVP.
 * Primary use case: French départements (96 metropolitan + 5 overseas).
 *
 * @example
 * // Example: département of Paris
 * {
 *   code: '75',
 *   name: 'Paris',
 *   level: AdminLevel.DEPARTMENT,
 *   parentCode: 'IDF', // Île-de-France region
 *   countryCode: 'FR',
 *   geometry: { type: 'MultiPolygon', coordinates: [...] }
 * }
 */
@Entity('administrative_areas')
@Index(['code', 'level'], { unique: true })
@Index(['level'])
@Index(['parentCode'])
@Index(['countryCode'])
export class AdministrativeArea {
  /**
   * Auto-generated primary key.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Official code for this administrative area.
   * - For départements: INSEE code (e.g., '75' for Paris, '971' for Guadeloupe)
   * - For regions: Region code (e.g., 'IDF' for Île-de-France)
   * - For countries: ISO 3166-1 alpha-2 (e.g., 'FR')
   */
  @Column({ type: 'varchar', length: 10 })
  code: string;

  /**
   * Official name of the administrative area.
   * Stored in the local language (French for France).
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * English name of the administrative area (for international display).
   * May be the same as `name` if no translation exists.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  nameEn: string | null;

  /**
   * Administrative level following NUTS classification.
   */
  @Column({
    type: 'enum',
    enum: AdminLevel,
  })
  level: AdminLevel;

  /**
   * Parent area code for hierarchical relationships.
   * - Départements have parent regions
   * - Regions have parent country
   * - Countries have no parent (null)
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  parentCode: string | null;

  /**
   * ISO 3166-1 alpha-2 country code.
   * All French administrative areas have 'FR'.
   */
  @Column({ type: 'char', length: 2 })
  countryCode: string;

  /**
   * PostGIS geometry column storing the administrative boundary.
   * Uses MultiPolygon to support areas with multiple disconnected regions
   * (e.g., overseas territories, islands).
   *
   * SRID: 4326 (WGS84) for compatibility with GeoJSON and Mapbox.
   */
  @Column(multiPolygonColumn({ nullable: true }))
  @Index({ spatial: true })
  geometry: MultiPolygon | null;

  /**
   * Area in square kilometers.
   * Can be computed from geometry or sourced from official data.
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  areaKm2: number | null;

  /**
   * Record creation timestamp.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Record last update timestamp.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
