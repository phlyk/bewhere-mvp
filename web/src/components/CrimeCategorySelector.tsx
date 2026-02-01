import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningIcon from '@mui/icons-material/Warning';
import type { SelectChangeEvent } from '@mui/material';
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    ListSubheader,
    MenuItem,
    OutlinedInput,
    Select,
    Typography,
} from '@mui/material';
import { useCallback, useMemo, type ReactNode } from 'react';
import {
    useGetCategoriesQuery,
    type CrimeCategory,
    type CrimeCategoryGroup,
    type CrimeSeverity,
} from '../store';

/**
 * Props for CrimeCategorySelector component.
 */
export interface CrimeCategorySelectorProps {
  /**
   * Currently selected category ID (single selection).
   */
  value: string;
  /**
   * Callback when selection changes.
   */
  onChange: (categoryId: string) => void;
  /**
   * Label for the field.
   * @default 'Crime Category'
   */
  label?: string;
  /**
   * Whether the field is disabled.
   * @default false
   */
  disabled?: boolean;
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
  /**
   * Filter to only show categories of certain severity levels.
   */
  severityFilter?: CrimeSeverity[];
  /**
   * Filter to only show categories in certain groups.
   */
  groupFilter?: CrimeCategoryGroup[];
  /**
   * Whether to show the severity indicator.
   * @default true
   */
  showSeverity?: boolean;
  /**
   * Placeholder text when no category is selected.
   * @default 'Select a category...'
   */
  placeholder?: string;
}

/**
 * Get human-readable label for category group.
 */
function getGroupLabel(group: CrimeCategoryGroup): string {
  switch (group) {
    case 'violent_crimes':
      return 'Violent Crimes';
    case 'property_crimes':
      return 'Property Crimes';
    case 'drug_offenses':
      return 'Drug Offenses';
    case 'other_offenses':
      return 'Other Offenses';
    default:
      return group;
  }
}

/**
 * Get severity icon component.
 */
function getSeverityIcon(severity: CrimeSeverity) {
  switch (severity) {
    case 'critical':
      return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
    case 'high':
      return <ReportProblemIcon fontSize="small" sx={{ color: 'warning.main' }} />;
    case 'medium':
      return <WarningIcon fontSize="small" sx={{ color: 'info.main' }} />;
    case 'low':
      return <InfoIcon fontSize="small" sx={{ color: 'success.main' }} />;
    default:
      return <InfoIcon fontSize="small" />;
  }
}

/**
 * Get color for severity chip.
 */
function getSeverityColor(severity: CrimeSeverity): 'error' | 'warning' | 'info' | 'success' {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'info';
  }
}

/**
 * Get the order for category groups (for consistent display).
 */
function getGroupOrder(group: CrimeCategoryGroup): number {
  switch (group) {
    case 'violent_crimes':
      return 0;
    case 'property_crimes':
      return 1;
    case 'drug_offenses':
      return 2;
    case 'other_offenses':
      return 3;
    default:
      return 4;
  }
}

/**
 * Group categories by their category group.
 */
function groupCategories(categories: CrimeCategory[]): Map<CrimeCategoryGroup, CrimeCategory[]> {
  const groups = new Map<CrimeCategoryGroup, CrimeCategory[]>();
  
  categories.forEach((category) => {
    const existing = groups.get(category.categoryGroup) || [];
    existing.push(category);
    groups.set(category.categoryGroup, existing);
  });
  
  // Sort categories within each group by sortOrder
  groups.forEach((cats, group) => {
    groups.set(group, cats.sort((a, b) => a.sortOrder - b.sortOrder));
  });
  
  return groups;
}

/**
 * A MUI Select component for selecting crime categories.
 * 
 * Features:
 * - Fetches categories from the API using RTK Query
 * - Groups categories by their group (violent crimes, property crimes, etc.)
 * - Shows severity indicators with color-coded icons
 * - Supports filtering by severity and group
 * - Shows loading and error states
 * 
 * @example
 * ```tsx
 * const [categoryId, setCategoryId] = useState<string>('');
 * 
 * <CrimeCategorySelector
 *   value={categoryId}
 *   onChange={setCategoryId}
 *   label="Crime Type"
 * />
 * ```
 */
