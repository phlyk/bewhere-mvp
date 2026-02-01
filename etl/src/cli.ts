/**
 * ETL CLI - Command Line Interface for running ETL pipelines
 *
 * Usage:
 *   npm run etl:all               - Run all pipelines
 *   npm run etl:departements      - Load département geometries
 *   npm run etl:population        - Load INSEE population data
 *   npm run etl:france-monthly    - Load État 4001 monthly data
 *   npm run etl:france-timeseries - Load time series data
 */

import { Command } from 'commander';
import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { EtlOrchestrator } from './orchestrator';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('bewhere-etl')
  .description('BeWhere ETL Pipeline CLI')
  .version('0.1.0');

program
  .command('run')
  .description('Run ETL pipeline(s)')
  .option('--all', 'Run all pipelines in order')
  .option('--dataset <name>', 'Run specific dataset pipeline')
  .option('--dry-run', 'Validate without loading data')
  .option('--force', 'Force re-run even if data exists')
  .action(async (options) => {
    try {
      logger.info('Initializing database connection...');
      await AppDataSource.initialize();
      logger.info('Database connection established');

      const orchestrator = new EtlOrchestrator();

      if (options.all) {
        logger.info('Running all ETL pipelines...');
        await orchestrator.runAll({
          dryRun: options.dryRun,
          force: options.force,
        });
      } else if (options.dataset) {
        logger.info(`Running ETL pipeline: ${options.dataset}`);
        await orchestrator.runDataset(options.dataset, {
          dryRun: options.dryRun,
          force: options.force,
        });
      } else {
        logger.error('Please specify --all or --dataset <name>');
        process.exit(1);
      }

      await AppDataSource.destroy();
      logger.info('ETL pipeline completed successfully');
    } catch (error) {
      logger.error('ETL pipeline failed:', error);
      await AppDataSource.destroy().catch(() => {});
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate data sources and mappings')
  .option('--dataset <name>', 'Validate specific dataset')
  .action(async (options) => {
    try {
      await AppDataSource.initialize();
      const orchestrator = new EtlOrchestrator();

      if (options.dataset) {
        await orchestrator.validateDataset(options.dataset);
      } else {
        await orchestrator.validateAll();
      }

      await AppDataSource.destroy();
    } catch (error) {
      logger.error('Validation failed:', error);
      await AppDataSource.destroy().catch(() => {});
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show ETL run history and status')
  .option('--dataset <name>', 'Show status for specific dataset')
  .option('--limit <n>', 'Number of runs to show', '10')
  .action(async (options) => {
    try {
      await AppDataSource.initialize();
      const orchestrator = new EtlOrchestrator();

      await orchestrator.showStatus({
        dataset: options.dataset,
        limit: parseInt(options.limit, 10),
      });

      await AppDataSource.destroy();
    } catch (error) {
      logger.error('Status check failed:', error);
      await AppDataSource.destroy().catch(() => {});
      process.exit(1);
    }
  });

program.parse();
