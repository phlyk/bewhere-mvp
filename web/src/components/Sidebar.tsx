import InfoIcon from '@mui/icons-material/Info';
import {
    Alert,
    Box,
    Chip,
    Divider,
    Drawer,
    Typography,
} from '@mui/material';
import { useCallback } from 'react';
import {
    setAreaIds,
    setCategoryId,
    setDataSourceId,
    setDisplayMode,
    setViewMode,
    setYearRange,
    useAppDispatch,
    useChoroplethData,
    useGetHealthQuery,
    useSelections,
    useSelectionsValid,
    type ViewMode,
} from '../store';
import { ComparePanel } from './ComparePanel';
import { CrimeCategorySelector } from './CrimeCategorySelector';
import { DataFetchStatus } from './LoadingStates';
import { DataSourceSelector } from './DataSourceSelector';
import { DisplayModeToggle, type DisplayMode } from './DisplayModeToggle';
import { RegionDepartmentSelector } from './RegionDepartmentSelector';
import { ViewModeToggle } from './ViewModeToggle';
import { YearRangeSelector } from './YearRangeSelector';

export const SIDEBAR_WIDTH = 320;

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

export function Sidebar({
  open = true,
  onClose,
  variant = 'permanent',
}: SidebarProps) {
  const dispatch = useAppDispatch();
  const { data: health, isLoading, isError } = useGetHealthQuery();

  // Get current selections from Redux
  const {
    areaIds: selectedAreaIds,
    categoryId: selectedCategoryId,
    yearRange: selectedYearRange,
    dataSourceId: selectedDataSourceId,
    displayMode,
    viewMode,
  } = useSelections();

  // Get data fetch status for loading indicators
  const isValidSelection = useSelectionsValid();
  const {
    choroplethData,
    isLoading: isChoroplethLoading,
    isFetching: isChoroplethFetching,
    error: choroplethError,
  } = useChoroplethData();

  // Handle area selection change - dispatch to Redux
  const handleAreaSelectionChange = useCallback((areaIds: string[]) => {
    dispatch(setAreaIds(areaIds));
  }, [dispatch]);

  // Handle category selection change - dispatch to Redux
  const handleCategorySelectionChange = useCallback((categoryId: string) => {
    dispatch(setCategoryId(categoryId));
  }, [dispatch]);

  // Handle year range change - dispatch to Redux
  const handleYearRangeChange = useCallback((range: [number, number]) => {
    dispatch(setYearRange(range));
  }, [dispatch]);

  // Handle data source change - dispatch to Redux
  const handleDataSourceChange = useCallback((dataSourceId: string) => {
    dispatch(setDataSourceId(dataSourceId));
  }, [dispatch]);

  // Handle display mode change - dispatch to Redux
  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    dispatch(setDisplayMode(mode));
  }, [dispatch]);

  // Handle view mode change - dispatch to Redux
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    dispatch(setViewMode(mode));
  }, [dispatch]);

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight={600}>
          BeWhere
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          French Crime Statistics Explorer
        </Typography>
      </Box>

      <Divider />

      {/* API Status */}
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" color="text.secondary">
            API Status:
          </Typography>
          {isLoading && (
            <Chip size="small" label="Connecting..." color="default" />
          )}
          {isError && (
            <Chip size="small" label="Offline" color="error" />
          )}
          {health && (
            <Chip
              size="small"
              label={health.status}
              color={health.status === 'ok' ? 'success' : 'warning'}
            />
          )}
        </Box>
        {isError && (
          <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              Cannot connect to API. Start the backend server.
            </Typography>
          </Alert>
        )}
      </Box>

      <Divider />

      {/* View Mode Toggle */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <ViewModeToggle
          value={viewMode}
          onChange={handleViewModeChange}
          size="small"
          fullWidth
        />
      </Box>

      <Divider />

      {/* Conditional content based on view mode */}
      {viewMode === 'compare' ? (
        /* Compare Panel */
        <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
          <ComparePanel
            categoryId={selectedCategoryId}
            dataSourceId={selectedDataSourceId}
            yearRange={selectedYearRange}
            displayMode={displayMode}
          />
        </Box>
      ) : (
        /* Filters Section (Map View) */
        <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Filters
          </Typography>
          
          {/* Region/Department Selector */}
          <Box sx={{ mb: 2 }}>
            <RegionDepartmentSelector
              value={selectedAreaIds}
              onChange={handleAreaSelectionChange}
              multiple={true}
              levels={['department']}
              label="Département"
              placeholder="Search départements..."
              size="small"
              maxSelections={5}
            />
          </Box>

          {/* Crime Category Selector */}
          <Box sx={{ mb: 2 }}>
            <CrimeCategorySelector
              value={selectedCategoryId}
              onChange={handleCategorySelectionChange}
              label="Crime Category"
              placeholder="Select a category..."
              size="small"
              showSeverity={true}
            />
          </Box>

          {/* Year Range Selector */}
          <Box sx={{ mb: 2 }}>
            <YearRangeSelector
              value={selectedYearRange}
              onChange={handleYearRangeChange}
              label="Year Range"
              size="small"
              showMarks={true}
              showChips={true}
              showReset={true}
            />
          </Box>

          {/* Data Source Selector */}
          <Box sx={{ mb: 2 }}>
            <DataSourceSelector
              value={selectedDataSourceId}
              onChange={handleDataSourceChange}
              label="Data Source"
              displayMode="chip"
              size="small"
              showIcons={true}
              showDescription={true}
              showUpdateFrequency={false}
              required={false}
            />
          </Box>

          {/* Display Mode Toggle */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Display Mode
            </Typography>
            <DisplayModeToggle
              value={displayMode}
              onChange={handleDisplayModeChange}
              size="small"
              showLabels={true}
              showTooltip={true}
              compact={true}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Data Fetch Status - Shows loading/error/data count */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Data Status
            </Typography>
            <DataFetchStatus
              isLoading={isChoroplethLoading}
              isFetching={isChoroplethFetching}
              error={choroplethError}
              dataCount={choroplethData.length}
              dataLabel="regions"
              isValidSelection={isValidSelection}
              invalidSelectionMessage="Select a crime category to view data"
              compact
            />
          </Box>

          {/* Selection summary */}
          {selectedAreaIds.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {selectedAreaIds.length} département{selectedAreaIds.length > 1 ? 's' : ''} selected
            </Typography>
          )}
          
          {selectedAreaIds.length === 0 && (
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              Select a département from the dropdown or click on the map.
            </Typography>
          )}
        </Box>
      )}

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <InfoIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Data: data.gouv.fr
          </Typography>
        </Box>
        {health?.version && (
          <Typography variant="caption" color="text.disabled" display="block">
            API v{health.version}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}

export default Sidebar;
