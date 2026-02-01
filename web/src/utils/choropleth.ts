/**
 * Choropleth color scale utilities for map visualization
 *
 * Provides functions to map numeric values (crime counts, rates) to colors
 * for choropleth map rendering in Mapbox GL JS.
 */

// Sequential color scale (low to high) - matches theme
export const SEQUENTIAL_COLORS = [
  '#f7fbff',
  '#deebf7',
  '#c6dbef',
  '#9ecae1',
  '#6baed6',
  '#4292c6',
  '#2171b5',
  '#08519c',
  '#08306b',
] as const;

// Diverging color scale for comparison views (decrease to increase)
export const DIVERGING_COLORS = [
  '#2166ac', // Strong decrease
  '#4393c3',
  '#92c5de',
  '#d1e5f0',
  '#f7f7f7', // No change
  '#fddbc7',
  '#f4a582',
  '#d6604d',
  '#b2182b', // Strong increase
] as const;

// No data color
export const NO_DATA_COLOR = '#e0e0e0';

/**
 * Data value with area identifier
 */
export interface ChoroplethDataPoint {
  areaId: string;
  value: number;
}

/**
 * Scale configuration for choropleth rendering
 */
export interface ChoroplethScale {
  type: 'sequential' | 'diverging';
  colors: readonly string[];
  domain: [number, number]; // [min, max]
  breaks: number[]; // Value breakpoints for each color
}

/**
 * Legend configuration derived from scale
 */
export interface LegendConfig {
  colors: string[];
  labels: string[];
  title: string;
  noDataColor: string;
  noDataLabel: string;
}

/**
 * Calculate quantile breaks for a dataset
 */
export function calculateQuantileBreaks(
  values: number[],
  numClasses: number
): number[] {
  if (values.length === 0) {
    return [];
  }

  const sorted = [...values].sort((a, b) => a - b);
  const breaks: number[] = [];

  for (let i = 1; i <= numClasses; i++) {
    const index = Math.floor((i / numClasses) * sorted.length) - 1;
    breaks.push(sorted[Math.max(0, index)]);
  }

  // Ensure last break is the maximum
  breaks[breaks.length - 1] = sorted[sorted.length - 1];

  return breaks;
}

/**
 * Calculate equal interval breaks for a dataset
 */
export function calculateEqualIntervalBreaks(
  min: number,
  max: number,
  numClasses: number
): number[] {
  const interval = (max - min) / numClasses;
  const breaks: number[] = [];

  for (let i = 1; i <= numClasses; i++) {
    breaks.push(min + interval * i);
  }

  return breaks;
}

/**
 * Create a sequential choropleth scale
 */
