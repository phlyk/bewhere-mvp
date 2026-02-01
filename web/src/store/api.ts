import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// API Types based on OpenAPI spec from backend
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface AdministrativeArea {
  id: string;
  code: string;
  name: string;
  level: 'country' | 'region' | 'department';
  countryCode: string;
  parentCode?: string;
  population?: number;
  geometry?: GeoJSON.MultiPolygon;
}

/**
 * Severity level for crime categories.
 */
export type CrimeSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * High-level crime category groups.
 */
export type CrimeCategoryGroup = 'violent_crimes' | 'property_crimes' | 'drug_offenses' | 'other_offenses';

export interface CrimeCategory {
  id: string;
  code: string;
  name: string;
  nameFr: string;
  description?: string | null;
  severity: CrimeSeverity;
  categoryGroup: CrimeCategoryGroup;
  sortOrder: number;
  isActive: boolean;
}

export interface DataSource {
  id: string;
  code: string;
  name: string;
  nameFr?: string;
  description?: string;
  url?: string;
  updateFrequency?: string;
}

export interface CrimeObservation {
  id: string;
  areaId: string;
  categoryId: string;
  dataSourceId: string;
  year: number;
  count: number;
  ratePer100k?: number;
  area?: AdministrativeArea;
  category?: CrimeCategory;
  dataSource?: DataSource;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AreaComparisonResult {
  areaA: {
    area: AdministrativeArea;
    count: number;
    ratePer100k?: number;
  };
  areaB: {
    area: AdministrativeArea;
    count: number;
    ratePer100k?: number;
  };
  difference: {
    count: number;
    ratePer100k?: number;
    percentageCount: number;
    percentageRate?: number;
  };
}

export interface YearComparisonResult {
  yearA: {
    year: number;
    count: number;
    ratePer100k?: number;
  };
  yearB: {
    year: number;
    count: number;
    ratePer100k?: number;
  };
  difference: {
    count: number;
    ratePer100k?: number;
    percentageCount: number;
    percentageRate?: number;
  };
}

export interface SourceComparisonItem {
  category: CrimeCategory;
  countA: number | null;
  countB: number | null;
  rateA: number | null;
  rateB: number | null;
  countDiff: number | null;
  rateDiff: number | null;
  countPctChange: number | null;
  ratePctChange: number | null;
}

export interface SourceComparisonResult {
  sourceA: DataSource;
  sourceB: DataSource;
  area: AdministrativeArea;
  year: number;
  comparisons: SourceComparisonItem[];
}

// Query parameter types
export interface GetAreasParams {
  level?: 'country' | 'region' | 'department';
  parentCode?: string;
  includeGeometry?: boolean;
}

export interface GetAreasGeoJsonParams {
  level?: 'country' | 'region' | 'department';
  parentCode?: string;
  countryCode?: string;
}

export interface GetObservationsParams {
  areaId?: string;
  categoryId?: string;
  dataSourceId?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  page?: number;
  limit?: number;
}

export interface CompareAreasParams {
  areaIdA: string;
  areaIdB: string;
  categoryId: string;
  year: number;
  dataSourceId?: string;
}

export interface CompareYearsParams {
  areaId: string;
  categoryId: string;
  yearA: number;
  yearB: number;
  dataSourceId?: string;
}

export interface CompareSourcesParams {
  sourceCodeA: string;
  sourceCodeB: string;
  areaCode: string;
  year: number;
  categoryCode?: string;
}

// RTK Query API definition
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  }),
  tagTypes: ['Areas', 'Categories', 'Observations', 'DataSources'],
  endpoints: (builder) => ({
    // Health check
    getHealth: builder.query<HealthResponse, void>({
      query: () => '/health',
    }),

    // Areas endpoints
    getAreas: builder.query<AdministrativeArea[], GetAreasParams | void>({
      query: (params) => ({
        url: '/areas',
        params: params || {},
      }),
      transformResponse: (response: { data: AdministrativeArea[]; total: number } | AdministrativeArea[]) =>
        Array.isArray(response) ? response : response.data,
      providesTags: ['Areas'],
    }),

    getAreaById: builder.query<AdministrativeArea, string>({
      query: (id) => `/areas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Areas', id }],
    }),

    getAreasGeoJson: builder.query<GeoJSON.FeatureCollection, GetAreasGeoJsonParams | void>({
      query: (params) => ({
        url: '/areas/geojson',
        params: params || {},
      }),
      providesTags: ['Areas'],
    }),

    // Categories endpoints
    getCategories: builder.query<CrimeCategory[], void>({
      query: () => '/categories',
      transformResponse: (response: { data: CrimeCategory[]; total: number } | CrimeCategory[]) =>
        Array.isArray(response) ? response : response.data,
      providesTags: ['Categories'],
    }),

    getCategoryById: builder.query<CrimeCategory, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Categories', id }],
    }),

    // Data sources endpoints
    getDataSources: builder.query<DataSource[], void>({
      query: () => '/data-sources',
      transformResponse: (response: { data: DataSource[]; total: number } | DataSource[]) =>
        Array.isArray(response) ? response : response.data,
      providesTags: ['DataSources'],
    }),

    // Observations endpoints
    getObservations: builder.query<PaginatedResponse<CrimeObservation>, GetObservationsParams>({
      query: (params) => ({
        url: '/observations',
        params,
      }),
      providesTags: ['Observations'],
    }),

    // Comparison endpoints
    compareAreas: builder.query<AreaComparisonResult, CompareAreasParams>({
      query: (params) => ({
        url: '/compare/areas',
        params,
      }),
    }),

    compareYears: builder.query<YearComparisonResult, CompareYearsParams>({
      query: (params) => ({
        url: '/compare/years',
        params,
      }),
    }),

    compareSources: builder.query<SourceComparisonResult, CompareSourcesParams>({
      query: (params) => ({
        url: '/compare/sources',
        params,
      }),
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetHealthQuery,
  useGetAreasQuery,
  useGetAreaByIdQuery,
  useGetAreasGeoJsonQuery,
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetDataSourcesQuery,
  useGetObservationsQuery,
  useCompareAreasQuery,
  useCompareYearsQuery,
  useCompareSourcesQuery,
} = api;
