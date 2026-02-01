/**
 * Custom hooks for connecting UI selections to RTK Query data fetching.
 *
 * These hooks encapsulate the logic for:
 * - Reading selection state from Redux
 * - Building query parameters from selections
 * - Fetching data via RTK Query hooks
 * - Transforming data for map visualization (choropleth)
 */

import { useMemo } from 'react';
import type { ChoroplethDataPoint } from '../utils/choropleth';
import {
    useGetCategoriesQuery,
    useGetDataSourcesQuery,
    useGetObservationsQuery,
    type CrimeObservation,
    type GetObservationsParams,
} from './api';
import { useAppDispatch, useAppSelector } from './hooks';
import type { RootState } from './store';

/**
 * Selector for the full selections state
 */
export const selectSelections = (state: RootState) => state.selections;

/**
 * Individual selectors for each selection field
 */
export const selectAreaIds = (state: RootState) => state.selections.areaIds;
export const selectCategoryId = (state: RootState) => state.selections.categoryId;
export const selectYearRange = (state: RootState) => state.selections.yearRange;
export const selectDataSourceId = (state: RootState) => state.selections.dataSourceId;
export const selectDisplayMode = (state: RootState) => state.selections.displayMode;
export const selectMapSelectedAreaId = (state: RootState) => state.selections.mapSelectedAreaId;
export const selectViewMode = (state: RootState) => state.selections.viewMode;

/**
 * Hook that returns the current selections state from Redux.
 */
export function useSelections() {
  return useAppSelector(selectSelections);
}

/**
 * Hook that returns whether the current selections are valid for fetching observations.
 * Requires at least a category to be selected.
 */
export function useSelectionsValid() {
  const { categoryId, yearRange } = useSelections();
  return useMemo(() => {
    return categoryId !== '' && yearRange[0] <= yearRange[1];
  }, [categoryId, yearRange]);
}

/**
 * Build query parameters from selections state.
 * Returns null if selections are not valid for fetching.
 */
export function useBuildObservationsParams(): GetObservationsParams | null {
  const { categoryId, yearRange, dataSourceId } = useSelections();
  const isValid = useSelectionsValid();

  return useMemo(() => {
    if (!isValid) {
      return null;
    }

    const params: GetObservationsParams = {
      categoryId,
      yearFrom: yearRange[0],
      yearTo: yearRange[1],
      limit: 200, // Fetch enough for all départements (96 in metropolitan France)
    };

    // Only add dataSourceId if selected
    if (dataSourceId) {
      params.dataSourceId = dataSourceId;
    }

    return params;
  }, [categoryId, yearRange, dataSourceId, isValid]);
}

/**
 * Result type for the observations hook
 */
