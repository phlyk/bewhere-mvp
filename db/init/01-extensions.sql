-- Enable PostGIS extension for spatial data support
-- This runs automatically on first database initialization

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS installation
DO $$
BEGIN
    RAISE NOTICE 'PostGIS version: %', PostGIS_Full_Version();
END
$$;
