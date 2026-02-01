/**
 * ComparisonChart Component
 *
 * Visualizes crime statistics trends over time using Recharts.
 * Supports:
 * - Single area time series (line chart)
 * - Area comparison bar chart (side by side)
 * - Year-over-year comparison
 */

import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
    Alert,
    Box,
    Card,
    CardContent,
    FormControl,
    FormLabel,
    Skeleton,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';
import {
    useGetAreasQuery,
    useGetObservationsQuery,
    type CrimeObservation,
} from '../store';
import { RegionDepartmentSelector } from './RegionDepartmentSelector';

/**
 * Chart type options
 */
export type ChartType = 'line' | 'bar';

/**
 * Props for ComparisonChart component
 */
export interface ComparisonChartProps {
  /**
   * Selected crime category ID (required)
   */
  categoryId: string;
  /**
   * Selected data source ID (optional filter)
   */
  dataSourceId?: string;
  /**
   * Year range to display
   */
  yearRange: [number, number];
  /**
   * Display mode (count or rate)
   */
  displayMode: 'count' | 'rate';
}

/**
 * Data point for the chart
 */
interface ChartDataPoint {
  year: number;
  [key: string]: number | string;
}

/**
 * Format value based on display mode
 */
function formatValue(value: number | null | undefined, isRate: boolean): string {
  if (value === null || value === undefined) return '—';
  if (isRate) {
    return value.toFixed(1);
  }
  return value.toLocaleString();
}

/**
 * Calculate trend direction from data
 */
function calculateTrend(data: ChartDataPoint[], key: string): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat';
  
  const firstValue = data[0][key] as number;
  const lastValue = data[data.length - 1][key] as number;
  
  if (!firstValue || !lastValue) return 'flat';
  
  const changePercent = ((lastValue - firstValue) / firstValue) * 100;
  
  if (changePercent > 5) return 'up';
  if (changePercent < -5) return 'down';
  return 'flat';
}

/**
 * Get trend icon and color
 */
function getTrendIndicator(trend: 'up' | 'down' | 'flat') {
  switch (trend) {
    case 'up':
      return {
        icon: <TrendingUpIcon fontSize="small" />,
        color: 'error.main',
        label: 'Increasing',
      };
    case 'down':
      return {
        icon: <TrendingDownIcon fontSize="small" />,
        color: 'success.main',
        label: 'Decreasing',
      };
    default:
      return {
        icon: <TrendingFlatIcon fontSize="small" />,
        color: 'text.secondary',
        label: 'Stable',
      };
  }
}

/**
 * Loading skeleton for chart
 */
function ChartSkeleton() {
  return (
    <Box>
      <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
      <Box display="flex" justifyContent="center" gap={2} mt={2}>
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
    </Box>
  );
}

/**
 * Custom tooltip for Recharts
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  isRate: boolean;
}

function CustomTooltip({ active, payload, label, isRate }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Card elevation={3} sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.dataKey} display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: entry.color,
            }}
          />
          <Typography variant="body2">
            {entry.name}: {formatValue(entry.value, isRate)}
            {isRate && ' per 100k'}
          </Typography>
        </Box>
      ))}
    </Card>
  );
}

/**
 * Single area trend chart
 */
interface SingleAreaTrendProps {
  areaId: string;
  areaName: string;
  categoryId: string;
  dataSourceId?: string;
  yearRange: [number, number];
  displayMode: 'count' | 'rate';
  chartType: ChartType;
}

