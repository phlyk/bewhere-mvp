import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdministrativeArea, AdminLevel } from '../areas/entities';
import { DataSource as DataSourceEntity } from '../etl/entities';
import {
    ObservationListQueryDto,
    ObservationListResponseDto,
    ObservationResponseDto,
    PaginationMetaDto,
} from './dto';
import { CrimeCategory, CrimeObservation } from './entities';

/**
 * Service for querying crime observations.
 * Provides read-only access to crime statistics with filtering and pagination.
 */
@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(CrimeObservation)
    private readonly observationRepository: Repository<CrimeObservation>,
    @InjectRepository(AdministrativeArea)
    private readonly areaRepository: Repository<AdministrativeArea>,
    @InjectRepository(CrimeCategory)
    private readonly categoryRepository: Repository<CrimeCategory>,
    @InjectRepository(DataSourceEntity)
    private readonly dataSourceRepository: Repository<DataSourceEntity>,
  ) {}

  /**
   * Get a paginated list of crime observations with optional filtering.
   */
  async findAll(query: ObservationListQueryDto): Promise<ObservationListResponseDto> {
    const {
      areaId,
      areaCode,
      categoryId,
      categoryCode,
      dataSourceId,
      dataSourceCode,
      year,
      yearFrom,
      yearTo,
      page = 1,
      limit = 50,
    } = query;

    const qb = this.observationRepository
      .createQueryBuilder('obs')
      .leftJoinAndSelect('obs.area', 'area')
      .leftJoinAndSelect('obs.category', 'category')
      .leftJoinAndSelect('obs.dataSource', 'dataSource');

    // Apply filters

    // Area filters
    if (areaId) {
      qb.andWhere('obs.areaId = :areaId', { areaId });
    }
    if (areaCode) {
      qb.andWhere('area.code = :areaCode', { areaCode });
      qb.andWhere('area.level = :areaLevel', { areaLevel: AdminLevel.DEPARTMENT });
    }

    // Category filters
    if (categoryId) {
      qb.andWhere('obs.categoryId = :categoryId', { categoryId });
    }
    if (categoryCode) {
      qb.andWhere('category.code = :categoryCode', { categoryCode });
    }

    // Data source filters
    if (dataSourceId) {
      qb.andWhere('obs.dataSourceId = :dataSourceId', { dataSourceId });
    }
    if (dataSourceCode) {
      qb.andWhere('dataSource.code = :dataSourceCode', { dataSourceCode });
    }

    // Year filters
    if (year) {
      qb.andWhere('obs.year = :year', { year });
    } else {
      if (yearFrom) {
        qb.andWhere('obs.year >= :yearFrom', { yearFrom });
      }
      if (yearTo) {
        qb.andWhere('obs.year <= :yearTo', { yearTo });
      }
    }

    // Order by year desc, then area code, then category sortOrder
    qb.orderBy('obs.year', 'DESC')
      .addOrderBy('area.code', 'ASC')
      .addOrderBy('category.sortOrder', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [observations, total] = await qb.getManyAndCount();

    // Map to response DTOs
    const data: ObservationResponseDto[] = observations.map((obs) => ({
      id: obs.id,
      area: {
        id: obs.area.id,
        code: obs.area.code,
        name: obs.area.name,
      },
      category: {
        id: obs.category.id,
        code: obs.category.code,
        name: obs.category.name,
        nameFr: obs.category.nameFr,
      },
      dataSource: {
        id: obs.dataSource.id,
        code: obs.dataSource.code,
        name: obs.dataSource.name,
      },
      year: obs.year,
      month: obs.month,
      granularity: obs.granularity,
      count: obs.count,
      ratePer100k: obs.ratePer100k ? parseFloat(obs.ratePer100k.toString()) : null,
      populationUsed: obs.populationUsed,
    }));

    // Build pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return { data, meta };
  }

  /**
   * Get a single observation by ID.
   */
  async findOne(id: string): Promise<ObservationResponseDto> {
    const obs = await this.observationRepository.findOne({
      where: { id },
      relations: ['area', 'category', 'dataSource'],
    });

    if (!obs) {
      throw new NotFoundException(`Crime observation with ID "${id}" not found`);
    }

    return {
      id: obs.id,
      area: {
        id: obs.area.id,
        code: obs.area.code,
        name: obs.area.name,
      },
      category: {
        id: obs.category.id,
        code: obs.category.code,
        name: obs.category.name,
        nameFr: obs.category.nameFr,
      },
      dataSource: {
        id: obs.dataSource.id,
        code: obs.dataSource.code,
        name: obs.dataSource.name,
      },
      year: obs.year,
      month: obs.month,
      granularity: obs.granularity,
      count: obs.count,
      ratePer100k: obs.ratePer100k ? parseFloat(obs.ratePer100k.toString()) : null,
      populationUsed: obs.populationUsed,
    };
  }

  /**
   * Get summary statistics for a specific area and year.
   * Useful for dashboard views showing all categories for an area.
   */
  async findByAreaAndYear(
    areaCode: string,
    year: number,
  ): Promise<ObservationResponseDto[]> {
    const qb = this.observationRepository
      .createQueryBuilder('obs')
      .leftJoinAndSelect('obs.area', 'area')
      .leftJoinAndSelect('obs.category', 'category')
      .leftJoinAndSelect('obs.dataSource', 'dataSource')
      .where('area.code = :areaCode', { areaCode })
      .andWhere('area.level = :areaLevel', { areaLevel: AdminLevel.DEPARTMENT })
      .andWhere('obs.year = :year', { year })
      .orderBy('category.sortOrder', 'ASC');

    const observations = await qb.getMany();

    return observations.map((obs) => ({
      id: obs.id,
      area: {
        id: obs.area.id,
        code: obs.area.code,
        name: obs.area.name,
      },
      category: {
        id: obs.category.id,
        code: obs.category.code,
        name: obs.category.name,
        nameFr: obs.category.nameFr,
      },
      dataSource: {
        id: obs.dataSource.id,
        code: obs.dataSource.code,
        name: obs.dataSource.name,
      },
      year: obs.year,
      month: obs.month,
      granularity: obs.granularity,
      count: obs.count,
      ratePer100k: obs.ratePer100k ? parseFloat(obs.ratePer100k.toString()) : null,
      populationUsed: obs.populationUsed,
    }));
  }
}
