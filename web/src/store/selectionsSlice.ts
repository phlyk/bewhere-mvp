/**
 * Redux slice for managing UI filter selections.
 *
 * Centralizes state for:
 * - Selected area IDs (départements)
 * - Selected crime category
 * - Year range
 * - Data source
 * - Display mode (count vs rate)
 * - View mode (map vs compare)
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_MAX_YEAR, DEFAULT_MIN_YEAR } from '../components/YearRangeSelector';

/**
 * Display mode for crime statistics
 */
export type DisplayMode = 'count' | 'rate';

/**
 * View mode for the main application
 */
export type ViewMode = 'map' | 'compare';

/**
 * Selection state for all UI filters
 */
export interface SelectionsState {
  /** Selected département/region IDs */
  areaIds: string[];
  /** Selected crime category ID */
  categoryId: string;
  /** Selected year range [startYear, endYear] */
  yearRange: [number, number];
  /** Selected data source ID */
  dataSourceId: string;
  /** Display mode: count or rate per 100k */
  displayMode: DisplayMode;
  /** Area clicked on the map (for highlighting) */
  mapSelectedAreaId: string | null;
  /** View mode: map visualization or comparison panel */
  viewMode: ViewMode;
}

const initialState: SelectionsState = {
  areaIds: [],
  categoryId: '',
  yearRange: [DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR],
  dataSourceId: '',
  displayMode: 'rate',
  mapSelectedAreaId: null,
  viewMode: 'map',
};

export const selectionsSlice = createSlice({
  name: 'selections',
  initialState,
  reducers: {
    /**
     * Set selected area IDs (départements)
     */
    setAreaIds: (state, action: PayloadAction<string[]>) => {
      state.areaIds = action.payload;
    },

    /**
     * Add an area ID to the selection
     */
    addAreaId: (state, action: PayloadAction<string>) => {
      if (!state.areaIds.includes(action.payload)) {
        state.areaIds.push(action.payload);
      }
    },

    /**
     * Remove an area ID from the selection
     */
    removeAreaId: (state, action: PayloadAction<string>) => {
      state.areaIds = state.areaIds.filter((id) => id !== action.payload);
    },

    /**
     * Toggle an area ID in the selection
     */
    toggleAreaId: (state, action: PayloadAction<string>) => {
      const index = state.areaIds.indexOf(action.payload);
      if (index === -1) {
        state.areaIds.push(action.payload);
      } else {
        state.areaIds.splice(index, 1);
      }
    },

    /**
     * Clear all selected areas
     */
    clearAreaIds: (state) => {
      state.areaIds = [];
    },

    /**
     * Set selected crime category ID
     */
    setCategoryId: (state, action: PayloadAction<string>) => {
      state.categoryId = action.payload;
    },

    /**
     * Set selected year range
     */
    setYearRange: (state, action: PayloadAction<[number, number]>) => {
      state.yearRange = action.payload;
    },

    /**
     * Set selected data source ID
     */
    setDataSourceId: (state, action: PayloadAction<string>) => {
      state.dataSourceId = action.payload;
    },

    /**
     * Set display mode (count vs rate)
     */
    setDisplayMode: (state, action: PayloadAction<DisplayMode>) => {
      state.displayMode = action.payload;
    },

    /**
     * Set the area selected on the map (for highlighting)
     */
    setMapSelectedAreaId: (state, action: PayloadAction<string | null>) => {
      state.mapSelectedAreaId = action.payload;
    },

    /**
     * Set view mode (map vs compare)
     */
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },

    /**
     * Reset all selections to defaults
     */
    resetSelections: (state) => {
      state.areaIds = initialState.areaIds;
      state.categoryId = initialState.categoryId;
      state.yearRange = initialState.yearRange;
      state.dataSourceId = initialState.dataSourceId;
      state.displayMode = initialState.displayMode;
      state.mapSelectedAreaId = initialState.mapSelectedAreaId;
      state.viewMode = initialState.viewMode;
    },
  },
});

export const {
  setAreaIds,
  addAreaId,
  removeAreaId,
  toggleAreaId,
  clearAreaIds,
  setCategoryId,
  setYearRange,
  setDataSourceId,
  setDisplayMode,
  setMapSelectedAreaId,
  setViewMode,
  resetSelections,
} = selectionsSlice.actions;

export default selectionsSlice.reducer;
