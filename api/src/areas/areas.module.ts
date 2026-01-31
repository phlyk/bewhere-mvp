import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrativeArea, Population } from './entities';

/**
 * Areas module for managing administrative boundaries and population data.
 *
 * This module provides:
 * - AdministrativeArea entity (départements, regions, countries)
 * - Population entity (yearly population counts per area)
 * - Future: AreasController for read-only API endpoints
 * - Future: AreasService for business logic
 */
@Module({
  imports: [TypeOrmModule.forFeature([AdministrativeArea, Population])],
  exports: [TypeOrmModule],
})
export class AreasModule {}
