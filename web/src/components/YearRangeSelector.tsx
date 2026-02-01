import DateRangeIcon from '@mui/icons-material/DateRange';
import RestoreIcon from '@mui/icons-material/Restore';
import {
    Box,
    Chip,
    FormControl,
    FormLabel,
    IconButton,
    Slider,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback, useMemo } from 'react';

/**
 * Default year range based on available French crime data.
 * État 4001 data: historical yearly data
 * Time Series data: 2016-2025
 */
export const DEFAULT_MIN_YEAR = 2016;
export const DEFAULT_MAX_YEAR = 2025;

export interface YearRangeSelectorProps {
  /**
   * Currently selected year range as [startYear, endYear].
   */
  value: [number, number];
  /**
   * Callback when the year range changes.
   */
  onChange: (range: [number, number]) => void;
  /**
   * Minimum selectable year.
   * @default 2016
   */
  minYear?: number;
  /**
   * Maximum selectable year.
   * @default 2025
   */
  maxYear?: number;
  /**
   * Label for the field.
   * @default 'Year Range'
   */
  label?: string;
  /**
   * Whether the field is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Size of the slider.
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  /**
   * Whether to show the reset button.
   * @default true
   */
  showReset?: boolean;
  /**
   * Whether to show year marks on the slider.
   * @default true
   */
  showMarks?: boolean;
  /**
   * Step size for the slider.
   * @default 1
   */
  step?: number;
  /**
   * Whether to show the selected range as chips.
   * @default true
   */
  showChips?: boolean;
  /**
   * Orientation of the slider.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether to allow selecting a single year (start === end).
   * @default true
   */
  allowSingleYear?: boolean;
}

/**
 * Format year value for display.
 */
function formatYear(year: number): string {
  return year.toString();
}

/**
 * Generate mark points for the slider.
 */
function generateMarks(
  minYear: number,
  maxYear: number,
  showMarks: boolean
): { value: number; label: string }[] {
  if (!showMarks) {
    return [];
  }

  const marks: { value: number; label: string }[] = [];
  const range = maxYear - minYear;

  // For ranges up to 10 years, show every year
  // For larger ranges, show every 2 or 5 years
  let step = 1;
  if (range > 20) {
    step = 5;
  } else if (range > 10) {
    step = 2;
  }

  for (let year = minYear; year <= maxYear; year += step) {
    marks.push({
      value: year,
      label: formatYear(year),
    });
  }

  // Always include the max year if not already included
  if (marks[marks.length - 1]?.value !== maxYear) {
    marks.push({
      value: maxYear,
      label: formatYear(maxYear),
    });
  }

  return marks;
}

/**
 * Calculate the number of years in a range.
 */
function calculateYearSpan(range: [number, number]): number {
  return range[1] - range[0] + 1;
}

/**
 * A MUI Slider component for selecting a year range.
 * 
 * Features:
 * - Dual-thumb slider for selecting start and end years
 * - Configurable min/max year bounds
 * - Optional year marks for better visualization
 * - Reset button to restore default range
 * - Shows selected range as chips
 * - Accessible with keyboard navigation
 * 
 * @example
 * ```tsx
 * const [yearRange, setYearRange] = useState<[number, number]>([2018, 2022]);
 * 
 * <YearRangeSelector
 *   value={yearRange}
 *   onChange={setYearRange}
 *   label="Select Years"
 * />
 * ```
 */
