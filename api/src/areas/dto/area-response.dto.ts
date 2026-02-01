import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultiPolygon } from 'geojson';
import { AdminLevel } from '../entities';

/**
 * Response DTO for a single administrative area.
 * Used for both list items and detailed responses.
 */
export class AreaResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Official code (e.g., INSEE département code)',
    example: '75',
  })
  code: string;

  @ApiProperty({
    description: 'Official name (in local language)',
    example: 'Paris',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'English name',
    example: 'Paris',
    nullable: true,
  })
  nameEn: string | null;

  @ApiProperty({
    description: 'Administrative level',
    enum: AdminLevel,
    example: AdminLevel.DEPARTMENT,
  })
  level: AdminLevel;

  @ApiPropertyOptional({
    description: 'Parent area code',
    example: 'IDF',
    nullable: true,
  })
  parentCode: string | null;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'FR',
  })
  countryCode: string;

  @ApiPropertyOptional({
    description: 'Area in square kilometers',
    example: 105.4,
    nullable: true,
  })
  areaKm2: number | null;
}

/**
 * Response DTO for area with geometry (used for detailed endpoint).
 */
export class AreaDetailResponseDto extends AreaResponseDto {
  @ApiPropertyOptional({
    description: 'GeoJSON MultiPolygon geometry',
    example: {
      type: 'MultiPolygon',
      coordinates: [[[[2.22, 48.81], [2.47, 48.81], [2.47, 48.90], [2.22, 48.90], [2.22, 48.81]]]],
    },
    nullable: true,
  })
  geometry: MultiPolygon | null;
}

/**
 * Response DTO for list of areas.
 */
export class AreaListResponseDto {
  @ApiProperty({
    description: 'List of administrative areas',
    type: [AreaResponseDto],
  })
  data: AreaResponseDto[];

  @ApiProperty({
    description: 'Total count of areas matching the query',
    example: 96,
  })
  total: number;
}
