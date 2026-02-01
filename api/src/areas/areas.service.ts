import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    AreaDetailResponseDto,
    AreaListQueryDto,
    AreaListResponseDto,
    AreaResponseDto,
} from './dto';
import { AdministrativeArea, AdminLevel } from './entities';

/**
 * Service for managing administrative areas.
 * Provides read-only access to départements, regions, and countries.
 */
@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(AdministrativeArea)
    private readonly areaRepository: Repository<AdministrativeArea>,
  ) {}

  /**
   * Get a list of administrative areas with optional filtering.
   * By default, returns French départements sorted by code.
   */
  async findAll(query: AreaListQueryDto): Promise<AreaListResponseDto> {
    const { level = AdminLevel.DEPARTMENT, parentCode, countryCode = 'FR' } = query;

    const qb = this.areaRepository.createQueryBuilder('area');

    // Apply filters
    qb.where('area.level = :level', { level });
    qb.andWhere('area.countryCode = :countryCode', { countryCode });

    if (parentCode) {
      qb.andWhere('area.parentCode = :parentCode', { parentCode });
    }

    // Order by code for consistent ordering
    qb.orderBy('area.code', 'ASC');

    const [areas, total] = await qb.getManyAndCount();

    // Map to DTOs (exclude geometry for list endpoint)
    const data: AreaResponseDto[] = areas.map((area) => ({
      id: area.id,
      code: area.code,
      name: area.name,
      nameEn: area.nameEn,
      level: area.level,
      parentCode: area.parentCode,
      countryCode: area.countryCode,
      areaKm2: area.areaKm2 ? parseFloat(area.areaKm2.toString()) : null,
    }));

    return { data, total };
  }

  /**
   * Get a single administrative area by ID (with geometry).
   */
  async findOne(id: string): Promise<AreaDetailResponseDto> {
    const area = await this.areaRepository.findOne({
      where: { id },
    });

    if (!area) {
      throw new NotFoundException(`Administrative area with ID "${id}" not found`);
    }

    return {
      id: area.id,
      code: area.code,
      name: area.name,
      nameEn: area.nameEn,
      level: area.level,
      parentCode: area.parentCode,
      countryCode: area.countryCode,
      areaKm2: area.areaKm2 ? parseFloat(area.areaKm2.toString()) : null,
      geometry: area.geometry,
    };
  }

  /**
   * Get a single administrative area by code and level.
   * Useful for looking up areas by département code (e.g., '75').
   */
  async findByCode(
    code: string,
    level: AdminLevel = AdminLevel.DEPARTMENT,
  ): Promise<AreaDetailResponseDto> {
    const area = await this.areaRepository.findOne({
      where: { code, level },
    });

    if (!area) {
      throw new NotFoundException(
        `Administrative area with code "${code}" and level "${level}" not found`,
      );
    }

    return {
      id: area.id,
      code: area.code,
      name: area.name,
      nameEn: area.nameEn,
      level: area.level,
      parentCode: area.parentCode,
      countryCode: area.countryCode,
      areaKm2: area.areaKm2 ? parseFloat(area.areaKm2.toString()) : null,
      geometry: area.geometry,
    };
  }

  /**
   * Get all areas as GeoJSON FeatureCollection.
   * Useful for map visualization (choropleth layers).
   */
  async findAllAsGeoJson(query: AreaListQueryDto): Promise<GeoJSON.FeatureCollection> {
    const { level = AdminLevel.DEPARTMENT, parentCode, countryCode = 'FR' } = query;

    const qb = this.areaRepository.createQueryBuilder('area');

    qb.where('area.level = :level', { level });
    qb.andWhere('area.countryCode = :countryCode', { countryCode });
    qb.andWhere('area.geometry IS NOT NULL');

    if (parentCode) {
      qb.andWhere('area.parentCode = :parentCode', { parentCode });
    }

    qb.orderBy('area.code', 'ASC');

    const areas = await qb.getMany();

    const features: GeoJSON.Feature[] = areas.map((area) => ({
      type: 'Feature',
      id: area.id,
      geometry: area.geometry as GeoJSON.MultiPolygon,
      properties: {
        id: area.id,
        code: area.code,
        name: area.name,
        nameEn: area.nameEn,
        level: area.level,
        parentCode: area.parentCode,
        countryCode: area.countryCode,
        areaKm2: area.areaKm2 ? parseFloat(area.areaKm2.toString()) : null,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