export interface UseObservationsResult {
  /** Observations data */
  observations: CrimeObservation[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether data is being fetched (initial or refetch) */
  isFetching: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether there's valid data */
  hasData: boolean;
  /** Whether selections are valid for fetching */
  isValidSelection: boolean;
  /** Total count of observations */
  total: number;
}

/**
 * Hook that fetches observations based on current selections.
 *
 * This hook:
 * 1. Reads selection state from Redux
 * 2. Builds query parameters
 * 3. Fetches observations via RTK Query
 * 4. Returns normalized result with loading/error states
 *
 * @example
 * ```tsx
 * const { observations, isLoading, error, hasData } = useSelectedObservations();
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Alert severity="error">{error}</Alert>;
 * if (!hasData) return <Typography>Select a category to view data</Typography>;
 *
 * return <ObservationsList data={observations} />;
 * ```
 */
export function useSelectedObservations(): UseObservationsResult {
  const params = useBuildObservationsParams();
  const isValidSelection = useSelectionsValid();

  // Skip query if no valid params (category not selected)
  const { data, isLoading, isFetching, error } = useGetObservationsQuery(
    params ?? { limit: 0 }, // Fallback params (will be skipped)
    { skip: !params }
  );

  return useMemo(() => {
    // Handle error case
    const errorMessage = error
      ? 'message' in error
        ? (error as { message: string }).message
        : 'Failed to fetch observations'
      : null;

    return {
      observations: data?.data ?? [],
      isLoading,
      isFetching,
      error: errorMessage,
      hasData: (data?.data?.length ?? 0) > 0,
      isValidSelection,
      total: data?.meta?.total ?? 0,
    };
  }, [data, isLoading, isFetching, error, isValidSelection]);
}

/**
 * Result type for choropleth data hook
 */
export interface UseChoroplethDataResult {
  /** Choropleth data points for map visualization */
  choroplethData: ChoroplethDataPoint[];
  /** Legend title based on current selections */
  legendTitle: string;
  /** Whether display mode is rate (affects formatting) */
  isRate: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether data is being fetched */
  isFetching: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there's data to display */
  hasData: boolean;
  /** Name of the selected category */
  categoryName: string;
}

/**
 * Hook that transforms observations into choropleth data for map visualization.
 *
 * This hook:
 * 1. Fetches observations based on selections
 * 2. Aggregates data by area (handles multiple years by summing/averaging)
 * 3. Transforms to choropleth data format
 * 4. Returns ready-to-use data for MapContainer
 *
 * @example
 * ```tsx
 * const { choroplethData, legendTitle, isRate, isLoading } = useChoroplethData();
 *
 * return (
 *   <MapContainer
 *     choropleth={{
 *       data: choroplethData,
 *       title: legendTitle,
 *       isRate,
 *     }}
 *     isChoroplethLoading={isLoading}
 *   />
 * );
 * ```
 */
export function useChoroplethData(): UseChoroplethDataResult {
  const { displayMode, categoryId, yearRange } = useSelections();
  const { observations, isLoading, isFetching, error, hasData } =
    useSelectedObservations();

  // Fetch categories to get the selected category name
  const { data: categories } = useGetCategoriesQuery();

  // Find the selected category
  const selectedCategory = useMemo(() => {
    if (!categoryId || !categories) return null;
    return categories.find((c) => c.id === categoryId) ?? null;
  }, [categoryId, categories]);

  // Transform observations to choropleth data
  const result = useMemo(() => {
    const isRate = displayMode === 'rate';
    const categoryName = selectedCategory?.name ?? 'Crime';

    // Build legend title
    let legendTitle = isRate ? 'per 100k' : 'Count';
    if (yearRange[0] === yearRange[1]) {
      legendTitle = `${categoryName} (${yearRange[0]}) - ${legendTitle}`;
    } else {
      legendTitle = `${categoryName} (${yearRange[0]}-${yearRange[1]}) - ${legendTitle}`;
    }

    // If no data, return empty result
    if (!hasData || observations.length === 0) {
      return {
        choroplethData: [],
        legendTitle,
        isRate,
        categoryName,
      };
    }

    // Aggregate observations by area
    // For single year: use the value directly
    // For multiple years: average the values
    const areaAggregates = new Map<
      string,
      { sum: number; rateSum: number; count: number }
    >();

    for (const obs of observations) {
      const existing = areaAggregates.get(obs.areaId);
      if (existing) {
        existing.sum += obs.count;
        existing.rateSum += obs.ratePer100k ?? 0;
        existing.count += 1;
      } else {
        areaAggregates.set(obs.areaId, {
          sum: obs.count,
          rateSum: obs.ratePer100k ?? 0,
          count: 1,
        });
      }
    }

    // Convert to choropleth data points
    const choroplethData: ChoroplethDataPoint[] = [];
    for (const [areaId, aggregate] of areaAggregates) {
      // For count: sum all years; for rate: average across years
      const value = isRate
        ? aggregate.rateSum / aggregate.count
        : aggregate.sum;

      choroplethData.push({
        areaId,
        value,
      });
    }

    return {
      choroplethData,
      legendTitle,
      isRate,
      categoryName,
    };
  }, [observations, displayMode, hasData, yearRange, selectedCategory]);

  return {
    ...result,
    isLoading,
    isFetching,
    error,
    hasData,
  };
}

/**
 * Hook that provides default category and data source selection on first load.
 *
 * This hook:
 * 1. Fetches available categories and data sources
 * 2. Dispatches actions to set defaults if nothing is selected
 * 3. Ensures the UI starts with valid selections
 */
export function useDefaultSelections() {
  const dispatch = useAppDispatch();
  const { categoryId, dataSourceId } = useSelections();

  // Fetch categories and data sources
  const { data: categories, isSuccess: categoriesLoaded } = useGetCategoriesQuery();
  const { data: dataSources, isSuccess: dataSourcesLoaded } = useGetDataSourcesQuery();

  // Set default category on first load (if none selected)
  useMemo(() => {
    if (categoriesLoaded && categories && categories.length > 0 && !categoryId) {
      // Select the first active category (prefer one with medium severity for demo)
      const defaultCategory =
        categories.find((c) => c.isActive && c.severity === 'medium') ??
        categories.find((c) => c.isActive) ??
        categories[0];

      if (defaultCategory) {
        // Import dispatch action
        import('./selectionsSlice').then(({ setCategoryId }) => {
          dispatch(setCategoryId(defaultCategory.id));
        });
      }
    }
  }, [categoriesLoaded, categories, categoryId, dispatch]);

  // Set default data source on first load (if none selected)
  useMemo(() => {
    if (dataSourcesLoaded && dataSources && dataSources.length > 0 && !dataSourceId) {
      // Select the first data source
      const defaultDataSource = dataSources[0];

      if (defaultDataSource) {
        import('./selectionsSlice').then(({ setDataSourceId }) => {
          dispatch(setDataSourceId(defaultDataSource.id));
        });
      }
    }
  }, [dataSourcesLoaded, dataSources, dataSourceId, dispatch]);

  return {
    isLoading: !categoriesLoaded || !dataSourcesLoaded,
    hasCategories: (categories?.length ?? 0) > 0,
    hasDataSources: (dataSources?.length ?? 0) > 0,
  };
}
