/**
 * ComparePanel Component
 *
 * A panel for comparing crime statistics between two areas or across years.
 * Supports:
 * - Area vs Area comparison (select two départements)
 * - Year vs Year comparison for a single area
 * - Source vs Source comparison (show discrepancies between datasets)
 * - Displays delta, percentage change, and visual indicators
 */

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import RemoveIcon from '@mui/icons-material/Remove';
import StorageIcon from '@mui/icons-material/Storage';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControl,
    FormLabel,
    IconButton,
    Skeleton,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback, useMemo, useState, type SyntheticEvent } from 'react';
import {
    useCompareAreasQuery,
    useCompareSourcesQuery,
    useCompareYearsQuery,
    useGetAreasQuery,
    useGetDataSourcesQuery,
    type SourceComparisonItem,
} from '../store';
import { ComparisonChart } from './ComparisonChart';
import { RegionDepartmentSelector } from './RegionDepartmentSelector';
import { SingleYearSelector } from './YearRangeSelector';

/**
 * Comparison mode - areas, years, sources, or trends
 */
export type CompareMode = 'areas' | 'years' | 'sources' | 'trends';

/**
 * Props for ComparePanel component
 */
export interface ComparePanelProps {
  /**
   * Selected crime category ID (required for comparison)
   */
  categoryId: string;
  /**
   * Selected data source ID (optional filter)
   */
  dataSourceId?: string;
  /**
   * Currently selected year range from main filters
   */
  yearRange: [number, number];
  /**
   * Display mode (count or rate)
   */
  displayMode: 'count' | 'rate';
}

/**
 * Format a numeric value for display
 */
function formatValue(value: number | null | undefined, isRate: boolean): string {
  if (value === null || value === undefined) return '—';
  if (isRate) {
    return value.toFixed(1);
  }
  return value.toLocaleString();
}

/**
 * Format a percentage change for display
 */
function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get color and icon for a change value
 */
function getChangeIndicator(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return { color: 'text.secondary', icon: <RemoveIcon fontSize="small" /> };
  }
  if (value > 5) {
    return { color: 'error.main', icon: <ArrowUpwardIcon fontSize="small" /> };
  }
  if (value < -5) {
    return { color: 'success.main', icon: <ArrowDownwardIcon fontSize="small" /> };
  }
  return { color: 'text.secondary', icon: <RemoveIcon fontSize="small" /> };
}

/**
 * Loading skeleton for comparison results
 */
function ComparisonSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
      <Box display="flex" gap={2} mb={2}>
        <Skeleton variant="rounded" width="45%" height={80} />
        <Skeleton variant="rounded" width="45%" height={80} />
      </Box>
      <Skeleton variant="rounded" height={60} />
    </Box>
  );
}

/**
 * Result card for displaying comparison item (area or year)
 */
interface ComparisonItemCardProps {
  label: string;
  value: number | null | undefined;
  isRate: boolean;
  sublabel?: string;
  highlighted?: boolean;
}

