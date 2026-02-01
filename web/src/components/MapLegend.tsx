/**
 * MapLegend Component
 *
 * Displays a color scale legend for choropleth map visualization.
 * Shows color swatches with value ranges and a "No data" indicator.
 */

import { Box, Paper, Typography } from '@mui/material';
import type { LegendConfig } from '../utils/choropleth';

interface MapLegendProps {
  config: LegendConfig | null;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  isLoading?: boolean;
}

export function MapLegend({
  config,
  position = 'bottom-right',
  isLoading = false,
}: MapLegendProps) {
  // Position mapping
  const positionStyles: Record<string, object> = {
    'bottom-left': { bottom: 40, left: 8 },
    'bottom-right': { bottom: 40, right: 8 },
    'top-left': { top: 8, left: 8 },
    'top-right': { top: 60, right: 8 }, // Below navigation controls
  };

  if (!config || isLoading) {
    return null;
  }

  const { colors, labels, title, noDataColor, noDataLabel } = config;

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        ...positionStyles[position],
        zIndex: 2,
        p: 1.5,
        minWidth: 120,
        maxWidth: 180,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Title */}
      <Typography
        variant="caption"
        component="div"
        fontWeight={600}
        sx={{ mb: 1, color: 'text.primary' }}
      >
        {title}
      </Typography>

      {/* Color scale */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {colors.map((color, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 14,
                bgcolor: color,
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 0.5,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                lineHeight: 1.2,
              }}
            >
              {labels[index]}
            </Typography>
          </Box>
        ))}

        {/* No data indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5,
            pt: 0.5,
            borderTop: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 14,
              bgcolor: noDataColor,
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 0.5,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontStyle: 'italic',
            }}
          >
            {noDataLabel}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

/**
 * Compact horizontal legend for smaller displays
 */
export function MapLegendCompact({
  config,
  position = 'bottom-left',
}: Omit<MapLegendProps, 'isLoading'>) {
  const positionStyles: Record<string, object> = {
    'bottom-left': { bottom: 40, left: 8 },
    'bottom-right': { bottom: 40, right: 8 },
    'top-left': { top: 8, left: 8 },
    'top-right': { top: 60, right: 8 },
  };

  if (!config) {
    return null;
  }

  const { colors, title, noDataColor } = config;

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        ...positionStyles[position],
        zIndex: 2,
        p: 1,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Typography
        variant="caption"
        component="div"
        fontWeight={600}
        sx={{ mb: 0.5, color: 'text.primary', fontSize: '0.65rem' }}
      >
        {title}
      </Typography>

      {/* Horizontal color bar */}
      <Box sx={{ display: 'flex', gap: 0 }}>
        {colors.map((color, index) => (
          <Box
            key={index}
            sx={{
              width: 16,
              height: 10,
              bgcolor: color,
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderLeft: index === 0 ? '1px solid' : 'none',
              borderRight: '1px solid',
              borderColor: 'grey.300',
            }}
          />
        ))}
        <Box
          sx={{
            width: 16,
            height: 10,
            bgcolor: noDataColor,
            border: '1px solid',
            borderColor: 'grey.300',
            ml: 0.5,
          }}
          title="No data"
        />
      </Box>

      {/* Min/Max labels */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 0.25,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
          Low
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
          High
        </Typography>
      </Box>
    </Paper>
  );
}

export default MapLegend;
