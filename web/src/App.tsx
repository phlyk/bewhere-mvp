import { useCallback } from 'react';
import { Layout, MapContainer, type SelectedArea } from './components';
import {
    setMapSelectedAreaId,
    toggleAreaId,
    useAppDispatch,
    useChoroplethData,
    useDefaultSelections,
    useSelections,
} from './store';

function App() {
  const dispatch = useAppDispatch();
  const { mapSelectedAreaId } = useSelections();

  // Initialize default selections on first load
  useDefaultSelections();

  // Get choropleth data based on current selections
  const { choroplethData, legendTitle, isRate, isFetching } = useChoroplethData();

  // Handle area click on map - toggle selection and set highlight
  const handleAreaClick = useCallback((area: SelectedArea | null) => {
    if (area) {
      // Set the map-selected area for highlighting
      dispatch(setMapSelectedAreaId(area.id));
      // Toggle the area in the filter selection
      dispatch(toggleAreaId(area.id));
    } else {
      dispatch(setMapSelectedAreaId(null));
    }
  }, [dispatch]);

  // Build choropleth config for the map
  const choroplethConfig = choroplethData.length > 0 ? {
    data: choroplethData,
    title: legendTitle,
    isRate,
  } : null;

  return (
    <Layout>
      <MapContainer
        selectedAreaId={mapSelectedAreaId}
        onAreaClick={handleAreaClick}
        choropleth={choroplethConfig}
        isChoroplethLoading={isFetching}
      />
    </Layout>
  );
}

export default App;
