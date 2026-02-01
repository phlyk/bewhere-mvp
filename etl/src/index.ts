/**
 * BeWhere ETL Pipeline
 *
 * Entry point for the ETL service. Initializes database connection
 * and runs specified ETL pipelines.
 */

import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  logger.info('BeWhere ETL Pipeline starting...');

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // ETL pipelines are run via CLI commands
    // This entry point is for programmatic execution
    logger.info('ETL Pipeline ready. Use CLI commands to run specific pipelines.');
    logger.info('Available commands:');
    logger.info('  npm run etl:all              - Run all pipelines');
    logger.info('  npm run etl:departements     - Load département geometries');
    logger.info('  npm run etl:population       - Load INSEE population data');
    logger.info('  npm run etl:france-monthly   - Load État 4001 monthly data');
    logger.info('  npm run etl:france-timeseries - Load time series data');

    // Close connection when done
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('ETL Pipeline failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