function ComparisonItemCard({
  label,
  value,
  isRate,
  sublabel,
  highlighted = false,
}: ComparisonItemCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        bgcolor: highlighted ? 'primary.50' : 'background.paper',
        borderColor: highlighted ? 'primary.main' : 'divider',
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          {formatValue(value, isRate)}
        </Typography>
        {sublabel && (
          <Typography variant="caption" color="text.secondary">
            {sublabel}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Display difference/delta results
 */
interface DifferenceDisplayProps {
  countDiff: number | null | undefined;
  rateDiff?: number | null | undefined;
  countPctChange: number | null | undefined;
  ratePctChange?: number | null | undefined;
  displayMode: 'count' | 'rate';
  labelA: string;
  labelB: string;
}

function DifferenceDisplay({
  countDiff,
  rateDiff,
  countPctChange,
  ratePctChange,
  displayMode,
  labelA,
  labelB,
}: DifferenceDisplayProps) {
  const isRate = displayMode === 'rate';
  const diff = isRate ? rateDiff : countDiff;
  const pctChange = isRate ? ratePctChange : countPctChange;
  const { color, icon } = getChangeIndicator(pctChange);

  return (
    <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Difference ({labelB} vs {labelA})
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight={600} sx={{ color }}>
                {diff !== null && diff !== undefined
                  ? `${diff >= 0 ? '+' : ''}${formatValue(diff, isRate)}`
                  : '—'}
              </Typography>
              <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            </Box>
          </Box>
          <Chip
            label={formatPercentage(pctChange)}
            size="small"
            sx={{
              bgcolor: color,
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Area comparison section
 */
interface AreaComparisonProps {
  categoryId: string;
  dataSourceId?: string;
  year: number;
  displayMode: 'count' | 'rate';
}

function AreaComparison({
  categoryId,
  dataSourceId,
  year,
  displayMode,
}: AreaComparisonProps) {
  const [areaIdA, setAreaIdA] = useState<string>('');
  const [areaIdB, setAreaIdB] = useState<string>('');

  // Fetch areas for name lookup
  const { data: areas } = useGetAreasQuery({ level: 'department' });

  // Get area names
  const areaAName = useMemo(() => {
    if (!areaIdA || !areas) return 'Area A';
    const area = areas.find((a) => a.id === areaIdA);
    return area?.name ?? 'Area A';
  }, [areaIdA, areas]);

  const areaBName = useMemo(() => {
    if (!areaIdB || !areas) return 'Area B';
    const area = areas.find((a) => a.id === areaIdB);
    return area?.name ?? 'Area B';
  }, [areaIdB, areas]);

  // Skip query if not ready
  const canCompare = areaIdA && areaIdB && categoryId;

  // Fetch comparison data
  const { data, isLoading, error } = useCompareAreasQuery(
    {
      areaIdA,
      areaIdB,
      categoryId,
      year,
      dataSourceId,
    },
    { skip: !canCompare }
  );

  // Handle area A selection
  const handleAreaAChange = useCallback((ids: string[]) => {
    setAreaIdA(ids[0] || '');
  }, []);

  // Handle area B selection
  const handleAreaBChange = useCallback((ids: string[]) => {
    setAreaIdB(ids[0] || '');
  }, []);

  // Swap areas
  const handleSwapAreas = useCallback(() => {
    setAreaIdA(areaIdB);
    setAreaIdB(areaIdA);
  }, [areaIdA, areaIdB]);

  const isRate = displayMode === 'rate';

  return (
    <Box>
      {/* Area selectors */}
      <Box display="flex" alignItems="flex-end" gap={1} mb={2}>
        <Box flex={1}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Area A</FormLabel>
            <RegionDepartmentSelector
              value={areaIdA ? [areaIdA] : []}
              onChange={handleAreaAChange}
              multiple={false}
              levels={['department']}
              placeholder="Select first area..."
              label=""
              size="small"
            />
          </FormControl>
        </Box>

        <Tooltip title="Swap areas">
          <IconButton
            size="small"
            onClick={handleSwapAreas}
            disabled={!areaIdA && !areaIdB}
            sx={{ mb: 0.5 }}
          >
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>

        <Box flex={1}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Area B</FormLabel>
            <RegionDepartmentSelector
              value={areaIdB ? [areaIdB] : []}
              onChange={handleAreaBChange}
              multiple={false}
              levels={['department']}
              placeholder="Select second area..."
              label=""
              size="small"
            />
          </FormControl>
        </Box>
      </Box>

      {/* Comparison results */}
      {!canCompare && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select two areas to compare crime statistics for {year}.
        </Alert>
      )}

      {isLoading && <ComparisonSkeleton />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load comparison data. Please try again.
        </Alert>
      )}

      {data && (
        <Box>
          <Box display="flex" gap={2} mb={2}>
            <ComparisonItemCard
              label={areaAName}
              value={isRate ? data.areaA.ratePer100k : data.areaA.count}
              isRate={isRate}
              sublabel={isRate ? 'per 100k' : 'incidents'}
            />
            <ComparisonItemCard
              label={areaBName}
              value={isRate ? data.areaB.ratePer100k : data.areaB.count}
              isRate={isRate}
              sublabel={isRate ? 'per 100k' : 'incidents'}
              highlighted
            />
          </Box>
          <DifferenceDisplay
            countDiff={data.difference.count}
            rateDiff={data.difference.ratePer100k}
            countPctChange={data.difference.percentageCount}
            ratePctChange={data.difference.percentageRate}
            displayMode={displayMode}
            labelA={areaAName}
            labelB={areaBName}
          />
        </Box>
      )}
    </Box>
  );
}

/**
 * Year comparison section
 */
interface YearComparisonProps {
  categoryId: string;
  dataSourceId?: string;
  areaIds: string[];
  yearRange: [number, number];
  displayMode: 'count' | 'rate';
}

function YearComparison({
  categoryId,
  dataSourceId,
  areaIds,
  yearRange,
  displayMode,
}: YearComparisonProps) {
  const [yearA, setYearA] = useState<number>(yearRange[0]);
  const [yearB, setYearB] = useState<number>(yearRange[1]);

  // Use first selected area or let user select one
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areaIds[0] || '');

  // Fetch areas for name lookup
  const { data: areas } = useGetAreasQuery({ level: 'department' });

  // Get area name
  const areaName = useMemo(() => {
    if (!selectedAreaId || !areas) return 'Selected Area';
    const area = areas.find((a) => a.id === selectedAreaId);
    return area?.name ?? 'Selected Area';
  }, [selectedAreaId, areas]);

  // Skip query if not ready
  const canCompare = selectedAreaId && categoryId && yearA !== yearB;

  // Fetch comparison data
  const { data, isLoading, error } = useCompareYearsQuery(
    {
      areaId: selectedAreaId,
      categoryId,
      yearA,
      yearB,
      dataSourceId,
    },
    { skip: !canCompare }
  );

  // Handle area selection
  const handleAreaChange = useCallback((ids: string[]) => {
    setSelectedAreaId(ids[0] || '');
  }, []);

  // Swap years
  const handleSwapYears = useCallback(() => {
    setYearA(yearB);
    setYearB(yearA);
  }, [yearA, yearB]);

  const isRate = displayMode === 'rate';

  return (
    <Box>
      {/* Area selector */}
      <Box mb={2}>
        <FormControl fullWidth size="small">
          <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Area</FormLabel>
          <RegionDepartmentSelector
            value={selectedAreaId ? [selectedAreaId] : []}
            onChange={handleAreaChange}
            multiple={false}
            levels={['department']}
            placeholder="Select an area..."
            label=""
            size="small"
          />
        </FormControl>
      </Box>

      {/* Year selectors */}
      <Box display="flex" alignItems="flex-end" gap={1} mb={2}>
        <Box flex={1}>
          <SingleYearSelector
            value={yearA}
            onChange={setYearA}
            minYear={yearRange[0]}
            maxYear={yearRange[1]}
            label="Year A"
            size="small"
          />
        </Box>

        <Tooltip title="Swap years">
          <IconButton
            size="small"
            onClick={handleSwapYears}
            sx={{ mb: 0.5 }}
          >
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>

        <Box flex={1}>
          <SingleYearSelector
            value={yearB}
            onChange={setYearB}
            minYear={yearRange[0]}
            maxYear={yearRange[1]}
            label="Year B"
            size="small"
          />
        </Box>
      </Box>

      {/* Comparison results */}
      {!canCompare && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {yearA === yearB
            ? 'Select different years to compare.'
            : 'Select an area and two different years to compare.'}
        </Alert>
      )}

      {isLoading && <ComparisonSkeleton />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load comparison data. Please try again.
        </Alert>
      )}

      {data && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {areaName}
          </Typography>
          <Box display="flex" gap={2} mb={2}>
            <ComparisonItemCard
              label={`${yearA}`}
              value={isRate ? data.yearA.ratePer100k : data.yearA.count}
              isRate={isRate}
              sublabel={isRate ? 'per 100k' : 'incidents'}
            />
            <ComparisonItemCard
              label={`${yearB}`}
              value={isRate ? data.yearB.ratePer100k : data.yearB.count}
              isRate={isRate}
              sublabel={isRate ? 'per 100k' : 'incidents'}
              highlighted
            />
          </Box>
          <DifferenceDisplay
            countDiff={data.difference.count}
            rateDiff={data.difference.ratePer100k}
            countPctChange={data.difference.percentageCount}
            ratePctChange={data.difference.percentageRate}
            displayMode={displayMode}
            labelA={`${yearA}`}
            labelB={`${yearB}`}
          />
        </Box>
      )}
    </Box>
  );
}

/**
 * Source comparison section - compares data from different data sources
 */
interface SourceComparisonProps {
  categoryCode?: string;
  yearRange: [number, number];
  displayMode: 'count' | 'rate';
}

/**
 * Data source selector chip
 */
interface DataSourceChipProps {
  label: string;
  value: string;
  selected: boolean;
  onClick: (code: string) => void;
  disabled?: boolean;
}

function DataSourceChip({ label, value, selected, onClick, disabled }: DataSourceChipProps) {
  return (
    <Chip
      label={label}
      icon={<StorageIcon />}
      onClick={() => onClick(value)}
      disabled={disabled}
      variant={selected ? 'filled' : 'outlined'}
      color={selected ? 'primary' : 'default'}
      size="small"
      sx={{
        '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
      }}
    />
  );
}

/**
 * Format comparison row data for display
 */
function formatComparisonValue(value: number | null, isRate: boolean): string {
  if (value === null) return '—';
  return isRate ? value.toFixed(1) : value.toLocaleString();
}

function SourceComparison({
  categoryCode,
  yearRange,
  displayMode,
}: SourceComparisonProps) {
  const [sourceCodeA, setSourceCodeA] = useState<string>('');
  const [sourceCodeB, setSourceCodeB] = useState<string>('');
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>('');
  const [year, setYear] = useState<number>(yearRange[1]);

  // Fetch data sources
  const { data: dataSources, isLoading: isLoadingDataSources } = useGetDataSourcesQuery();

  // Fetch areas for resolving codes
  const { data: areas } = useGetAreasQuery({ level: 'department' });

  // Get area code from selected area ID
  const areaCode = useMemo(() => {
    if (!selectedAreaCode || !areas) return '';
    const area = areas.find((a) => a.id === selectedAreaCode);
    return area?.code ?? '';
  }, [selectedAreaCode, areas]);

  // Get area name
  const areaName = useMemo(() => {
    if (!selectedAreaCode || !areas) return 'Selected Area';
    const area = areas.find((a) => a.id === selectedAreaCode);
    return area?.name ?? 'Selected Area';
  }, [selectedAreaCode, areas]);

  // Get source names for display
  const sourceAName = useMemo(() => {
    if (!sourceCodeA || !dataSources) return 'Source A';
    const source = dataSources.find((s) => s.code === sourceCodeA);
    return source?.name ?? source?.code ?? 'Source A';
  }, [sourceCodeA, dataSources]);

  const sourceBName = useMemo(() => {
    if (!sourceCodeB || !dataSources) return 'Source B';
    const source = dataSources.find((s) => s.code === sourceCodeB);
    return source?.name ?? source?.code ?? 'Source B';
  }, [sourceCodeB, dataSources]);

  // Skip query if not ready
  const canCompare = sourceCodeA && sourceCodeB && areaCode && sourceCodeA !== sourceCodeB;

  // Fetch comparison data
  const { data, isLoading, error } = useCompareSourcesQuery(
    {
      sourceCodeA,
      sourceCodeB,
      areaCode,
      year,
      categoryCode,
    },
    { skip: !canCompare }
  );

  // Handle area selection
  const handleAreaChange = useCallback((ids: string[]) => {
    setSelectedAreaCode(ids[0] || '');
  }, []);

  // Handle source selection
  const handleSourceAClick = useCallback((code: string) => {
    if (code === sourceCodeB) {
      // Swap if clicking the other source
      setSourceCodeB(sourceCodeA);
    }
    setSourceCodeA(code);
  }, [sourceCodeA, sourceCodeB]);

  const handleSourceBClick = useCallback((code: string) => {
    if (code === sourceCodeA) {
      // Swap if clicking the other source
      setSourceCodeA(sourceCodeB);
    }
    setSourceCodeB(code);
  }, [sourceCodeA, sourceCodeB]);

  // Swap sources
  const handleSwapSources = useCallback(() => {
    setSourceCodeA(sourceCodeB);
    setSourceCodeB(sourceCodeA);
  }, [sourceCodeA, sourceCodeB]);

  const isRate = displayMode === 'rate';

  // Filter to only show comparison items with data
  const comparisonItems = useMemo(() => {
    if (!data?.comparisons) return [];
    return data.comparisons.filter(
      (item: SourceComparisonItem) =>
        item.countA !== null || item.countB !== null
    );
  }, [data]);

  return (
    <Box>
      {/* Area selector */}
      <Box mb={2}>
        <FormControl fullWidth size="small">
          <FormLabel sx={{ fontSize: '0.75rem', mb: 0.5 }}>Area</FormLabel>
          <RegionDepartmentSelector
            value={selectedAreaCode ? [selectedAreaCode] : []}
            onChange={handleAreaChange}
            multiple={false}
            levels={['department']}
            placeholder="Select an area..."
            label=""
            size="small"
          />
        </FormControl>
      </Box>

      {/* Year selector */}
      <Box mb={2}>
        <SingleYearSelector
          value={year}
          onChange={setYear}
          minYear={yearRange[0]}
          maxYear={yearRange[1]}
          label="Year"
          size="small"
        />
      </Box>

      {/* Source selectors */}
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Select two data sources to compare:
      </Typography>
      
      {isLoadingDataSources && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          <Skeleton variant="rounded" width={100} height={24} />
          <Skeleton variant="rounded" width={100} height={24} />
        </Box>
      )}

      {dataSources && dataSources.length > 0 && (
        <>
          <Box mb={1.5}>
            <FormLabel sx={{ fontSize: '0.7rem', mb: 0.5 }}>Source A</FormLabel>
            <Box display="flex" gap={1} flexWrap="wrap">
              {dataSources.map((source) => (
                <DataSourceChip
                  key={source.code}
                  label={source.name}
                  value={source.code}
                  selected={sourceCodeA === source.code}
                  onClick={handleSourceAClick}
                  disabled={sourceCodeB === source.code}
                />
              ))}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Tooltip title="Swap sources">
              <span>
                <IconButton
                  size="small"
                  onClick={handleSwapSources}
                  disabled={!sourceCodeA || !sourceCodeB}
                >
                  <SwapHorizIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Box mb={2}>
            <FormLabel sx={{ fontSize: '0.7rem', mb: 0.5 }}>Source B</FormLabel>
            <Box display="flex" gap={1} flexWrap="wrap">
              {dataSources.map((source) => (
                <DataSourceChip
                  key={source.code}
                  label={source.name}
                  value={source.code}
                  selected={sourceCodeB === source.code}
                  onClick={handleSourceBClick}
                  disabled={sourceCodeA === source.code}
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      {dataSources && dataSources.length < 2 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          At least two data sources are required for comparison. Currently only {dataSources.length} source(s) available.
        </Alert>
      )}

      {/* Comparison results */}
      {!canCompare && dataSources && dataSources.length >= 2 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {sourceCodeA === sourceCodeB && sourceCodeA
            ? 'Select different data sources to compare.'
            : 'Select an area and two different data sources to compare.'}
        </Alert>
      )}

      {isLoading && <ComparisonSkeleton />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load comparison data. This may happen if one of the data sources has no data for this area/year.
        </Alert>
      )}

      {data && comparisonItems.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {areaName} ({year})
          </Typography>
          
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Category
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {sourceAName}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {sourceBName}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Diff
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    % Change
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonItems.map((item: SourceComparisonItem) => {
                  const valueA = isRate ? item.rateA : item.countA;
                  const valueB = isRate ? item.rateB : item.countB;
                  const diff = isRate ? item.rateDiff : item.countDiff;
                  const pctChange = isRate ? item.ratePctChange : item.countPctChange;
                  const { color, icon } = getChangeIndicator(pctChange);

                  return (
                    <TableRow key={item.category.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Tooltip title={item.category.name}>
                          <span>{item.category.nameFr || item.category.name}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                        {formatComparisonValue(valueA, isRate)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                        {formatComparisonValue(valueB, isRate)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: '0.75rem', color }}
                      >
                        {diff !== null
                          ? `${diff >= 0 ? '+' : ''}${formatComparisonValue(diff, isRate)}`
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="flex-end"
                          gap={0.5}
                          sx={{ color }}
                        >
                          {icon}
                          <Typography variant="caption" fontWeight={600}>
                            {formatPercentage(pctChange)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {comparisonItems.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No comparable data found between these sources for the selected area and year.
            </Alert>
          )}
        </Box>
      )}

      {data && comparisonItems.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No comparable data found between these sources for the selected area and year.
        </Alert>
      )}
    </Box>
  );
}

/**
 * Main ComparePanel component
 *
 * @example
 * ```tsx
 * <ComparePanel
 *   categoryId={selectedCategoryId}
 *   dataSourceId={selectedDataSourceId}
 *   yearRange={selectedYearRange}
 *   displayMode={displayMode}
 * />
 * ```
 */
export function ComparePanel({
  categoryId,
  dataSourceId,
  yearRange,
  displayMode,
}: ComparePanelProps) {
  const [compareMode, setCompareMode] = useState<CompareMode>('areas');

  const handleCompareModeChange = useCallback(
    (_event: SyntheticEvent, newValue: CompareMode) => {
      if (newValue !== null) {
        setCompareMode(newValue);
      }
    },
    []
  );

  // Check if we have required data
  if (!categoryId) {
    return (
      <Box p={2}>
        <Alert severity="warning" icon={<CompareArrowsIcon />}>
          Please select a crime category from the filters to enable comparisons.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Compare mode tabs */}
      <Tabs
        value={compareMode}
        onChange={handleCompareModeChange}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 0,
            px: 1,
          },
        }}
      >
        <Tab value="areas" label="Areas" />
        <Tab value="years" label="Years" />
        <Tab value="sources" label="Sources" />
        <Tab value="trends" label="Trends" />
      </Tabs>

      {/* Comparison content */}
      <Box px={0.5}>
        {compareMode === 'areas' && (
          <AreaComparison
            categoryId={categoryId}
            dataSourceId={dataSourceId}
            year={yearRange[1]} // Use the end year for area comparison
            displayMode={displayMode}
          />
        )}

        {compareMode === 'years' && (
          <YearComparison
            categoryId={categoryId}
            dataSourceId={dataSourceId}
            areaIds={[]} // Will be selected in the component
            yearRange={yearRange}
            displayMode={displayMode}
          />
        )}

        {compareMode === 'sources' && (
          <SourceComparison
            yearRange={yearRange}
            displayMode={displayMode}
          />
        )}

        {compareMode === 'trends' && (
          <ComparisonChart
            categoryId={categoryId}
            dataSourceId={dataSourceId}
            yearRange={yearRange}
            displayMode={displayMode}
          />
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Help text */}
      <Typography variant="caption" color="text.secondary" display="block" px={0.5}>
        {compareMode === 'areas'
          ? 'Compare crime statistics between two départements for the same time period.'
          : compareMode === 'years'
          ? 'Compare year-over-year changes for a single département.'
          : compareMode === 'sources'
          ? 'Compare data from different sources to identify discrepancies in reporting.'
          : 'View crime trends over time with interactive charts.'}
      </Typography>
    </Box>
  );
}

export default ComparePanel;
