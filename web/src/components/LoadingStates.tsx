import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 40,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        width="100%"
      >
        {content}
      </Box>
    );
  }

  return content;
}

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: number | string;
  height?: number | string;
  count?: number;
  spacing?: number;
}

export function LoadingSkeleton({
  variant = 'rectangular',
  width = '100%',
  height = 40,
  count = 1,
  spacing = 1,
}: LoadingSkeletonProps) {
  return (
    <Box display="flex" flexDirection="column" gap={spacing}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation="wave"
        />
      ))}
    </Box>
  );
}

interface MapLoadingProps {
  message?: string;
}

export function MapLoading({ message = 'Loading map...' }: MapLoadingProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      width="100%"
      bgcolor="grey.100"
    >
      <CircularProgress size={48} sx={{ mb: 2 }} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

interface SidebarLoadingProps {
  sections?: number;
}

export function SidebarLoading({ sections = 3 }: SidebarLoadingProps) {
  return (
    <Box p={2}>
      {Array.from({ length: sections }).map((_, index) => (
        <Box key={index} mb={3}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={48} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Status indicator for data fetching state.
 * Shows loading spinner, data summary, or empty state message.
 */
export interface DataFetchStatusProps {
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Whether data is being refetched (after initial load) */
  isFetching?: boolean;
  /** Error message if fetch failed */
  error?: string | null;
  /** Number of data points loaded */
  dataCount?: number;
  /** Label for the data type (e.g., "observations", "regions") */
  dataLabel?: string;
  /** Whether selections are valid for fetching */
  isValidSelection?: boolean;
  /** Message to show when selections are not valid */
  invalidSelectionMessage?: string;
  /** Whether to show a compact variant */
  compact?: boolean;
}

export function DataFetchStatus({
  isLoading,
  isFetching = false,
  error,
  dataCount = 0,
  dataLabel = 'data points',
  isValidSelection = true,
  invalidSelectionMessage = 'Select options above to load data',
  compact = false,
}: DataFetchStatusProps) {
  // Show error state
  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        p={compact ? 1 : 1.5}
        bgcolor="error.light"
        borderRadius={1}
        sx={{ opacity: 0.9 }}
      >
        <Typography variant="caption" color="error.contrastText">
          {error}
        </Typography>
      </Box>
    );
  }

  // Show loading state (initial load)
  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        p={compact ? 1 : 1.5}
        bgcolor="grey.100"
        borderRadius={1}
      >
        <CircularProgress size={16} thickness={4} />
        <Typography variant="caption" color="text.secondary">
          Loading {dataLabel}...
        </Typography>
      </Box>
    );
  }

  // Show fetching state (refetch after selections change)
  if (isFetching) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        p={compact ? 1 : 1.5}
        bgcolor="info.light"
        borderRadius={1}
        sx={{ opacity: 0.9 }}
      >
        <CircularProgress size={16} thickness={4} color="info" />
        <Typography variant="caption" color="info.contrastText">
          Updating {dataLabel}...
        </Typography>
      </Box>
    );
  }

  // Show invalid selection state
  if (!isValidSelection) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        p={compact ? 1 : 1.5}
        bgcolor="grey.100"
        borderRadius={1}
      >
        <Typography variant="caption" color="text.disabled">
          {invalidSelectionMessage}
        </Typography>
      </Box>
    );
  }

  // Show data count summary
  if (dataCount > 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        p={compact ? 1 : 1.5}
        bgcolor="success.light"
        borderRadius={1}
        sx={{ opacity: 0.9 }}
      >
        <Typography variant="caption" color="success.contrastText">
          {dataCount.toLocaleString()} {dataLabel} loaded
        </Typography>
      </Box>
    );
  }

  // No data state
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      p={compact ? 1 : 1.5}
      bgcolor="warning.light"
      borderRadius={1}
      sx={{ opacity: 0.9 }}
    >
      <Typography variant="caption" color="warning.contrastText">
        No {dataLabel} found for current selection
      </Typography>
    </Box>
  );
}

/**
 * Skeleton placeholder for filter controls while loading
 */
export interface FilterSkeletonProps {
  /** Type of filter control to simulate */
  type?: 'select' | 'slider' | 'toggle' | 'chips';
  /** Whether to show the label skeleton */
  showLabel?: boolean;
}

export function FilterSkeleton({
  type = 'select',
  showLabel = true,
}: FilterSkeletonProps) {
  return (
    <Box mb={2}>
      {showLabel && (
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 0.5 }} />
      )}
      {type === 'select' && (
        <Skeleton variant="rounded" height={40} animation="wave" />
      )}
      {type === 'slider' && (
        <Box>
          <Skeleton variant="rounded" height={20} sx={{ my: 1 }} animation="wave" />
          <Box display="flex" justifyContent="space-between">
            <Skeleton variant="rounded" width={50} height={24} animation="wave" />
            <Skeleton variant="rounded" width={50} height={24} animation="wave" />
          </Box>
        </Box>
      )}
      {type === 'toggle' && (
        <Box display="flex" gap={1}>
          <Skeleton variant="rounded" width="48%" height={36} animation="wave" />
          <Skeleton variant="rounded" width="48%" height={36} animation="wave" />
        </Box>
      )}
      {type === 'chips' && (
        <Box display="flex" gap={1} flexWrap="wrap">
          <Skeleton variant="rounded" width={80} height={32} animation="wave" />
          <Skeleton variant="rounded" width={100} height={32} animation="wave" />
          <Skeleton variant="rounded" width={70} height={32} animation="wave" />
        </Box>
      )}
    </Box>
  );
}

export default LoadingSpinner;
