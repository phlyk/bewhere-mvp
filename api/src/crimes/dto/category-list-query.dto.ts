import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CrimeCategoryGroup, CrimeSeverity } from '../entities';

/**
 * Query parameters for filtering crime categories.
 */
export class CategoryListQueryDto {
  /**
   * Filter by severity level.
   */
  @ApiPropertyOptional({
    description: 'Filter by severity level',
    enum: CrimeSeverity,
    example: CrimeSeverity.HIGH,
  })
  @IsOptional()
  @IsEnum(CrimeSeverity)
  severity?: CrimeSeverity;

  /**
   * Filter by category group.
   */
  @ApiPropertyOptional({
    description: 'Filter by category group',
    enum: CrimeCategoryGroup,
    example: CrimeCategoryGroup.VIOLENT_CRIMES,
  })
  @IsOptional()
  @IsEnum(CrimeCategoryGroup)
  categoryGroup?: CrimeCategoryGroup;

  /**
   * Filter by active status.
   */
  @ApiPropertyOptional({
    description: 'Filter by active status (default: true)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
