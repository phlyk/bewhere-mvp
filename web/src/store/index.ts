export {
    api, useCompareAreasQuery,
    useCompareSourcesQuery,
    useCompareYearsQuery, useGetAreaByIdQuery,
    useGetAreasGeoJsonQuery, useGetAreasQuery, useGetCategoriesQuery,
    useGetCategoryByIdQuery,
    useGetDataSourcesQuery, useGetHealthQuery, useGetObservationsQuery
} from './api';
export type {
    AdministrativeArea, AreaComparisonResult, CompareAreasParams,
    CompareSourcesParams,
    CompareYearsParams, CrimeCategory, CrimeCategoryGroup, CrimeObservation, CrimeSeverity, DataSource, GetAreasGeoJsonParams, GetAreasParams, GetObservationsParams, HealthResponse, PaginatedResponse, SourceComparisonItem, SourceComparisonResult, YearComparisonResult
} from './api';
export { useAppDispatch, useAppSelector } from './hooks';
export {
    selectAreaIds,
    selectCategoryId, selectDataSourceId,
    selectDisplayMode,
    selectMapSelectedAreaId, selectSelections, selectViewMode, selectYearRange, useBuildObservationsParams, useChoroplethData,
    useDefaultSelections, useSelectedObservations, useSelections,
    useSelectionsValid
} from './selectionHooks';
export type { UseChoroplethDataResult, UseObservationsResult } from './selectionHooks';
export {
    addAreaId, clearAreaIds, removeAreaId, resetSelections, setAreaIds, setCategoryId, setDataSourceId,
    setDisplayMode,
    setMapSelectedAreaId, setViewMode, setYearRange, toggleAreaId
} from './selectionsSlice';
export type { DisplayMode, SelectionsState, ViewMode } from './selectionsSlice';
export { store, type AppDispatch, type RootState } from './store';