export function CrimeCategorySelector({
  value,
  onChange,
  label = 'Crime Category',
  disabled = false,
  size = 'medium',
  fullWidth = true,
  severityFilter,
  groupFilter,
  showSeverity = true,
  placeholder = 'Select a category...',
}: CrimeCategorySelectorProps) {
  // Fetch all categories
  const { data: categories, isLoading, isError, error } = useGetCategoriesQuery();

  // Filter and group categories
  const { filteredCategories, groupedCategories, orderedGroups } = useMemo(() => {
    if (!categories) {
      return { filteredCategories: [], groupedCategories: new Map(), orderedGroups: [] };
    }

    // Apply filters
    let filtered = categories.filter((cat) => cat.isActive);
    
    if (severityFilter && severityFilter.length > 0) {
      filtered = filtered.filter((cat) => severityFilter.includes(cat.severity));
    }
    
    if (groupFilter && groupFilter.length > 0) {
      filtered = filtered.filter((cat) => groupFilter.includes(cat.categoryGroup));
    }

    // Group by category group
    const grouped = groupCategories(filtered);
    
    // Get ordered list of groups
    const groups = Array.from(grouped.keys()).sort(
      (a, b) => getGroupOrder(a) - getGroupOrder(b)
    );

    return {
      filteredCategories: filtered,
      groupedCategories: grouped,
      orderedGroups: groups,
    };
  }, [categories, severityFilter, groupFilter]);

  // Map of id -> category for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, CrimeCategory>();
    filteredCategories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [filteredCategories]);

  // Handle selection change
  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading categories...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        <Typography variant="body2">
          Failed to load categories.{' '}
          {error && 'message' in error ? String(error.message) : 'Please try again.'}
        </Typography>
      </Alert>
    );
  }

  // Build menu items with group headers
  const menuItems: ReactNode[] = [];
  
  orderedGroups.forEach((group) => {
    const cats: CrimeCategory[] = groupedCategories.get(group) || [];
    
    // Add group header
    menuItems.push(
      <ListSubheader key={`header-${group}`} sx={{ bgcolor: 'background.paper' }}>
        {getGroupLabel(group)}
      </ListSubheader>
    );
    
    // Add category items
    cats.forEach((category) => {
      menuItems.push(
        <MenuItem key={category.id} value={category.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            {showSeverity && getSeverityIcon(category.severity)}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">{category.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {category.nameFr}
              </Typography>
            </Box>
            {showSeverity && (
              <Chip
                label={category.severity}
                size="small"
                color={getSeverityColor(category.severity)}
                sx={{ ml: 1, textTransform: 'capitalize' }}
              />
            )}
          </Box>
        </MenuItem>
      );
    });
  });

  return (
    <FormControl fullWidth={fullWidth} size={size} disabled={disabled}>
      <InputLabel id="crime-category-selector-label">{label}</InputLabel>
      <Select
        labelId="crime-category-selector-label"
        id="crime-category-selector"
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return (
              <Typography variant="body2" color="text.secondary">
                {placeholder}
              </Typography>
            );
          }
          const category = categoryMap.get(selected);
          if (!category) {
            return selected;
          }
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showSeverity && getSeverityIcon(category.severity)}
              <Typography variant="body2">{category.name}</Typography>
            </Box>
          );
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
            },
          },
        }}
      >
        {/* Placeholder option */}
        <MenuItem value="" disabled>
          <Typography variant="body2" color="text.secondary">
            {placeholder}
          </Typography>
        </MenuItem>
        {menuItems}
      </Select>
    </FormControl>
  );
}

/**
 * Multiple selection variant of CrimeCategorySelector.
 */
export interface CrimeCategoryMultiSelectorProps
  extends Omit<CrimeCategorySelectorProps, 'value' | 'onChange'> {
  /**
   * Currently selected category IDs.
   */
  value: string[];
  /**
   * Callback when selection changes.
   */
  onChange: (categoryIds: string[]) => void;
  /**
   * Maximum number of selections.
   */
  maxSelections?: number;
}

