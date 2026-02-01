/**
 * Database configuration for ETL service
 *
 * Connects to the same PostgreSQL/PostGIS database as the API service.
 * Uses TypeORM for database access.
 */

import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

// Load environment variables
dotenv.config();

/**
 * Database connection options
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'bewhere',
  password: process.env.POSTGRES_PASSWORD || 'bewhere_dev',
  database: process.env.POSTGRES_DB || 'bewhere',
  synchronize: false, // Never auto-sync in ETL; use migrations
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  entities: [], // ETL uses raw SQL queries, not entities
  migrations: [], // Migrations are managed by the API service
};

/**
 * TypeORM DataSource instance
 */
export const AppDataSource = new DataSource(dataSourceOptions);

/**
 * Get database connection options for raw pg client
 */
export function getDatabaseConfig() {
  return {
    host: dataSourceOptions.host as string,
    port: dataSourceOptions.port as number,
    user: dataSourceOptions.username as string,
    password: dataSourceOptions.password as string,
    database: dataSourceOptions.database as string,
  };
}
