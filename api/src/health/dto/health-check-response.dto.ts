import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status: 'ok' | 'error';

  @ApiProperty({ example: '2026-01-31T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 'bewhere-api' })
  service: string;

  @ApiProperty({ example: '0.1.0' })
  version: string;

  @ApiPropertyOptional({
    example: { database: 'ok', postgis: 'ok' },
    description: 'Individual component health checks',
  })
  checks?: Record<string, 'ok' | 'error'>;
}
