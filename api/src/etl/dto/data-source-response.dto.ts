import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateFrequency } from '../entities';

/**
 * Response DTO for a single data source.
 */
export class DataSourceResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Unique data source code',
    example: 'ETAT4001_MONTHLY',
  })
  code: string;

  @ApiProperty({
    description: 'Data source name (English)',
    example: 'État 4001 Monthly Snapshots',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Data source name (French)',
    example: 'État 4001 - Données mensuelles',
    nullable: true,
  })
  nameFr: string | null;

  @ApiPropertyOptional({
    description: 'Data source description',
    example: 'Monthly crime statistics from French Interior Ministry',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Source URL',
    example: 'https://data.gouv.fr/fr/datasets/...',
  })
  url: string;

  @ApiProperty({
    description: 'Update frequency',
    enum: UpdateFrequency,
    example: UpdateFrequency.MONTHLY,
  })
  updateFrequency: UpdateFrequency;

  @ApiPropertyOptional({
    description: 'Data provider organization',
    example: "Ministère de l'Intérieur",
    nullable: true,
  })
  provider: string | null;

  @ApiPropertyOptional({
    description: 'Data license',
    example: 'Licence Ouverte v2.0',
    nullable: true,
  })
  license: string | null;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'FR',
    nullable: true,
  })
  countryCode: string | null;

  @ApiProperty({
    description: 'Whether the data source is currently active',
    example: true,
  })
  isActive: boolean;
}

/**
 * Response DTO for list of data sources.
 */
export class DataSourceListResponseDto {
  @ApiProperty({
    description: 'List of data sources',
    type: [DataSourceResponseDto],
  })
  data: DataSourceResponseDto[];

  @ApiProperty({
    description: 'Total count of data sources',
    example: 3,
  })
  total: number;
}
