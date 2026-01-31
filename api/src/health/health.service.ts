import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthCheckResponseDto> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bewhere-api',
      version: process.env.npm_package_version || '0.1.0',
    };
  }

  async checkReady(): Promise<HealthCheckResponseDto> {
    const response: HealthCheckResponseDto = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bewhere-api',
      version: process.env.npm_package_version || '0.1.0',
      checks: {},
    };

    // Check database connection
    try {
      await this.dataSource.query('SELECT 1');
      response.checks!.database = 'ok';
    } catch {
      response.status = 'error';
      response.checks!.database = 'error';
      throw new ServiceUnavailableException({
        ...response,
        message: 'Database connection failed',
      });
    }

    // Check PostGIS extension
    try {
      await this.dataSource.query('SELECT PostGIS_Version()');
      response.checks!.postgis = 'ok';
    } catch {
      response.status = 'error';
      response.checks!.postgis = 'error';
      throw new ServiceUnavailableException({
        ...response,
        message: 'PostGIS extension not available',
      });
    }

    return response;
  }
}
