import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query parameters for comparing two areas.
 */
export class CompareAreasQueryDto {
  /**
   * First area code (e.g., département code).
   */
  @ApiProperty({
    description: 'First area code',
    example: '75',
  })
  @IsNotEmpty()
  @IsString()
  areaCodeA: string;

  /**
   * Second area code.
   */
  @ApiProperty({
    description: 'Second area code',
    example: '13',
  })
  @IsNotEmpty()
  @IsString()
  areaCodeB: string;

  /**
   * Category code to compare (optional, all if not specified).
   */
  @ApiPropertyOptional({
    description: 'Category code to compare',
    example: 'BURGLARY_RESIDENTIAL',
  })
  @IsOptional()
  @IsString()
  categoryCode?: string;

  /**
   * Year to compare.
   */
  @ApiProperty({
    description: 'Year to compare',
    example: 2023,
    minimum: 1990,
    maximum: 2030,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  year: number;

  /**
   * Data source code (optional).
   */
  @ApiPropertyOptional({
    description: 'Data source code',
    example: 'ETAT4001_MONTHLY',
  })
  @IsOptional()
  @IsString()
  dataSourceCode?: string;
}

/**
 * Query parameters for comparing two years for a single area.
 */
export class CompareYearsQueryDto {
  /**
   * Area code (e.g., département code).
   */
  @ApiProperty({
    description: 'Area code',
    example: '75',
  })
  @IsNotEmpty()
  @IsString()
  areaCode: string;

  /**
   * First year to compare.
   */
  @ApiProperty({
    description: 'First year',
    example: 2022,
    minimum: 1990,
    maximum: 2030,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearA: number;

  /**
   * Second year to compare.
   */
  @ApiProperty({
    description: 'Second year',
    example: 2023,
    minimum: 1990,
    maximum: 2030,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  yearB: number;

  /**
   * Category code to compare (optional, all if not specified).
   */
  @ApiPropertyOptional({
    description: 'Category code to compare',
    example: 'BURGLARY_RESIDENTIAL',
  })
  @IsOptional()
  @IsString()
  categoryCode?: string;

  /**
   * Data source code (optional).
   */
  @ApiPropertyOptional({
    description: 'Data source code',
    example: 'ETAT4001_MONTHLY',
  })
  @IsOptional()
  @IsString()
  dataSourceCode?: string;
}

/**
 * Query parameters for comparing two data sources.
 */
export class CompareSourcesQueryDto {
  /**
   * First data source code.
   */
  @ApiProperty({
    description: 'First data source code',
    example: 'ETAT4001_MONTHLY',
  })
  @IsNotEmpty()
  @IsString()
  sourceCodeA: string;

  /**
   * Second data source code.
   */
  @ApiProperty({
    description: 'Second data source code',
    example: 'TIMESERIES',
  })
  @IsNotEmpty()
  @IsString()
  sourceCodeB: string;

  /**
   * Area code (e.g., département code).
   */
  @ApiProperty({
    description: 'Area code',
    example: '75',
  })
  @IsNotEmpty()
  @IsString()
  areaCode: string;

  /**
   * Category code to compare (optional, all if not specified).
   */
  @ApiPropertyOptional({
    description: 'Category code to compare',
    example: 'BURGLARY_RESIDENTIAL',
  })
  @IsOptional()
  @IsString()
  categoryCode?: string;

  /**
   * Year to compare.
   */
  @ApiProperty({
    description: 'Year to compare',
    example: 2023,
    minimum: 1990,
    maximum: 2030,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  year: number;
}