function SingleAreaTrend({
  areaId,
  areaName,
  categoryId,
  dataSourceId,
  yearRange,
  displayMode,
  chartType,
}: SingleAreaTrendProps) {
  const theme = useTheme();
  const isRate = displayMode === 'rate';

  // Fetch observations for the area
  const { data, isLoading, error } = useGetObservationsQuery(
    {
      areaId,
      categoryId,
      dataSourceId,
      yearFrom: yearRange[0],
      yearTo: yearRange[1],
      limit: 100,
    },
    { skip: !areaId || !categoryId }
  );

  // Transform data for chart
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!data?.data) return [];

    const yearMap = new Map<number, CrimeObservation>();
    
    // Use the most recent observation per year (in case of duplicates)
    data.data.forEach((obs) => {
      const existing = yearMap.get(obs.year);
      if (!existing || obs.id > existing.id) {
        yearMap.set(obs.year, obs);
      }
    });

    // Convert to chart data points, sorted by year
    return Array.from(yearMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, obs]) => ({
        year,
        value: isRate ? (obs.ratePer100k ?? 0) : obs.count,
      }));
  }, [data, isRate]);

  // Calculate trend
  const trend = useMemo(() => calculateTrend(chartData, 'value'), [chartData]);
  const trendIndicator = getTrendIndicator(trend);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load trend data. Please try again.
      </Alert>
    );
  }

  if (chartData.length === 0) {
    return (
      <Alert severity="info">
        No data available for the selected area and time range.
      </Alert>
    );
  }

  const primaryColor = theme.palette.primary.main;

  return (
    <Box>
      {/* Trend indicator */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          {areaName} • {yearRange[0]}–{yearRange[1]}
        </Typography>
        <Tooltip title={trendIndicator.label}>
          <Box display="flex" alignItems="center" sx={{ color: trendIndicator.color }}>
            {trendIndicator.icon}
            <Typography variant="caption" sx={{ ml: 0.5, color: trendIndicator.color }}>
              {trendIndicator.label}
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        {chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, isRate)}
            />
            <RechartsTooltip
              content={<CustomTooltip isRate={isRate} />}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={isRate ? 'Rate per 100k' : 'Count'}
              stroke={primaryColor}
              strokeWidth={2}
              dot={{ fill: primaryColor, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: primaryColor }}
            />
          </LineChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, isRate)}
            />
            <RechartsTooltip
              content={<CustomTooltip isRate={isRate} />}
            />
            <Bar
              dataKey="value"
              name={isRate ? 'Rate per 100k' : 'Count'}
              fill={primaryColor}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

/**
 * Dual area comparison chart
 */
interface DualAreaComparisonChartProps {
  areaIdA: string;
  areaIdB: string;
  areaNameA: string;
  areaNameB: string;
  categoryId: string;
  dataSourceId?: string;
  yearRange: [number, number];
  displayMode: 'count' | 'rate';
}

function DualAreaComparisonChart({
  areaIdA,
  areaIdB,
  areaNameA,
  areaNameB,
  categoryId,
  dataSourceId,
  yearRange,
  displayMode,
}: DualAreaComparisonChartProps) {
  const theme = useTheme();
  const isRate = displayMode === 'rate';

  // Fetch observations for both areas
  const { data: dataA, isLoading: loadingA } = useGetObservationsQuery(
    {
      areaId: areaIdA,
      categoryId,
      dataSourceId,
      yearFrom: yearRange[0],
      yearTo: yearRange[1],
      limit: 100,
    },
    { skip: !areaIdA || !categoryId }
  );

  const { data: dataB, isLoading: loadingB } = useGetObservationsQuery(
    {
      areaId: areaIdB,
      categoryId,
      dataSourceId,
      yearFrom: yearRange[0],
      yearTo: yearRange[1],
      limit: 100,
    },
    { skip: !areaIdB || !categoryId }
  );

  const isLoading = loadingA || loadingB;

  // Combine data for comparison chart
  const chartData = useMemo((): ChartDataPoint[] => {
    const yearMap = new Map<number, { areaA?: number; areaB?: number }>();

    // Process area A data
    dataA?.data?.forEach((obs) => {
      const value = isRate ? (obs.ratePer100k ?? 0) : obs.count;
      const existing = yearMap.get(obs.year) || {};
      yearMap.set(obs.year, { ...existing, areaA: value });
    });

    // Process area B data
    dataB?.data?.forEach((obs) => {
      const value = isRate ? (obs.ratePer100k ?? 0) : obs.count;
      const existing = yearMap.get(obs.year) || {};
      yearMap.set(obs.year, { ...existing, areaB: value });
    });

    return Array.from(yearMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, values]) => ({
        year,
        [areaNameA]: values.areaA ?? 0,
        [areaNameB]: values.areaB ?? 0,
      }));
  }, [dataA, dataB, isRate, areaNameA, areaNameB]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (chartData.length === 0) {
    return (
      <Alert severity="info">
        No data available for comparison. Select two areas with data.
      </Alert>
    );
  }

  const colorA = theme.palette.primary.main;
  const colorB = theme.palette.secondary.main;

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        {areaNameA} vs {areaNameB} • {yearRange[0]}–{yearRange[1]}
      </Typography>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatValue(value, isRate)}
          />
          <RechartsTooltip
            content={<CustomTooltip isRate={isRate} />}
          />
          <Legend />
          <Bar
            dataKey={areaNameA}
            name={areaNameA}
            fill={colorA}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey={areaNameB}
            name={areaNameB}
            fill={colorB}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

