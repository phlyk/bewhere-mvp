import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PublicIcon from '@mui/icons-material/Public';
import StorageIcon from '@mui/icons-material/Storage';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
    Alert,
    Box,
    Chip,
    FormControl,
    FormLabel,
    Skeleton,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback, useMemo } from 'react';
import {
    useGetDataSourcesQuery,
    type DataSource,
} from '../store';

/**
 * Display mode for the data source selector.
 */
export type DataSourceDisplayMode = 'chip' | 'toggle' | 'compact';

/**
 * Props for DataSourceSelector component.
 */
export interface DataSourceSelectorProps {
  /**
   * Currently selected data source ID (single selection).
   */
  value: string;
  /**
   * Callback when selection changes.
   */
  onChange: (dataSourceId: string) => void;
  /**
   * Display mode for the selector.
   * - 'chip': Clickable chips in a flex container (default)
   * - 'toggle': Material-UI ToggleButtonGroup
   * - 'compact': Single-line chip row with minimal spacing
   * @default 'chip'
   */
  displayMode?: DataSourceDisplayMode;
  /**
   * Label for the field.
   * @default 'Data Source'
   */
  label?: string;
  /**
   * Whether the field is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Size of the control.
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  /**
   * Whether to show the description tooltip.
   * @default true
   */
  showDescription?: boolean;
  /**
   * Whether to show the update frequency badge.
   * @default true
   */
  showUpdateFrequency?: boolean;
  /**
   * Filter to only show specific data source IDs.
   */
  dataSourceFilter?: string[];
  /**
   * Whether to show icons based on data source type.
   * @default true
   */
  showIcons?: boolean;
  /**
   * Orientation for toggle button group.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether selection is required (at least one must be selected).
   * @default true
   */
  required?: boolean;
}

/**
 * Props for multi-select version.
 */
export interface DataSourceMultiSelectorProps
  extends Omit<DataSourceSelectorProps, 'value' | 'onChange' | 'required'> {
  /**
   * Currently selected data source IDs (multiple selection).
   */
  value: string[];
  /**
   * Callback when selection changes.
   */
  onChange: (dataSourceIds: string[]) => void;
  /**
   * Minimum number of selections required.
   * @default 0
   */
  minSelections?: number;
  /**
   * Maximum number of selections allowed.
   */
  maxSelections?: number;
}

/**
 * Get icon for a data source based on its code/name.
 */
function getDataSourceIcon(dataSource: DataSource): React.ReactNode {
  const name = dataSource.name.toLowerCase();
  const code = dataSource.id?.toLowerCase() || '';
  
  if (name.includes('time') || name.includes('series') || name.includes('chrono')) {
    return <TrendingUpIcon fontSize="small" />;
  }
  if (name.includes('historique') || name.includes('historical') || name.includes('etat')) {
    return <HistoryIcon fontSize="small" />;
  }
  if (name.includes('insee') || name.includes('population')) {
    return <PublicIcon fontSize="small" />;
  }
  if (code.includes('etat') || code.includes('4001')) {
    return <HistoryIcon fontSize="small" />;
  }
  return <StorageIcon fontSize="small" />;
}

/**
 * Get color for update frequency badge.
 */
function getUpdateFrequencyColor(frequency?: string): 'default' | 'success' | 'warning' | 'info' | 'primary' {
  if (!frequency) return 'default';
  
  const freq = frequency.toLowerCase();
  if (freq === 'realtime' || freq === 'daily') return 'success';
  if (freq === 'weekly' || freq === 'monthly') return 'info';
  if (freq === 'quarterly' || freq === 'yearly') return 'primary';
  if (freq === 'historical') return 'warning';
  return 'default';
}

/**
 * Format update frequency for display.
 */
function formatUpdateFrequency(frequency?: string): string {
  if (!frequency) return 'Unknown';
  
  const freq = frequency.toLowerCase();
  switch (freq) {
    case 'realtime':
      return 'Real-time';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    case 'historical':
      return 'Historical';
    case 'irregular':
      return 'Irregular';
    default:
      return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }
}

/**
 * DataSourceSelector component.
 * 
 * Allows users to select a data source for filtering crime statistics.
 * Supports chip-based selection, toggle buttons, and compact mode.
 * 
 * @example
 * ```tsx
 * <DataSourceSelector
 *   value={selectedDataSourceId}
 *   onChange={setSelectedDataSourceId}
 *   displayMode="chip"
 *   label="Data Source"
 * />
 * ```
 */