/**
 * Multiple selection version of CrimeCategorySelector.
 * 
 * @example
 * ```tsx
 * const [categoryIds, setCategoryIds] = useState<string[]>([]);
 * 
 * <CrimeCategoryMultiSelector
 *   value={categoryIds}
 *   onChange={setCategoryIds}
 *   maxSelections={5}
 * />
 * ```
 */
export function CrimeCategoryMultiSelector({
  value,
  onChange,
  label = 'Crime Categories',
  disabled = false,
  size = 'medium',
  fullWidth = true,
  severityFilter,
  groupFilter,
  showSeverity = true,
  placeholder = 'Select categories...',
  maxSelections,
}: CrimeCategoryMultiSelectorProps) {
  // Fetch all categories
  const { data: categories, isLoading, isError, error } = useGetCategoriesQuery();

  // Filter and group categories
  const { filteredCategories, groupedCategories, orderedGroups } = useMemo(() => {
    if (!categories) {
      return { filteredCategories: [], groupedCategories: new Map(), orderedGroups: [] };
    }

    let filtered = categories.filter((cat) => cat.isActive);
    
    if (severityFilter && severityFilter.length > 0) {
      filtered = filtered.filter((cat) => severityFilter.includes(cat.severity));
    }
    
    if (groupFilter && groupFilter.length > 0) {
      filtered = filtered.filter((cat) => groupFilter.includes(cat.categoryGroup));
    }

    const grouped = groupCategories(filtered);
    const groups = Array.from(grouped.keys()).sort(
      (a, b) => getGroupOrder(a) - getGroupOrder(b)
    );

    return {
      filteredCategories: filtered,
      groupedCategories: grouped,
      orderedGroups: groups,
    };
  }, [categories, severityFilter, groupFilter]);

  // Map of id -> category for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, CrimeCategory>();
    filteredCategories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [filteredCategories]);

  // Handle selection change
  const handleChange = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const newValue = event.target.value;
      const ids = typeof newValue === 'string' ? newValue.split(',') : newValue;
      
      // Check max selections limit
      if (maxSelections && ids.length > maxSelections) {
        return;
      }
      
      onChange(ids);
    },
    [onChange, maxSelections]
  );

  // Check if max selections reached
  const isMaxReached = maxSelections && value.length >= maxSelections;

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading categories...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        <Typography variant="body2">
          Failed to load categories.{' '}
          {error && 'message' in error ? String(error.message) : 'Please try again.'}
        </Typography>
      </Alert>
    );
  }

  // Build menu items with group headers
  const menuItems: ReactNode[] = [];
  
  orderedGroups.forEach((group) => {
    const cats: CrimeCategory[] = groupedCategories.get(group) || [];
    
    menuItems.push(
      <ListSubheader key={`header-${group}`} sx={{ bgcolor: 'background.paper' }}>
        {getGroupLabel(group)}
      </ListSubheader>
    );
    
    cats.forEach((category) => {
      const isSelected = value.includes(category.id);
      const isDisabled = !isSelected && Boolean(isMaxReached);
      
      menuItems.push(
        <MenuItem key={category.id} value={category.id} disabled={isDisabled}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            {showSeverity && getSeverityIcon(category.severity)}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">{category.name}</Typography>
            </Box>
          </Box>
        </MenuItem>
      );
    });
  });

  return (
    <FormControl fullWidth={fullWidth} size={size} disabled={disabled}>
      <InputLabel id="crime-category-multi-selector-label">{label}</InputLabel>
      <Select
        labelId="crime-category-multi-selector-label"
        id="crime-category-multi-selector"
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                {placeholder}
              </Typography>
            );
          }
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((id) => {
                const category = categoryMap.get(id);
                if (!category) return null;
                return (
                  <Chip
                    key={id}
                    label={category.name}
                    size="small"
                    color={showSeverity ? getSeverityColor(category.severity) : 'default'}
                    icon={showSeverity ? getSeverityIcon(category.severity) : undefined}
                  />
                );
              })}
            </Box>
          );
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
            },
          },
        }}
      >
        {menuItems}
      </Select>
      {isMaxReached && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Maximum {maxSelections} selections reached
        </Typography>
      )}
    </FormControl>
  );
}

export default CrimeCategorySelector;
