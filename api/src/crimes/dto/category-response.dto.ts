import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrimeCategoryGroup, CrimeSeverity } from '../entities';

/**
 * Response DTO for a single crime category.
 */
export class CategoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Unique category code',
    example: 'HOMICIDE',
  })
  code: string;

  @ApiProperty({
    description: 'English name',
    example: 'Homicide',
  })
  name: string;

  @ApiProperty({
    description: 'French name',
    example: 'Homicide',
  })
  nameFr: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Intentional killing including criminal settlements',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Severity level',
    enum: CrimeSeverity,
    example: CrimeSeverity.CRITICAL,
  })
  severity: CrimeSeverity;

  @ApiProperty({
    description: 'Category group',
    enum: CrimeCategoryGroup,
    example: CrimeCategoryGroup.VIOLENT_CRIMES,
  })
  categoryGroup: CrimeCategoryGroup;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
  })
  isActive: boolean;
}

/**
 * Response DTO for list of categories.
 */
export class CategoryListResponseDto {
  @ApiProperty({
    description: 'List of crime categories',
    type: [CategoryResponseDto],
  })
  data: CategoryResponseDto[];

  @ApiProperty({
    description: 'Total count of categories matching the query',
    example: 20,
  })
  total: number;
}
