import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdministrativeArea, AdminLevel } from '../areas/entities';
import { DataSourceEntity } from '../etl/entities';
import {
    CompareAreasQueryDto,
    CompareAreasResponseDto,
    CompareSourcesQueryDto,
    CompareSourcesResponseDto,
    CompareYearsQueryDto,
    CompareYearsResponseDto,
    ComparisonItemDto,
    ObservationAreaDto,
    ObservationCategoryDto,
    ObservationDataSourceDto,
} from './dto';
import { CrimeCategory, CrimeObservation } from './entities';

/**
 * Service for comparing crime statistics.
 * Provides area-to-area, year-to-year, and source-to-source comparisons.
 */
@Injectable()
export class ComparisonService {
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
   * Compare crime statistics between two areas for a given year.
   */
  async compareAreas(query: CompareAreasQueryDto): Promise<CompareAreasResponseDto> {
    const { areaCodeA, areaCodeB, categoryCode, year, dataSourceCode } = query;

    // Look up areas
    const areaA = await this.findAreaByCode(areaCodeA);
    const areaB = await this.findAreaByCode(areaCodeB);

    // Optionally look up data source
    const dataSource = dataSourceCode
      ? await this.findDataSourceByCode(dataSourceCode)
      : null;

    // Get observations for area A
    const observationsA = await this.getObservationsForComparison(
      areaA.id,
      year,
      categoryCode,
      dataSource?.id,
    );

    // Get observations for area B
    const observationsB = await this.getObservationsForComparison(
      areaB.id,
      year,
      categoryCode,
      dataSource?.id,
    );

    // Build comparison items
    const comparisons = this.buildComparisonItems(observationsA, observationsB);

    return {
      areaA: this.toAreaDto(areaA),
      areaB: this.toAreaDto(areaB),
      year,
      dataSource: dataSource ? this.toDataSourceDto(dataSource) : null,
      comparisons,
    };
  }

  /**
   * Compare crime statistics between two years for a given area.
   */
  async compareYears(query: CompareYearsQueryDto): Promise<CompareYearsResponseDto> {
    const { areaCode, yearA, yearB, categoryCode, dataSourceCode } = query;

    // Look up area
    const area = await this.findAreaByCode(areaCode);

    // Optionally look up data source
    const dataSource = dataSourceCode
      ? await this.findDataSourceByCode(dataSourceCode)
      : null;

    // Get observations for year A
    const observationsA = await this.getObservationsForComparison(
      area.id,
      yearA,
      categoryCode,
      dataSource?.id,
    );

    // Get observations for year B
    const observationsB = await this.getObservationsForComparison(
      area.id,
      yearB,
      categoryCode,
      dataSource?.id,
    );

    // Build comparison items
    const comparisons = this.buildComparisonItems(observationsA, observationsB);

    return {
      area: this.toAreaDto(area),
      yearA,
      yearB,
      dataSource: dataSource ? this.toDataSourceDto(dataSource) : null,
      comparisons,
    };
  }

  /**
   * Compare crime statistics between two data sources.
   */
  async compareSources(query: CompareSourcesQueryDto): Promise<CompareSourcesResponseDto> {
    const { sourceCodeA, sourceCodeB, areaCode, categoryCode, year } = query;

    // Look up data sources
    const sourceA = await this.findDataSourceByCode(sourceCodeA);
    const sourceB = await this.findDataSourceByCode(sourceCodeB);

    // Look up area
    const area = await this.findAreaByCode(areaCode);

    // Get observations for source A
    const observationsA = await this.getObservationsForComparison(
      area.id,
      year,
      categoryCode,
      sourceA.id,
    );

    // Get observations for source B
    const observationsB = await this.getObservationsForComparison(
      area.id,
      year,
      categoryCode,
      sourceB.id,
    );

    // Build comparison items
    const comparisons = this.buildComparisonItems(observationsA, observationsB);

    return {
      sourceA: this.toDataSourceDto(sourceA),
      sourceB: this.toDataSourceDto(sourceB),
      area: this.toAreaDto(area),
      year,
      comparisons,
    };
  }

