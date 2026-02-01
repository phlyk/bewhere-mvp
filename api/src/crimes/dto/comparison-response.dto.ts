import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ObservationAreaDto,
    ObservationCategoryDto,
    ObservationDataSourceDto,
} from './observation-response.dto';

/**
 * Single comparison item (one category or observation).
 */
export class ComparisonItemDto {
  @ApiProperty({
    description: 'Crime category',
    type: ObservationCategoryDto,
  })
  category: ObservationCategoryDto;

  @ApiPropertyOptional({
    description: 'Value A (count)',
    example: 15234,
    nullable: true,
  })
  countA: number | null;

  @ApiPropertyOptional({
    description: 'Value B (count)',
    example: 12456,
    nullable: true,
  })
  countB: number | null;

  @ApiPropertyOptional({
    description: 'Rate per 100k A',
    example: 714.2,
    nullable: true,
  })
  rateA: number | null;

  @ApiPropertyOptional({
    description: 'Rate per 100k B',
    example: 623.8,
    nullable: true,
  })
  rateB: number | null;

  @ApiPropertyOptional({
    description: 'Absolute difference in count (B - A)',
    example: -2778,
    nullable: true,
  })
  countDiff: number | null;

  @ApiPropertyOptional({
    description: 'Absolute difference in rate (B - A)',
    example: -90.4,
    nullable: true,
  })
  rateDiff: number | null;

  @ApiPropertyOptional({
    description: 'Percentage change in count ((B - A) / A * 100)',
    example: -18.23,
    nullable: true,
  })
  countPctChange: number | null;

  @ApiPropertyOptional({
    description: 'Percentage change in rate ((B - A) / A * 100)',
    example: -12.66,
    nullable: true,
  })
  ratePctChange: number | null;
}

/**
 * Response DTO for area comparison.
 */
export class CompareAreasResponseDto {
  @ApiProperty({
    description: 'First area',
    type: ObservationAreaDto,
  })
  areaA: ObservationAreaDto;

  @ApiProperty({
    description: 'Second area',
    type: ObservationAreaDto,
  })
  areaB: ObservationAreaDto;

  @ApiProperty({
    description: 'Year being compared',
    example: 2023,
  })
  year: number;

  @ApiPropertyOptional({
    description: 'Data source (if specified)',
    type: ObservationDataSourceDto,
    nullable: true,
  })
  dataSource: ObservationDataSourceDto | null;

  @ApiProperty({
    description: 'Comparison results by category',
    type: [ComparisonItemDto],
  })
  comparisons: ComparisonItemDto[];
}

/**
 * Response DTO for year comparison.
 */
export class CompareYearsResponseDto {
  @ApiProperty({
    description: 'Area being compared',
    type: ObservationAreaDto,
  })
  area: ObservationAreaDto;

  @ApiProperty({
    description: 'First year',
    example: 2022,
  })
  yearA: number;

  @ApiProperty({
    description: 'Second year',
    example: 2023,
  })
  yearB: number;

  @ApiPropertyOptional({
    description: 'Data source (if specified)',
    type: ObservationDataSourceDto,
    nullable: true,
  })
  dataSource: ObservationDataSourceDto | null;

  @ApiProperty({
    description: 'Comparison results by category',
    type: [ComparisonItemDto],
  })
  comparisons: ComparisonItemDto[];
}

/**
 * Response DTO for data source comparison.
 */
export class CompareSourcesResponseDto {
  @ApiProperty({
    description: 'First data source',
    type: ObservationDataSourceDto,
  })
  sourceA: ObservationDataSourceDto;

  @ApiProperty({
    description: 'Second data source',
    type: ObservationDataSourceDto,
  })
  sourceB: ObservationDataSourceDto;

  @ApiProperty({
    description: 'Area being compared',
    type: ObservationAreaDto,
  })
  area: ObservationAreaDto;

  @ApiProperty({
    description: 'Year being compared',
    example: 2023,
  })
  year: number;

  @ApiProperty({
    description: 'Comparison results by category',
    type: [ComparisonItemDto],
  })
  comparisons: ComparisonItemDto[];
}
