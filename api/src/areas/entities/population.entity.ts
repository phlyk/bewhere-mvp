import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { AdministrativeArea } from './administrative-area.entity';

/**
 * Population entity storing yearly population counts for administrative areas.
 *
 * This table enables:
 * - Calculating crime rates per 100,000 population
 * - Year-over-year population trend analysis
 * - Normalization of crime statistics across areas of different sizes
 *
 * Data sources:
 * - INSEE (Institut National de la Statistique et des Études Économiques)
 * - Official French population estimates (legal population)
 *
 * @example
 * // Population for Paris (75) in 2023
 * {
 *   areaId: 'uuid-for-paris',
 *   year: 2023,
 *   populationCount: 2133111,
 *   source: 'INSEE',
 *   notes: 'Legal population as of January 1, 2023'
 * }
 */
@Entity('population')
@Unique(['areaId', 'year'])
@Index(['year'])
@Index(['areaId'])
export class Population {
  /**
   * Auto-generated primary key.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key to the administrative area.
   */
  @Column({ type: 'uuid' })
  areaId: string;

  /**
   * Reference to the administrative area entity.
   */
  @ManyToOne(() => AdministrativeArea, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'areaId' })
  area: AdministrativeArea;

  /**
   * Year for which this population count applies.
   * Typically January 1st of the given year (legal population).
   */
  @Column({ type: 'smallint' })
  year: number;

  /**
   * Total population count for the area in the given year.
   * Uses bigint to support large population values (e.g., national level).
   */
  @Column({ type: 'bigint' })
  populationCount: number;

  /**
   * Source of the population data.
   * Example: 'INSEE', 'Eurostat', 'Census 2021'
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string | null;

  /**
   * Optional notes about this population record.
   * Example: 'Provisional estimate', 'Census data', 'Legal population'
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

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
