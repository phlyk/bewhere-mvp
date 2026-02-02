import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrativeArea } from '../areas/entities';
import { DataSourceEntity } from '../etl/entities';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ComparisonController } from './comparison.controller';
import { ComparisonService } from './comparison.service';
import { CrimeCategory, CrimeObservation } from './entities';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';

/**
 * Crimes module for managing crime categories and observations.
 *
 * This module provides:
 * - CrimeCategory entity (canonical crime taxonomy)
 * - CrimeObservation entity (actual crime data)
 * - CategoriesController/Service for GET /categories endpoints
 * - ObservationsController/Service for GET /observations endpoints
 * - ComparisonController/Service for GET /compare/* endpoints
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrimeCategory,
      CrimeObservation,
      // Required for ObservationsService and ComparisonService
      AdministrativeArea,
      DataSourceEntity,
    ]),
  ],
  controllers: [
    CategoriesController,
    ObservationsController,
    ComparisonController,
  ],
  providers: [CategoriesService, ObservationsService, ComparisonService],
  exports: [TypeOrmModule, CategoriesService, ObservationsService, ComparisonService],
})
export class CrimesModule {}
