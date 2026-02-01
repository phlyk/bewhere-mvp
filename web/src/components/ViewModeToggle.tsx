/**
 * ViewModeToggle Component
 *
 * A tab-based toggle for switching between Map view and Compare view.
 * Used in the sidebar to control the main application view mode.
 */

import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MapIcon from '@mui/icons-material/Map';
import { Box, Tab, Tabs, Tooltip, type SxProps, type Theme } from '@mui/material';
import { useCallback, type SyntheticEvent } from 'react';

/**
 * View mode for the application
 */
export type ViewMode = 'map' | 'compare';

/**
 * Props for ViewModeToggle component
 */
export interface ViewModeToggleProps {
  /**
   * Current view mode
   */
  value: ViewMode;
  /**
   * Callback when view mode changes
   */
  onChange: (mode: ViewMode) => void;
  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Size of the tabs
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  /**
   * Whether to show icons only (no labels)
   * @default false
   */
  iconsOnly?: boolean;
  /**
   * Whether to use full width tabs
   * @default true
   */
  fullWidth?: boolean;
  /**
   * Additional sx props for styling
   */
  sx?: SxProps<Theme>;
}

/**
 * Get human-readable label for view mode
 */
export function getViewModeLabel(mode: ViewMode): string {
  switch (mode) {
    case 'map':
      return 'Map View';
    case 'compare':
      return 'Compare';
    default:
      return mode;
  }
}

/**
 * Get description for view mode (for tooltips)
 */
export function getViewModeDescription(mode: ViewMode): string {
  switch (mode) {
    case 'map':
      return 'Explore crime statistics on an interactive map with choropleth visualization';
    case 'compare':
      return 'Compare statistics between two areas or across different time periods';
    default:
      return '';
  }
}

/**
 * Get icon for view mode
 */
function getViewModeIcon(mode: ViewMode) {
  switch (mode) {
    case 'map':
      return <MapIcon />;
    case 'compare':
      return <CompareArrowsIcon />;
    default:
      return null;
  }
}

/**
 * Tab-based toggle for switching between Map and Compare views.
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useState<ViewMode>('map');
 *
 * <ViewModeToggle
 *   value={viewMode}
 *   onChange={setViewMode}
 * />
 * ```
 */
export function ViewModeToggle({
  value,
  onChange,
  disabled = false,
  size = 'medium',
  iconsOnly = false,
  fullWidth = true,
  sx,
}: ViewModeToggleProps) {
  const handleChange = useCallback(
    (_event: SyntheticEvent, newValue: ViewMode) => {
      if (newValue !== null) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const tabHeight = size === 'small' ? 40 : 48;

  return (
    <Box sx={sx}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant={fullWidth ? 'fullWidth' : 'standard'}
        aria-label="View mode selection"
        sx={{
          minHeight: tabHeight,
          '& .MuiTab-root': {
            minHeight: tabHeight,
            py: size === 'small' ? 0.5 : 1,
            textTransform: 'none',
            fontWeight: 500,
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        <Tab
          value="map"
          disabled={disabled}
          icon={getViewModeIcon('map')}
          iconPosition="start"
          label={iconsOnly ? undefined : getViewModeLabel('map')}
          aria-label={getViewModeLabel('map')}
          sx={{
            gap: 0.5,
            ...(iconsOnly && {
              minWidth: 'auto',
              px: 2,
            }),
          }}
        />
        <Tab
          value="compare"
          disabled={disabled}
          icon={getViewModeIcon('compare')}
          iconPosition="start"
          label={iconsOnly ? undefined : getViewModeLabel('compare')}
          aria-label={getViewModeLabel('compare')}
          sx={{
            gap: 0.5,
            ...(iconsOnly && {
              minWidth: 'auto',
              px: 2,
            }),
          }}
        />
      </Tabs>
    </Box>
  );
}

/**
 * Props for ViewModeToggleCompact component
 */
export interface ViewModeToggleCompactProps extends Omit<ViewModeToggleProps, 'fullWidth' | 'iconsOnly'> {
  /**
   * Whether to show tooltips on hover
   * @default true
   */
  showTooltips?: boolean;
}

/**
 * Compact version of ViewModeToggle with icons only and tooltips.
 * Useful for space-constrained layouts.
 *
 * @example
 * ```tsx
 * <ViewModeToggleCompact
 *   value={viewMode}
 *   onChange={setViewMode}
 * />
 * ```
 */
export function ViewModeToggleCompact({
  value,
  onChange,
  disabled = false,
  size = 'small',
  showTooltips = true,
  sx,
}: ViewModeToggleCompactProps) {
  const handleChange = useCallback(
    (_event: SyntheticEvent, newValue: ViewMode) => {
      if (newValue !== null) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const tabHeight = size === 'small' ? 36 : 44;

  const renderTab = (mode: ViewMode) => {
    const tab = (
      <Tab
        value={mode}
        disabled={disabled}
        icon={getViewModeIcon(mode)}
        aria-label={getViewModeLabel(mode)}
        sx={{
          minWidth: 48,
          minHeight: tabHeight,
          px: 1.5,
        }}
      />
    );

    if (showTooltips) {
      return (
        <Tooltip key={mode} title={getViewModeDescription(mode)} arrow placement="bottom">
          {tab}
        </Tooltip>
      );
    }

    return tab;
  };

  return (
    <Box sx={sx}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="standard"
        centered
        aria-label="View mode selection"
        sx={{
          minHeight: tabHeight,
          '& .MuiTabs-indicator': {
            height: 2,
          },
        }}
      >
        {renderTab('map')}
        {renderTab('compare')}
      </Tabs>
    </Box>
  );
}

export default ViewModeToggle;
