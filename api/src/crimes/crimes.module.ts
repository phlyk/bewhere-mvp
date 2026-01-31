import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrimeCategory, CrimeObservation } from './entities';

/**
 * Crimes module for managing crime categories and observations.
 *
 * This module provides:
 * - CrimeCategory entity (canonical crime taxonomy)
 * - CrimeObservation entity (actual crime data)
 * - Future: CategoryMapping entity (source→canonical mappings)
 * - Future: CrimesController for read-only API endpoints
 * - Future: CrimesService for business logic
 */
@Module({
  imports: [TypeOrmModule.forFeature([CrimeCategory, CrimeObservation])],
  exports: [TypeOrmModule],
})
export class CrimesModule {}
