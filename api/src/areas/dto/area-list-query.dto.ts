import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminLevel } from '../entities';

/**
 * Query parameters for filtering administrative areas.
 */
export class AreaListQueryDto {
  /**
   * Filter by administrative level (department, region, country).
   */
  @ApiPropertyOptional({
    description: 'Filter by administrative level',
    enum: AdminLevel,
    example: AdminLevel.DEPARTMENT,
  })
  @IsOptional()
  @IsEnum(AdminLevel)
  level?: AdminLevel;

  /**
   * Filter by parent code (e.g., region code for départements).
   */
  @ApiPropertyOptional({
    description: 'Filter by parent area code (e.g., region code for départements)',
    example: 'IDF',
  })
  @IsOptional()
  @IsString()
  parentCode?: string;

  /**
   * Filter by country code (ISO 3166-1 alpha-2).
   */
  @ApiPropertyOptional({
    description: 'Filter by country code (ISO 3166-1 alpha-2)',
    example: 'FR',
    default: 'FR',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
}