/**
 * Main ComparisonChart component
 *
 * Displays time-series crime data visualization.
 *
 * @example
 * ```tsx
 * <ComparisonChart
 *   categoryId={selectedCategoryId}
 *   dataSourceId={selectedDataSourceId}
 *   yearRange={selectedYearRange}
 *   displayMode={displayMode}
 * />
 * ```
 */
export function ComparisonChart({
  categoryId,
  dataSourceId,
  yearRange,
  displayMode,
}: ComparisonChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [comparisonAreaId, setComparisonAreaId] = useState<string>('');

  // Fetch areas for name lookup
  const { data: areas } = useGetAreasQuery({ level: 'department' });

  // Get area names
  const selectedAreaName = useMemo(() => {
    if (!selectedAreaId || !areas) return 'Area';
    const area = areas.find((a) => a.id === selectedAreaId);
    return area?.name ?? 'Area';
  }, [selectedAreaId, areas]);

  const comparisonAreaName = useMemo(() => {
    if (!comparisonAreaId || !areas) return 'Area B';
    const area = areas.find((a) => a.id === comparisonAreaId);
    return area?.name ?? 'Area B';
  }, [comparisonAreaId, areas]);

  // Handlers
  const handleAreaChange = useCallback((ids: string[]) => {
    setSelectedAreaId(ids[0] || '');
  }, []);

  const handleComparisonAreaChange = useCallback((ids: string[]) => {
    setComparisonAreaId(ids[0] || '');
  }, []);

  const handleChartTypeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
      if (newType !== null) {
        setChartType(newType);
      }
    },
    []
  );

  // Check if we have required data
  if (!categoryId) {
    return (
      <Alert severity="warning">
        Please select a crime category to view trends.
      </Alert>
    );
  }

  const showComparison = !!comparisonAreaId && !!selectedAreaId;

  return (
    <Box>
      {/* Area selector */}
      <Box mb={2}>
        <FormControl fullWidth size="small">
          <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            Select Area
          </FormLabel>
          <RegionDepartmentSelector
            value={selectedAreaId ? [selectedAreaId] : []}
            onChange={handleAreaChange}
            multiple={false}
            levels={['department']}
            placeholder="Select an area to view trend..."
            label=""
            size="small"
          />
        </FormControl>
      </Box>

      {/* Optional comparison area */}
      <Box mb={2}>
        <FormControl fullWidth size="small">
          <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            Compare with (optional)
          </FormLabel>
          <RegionDepartmentSelector
            value={comparisonAreaId ? [comparisonAreaId] : []}
            onChange={handleComparisonAreaChange}
            multiple={false}
            levels={['department']}
            placeholder="Select second area for comparison..."
            label=""
            size="small"
          />
        </FormControl>
      </Box>

      {/* Chart type toggle (only for single area) */}
      {!showComparison && selectedAreaId && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
            aria-label="Chart type"
          >
            <ToggleButton value="line" aria-label="Line chart">
              Line
            </ToggleButton>
            <ToggleButton value="bar" aria-label="Bar chart">
              Bar
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Chart display */}
      {!selectedAreaId && (
        <Card variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography color="text.secondary">
            Select an area above to view crime trends over time.
          </Typography>
        </Card>
      )}

      {selectedAreaId && !showComparison && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <SingleAreaTrend
              areaId={selectedAreaId}
              areaName={selectedAreaName}
              categoryId={categoryId}
              dataSourceId={dataSourceId}
              yearRange={yearRange}
              displayMode={displayMode}
              chartType={chartType}
            />
          </CardContent>
        </Card>
      )}

      {showComparison && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <DualAreaComparisonChart
              areaIdA={selectedAreaId}
              areaIdB={comparisonAreaId}
              areaNameA={selectedAreaName}
              areaNameB={comparisonAreaName}
              categoryId={categoryId}
              dataSourceId={dataSourceId}
              yearRange={yearRange}
              displayMode={displayMode}
            />
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
        {showComparison
          ? 'Comparing crime trends between two areas over time.'
          : 'View how crime statistics have changed over the selected time period.'}
      </Typography>
    </Box>
  );
}

export default ComparisonChart;