export function DataSourceSelector({
  value,
  onChange,
  displayMode = 'chip',
  label = 'Data Source',
  disabled = false,
  size = 'medium',
  showDescription = true,
  showUpdateFrequency = true,
  dataSourceFilter,
  showIcons = true,
  orientation = 'horizontal',
  required = true,
}: DataSourceSelectorProps) {
  const { data: dataSources, isLoading, isError, error } = useGetDataSourcesQuery();

  // Filter data sources based on the filter prop
  const filteredDataSources = useMemo(() => {
    if (!dataSources) return [];
    if (!dataSourceFilter || dataSourceFilter.length === 0) return dataSources;
    return dataSources.filter((ds) => dataSourceFilter.includes(ds.id));
  }, [dataSources, dataSourceFilter]);

  // Handle selection change
  const handleChange = useCallback(
    (newValue: string | null) => {
      if (newValue === null && required) {
        // Don't allow deselection if required
        return;
      }
      onChange(newValue || '');
    },
    [onChange, required]
  );

  // Handle chip click
  const handleChipClick = useCallback(
    (dataSourceId: string) => {
      if (disabled) return;
      if (value === dataSourceId && !required) {
        handleChange(null);
      } else {
        handleChange(dataSourceId);
      }
    },
    [value, handleChange, disabled, required]
  );

  // Handle toggle button change
  const handleToggleChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
      handleChange(newValue);
    },
    [handleChange]
  );

  // Loading state
  if (isLoading) {
    return (
      <FormControl fullWidth disabled>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Skeleton variant="rounded" width={120} height={32} />
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="rounded" width={140} height={32} />
        </Box>
      </FormControl>
    );
  }

  // Error state
  if (isError) {
    return (
      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <Alert severity="error" sx={{ py: 0.5 }}>
          <Typography variant="caption">
            Failed to load data sources
            {error && 'message' in error && `: ${error.message}`}
          </Typography>
        </Alert>
      </FormControl>
    );
  }

  // No data sources available
  if (!filteredDataSources || filteredDataSources.length === 0) {
    return (
      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <Typography variant="body2" color="text.secondary">
          No data sources available
        </Typography>
      </FormControl>
    );
  }

  // Render chip-based selector
  if (displayMode === 'chip' || displayMode === 'compact') {
    const isCompact = displayMode === 'compact';
    
    return (
      <FormControl fullWidth disabled={disabled}>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <Box
          display="flex"
          gap={isCompact ? 0.5 : 1}
          flexWrap={isCompact ? 'nowrap' : 'wrap'}
          sx={isCompact ? { overflowX: 'auto' } : undefined}
        >
          {filteredDataSources.map((dataSource) => {
            const isSelected = value === dataSource.id;
            const chipContent = (
              <Chip
                key={dataSource.id}
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {showIcons && getDataSourceIcon(dataSource)}
                    <span>{dataSource.name}</span>
                    {showUpdateFrequency && dataSource.updateFrequency && (
                      <Chip
                        size="small"
                        label={formatUpdateFrequency(dataSource.updateFrequency)}
                        color={getUpdateFrequencyColor(dataSource.updateFrequency)}
                        sx={{
                          height: 16,
                          fontSize: '0.625rem',
                          ml: 0.5,
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    )}
                  </Box>
                }
                onClick={() => handleChipClick(dataSource.id)}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                disabled={disabled}
                size={size}
                sx={{
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': disabled
                    ? {}
                    : {
                        transform: 'translateY(-1px)',
                        boxShadow: 1,
                      },
                }}
              />
            );

            if (showDescription && dataSource.description) {
              return (
                <Tooltip
                  key={dataSource.id}
                  title={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {dataSource.name}
                      </Typography>
                      <Typography variant="caption">
                        {dataSource.description}
                      </Typography>
                      {dataSource.url && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 0.5, color: 'info.light' }}
                        >
                          Source: {dataSource.url}
                        </Typography>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  {chipContent}
                </Tooltip>
              );
            }

            return chipContent;
          })}
        </Box>
      </FormControl>
    );
  }

  // Render toggle button group
  if (displayMode === 'toggle') {
    return (
      <FormControl fullWidth disabled={disabled}>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <ToggleButtonGroup
          value={value}
          exclusive
          onChange={handleToggleChange}
          orientation={orientation}
          size={size}
          sx={{
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
            },
          }}
        >
          {filteredDataSources.map((dataSource) => {
            const button = (
              <ToggleButton
                key={dataSource.id}
                value={dataSource.id}
                disabled={disabled}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: size === 'small' ? 1.5 : 2,
                }}
              >
                {showIcons && getDataSourceIcon(dataSource)}
                <span>{dataSource.name}</span>
                {showUpdateFrequency && dataSource.updateFrequency && (
                  <Chip
                    size="small"
                    label={formatUpdateFrequency(dataSource.updateFrequency)}
                    color={getUpdateFrequencyColor(dataSource.updateFrequency)}
                    sx={{
                      height: 16,
                      fontSize: '0.625rem',
                      ml: 0.5,
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                  />
                )}
              </ToggleButton>
            );

            if (showDescription && dataSource.description) {
              return (
                <Tooltip
                  key={dataSource.id}
                  title={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {dataSource.name}
                      </Typography>
                      <Typography variant="caption">
                        {dataSource.description}
                      </Typography>
                      {dataSource.url && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 0.5, color: 'info.light' }}
                        >
                          Source: {dataSource.url}
                        </Typography>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  {button}
                </Tooltip>
              );
            }

            return button;
          })}
        </ToggleButtonGroup>
      </FormControl>
    );
  }

  return null;
}

