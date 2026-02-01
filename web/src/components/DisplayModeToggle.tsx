/**
 * DisplayModeToggle Component
 *
 * A toggle switch for selecting between count and rate per 100k display modes.
 * Used to control how crime statistics are visualized on the map and in charts.
 */

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NumbersIcon from '@mui/icons-material/Numbers';
import PercentIcon from '@mui/icons-material/Percent';
import {
    Box,
    Paper,
    Switch,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback } from 'react';

/**
 * Display mode for crime statistics
 */
export type DisplayMode = 'count' | 'rate';

/**
 * Props for DisplayModeToggle component (switch variant)
 */
export interface DisplayModeToggleProps {
  /**
   * Current display mode value
   */
  value: DisplayMode;
  /**
   * Callback when mode changes
   */
  onChange: (mode: DisplayMode) => void;
  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Size of the toggle
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  /**
   * Show labels next to toggle
   * @default true
   */
  showLabels?: boolean;
  /**
   * Show tooltip with description
   * @default true
   */
  showTooltip?: boolean;
  /**
   * Use compact layout
   * @default false
   */
  compact?: boolean;
}

/**
 * Get human-readable label for display mode
 */
export function getDisplayModeLabel(mode: DisplayMode): string {
  switch (mode) {
    case 'count':
      return 'Count';
    case 'rate':
      return 'Rate per 100k';
    default:
      return mode;
  }
}

/**
 * Get description for display mode (for tooltips)
 */
export function getDisplayModeDescription(mode: DisplayMode): string {
  switch (mode) {
    case 'count':
      return 'Total number of reported incidents';
    case 'rate':
      return 'Incidents per 100,000 population (normalized for comparison)';
    default:
      return '';
  }
}

/**
 * Toggle switch for count vs rate display mode
 */
export function DisplayModeToggle({
  value,
  onChange,
  disabled = false,
  size = 'medium',
  showLabels = true,
  showTooltip = true,
  compact = false,
}: DisplayModeToggleProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked ? 'rate' : 'count');
    },
    [onChange]
  );

  const isRateMode = value === 'rate';

  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" component="div" fontWeight={600}>
        Display Mode
      </Typography>
      <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
        <strong>Count:</strong> {getDisplayModeDescription('count')}
      </Typography>
      <Typography variant="caption" component="div" sx={{ mt: 0.25 }}>
        <strong>Rate:</strong> {getDisplayModeDescription('rate')}
      </Typography>
    </Box>
  );

  const toggle = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 1,
      }}
    >
      {showLabels && (
        <Typography
          variant={compact ? 'caption' : 'body2'}
          color={!isRateMode ? 'primary' : 'text.secondary'}
          sx={{
            fontWeight: !isRateMode ? 600 : 400,
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          Count
        </Typography>
      )}

      <Switch
        checked={isRateMode}
        onChange={handleChange}
        disabled={disabled}
        size={size}
        inputProps={{
          'aria-label': 'Toggle between count and rate per 100k',
        }}
        sx={{
          '& .MuiSwitch-track': {
            backgroundColor: disabled ? 'action.disabled' : 'primary.light',
          },
        }}
      />

      {showLabels && (
        <Typography
          variant={compact ? 'caption' : 'body2'}
          color={isRateMode ? 'primary' : 'text.secondary'}
          sx={{
            fontWeight: isRateMode ? 600 : 400,
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          Rate
        </Typography>
      )}

      {showTooltip && (
        <Tooltip title={tooltipContent} arrow placement="top">
          <InfoOutlinedIcon
            sx={{
              fontSize: size === 'small' ? 14 : 16,
              color: 'text.disabled',
              cursor: 'help',
              ml: 0.5,
            }}
          />
        </Tooltip>
      )}
    </Box>
  );

  return toggle;
}

/**
 * Props for DisplayModeButtonGroup component (toggle button variant)
 */
export interface DisplayModeButtonGroupProps {
  /**
   * Current display mode value
   */
  value: DisplayMode;
  /**
   * Callback when mode changes
   */
  onChange: (mode: DisplayMode) => void;
  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Size of the buttons
   * @default 'small'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Show icons in buttons
   * @default true
   */
  showIcons?: boolean;
  /**
   * Orientation of the button group
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether to take full width
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Toggle button group for count vs rate display mode
 * An alternative to the switch component with more explicit selection
 */
export function DisplayModeButtonGroup({
  value,
  onChange,
  disabled = false,
  size = 'small',
  showIcons = true,
  orientation = 'horizontal',
  fullWidth = false,
}: DisplayModeButtonGroupProps) {
  const handleChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newMode: DisplayMode | null) => {
      // Only change if a value is selected (don't allow deselection)
      if (newMode !== null) {
        onChange(newMode);
      }
    },
    [onChange]
  );

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      disabled={disabled}
      size={size}
      orientation={orientation}
      fullWidth={fullWidth}
      aria-label="Display mode selection"
    >
      <ToggleButton value="count" aria-label="Show count">
        <Tooltip title={getDisplayModeDescription('count')} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {showIcons && <NumbersIcon fontSize="small" />}
            <span>Count</span>
          </Box>
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="rate" aria-label="Show rate per 100k">
        <Tooltip title={getDisplayModeDescription('rate')} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {showIcons && <PercentIcon fontSize="small" />}
            <span>Rate</span>
          </Box>
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

/**
 * Props for DisplayModeCard component (card variant with description)
 */
export interface DisplayModeCardProps {
  /**
   * Current display mode value
   */
  value: DisplayMode;
  /**
   * Callback when mode changes
   */
  onChange: (mode: DisplayMode) => void;
  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Elevation of the card
   * @default 0
   */
  elevation?: number;
}

/**
 * Display mode toggle with descriptive card layout
 * Shows icon, label, and description for the selected mode
 */
export function DisplayModeCard({
  value,
  onChange,
  disabled = false,
  elevation = 0,
}: DisplayModeCardProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked ? 'rate' : 'count');
    },
    [onChange]
  );

  const isRateMode = value === 'rate';

  return (
    <Paper
      elevation={elevation}
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {isRateMode ? <PercentIcon /> : <NumbersIcon />}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={600}
              sx={{ opacity: disabled ? 0.5 : 1 }}
            >
              {getDisplayModeLabel(value)}
            </Typography>
            <Switch
              checked={isRateMode}
              onChange={handleChange}
              disabled={disabled}
              size="small"
              inputProps={{
                'aria-label': 'Toggle between count and rate per 100k',
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ opacity: disabled ? 0.5 : 1 }}
          >
            {getDisplayModeDescription(value)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default DisplayModeToggle;
