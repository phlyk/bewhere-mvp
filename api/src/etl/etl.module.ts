import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryMapping, DataSource, EtlRun } from './entities';

/**
 * ETL module for managing data sources and ETL tracking.
 *
 * This module provides:
 * - DataSource entity (external data source metadata)
 * - CategoryMapping entity (source→canonical category mappings)
 * - EtlRun entity (ETL run history and status)
 * - Future: EtlService for orchestrating data imports
 */
@Module({
  imports: [TypeOrmModule.forFeature([CategoryMapping, DataSource, EtlRun])],
  exports: [TypeOrmModule],
})
export class EtlModule {}
