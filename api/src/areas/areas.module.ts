import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { AdministrativeArea, Population } from './entities';

/**
 * Areas module for managing administrative boundaries and population data.
 *
 * This module provides:
 * - AdministrativeArea entity (départements, regions, countries)
 * - Population entity (yearly population counts per area)
 * - AreasController for read-only API endpoints
 * - AreasService for business logic
 */
@Module({
  imports: [TypeOrmModule.forFeature([AdministrativeArea, Population])],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [TypeOrmModule, AreasService],
})
export class AreasModule {}
