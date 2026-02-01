import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import PublicIcon from '@mui/icons-material/Public';
import {
    Alert,
    Autocomplete,
    Box,
    Chip,
    CircularProgress,
    Divider,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography,
} from '@mui/material';
import { useCallback, useMemo, useState, type SyntheticEvent } from 'react';
import { useGetAreasQuery, type AdministrativeArea } from '../store';

/**
 * Option type for the autocomplete, extending area with display properties.
 */
export interface AreaOption {
  id: string;
  code: string;
  name: string;
  level: 'country' | 'region' | 'department';
  parentCode?: string;
  group: string; // For grouping in the autocomplete
}

export interface RegionDepartmentSelectorProps {
  /**
   * Currently selected area IDs.
   */
  value: string[];
  /**
   * Callback when selection changes.
   */
  onChange: (areaIds: string[]) => void;
  /**
   * Whether to allow multiple selections.
   * @default true
   */
  multiple?: boolean;
  /**
   * Which admin levels to show.
   * @default ['region', 'department']
   */
  levels?: Array<'country' | 'region' | 'department'>;
  /**
   * Placeholder text.
   * @default 'Select région or département...'
   */
  placeholder?: string;
  /**
   * Label for the field.
   * @default 'Location'
   */
  label?: string;
  /**
   * Whether the field is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Maximum number of selections (only for multiple mode).
   */
  maxSelections?: number;
  /**
   * Size of the input.
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  /**
   * Whether to show full width.
   * @default true
   */
  fullWidth?: boolean;
}

/**
 * Get the icon for an admin level.
 */
function getAreaIcon(level: string) {
  switch (level) {
    case 'country':
      return <PublicIcon fontSize="small" color="primary" />;
    case 'region':
      return <MapIcon fontSize="small" color="secondary" />;
    case 'department':
      return <LocationCityIcon fontSize="small" color="action" />;
    default:
      return <LocationCityIcon fontSize="small" />;
  }
}

/**
 * Get a human-readable label for an admin level.
 */
function getLevelLabel(level: string): string {
  switch (level) {
    case 'country':
      return 'Country';
    case 'region':
      return 'Région';
    case 'department':
      return 'Département';
    default:
      return level;
  }
}

/**
 * Convert AdministrativeArea to AreaOption with grouping.
 */
function areaToOption(area: AdministrativeArea, regionMap: Map<string, string>): AreaOption {
  let group = 'Other';
  
  if (area.level === 'country') {
    group = 'Countries';
  } else if (area.level === 'region') {
    group = 'Régions';
  } else if (area.level === 'department') {
    // Group departments by their parent region
    const regionName = area.parentCode ? regionMap.get(area.parentCode) : undefined;
    group = regionName || 'Départements';
  }
  
  return {
    id: area.id,
    code: area.code,
    name: area.name,
    level: area.level,
    parentCode: area.parentCode,
    group,
  };
}

/**
 * A MUI Autocomplete component for selecting French régions and départements.
 * 
 * Features:
 * - Fetches areas from the API using RTK Query
 * - Groups départements by their parent région
 * - Supports single and multiple selection modes
 * - Shows loading and error states
 * - Displays icons for different admin levels
 * 
 * @example
 * ```tsx
 * const [selectedIds, setSelectedIds] = useState<string[]>([]);
 * 
 * <RegionDepartmentSelector
 *   value={selectedIds}
 *   onChange={setSelectedIds}
 *   placeholder="Select a département..."
 * />
 * ```
 */
