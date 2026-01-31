import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

// Load environment variables from both locations
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * TypeORM DataSource configuration for CLI operations (migrations, schema sync).
 * This is separate from the NestJS module configuration to support the TypeORM CLI.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'bewhere',
  password: process.env.POSTGRES_PASSWORD || 'bewhere_dev',
  database: process.env.POSTGRES_DB || 'bewhere',
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false, // Never auto-sync; use migrations
  logging: process.env.NODE_ENV === 'development',
  // PostGIS-specific: Ensure geometry columns work correctly
  // TypeORM handles PostGIS geometry types natively when using 'geometry' column type
};

// Export DataSource instance for TypeORM CLI
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
