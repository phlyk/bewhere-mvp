import { Alert, Box, Chip, Typography } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGetAreasGeoJsonQuery } from '../store';
import {
    type ChoroplethDataPoint,
    buildMapboxMatchExpression,
    createSequentialScale,
    generateLegendConfig,
    SEQUENTIAL_COLORS
} from '../utils/choropleth';
import { MapLoading } from './LoadingStates';
import { MapLegend } from './MapLegend';

// Get Mapbox token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Layer and source IDs
const AREAS_SOURCE_ID = 'areas-source';
const AREAS_FILL_LAYER_ID = 'areas-fill';
const AREAS_LINE_LAYER_ID = 'areas-line';
const AREAS_HIGHLIGHT_LAYER_ID = 'areas-highlight';

// Default colors for département boundaries (when no choropleth data)
const AREA_FILL_COLOR = '#1976d2';
const AREA_FILL_OPACITY = 0.1;
const AREA_LINE_COLOR = '#1565c0';
const AREA_LINE_WIDTH = 1;
const AREA_HIGHLIGHT_LINE_WIDTH = 3;
const AREA_HOVER_FILL_OPACITY = 0.3;

// Choropleth opacity settings
const CHOROPLETH_FILL_OPACITY = 0.7;
const CHOROPLETH_HOVER_OPACITY = 0.9;

export interface SelectedArea {
  id: string;
  code: string;
  name: string;
}

/**
 * Choropleth configuration for data-driven styling
 */
export interface ChoroplethConfig {
  /** Array of data points to visualize */
  data: ChoroplethDataPoint[];
  /** Legend title (e.g., "Crime Rate per 100k") */
  title: string;
  /** Whether values are rates (affects formatting) */
  isRate?: boolean;
  /** Classification method */
  method?: 'quantile' | 'equal';
}

interface MapContainerProps {
  onMapLoad?: (map: mapboxgl.Map) => void;
  onAreaClick?: (area: SelectedArea | null) => void;
  onAreaHover?: (area: SelectedArea | null) => void;
  selectedAreaId?: string | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  /** Choropleth configuration - when provided, colors areas by data values */
  choropleth?: ChoroplethConfig | null;
  /** Whether choropleth data is loading */
  isChoroplethLoading?: boolean;
}

