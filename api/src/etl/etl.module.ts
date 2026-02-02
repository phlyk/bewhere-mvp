import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';
import { CategoryMapping, DataSourceEntity, EtlRun } from './entities';

/**
 * ETL module for managing data sources and ETL tracking.
 *
 * This module provides:
 * - DataSourceEntity (external data source metadata)
 * - CategoryMapping entity (source→canonical category mappings)
 * - EtlRun entity (ETL run history and status)
 * - DataSourcesController/Service for GET /data-sources endpoints
 * - Future: EtlService for orchestrating data imports
 */
@Module({
  imports: [TypeOrmModule.forFeature([CategoryMapping, DataSourceEntity, EtlRun])],
  controllers: [DataSourcesController],
  providers: [DataSourcesService],
  exports: [TypeOrmModule, DataSourcesService],
})
export class EtlModule {}