export function createSequentialScale(
  values: number[],
  options: {
    method?: 'quantile' | 'equal';
    numClasses?: number;
    colors?: readonly string[];
  } = {}
): ChoroplethScale {
  const {
    method = 'quantile',
    numClasses = SEQUENTIAL_COLORS.length,
    colors = SEQUENTIAL_COLORS,
  } = options;

  if (values.length === 0) {
    return {
      type: 'sequential',
      colors,
      domain: [0, 100],
      breaks: calculateEqualIntervalBreaks(0, 100, colors.length),
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  const breaks =
    method === 'quantile'
      ? calculateQuantileBreaks(values, colors.length)
      : calculateEqualIntervalBreaks(min, max, colors.length);

  return {
    type: 'sequential',
    colors,
    domain: [min, max],
    breaks,
  };
}

/**
 * Create a diverging choropleth scale centered at zero
 */
export function createDivergingScale(
  values: number[],
  options: {
    colors?: readonly string[];
    centerValue?: number;
  } = {}
): ChoroplethScale {
  const { colors = DIVERGING_COLORS, centerValue = 0 } = options;

  if (values.length === 0) {
    return {
      type: 'diverging',
      colors,
      domain: [-100, 100],
      breaks: calculateEqualIntervalBreaks(-100, 100, colors.length),
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  // Create symmetric domain around center value
  const maxAbsValue = Math.max(Math.abs(min - centerValue), Math.abs(max - centerValue));
  const domain: [number, number] = [centerValue - maxAbsValue, centerValue + maxAbsValue];

  const breaks = calculateEqualIntervalBreaks(domain[0], domain[1], colors.length);

  return {
    type: 'diverging',
    colors,
    domain,
    breaks,
  };
}

/**
 * Get color for a value based on scale
 */
export function getColorForValue(value: number | null | undefined, scale: ChoroplethScale): string {
  if (value === null || value === undefined) {
    return NO_DATA_COLOR;
  }

  const { colors, breaks } = scale;

  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) {
      return colors[i];
    }
  }

  return colors[colors.length - 1];
}

/**
 * Build Mapbox GL JS fill-color expression for choropleth
 *
 * Creates a step expression that can be used with map.setPaintProperty()
 */
export function buildMapboxColorExpression(
  scale: ChoroplethScale,
  dataProperty: string = 'value'
): mapboxgl.Expression {
  const { colors, breaks } = scale;

  // Build step expression: ['step', ['get', 'value'], color0, break1, color1, break2, color2, ...]
  const expression: (string | number | string[])[] = [
    'step',
    ['get', dataProperty],
    colors[0], // Default color for values <= first break
  ];

  for (let i = 0; i < breaks.length - 1; i++) {
    expression.push(breaks[i], colors[i + 1]);
  }

  return expression as mapboxgl.Expression;
}

/**
 * Build Mapbox GL JS fill-color expression with case/match for area IDs
 *
 * Use when data is not embedded in GeoJSON properties
 */
export function buildMapboxMatchExpression(
  dataPoints: ChoroplethDataPoint[],
  scale: ChoroplethScale,
  idProperty: string = 'id'
): mapboxgl.Expression {
  if (dataPoints.length === 0) {
    return NO_DATA_COLOR;
  }

  // Build match expression: ['match', ['get', 'id'], id1, color1, id2, color2, ..., defaultColor]
  const expression: (string | string[] | number[])[] = [
    'match',
    ['get', idProperty],
  ];

  for (const point of dataPoints) {
    const color = getColorForValue(point.value, scale);
    expression.push(point.areaId, color);
  }

  // Default color for areas without data
  expression.push(NO_DATA_COLOR);

  return expression as mapboxgl.Expression;
}

/**
 * Format value for legend display
 */
export function formatLegendValue(value: number, options: { isRate?: boolean; compact?: boolean } = {}): string {
  const { isRate = false, compact = true } = options;

  if (compact && Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  if (isRate) {
    return value.toFixed(1);
  }

  return Math.round(value).toLocaleString();
}

/**
 * Generate legend configuration from scale
 */
export function generateLegendConfig(
  scale: ChoroplethScale,
  options: {
    title?: string;
    isRate?: boolean;
    compact?: boolean;
  } = {}
): LegendConfig {
  const { title = 'Value', isRate = false, compact = true } = options;
  const { colors, breaks, domain } = scale;

  const labels: string[] = [];

  // Generate range labels
  for (let i = 0; i < colors.length; i++) {
    const lowerBound = i === 0 ? domain[0] : breaks[i - 1];
    const upperBound = breaks[i];

    const lowerLabel = formatLegendValue(lowerBound, { isRate, compact });
    const upperLabel = formatLegendValue(upperBound, { isRate, compact });

    if (i === 0) {
      labels.push(`< ${upperLabel}`);
    } else if (i === colors.length - 1) {
      labels.push(`≥ ${lowerLabel}`);
    } else {
      labels.push(`${lowerLabel} - ${upperLabel}`);
    }
  }

  return {
    colors: [...colors],
    labels,
    title,
    noDataColor: NO_DATA_COLOR,
    noDataLabel: 'No data',
  };
}

/**
 * Merge crime observation data into GeoJSON features
 */
export function mergeDataIntoGeoJson(
  geoJson: GeoJSON.FeatureCollection,
  dataPoints: ChoroplethDataPoint[],
  valuePropertyName: string = 'value'
): GeoJSON.FeatureCollection {
  const dataMap = new Map(dataPoints.map((p) => [p.areaId, p.value]));

  return {
    type: 'FeatureCollection',
    features: geoJson.features.map((feature) => {
      const areaId = feature.properties?.id as string;
      const value = dataMap.get(areaId);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          [valuePropertyName]: value ?? null,
          hasData: value !== undefined,
        },
      };
    }),
  };
}

export default {
  SEQUENTIAL_COLORS,
  DIVERGING_COLORS,
  NO_DATA_COLOR,
  createSequentialScale,
  createDivergingScale,
  getColorForValue,
  buildMapboxColorExpression,
  buildMapboxMatchExpression,
  formatLegendValue,
  generateLegendConfig,
  mergeDataIntoGeoJson,
};
