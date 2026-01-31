import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrimeCategory } from './entities';

/**
 * Crimes module for managing crime categories and observations.
 *
 * This module provides:
 * - CrimeCategory entity (canonical crime taxonomy)
 * - Future: CrimeObservation entity (actual crime data)
 * - Future: CategoryMapping entity (source→canonical mappings)
 * - Future: CrimesController for read-only API endpoints
 * - Future: CrimesService for business logic
 */
@Module({
  imports: [TypeOrmModule.forFeature([CrimeCategory])],
  exports: [TypeOrmModule],
})
export class CrimesModule {}
