/**
 * ETL Pipeline Implementations
 *
 * Exports all ETL pipelines for loading data into BeWhere database.
 */

// Département geometry pipeline (Task 3.3)
export * from './departements';

// Population pipeline (Task 3.4)
export * from './population';

// French crime data pipelines (Phase 4)
export * from './france-monthly';
// export * from './france-timeseries'; // TODO: Implement