export function YearRangeSelector({
  value,
  onChange,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
  label = 'Year Range',
  disabled = false,
  size = 'medium',
  showReset = true,
  showMarks = true,
  step = 1,
  showChips = true,
  orientation = 'horizontal',
  allowSingleYear = true,
}: YearRangeSelectorProps) {
  // Generate marks for the slider
  const marks = useMemo(
    () => generateMarks(minYear, maxYear, showMarks),
    [minYear, maxYear, showMarks]
  );

  // Check if current value is the full range (for reset button state)
  const isFullRange = value[0] === minYear && value[1] === maxYear;

  // Handle slider change
  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      if (Array.isArray(newValue) && newValue.length === 2) {
        let [start, end] = newValue as [number, number];
        
        // Enforce minimum distance of 1 year if single year not allowed
        if (!allowSingleYear && start === end) {
          // Adjust based on which thumb was moved
          if (start === value[0]) {
            // End thumb was moved toward start
            end = start + 1;
          } else {
            // Start thumb was moved toward end
            start = end - 1;
          }
        }
        
        // Ensure bounds
        start = Math.max(minYear, start);
        end = Math.min(maxYear, end);
        
        onChange([start, end]);
      }
    },
    [onChange, minYear, maxYear, allowSingleYear, value]
  );

  // Handle reset button click
  const handleReset = useCallback(() => {
    onChange([minYear, maxYear]);
  }, [onChange, minYear, maxYear]);

  // Calculate year span for display
  const yearSpan = calculateYearSpan(value);
  const isSingleYear = value[0] === value[1];

  // Value label format for slider tooltips
  const valueLabelFormat = useCallback((year: number) => formatYear(year), []);

  return (
    <FormControl
      fullWidth
      disabled={disabled}
      sx={{
        ...(orientation === 'vertical' && {
          height: '200px',
        }),
      }}
    >
      {/* Label and Reset Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <FormLabel
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: disabled ? 'text.disabled' : 'text.primary',
            fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          }}
        >
          <DateRangeIcon fontSize="small" color={disabled ? 'disabled' : 'action'} />
          {label}
        </FormLabel>
        
        {showReset && (
          <Tooltip title="Reset to full range">
            <span>
              <IconButton
                size="small"
                onClick={handleReset}
                disabled={disabled || isFullRange}
                sx={{ ml: 1 }}
                aria-label="Reset year range"
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Selected Range Chips */}
      {showChips && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
            flexWrap: 'wrap',
          }}
        >
          {isSingleYear ? (
            <Chip
              label={formatYear(value[0])}
              size="small"
              color="primary"
              variant="filled"
              icon={<DateRangeIcon />}
            />
          ) : (
            <>
              <Chip
                label={formatYear(value[0])}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                to
              </Typography>
              <Chip
                label={formatYear(value[1])}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 0.5 }}
              >
                ({yearSpan} {yearSpan === 1 ? 'year' : 'years'})
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Slider */}
      <Box
        sx={{
          px: orientation === 'horizontal' ? 1 : 0,
          ...(orientation === 'vertical' && {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }),
        }}
      >
        <Slider
          value={value}
          onChange={handleSliderChange}
          min={minYear}
          max={maxYear}
          step={step}
          marks={marks}
          disabled={disabled}
          size={size}
          orientation={orientation}
          valueLabelDisplay="auto"
          valueLabelFormat={valueLabelFormat}
          getAriaLabel={(index) => (index === 0 ? 'Start year' : 'End year')}
          getAriaValueText={valueLabelFormat}
          disableSwap
          sx={{
            '& .MuiSlider-markLabel': {
              fontSize: size === 'small' ? '0.625rem' : '0.75rem',
              color: 'text.secondary',
            },
            '& .MuiSlider-thumb': {
              '&:focus, &:hover, &.Mui-active': {
                boxShadow: 'inherit',
              },
            },
            '& .MuiSlider-track': {
              border: 'none',
            },
          }}
        />
      </Box>

      {/* Helper text */}
      {!showChips && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, textAlign: 'center' }}
        >
          {isSingleYear
            ? `Year: ${formatYear(value[0])}`
            : `${formatYear(value[0])} - ${formatYear(value[1])} (${yearSpan} years)`}
        </Typography>
      )}
    </FormControl>
  );
}

export interface SingleYearSelectorProps {
  /**
   * Currently selected year.
   */
  value: number;
  /**
   * Callback when the year changes.
   */
  onChange: (year: number) => void;
  /**
   * Minimum selectable year.
   * @default 2016
   */
  minYear?: number;
  /**
   * Maximum selectable year.
   * @default 2025
   */
  maxYear?: number;
  /**
   * Label for the field.
   * @default 'Year'
   */
  label?: string;
  /**
   * Whether the field is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Size of the slider.
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  /**
   * Whether to show year marks on the slider.
   * @default true
   */
  showMarks?: boolean;
}

/**
 * A MUI Slider component for selecting a single year.
 * 
 * Simplified version of YearRangeSelector for when only one year is needed.
 * 
 * @example
 * ```tsx
 * const [year, setYear] = useState<number>(2022);
 * 
 * <SingleYearSelector
 *   value={year}
 *   onChange={setYear}
 *   label="Select Year"
 * />
 * ```
 */
export function SingleYearSelector({
  value,
  onChange,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
  label = 'Year',
  disabled = false,
  size = 'medium',
  showMarks = true,
}: SingleYearSelectorProps) {
  // Generate marks for the slider
  const marks = useMemo(
    () => generateMarks(minYear, maxYear, showMarks),
    [minYear, maxYear, showMarks]
  );

  // Handle slider change
  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      if (typeof newValue === 'number') {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Value label format for slider tooltips
  const valueLabelFormat = useCallback((year: number) => formatYear(year), []);

  return (
    <FormControl fullWidth disabled={disabled}>
      {/* Label */}
      <FormLabel
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 1,
          color: disabled ? 'text.disabled' : 'text.primary',
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        }}
      >
        <DateRangeIcon fontSize="small" color={disabled ? 'disabled' : 'action'} />
        {label}
      </FormLabel>

      {/* Selected Year Display */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
        <Chip
          label={formatYear(value)}
          size="small"
          color="primary"
          variant="filled"
          icon={<DateRangeIcon />}
        />
      </Box>

      {/* Slider */}
      <Box sx={{ px: 1 }}>
        <Slider
          value={value}
          onChange={handleSliderChange}
          min={minYear}
          max={maxYear}
          step={1}
          marks={marks}
          disabled={disabled}
          size={size}
          valueLabelDisplay="auto"
          valueLabelFormat={valueLabelFormat}
          aria-label={label}
          getAriaValueText={valueLabelFormat}
          sx={{
            '& .MuiSlider-markLabel': {
              fontSize: size === 'small' ? '0.625rem' : '0.75rem',
              color: 'text.secondary',
            },
          }}
        />
      </Box>
    </FormControl>
  );
}

export default YearRangeSelector;