/**
 * DataSourceMultiSelector component.
 * 
 * Allows users to select multiple data sources for filtering.
 * Uses chip-based selection with multi-select behavior.
 * 
 * @example
 * ```tsx
 * <DataSourceMultiSelector
 *   value={selectedDataSourceIds}
 *   onChange={setSelectedDataSourceIds}
 *   displayMode="chip"
 *   label="Data Sources"
 * />
 * ```
 */
export function DataSourceMultiSelector({
  value,
  onChange,
  displayMode = 'chip',
  label = 'Data Sources',
  disabled = false,
  size = 'medium',
  showDescription = true,
  showUpdateFrequency = true,
  dataSourceFilter,
  showIcons = true,
  orientation = 'horizontal',
  minSelections = 0,
  maxSelections,
}: DataSourceMultiSelectorProps) {
  const { data: dataSources, isLoading, isError, error } = useGetDataSourcesQuery();

  // Filter data sources based on the filter prop
  const filteredDataSources = useMemo(() => {
    if (!dataSources) return [];
    if (!dataSourceFilter || dataSourceFilter.length === 0) return dataSources;
    return dataSources.filter((ds) => dataSourceFilter.includes(ds.id));
  }, [dataSources, dataSourceFilter]);

  // Handle chip click for multi-select
  const handleChipClick = useCallback(
    (dataSourceId: string) => {
      if (disabled) return;

      const isCurrentlySelected = value.includes(dataSourceId);

      if (isCurrentlySelected) {
        // Deselecting
        if (value.length > minSelections) {
          onChange(value.filter((id) => id !== dataSourceId));
        }
      } else {
        // Selecting
        if (maxSelections === undefined || value.length < maxSelections) {
          onChange([...value, dataSourceId]);
        }
      }
    },
    [value, onChange, disabled, minSelections, maxSelections]
  );

  // Handle toggle button change for multi-select
  const handleToggleChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newValues: string[]) => {
      if (newValues.length < minSelections) {
        return; // Don't allow below minimum
      }
      if (maxSelections !== undefined && newValues.length > maxSelections) {
        return; // Don't allow above maximum
      }
      onChange(newValues);
    },
    [onChange, minSelections, maxSelections]
  );

  // Loading state
  if (isLoading) {
    return (
      <FormControl fullWidth disabled>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Skeleton variant="rounded" width={120} height={32} />
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="rounded" width={140} height={32} />
        </Box>
      </FormControl>
    );
  }

  // Error state
  if (isError) {
    return (
      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <Alert severity="error" sx={{ py: 0.5 }}>
          <Typography variant="caption">
            Failed to load data sources
            {error && 'message' in error && `: ${error.message}`}
          </Typography>
        </Alert>
      </FormControl>
    );
  }

  // No data sources available
  if (!filteredDataSources || filteredDataSources.length === 0) {
    return (
      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1, fontSize: size === 'small' ? '0.875rem' : '1rem' }}>
          {label}
        </FormLabel>
        <Typography variant="body2" color="text.secondary">
          No data sources available
        </Typography>
      </FormControl>
    );
  }

  // Render chip-based multi-selector
  if (displayMode === 'chip' || displayMode === 'compact') {
    const isCompact = displayMode === 'compact';

    return (
      <FormControl fullWidth disabled={disabled}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <FormLabel sx={{ fontSize: size === 'small' ? '0.875rem' : '1rem', mb: 0 }}>
            {label}
          </FormLabel>
          {(minSelections > 0 || maxSelections !== undefined) && (
            <Tooltip
              title={
                <Typography variant="caption">
                  {minSelections > 0 && maxSelections !== undefined
                    ? `Select ${minSelections}-${maxSelections} sources`
                    : minSelections > 0
                      ? `Select at least ${minSelections}`
                      : `Select up to ${maxSelections}`}
                </Typography>
              }
              arrow
            >
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
          )}
        </Box>
        <Box
          display="flex"
          gap={isCompact ? 0.5 : 1}
          flexWrap={isCompact ? 'nowrap' : 'wrap'}
          sx={isCompact ? { overflowX: 'auto' } : undefined}
        >
          {filteredDataSources.map((dataSource) => {
            const isSelected = value.includes(dataSource.id);
            const isAtMax = maxSelections !== undefined && value.length >= maxSelections && !isSelected;

            const chipContent = (
              <Chip
                key={dataSource.id}
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {showIcons && getDataSourceIcon(dataSource)}
                    <span>{dataSource.name}</span>
                    {showUpdateFrequency && dataSource.updateFrequency && (
                      <Chip
                        size="small"
                        label={formatUpdateFrequency(dataSource.updateFrequency)}
                        color={getUpdateFrequencyColor(dataSource.updateFrequency)}
                        sx={{
                          height: 16,
                          fontSize: '0.625rem',
                          ml: 0.5,
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    )}
                  </Box>
                }
                onClick={() => handleChipClick(dataSource.id)}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                disabled={disabled || isAtMax}
                size={size}
                sx={{
                  cursor: disabled || isAtMax ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  opacity: isAtMax ? 0.5 : 1,
                  '&:hover': disabled || isAtMax
                    ? {}
                    : {
                        transform: 'translateY(-1px)',
                        boxShadow: 1,
                      },
                }}
              />
            );

            if (showDescription && dataSource.description) {
              return (
                <Tooltip
                  key={dataSource.id}
                  title={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {dataSource.name}
                      </Typography>
                      <Typography variant="caption">
                        {dataSource.description}
                      </Typography>
                      {dataSource.url && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 0.5, color: 'info.light' }}
                        >
                          Source: {dataSource.url}
                        </Typography>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  {chipContent}
                </Tooltip>
              );
            }

            return chipContent;
          })}
        </Box>
        {value.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {value.length} source{value.length !== 1 ? 's' : ''} selected
          </Typography>
        )}
      </FormControl>
    );
  }

  // Render toggle button group for multi-select
  if (displayMode === 'toggle') {
    return (
      <FormControl fullWidth disabled={disabled}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <FormLabel sx={{ fontSize: size === 'small' ? '0.875rem' : '1rem', mb: 0 }}>
            {label}
          </FormLabel>
          {(minSelections > 0 || maxSelections !== undefined) && (
            <Tooltip
              title={
                <Typography variant="caption">
                  {minSelections > 0 && maxSelections !== undefined
                    ? `Select ${minSelections}-${maxSelections} sources`
                    : minSelections > 0
                      ? `Select at least ${minSelections}`
                      : `Select up to ${maxSelections}`}
                </Typography>
              }
              arrow
            >
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
          )}
        </Box>
        <ToggleButtonGroup
          value={value}
          onChange={handleToggleChange}
          orientation={orientation}
          size={size}
          sx={{
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
            },
          }}
        >
          {filteredDataSources.map((dataSource) => {
            const isSelected = value.includes(dataSource.id);
            const isAtMax = maxSelections !== undefined && value.length >= maxSelections && !isSelected;

            const button = (
              <ToggleButton
                key={dataSource.id}
                value={dataSource.id}
                disabled={disabled || isAtMax}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: size === 'small' ? 1.5 : 2,
                  opacity: isAtMax ? 0.5 : 1,
                }}
              >
                {showIcons && getDataSourceIcon(dataSource)}
                <span>{dataSource.name}</span>
                {showUpdateFrequency && dataSource.updateFrequency && (
                  <Chip
                    size="small"
                    label={formatUpdateFrequency(dataSource.updateFrequency)}
                    color={getUpdateFrequencyColor(dataSource.updateFrequency)}
                    sx={{
                      height: 16,
                      fontSize: '0.625rem',
                      ml: 0.5,
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                  />
                )}
              </ToggleButton>
            );

            if (showDescription && dataSource.description) {
              return (
                <Tooltip
                  key={dataSource.id}
                  title={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {dataSource.name}
                      </Typography>
                      <Typography variant="caption">
                        {dataSource.description}
                      </Typography>
                      {dataSource.url && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 0.5, color: 'info.light' }}
                        >
                          Source: {dataSource.url}
                        </Typography>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  {button}
                </Tooltip>
              );
            }

            return button;
          })}
        </ToggleButtonGroup>
        {value.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {value.length} source{value.length !== 1 ? 's' : ''} selected
          </Typography>
        )}
      </FormControl>
    );
  }

  return null;
}

export default DataSourceSelector;