  // ----- Helper methods -----

  private async findAreaByCode(code: string): Promise<AdministrativeArea> {
    const area = await this.areaRepository.findOne({
      where: { code, level: AdminLevel.DEPARTMENT },
    });

    if (!area) {
      throw new NotFoundException(`Area with code "${code}" not found`);
    }

    return area;
  }

  private async findDataSourceByCode(code: string): Promise<DataSourceEntity> {
    const source = await this.dataSourceRepository.findOne({
      where: { code },
    });

    if (!source) {
      throw new NotFoundException(`Data source with code "${code}" not found`);
    }

    return source;
  }

  private async getObservationsForComparison(
    areaId: string,
    year: number,
    categoryCode?: string,
    dataSourceId?: string,
  ): Promise<CrimeObservation[]> {
    const qb = this.observationRepository
      .createQueryBuilder('obs')
      .leftJoinAndSelect('obs.category', 'category')
      .leftJoinAndSelect('obs.dataSource', 'dataSource')
      .where('obs.areaId = :areaId', { areaId })
      .andWhere('obs.year = :year', { year });

    if (categoryCode) {
      qb.andWhere('category.code = :categoryCode', { categoryCode });
    }

    if (dataSourceId) {
      qb.andWhere('obs.dataSourceId = :dataSourceId', { dataSourceId });
    }

    qb.orderBy('category.sortOrder', 'ASC');

    return qb.getMany();
  }

  private buildComparisonItems(
    observationsA: CrimeObservation[],
    observationsB: CrimeObservation[],
  ): ComparisonItemDto[] {
    // Build map of category code -> observation for each set
    const mapA = new Map<string, CrimeObservation>();
    const mapB = new Map<string, CrimeObservation>();

    for (const obs of observationsA) {
      mapA.set(obs.category.code, obs);
    }

    for (const obs of observationsB) {
      mapB.set(obs.category.code, obs);
    }

    // Get all unique category codes, sorted
    const allCategories = new Map<string, CrimeCategory>();
    for (const obs of [...observationsA, ...observationsB]) {
      allCategories.set(obs.category.code, obs.category);
    }

    // Sort by sortOrder
    const sortedCategories = Array.from(allCategories.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    // Build comparison items
    return sortedCategories.map((category) => {
      const obsA = mapA.get(category.code);
      const obsB = mapB.get(category.code);

      const countA = obsA?.count ?? null;
      const countB = obsB?.count ?? null;
      const rateA = obsA?.ratePer100k
        ? parseFloat(obsA.ratePer100k.toString())
        : null;
      const rateB = obsB?.ratePer100k
        ? parseFloat(obsB.ratePer100k.toString())
        : null;

      // Calculate differences and percentage changes
      const countDiff =
        countA !== null && countB !== null ? countB - countA : null;
      const rateDiff =
        rateA !== null && rateB !== null
          ? Math.round((rateB - rateA) * 100) / 100
          : null;
      const countPctChange =
        countA !== null && countA !== 0 && countB !== null
          ? Math.round(((countB - countA) / countA) * 10000) / 100
          : null;
      const ratePctChange =
        rateA !== null && rateA !== 0 && rateB !== null
          ? Math.round(((rateB - rateA) / rateA) * 10000) / 100
          : null;

      return {
        category: this.toCategoryDto(category),
        countA,
        countB,
        rateA,
        rateB,
        countDiff,
        rateDiff,
        countPctChange,
        ratePctChange,
      };
    });
  }

  private toAreaDto(area: AdministrativeArea): ObservationAreaDto {
    return {
      id: area.id,
      code: area.code,
      name: area.name,
    };
  }

  private toDataSourceDto(source: DataSourceEntity): ObservationDataSourceDto {
    return {
      id: source.id,
      code: source.code,
      name: source.name,
    };
  }

  private toCategoryDto(category: CrimeCategory): ObservationCategoryDto {
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      nameFr: category.nameFr,
    };
  }
}
