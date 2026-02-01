import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

/**
 * Query parameters for filtering crime observations.
 */
export class ObservationListQueryDto {
  /**
   * Filter by administrative area ID (UUID).
   */
  @ApiPropertyOptional({
    description: 'Filter by area ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  areaId?: string;

  /**
   * Filter by area code (e.g., département code).
   */
  @ApiPropertyOptional({
    description: 'Filter by area code (e.g., département code)',
    example: '75',
  })
  @IsOptional()
  @IsString()
  areaCode?: string;

  /**
   * Filter by crime category ID (UUID).
   */
  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /**
   * Filter by category code (e.g., 'HOMICIDE').
   */
  @ApiPropertyOptional({
    description: 'Filter by category code',
    example: 'HOMICIDE',
  })
  @IsOptional()
  @IsString()
  categoryCode?: string;

  /**
   * Filter by data source ID (UUID).
   */
  @ApiPropertyOptional({
    description: 'Filter by data source ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  dataSourceId?: string;

  /**
   * Filter by data source code.
   */
  @ApiPropertyOptional({
    description: 'Filter by data source code',
    example: 'ETAT4001_MONTHLY',
  })
  @IsOptional()
  @IsString()
  dataSourceCode?: string;

  /**
   * Filter by exact year.
   */
  @ApiPropertyOptional({
    description: 'Filter by exact year',
    example: 2023,
    minimum: 1990,
    maximum: 2030,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  year?: number;

  /**
   * Filter by start year (inclusive).
   */
  @ApiPropertyOptional({
    description: 'Filter by start year (inclusive)',
    example: 2018,
    minimum: 1990,
    maximum: 2030,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearFrom?: number;

  /**
   * Filter by end year (inclusive).
   */
  @ApiPropertyOptional({
    description: 'Filter by end year (inclusive)',
    example: 2023,
    minimum: 1990,
    maximum: 2030,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearTo?: number;

  /**
   * Page number for pagination (1-indexed).
   */
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of items per page.
   */
  @ApiPropertyOptional({
    description: 'Items per page',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50;
}
