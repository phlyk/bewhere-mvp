# ETL Pipelines

This directory contains the specific pipeline implementations for loading data into BeWhere:

- `departements/` - French département geometry loader ✅
- `population/` - INSEE population data loader ✅
- `france-monthly/` - État 4001 monthly snapshot loader (TODO)
- `france-timeseries/` - Time series data loader (TODO)

Each pipeline implements the base classes from `../core/`:
- Extractor (extract data from source)
- Transformer (map and validate data)
- Loader (load into database)

## Implementation Status

- [x] `departements/` - Task 3.3 ✅
  - Downloads GeoJSON from geo.api.gouv.fr
  - Transforms to PostGIS-compatible format
  - Loads 96 metropolitan + 5 overseas départements
- [x] `population/` - Task 3.4 ✅
  - Extracts population data from embedded INSEE dataset
  - Transforms with département → area_id resolution
  - Loads 909 records (101 départements × 9 years, 2016-2024)
- [ ] `france-monthly/` - Tasks 4.1.1-4.1.8
- [ ] `france-timeseries/` - Tasks 4.2.1-4.2.8

## Usage

Run individual pipelines:

```bash
# Load département geometries (must run first)
npm run etl:departements

# Load population data (must run after départements)
npm run etl:population

# Load French crime data
npm run etl:france-monthly
npm run etl:france-timeseries

# Run all pipelines in order
npm run etl:all
```

## Pipeline Order

1. **departements** - Must be first (provides area_id references)
2. **population** - Must be before crime data (provides population for rate calculation)
3. **france-monthly** - Crime data from État 4001
4. **france-timeseries** - Crime data from time series

## ETL Contract

For detailed documentation on implementing new pipelines, see [docs/ETL_CONTRACT.md](../../../docs/ETL_CONTRACT.md).

This includes:
- Base class contracts and required methods
- Pipeline implementation checklist
- Dataset-specific requirements
- Utility function usage
- Error handling strategies
- Testing guidelines

## Population Data

The population pipeline uses embedded INSEE data for the MVP:

- **Source**: INSEE Estimations de population
- **URL**: https://www.insee.fr/fr/statistiques/1893198
- **Coverage**: 2016-2024 (9 years)
- **Départements**: 101 (96 metropolitan + 5 overseas DOM)
- **Total Records**: 909

Population values are stored as legal population as of January 1st of each year.
Values are used to calculate crime rates per 100,000 population.
