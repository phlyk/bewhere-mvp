import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeGranularity } from '../entities';

/**
 * Nested area reference in observation response.
 */
export class ObservationAreaDto {
  @ApiProperty({
    description: 'Area ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Area code',
    example: '75',
  })
  code: string;

  @ApiProperty({
    description: 'Area name',
    example: 'Paris',
  })
  name: string;
}

/**
 * Nested category reference in observation response.
 */
export class ObservationCategoryDto {
  @ApiProperty({
    description: 'Category ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    description: 'Category code',
    example: 'HOMICIDE',
  })
  code: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Homicide',
  })
  name: string;

  @ApiProperty({
    description: 'Category name (French)',
    example: 'Homicide',
  })
  nameFr: string;
}

/**
 * Nested data source reference in observation response.
 */
export class ObservationDataSourceDto {
  @ApiProperty({
    description: 'Data source ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  id: string;

  @ApiProperty({
    description: 'Data source code',
    example: 'ETAT4001_MONTHLY',
  })
  code: string;

  @ApiProperty({
    description: 'Data source name',
    example: 'État 4001 Monthly Snapshots',
  })
  name: string;
}

/**
 * Response DTO for a single crime observation.
 */
export class ObservationResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  id: string;

  @ApiProperty({
    description: 'Administrative area',
    type: ObservationAreaDto,
  })
  area: ObservationAreaDto;

  @ApiProperty({
    description: 'Crime category',
    type: ObservationCategoryDto,
  })
  category: ObservationCategoryDto;

  @ApiProperty({
    description: 'Data source',
    type: ObservationDataSourceDto,
  })
  dataSource: ObservationDataSourceDto;

  @ApiProperty({
    description: 'Year of observation',
    example: 2023,
  })
  year: number;

  @ApiPropertyOptional({
    description: 'Month of observation (1-12, null for yearly data)',
    example: null,
    nullable: true,
  })
  month: number | null;

  @ApiProperty({
    description: 'Time granularity',
    enum: TimeGranularity,
    example: TimeGranularity.YEARLY,
  })
  granularity: TimeGranularity;

  @ApiProperty({
    description: 'Raw crime count',
    example: 15234,
  })
  count: number;

  @ApiPropertyOptional({
    description: 'Crime rate per 100,000 population',
    example: 714.2,
    nullable: true,
  })
  ratePer100k: number | null;

  @ApiPropertyOptional({
    description: 'Population used for rate calculation',
    example: 2133111,
    nullable: true,
  })
  populationUsed: number | null;
}

/**
 * Pagination metadata.
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 50,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 1920,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 39,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevPage: boolean;
}

/**
 * Response DTO for paginated list of observations.
 */
export class ObservationListResponseDto {
  @ApiProperty({
    description: 'List of crime observations',
    type: [ObservationResponseDto],
  })
  data: ObservationResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