export function MapContainer({
  onMapLoad,
  onAreaClick,
  onAreaHover,
  selectedAreaId,
  initialCenter = [2.3522, 46.6034], // Center of France
  initialZoom = 5.5,
  choropleth,
  isChoroplethLoading = false,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [_hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);

  // Fetch département geometries
  const {
    data: geoJsonData,
    isLoading: isGeoJsonLoading,
    isError: isGeoJsonError,
    error: geoJsonError,
  } = useGetAreasGeoJsonQuery({ level: 'department' });

  // Calculate choropleth scale and legend config
  const { scale: choroplethScale, legendConfig } = useMemo(() => {
    if (!choropleth || choropleth.data.length === 0) {
      return { scale: null, legendConfig: null };
    }

    const values = choropleth.data.map((d) => d.value);
    const scale = createSequentialScale(values, {
      method: choropleth.method || 'quantile',
      colors: SEQUENTIAL_COLORS,
    });

    const legend = generateLegendConfig(scale, {
      title: choropleth.title,
      isRate: choropleth.isRate,
      compact: true,
    });

    return { scale, legendConfig: legend };
  }, [choropleth]);

  // Build Mapbox fill expression from choropleth data
  const choroplethFillExpression = useMemo(() => {
    if (!choropleth || !choroplethScale || choropleth.data.length === 0) {
      return null;
    }
    return buildMapboxMatchExpression(choropleth.data, choroplethScale, 'id');
  }, [choropleth, choroplethScale]);

  // Add GeoJSON source and layers to map
  const addAreasLayer = useCallback((map: mapboxgl.Map, geoJson: GeoJSON.FeatureCollection) => {
    // Remove existing layers and source if they exist
    if (map.getLayer(AREAS_HIGHLIGHT_LAYER_ID)) {
      map.removeLayer(AREAS_HIGHLIGHT_LAYER_ID);
    }
    if (map.getLayer(AREAS_FILL_LAYER_ID)) {
      map.removeLayer(AREAS_FILL_LAYER_ID);
    }
    if (map.getLayer(AREAS_LINE_LAYER_ID)) {
      map.removeLayer(AREAS_LINE_LAYER_ID);
    }
    if (map.getSource(AREAS_SOURCE_ID)) {
      map.removeSource(AREAS_SOURCE_ID);
    }

    // Add GeoJSON source
    map.addSource(AREAS_SOURCE_ID, {
      type: 'geojson',
      data: geoJson,
      promoteId: 'id', // Use feature.properties.id as the feature ID
    });

    // Add fill layer (base)
    map.addLayer({
      id: AREAS_FILL_LAYER_ID,
      type: 'fill',
      source: AREAS_SOURCE_ID,
      paint: {
        'fill-color': AREA_FILL_COLOR,
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          AREA_HOVER_FILL_OPACITY,
          AREA_FILL_OPACITY,
        ],
      },
    });

    // Add line layer (borders)
    map.addLayer({
      id: AREAS_LINE_LAYER_ID,
      type: 'line',
      source: AREAS_SOURCE_ID,
      paint: {
        'line-color': AREA_LINE_COLOR,
        'line-width': AREA_LINE_WIDTH,
      },
    });

    // Add highlight layer for selected area
    map.addLayer({
      id: AREAS_HIGHLIGHT_LAYER_ID,
      type: 'line',
      source: AREAS_SOURCE_ID,
      paint: {
        'line-color': '#d32f2f',
        'line-width': AREA_HIGHLIGHT_LINE_WIDTH,
      },
      filter: ['==', ['get', 'id'], ''], // Empty filter - will be updated when area is selected
    });
  }, []);

  // Update selected area highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(AREAS_HIGHLIGHT_LAYER_ID)) return;

    if (selectedAreaId) {
      map.setFilter(AREAS_HIGHLIGHT_LAYER_ID, ['==', ['get', 'id'], selectedAreaId]);
    } else {
      map.setFilter(AREAS_HIGHLIGHT_LAYER_ID, ['==', ['get', 'id'], '']);
    }
  }, [selectedAreaId]);

  // Update choropleth styling when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(AREAS_FILL_LAYER_ID)) return;

    if (choroplethFillExpression) {
      // Apply choropleth coloring
      map.setPaintProperty(AREAS_FILL_LAYER_ID, 'fill-color', choroplethFillExpression);
      map.setPaintProperty(AREAS_FILL_LAYER_ID, 'fill-opacity', [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        CHOROPLETH_HOVER_OPACITY,
        CHOROPLETH_FILL_OPACITY,
      ]);
      // Lighter border for choropleth mode
      map.setPaintProperty(AREAS_LINE_LAYER_ID, 'line-color', '#666666');
      map.setPaintProperty(AREAS_LINE_LAYER_ID, 'line-width', 0.5);
    } else {
      // Reset to default styling
      map.setPaintProperty(AREAS_FILL_LAYER_ID, 'fill-color', AREA_FILL_COLOR);
      map.setPaintProperty(AREAS_FILL_LAYER_ID, 'fill-opacity', [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        AREA_HOVER_FILL_OPACITY,
        AREA_FILL_OPACITY,
      ]);
      map.setPaintProperty(AREAS_LINE_LAYER_ID, 'line-color', AREA_LINE_COLOR);
      map.setPaintProperty(AREAS_LINE_LAYER_ID, 'line-width', AREA_LINE_WIDTH);
    }
  }, [choroplethFillExpression]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured. Set VITE_MAPBOX_TOKEN in your environment.');
      setIsMapLoading(false);
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 4,
        maxZoom: 12,
        attributionControl: true,
      });

      // Create popup for hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'area-popup',
      });
      popupRef.current = popup;

      // Add navigation controls
      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: false,
        }),
        'top-right'
      );

      // Add scale control
      map.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric',
        }),
        'bottom-left'
      );

      map.on('load', () => {
        setIsMapLoading(false);
        mapRef.current = map;
        onMapLoad?.(map);
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map. Please check your connection and try again.');
        setIsMapLoading(false);
      });

      return () => {
        popup.remove();
        map.remove();
        mapRef.current = null;
        popupRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapError('Failed to initialize map. Please refresh the page.');
      setIsMapLoading(false);
    }
  }, [initialCenter, initialZoom, onMapLoad]);

  // Add GeoJSON data when available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isMapLoading || !geoJsonData) return;

    // Wait for map style to be loaded
    if (!map.isStyleLoaded()) {
      const checkStyle = () => {
        if (map.isStyleLoaded()) {
          addAreasLayer(map, geoJsonData);
          map.off('styledata', checkStyle);
        }
      };
      map.on('styledata', checkStyle);
      return;
    }

    addAreasLayer(map, geoJsonData);
  }, [geoJsonData, isMapLoading, addAreasLayer]);

  // Set up mouse event handlers
  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup || !geoJsonData) return;

    // Create a lookup map for choropleth values
    const choroplethDataMap = new Map<string, number>();
    if (choropleth?.data) {
      for (const point of choropleth.data) {
        choroplethDataMap.set(point.areaId, point.value);
      }
    }

    let currentHoveredId: string | null = null;

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!map.getLayer(AREAS_FILL_LAYER_ID)) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [AREAS_FILL_LAYER_ID],
      });

      if (features.length > 0) {
        const feature = features[0];
        const featureId = feature.properties?.id as string;
        const featureName = feature.properties?.name as string;
        const featureCode = feature.properties?.code as string;

        // Update cursor
        map.getCanvas().style.cursor = 'pointer';

        // Update hover state
        if (currentHoveredId !== featureId) {
          // Remove previous hover state
          if (currentHoveredId) {
            map.setFeatureState(
              { source: AREAS_SOURCE_ID, id: currentHoveredId },
              { hover: false }
            );
          }

          // Set new hover state
          currentHoveredId = featureId;
          setHoveredAreaId(featureId);
          map.setFeatureState(
            { source: AREAS_SOURCE_ID, id: featureId },
            { hover: true }
          );

          // Notify parent
          onAreaHover?.({
            id: featureId,
            code: featureCode,
            name: featureName,
          });
        }

        // Build popup content with optional choropleth value
        const choroplethValue = choroplethDataMap.get(featureId);
        let valueHtml = '';
        if (choroplethValue !== undefined && choropleth?.title) {
          const formattedValue = choropleth.isRate
            ? choroplethValue.toFixed(1)
            : Math.round(choroplethValue).toLocaleString();
          valueHtml = `
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
              <span style="color: #333; font-size: 13px; font-weight: 500;">${formattedValue}</span>
              <span style="color: #666; font-size: 11px;"> ${choropleth.title}</span>
            </div>
          `;
        } else if (choropleth?.data && choropleth.data.length > 0) {
          valueHtml = `
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
              <span style="color: #999; font-size: 11px; font-style: italic;">No data</span>
            </div>
          `;
        }

        // Show popup
        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 4px 8px; font-family: Roboto, sans-serif;">
              <strong>${featureName}</strong>
              <br/>
              <span style="color: #666; font-size: 12px;">${featureCode}</span>
              ${valueHtml}
            </div>
          `)
          .addTo(map);
      } else {
        // Reset cursor and hover state
        map.getCanvas().style.cursor = '';
        popup.remove();

        if (currentHoveredId) {
          map.setFeatureState(
            { source: AREAS_SOURCE_ID, id: currentHoveredId },
            { hover: false }
          );
          currentHoveredId = null;
          setHoveredAreaId(null);
          onAreaHover?.(null);
        }
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      popup.remove();

      if (currentHoveredId) {
        map.setFeatureState(
          { source: AREAS_SOURCE_ID, id: currentHoveredId },
          { hover: false }
        );
        currentHoveredId = null;
        setHoveredAreaId(null);
        onAreaHover?.(null);
      }
    };

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!map.getLayer(AREAS_FILL_LAYER_ID)) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [AREAS_FILL_LAYER_ID],
      });

      if (features.length > 0) {
        const feature = features[0];
        onAreaClick?.({
          id: feature.properties?.id as string,
          code: feature.properties?.code as string,
          name: feature.properties?.name as string,
        });
      } else {
        onAreaClick?.(null);
      }
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseleave', AREAS_FILL_LAYER_ID, handleMouseLeave);
    map.on('click', handleClick);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseleave', AREAS_FILL_LAYER_ID, handleMouseLeave);
      map.off('click', handleClick);
    };
  }, [geoJsonData, onAreaClick, onAreaHover, choropleth]);

  // Show error state
  if (mapError) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        width="100%"
        bgcolor="grey.100"
        p={3}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Map Error
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {mapError}
        </Typography>
      </Box>
    );
  }

  const isLoading = isMapLoading || isGeoJsonLoading;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Map container */}
      <Box
        ref={mapContainer}
        sx={{
          width: '100%',
          height: '100%',
          '& .mapboxgl-ctrl-logo': {
            display: 'block',
          },
          '& .area-popup .mapboxgl-popup-content': {
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: 0,
          },
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1}
        >
          <MapLoading message={isGeoJsonLoading ? 'Loading départements...' : 'Loading map...'} />
        </Box>
      )}

      {/* GeoJSON error notification */}
      {isGeoJsonError && !isMapLoading && (
        <Box
          position="absolute"
          top={8}
          left={8}
          right={8}
          zIndex={2}
        >
          <Alert severity="warning" variant="filled">
            Could not load département boundaries. 
            {(geoJsonError as Error)?.message || 'API may be offline.'}
          </Alert>
        </Box>
      )}

      {/* Choropleth legend */}
      {!isLoading && legendConfig && (
        <MapLegend
          config={legendConfig}
          position="bottom-right"
          isLoading={isChoroplethLoading}
        />
      )}

      {/* Feature count indicator - moved to top when legend present */}
      {geoJsonData && !isLoading && (
        <Box
          position="absolute"
          bottom={legendConfig ? 'auto' : 40}
          top={legendConfig ? 60 : 'auto'}
          right={8}
          zIndex={2}
        >
          <Chip
            size="small"
            label={`${geoJsonData.features.length} départements`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: 1,
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default MapContainer;