export function RegionDepartmentSelector({
  value,
  onChange,
  multiple = true,
  levels = ['region', 'department'],
  placeholder = 'Select région or département...',
  label = 'Location',
  disabled = false,
  maxSelections,
  size = 'medium',
  fullWidth = true,
}: RegionDepartmentSelectorProps) {
  // Fetch all areas (regions and departments)
  const { data: areas, isLoading, isError, error } = useGetAreasQuery({});
  
  // Local state for input value (for filtering)
  const [inputValue, setInputValue] = useState('');

  // Build region code -> name map for grouping departments
  const regionMap = useMemo(() => {
    const map = new Map<string, string>();
    if (areas) {
      areas.forEach((area) => {
        if (area.level === 'region') {
          map.set(area.code, area.name);
        }
      });
    }
    return map;
  }, [areas]);

  // Convert areas to options, filtering by requested levels
  const options = useMemo<AreaOption[]>(() => {
    if (!areas) return [];
    
    return areas
      .filter((area) => levels.includes(area.level))
      .map((area) => areaToOption(area, regionMap))
      .sort((a, b) => {
        // Sort by group first, then by code
        const groupCompare = a.group.localeCompare(b.group);
        if (groupCompare !== 0) return groupCompare;
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });
  }, [areas, levels, regionMap]);

  // Map of id -> option for quick lookup
  const optionMap = useMemo(() => {
    const map = new Map<string, AreaOption>();
    options.forEach((opt) => map.set(opt.id, opt));
    return map;
  }, [options]);

  // Get selected options from value array
  const selectedOptions = useMemo(() => {
    return value
      .map((id) => optionMap.get(id))
      .filter((opt): opt is AreaOption => opt !== undefined);
  }, [value, optionMap]);

  // Handle selection change
  const handleChange = useCallback(
    (
      _event: SyntheticEvent,
      newValue: AreaOption | AreaOption[] | null
    ) => {
      if (newValue === null) {
        onChange([]);
      } else if (Array.isArray(newValue)) {
        // Check max selections limit
        if (maxSelections && newValue.length > maxSelections) {
          return; // Don't allow more than max
        }
        onChange(newValue.map((opt) => opt.id));
      } else {
        onChange([newValue.id]);
      }
    },
    [onChange, maxSelections]
  );

  // Handle input change for filtering
  const handleInputChange = useCallback(
    (_event: SyntheticEvent, newInputValue: string) => {
      setInputValue(newInputValue);
    },
    []
  );

  // Check if max selections reached
  const isMaxReached = multiple && maxSelections && value.length >= maxSelections;

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading areas...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        <Typography variant="body2">
          Failed to load areas. {error && 'message' in error ? String(error.message) : 'Please try again.'}
        </Typography>
      </Alert>
    );
  }

  return (
    <Autocomplete
      multiple={multiple}
      value={multiple ? selectedOptions : selectedOptions[0] ?? null}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      getOptionLabel={(option) => `${option.code} - ${option.name}`}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      groupBy={(option) => option.group}
      disabled={disabled || Boolean(isMaxReached)}
      size={size}
      fullWidth={fullWidth}
      filterOptions={(opts, state) => {
        const query = state.inputValue.toLowerCase();
        if (!query) return opts;
        
        return opts.filter(
          (opt) =>
            opt.code.toLowerCase().includes(query) ||
            opt.name.toLowerCase().includes(query)
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={selectedOptions.length === 0 ? placeholder : undefined}
          helperText={
            isMaxReached
              ? `Maximum ${maxSelections} selections reached`
              : undefined
          }
        />
      )}
      renderOption={(props, option) => {
        // Extract key from props to avoid spread warning
        const { key, ...otherProps } = props;
        return (
          <ListItem key={key} {...otherProps} dense>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getAreaIcon(option.level)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ fontWeight: 500, fontFamily: 'monospace', minWidth: 32 }}
                  >
                    {option.code}
                  </Typography>
                  <Typography variant="body2" component="span">
                    {option.name}
                  </Typography>
                </Box>
              }
              secondary={getLevelLabel(option.level)}
            />
          </ListItem>
        );
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const tagProps = getTagProps({ index });
          return (
            <Chip
              {...tagProps}
              key={option.id}
              label={`${option.code} - ${option.name}`}
              size="small"
              icon={getAreaIcon(option.level)}
              color={option.level === 'region' ? 'secondary' : 'default'}
            />
          );
        })
      }
      renderGroup={(params) => (
        <li key={params.key}>
          <Box
            sx={{
              position: 'sticky',
              top: -8,
              bgcolor: 'background.paper',
              zIndex: 1,
              py: 0.5,
              px: 2,
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {params.group}
            </Typography>
            <Divider />
          </Box>
          <ul style={{ padding: 0 }}>{params.children}</ul>
        </li>
      )}
      noOptionsText="No matching areas found"
      loadingText="Loading areas..."
      sx={{
        '& .MuiAutocomplete-groupLabel': {
          lineHeight: 2,
        },
      }}
    />
  );
}

export default RegionDepartmentSelector;
