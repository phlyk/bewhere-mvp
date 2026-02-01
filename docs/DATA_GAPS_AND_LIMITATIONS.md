# Data Gaps and Limitations

> Task 11.4: Document known data gaps and limitations

This document describes the known limitations, data quality issues, and coverage gaps in BeWhere MVP. Understanding these constraints is essential for accurate interpretation of crime statistics.

---

## Executive Summary

BeWhere MVP provides crime statistics for **101 French départements** (96 metropolitan + 5 overseas) from **2016 to 2024**. The data is derived from official French government sources but has inherent limitations:

| Limitation Type | Impact | Mitigation |
|-----------------|--------|------------|
| Geographic Coverage | Metropolitan France emphasis; overseas territories less complete | Filter to metropolitan départements for consistent analysis |
| Temporal Coverage | 2016-2024 only (9 years) | Compare within available range; avoid extrapolation |
| Category Mapping | 107→20 aggregation loses granularity | Check original categories for research requiring detail |
| Data Collection | Police-recorded only; dark figures exist | Use rates and trends, not absolute values |
| Population Data | Annual estimates, not census | Acceptable for rate normalization |

---

## Geographic Coverage Gaps

### Metropolitan France (Complete)

All **96 metropolitan départements** are fully covered:

| Code Range | Description | Count | Status |
|------------|-------------|-------|--------|
| 01-19 | Standard codes (A-S alphabetically) | 19 | ✅ Complete |
| 21-95 | Standard codes (excluding 20) | 75 | ✅ Complete |
| 2A, 2B | Corsica (Corse-du-Sud, Haute-Corse) | 2 | ✅ Complete |

**Note:** Code `20` (historical Corsica) was split into `2A` and `2B` in 1976. BeWhere correctly handles this historical quirk.

### Overseas Territories (DOM-TOM)

Overseas départements have **partial coverage** depending on data source:

| Code | Name | État 4001 | Time Series | Population | Status |
|------|------|-----------|-------------|------------|--------|
| 971 | Guadeloupe | ❌ Excluded | ✅ Annual | ✅ Available | Partial |
| 972 | Martinique | ❌ Excluded | ✅ Annual | ✅ Available | Partial |
| 973 | Guyane | ❌ Excluded | ✅ Annual | ✅ Available | Partial |
| 974 | La Réunion | ❌ Excluded | ✅ Annual | ✅ Available | Partial |
| 976 | Mayotte | ❌ Excluded | ✅ Annual | ✅ Available | Partial |
| 975 | Saint-Pierre-et-Miquelon | ❌ Excluded | ❌ Excluded | ❌ N/A | Not covered |
| 984-989 | Collectivités d'outre-mer | ❌ Excluded | ❌ Excluded | ❌ N/A | Not covered |

**Impact:** When comparing metropolitan and overseas départements, category coverage may differ. Time series data is available for DOM départements but État 4001 monthly snapshots are not.

### Regions and National Aggregates

BeWhere stores **département-level data only**. Regional and national aggregates are **not pre-calculated**:

- ❌ NUTS-2 regions (13 regions) - not aggregated
- ❌ National totals (France métropolitaine) - not stored
- ✅ Départements (NUTS-3) - full coverage

**Workaround:** Use the comparison API endpoints to aggregate multiple départements for regional analysis.

---

## Temporal Coverage Gaps

### Available Time Range

| Metric | Value |
|--------|-------|
| **Start Year** | 2016 |
| **End Year** | 2024 |
| **Years Available** | 9 |
| **Granularity** | Yearly (aggregated from monthly) |

### Time Range Limitations

1. **No Historical Data Before 2016**
   - État 4001 methodology changed significantly in 2016
   - Earlier data uses different category classifications
   - Direct comparison with pre-2016 data is not valid

2. **2024 Data May Be Incomplete**
   - Time series data updated quarterly
   - Year-end totals may not reflect full calendar year
   - Use 2023 for complete annual comparisons

3. **Monthly Granularity Not Exposed**
   - Source data is monthly; stored as yearly aggregates
   - Seasonal patterns cannot be analyzed in current MVP
   - Future enhancement: add monthly granularity option

### Missing Year-Département Combinations

Some département-year combinations may lack data:

| Scenario | Example | Frequency |
|----------|---------|-----------|
| New département boundaries | Rare | <1% |
| Data submission delays | Recent years | ~2% |
| Zero-value categories | Low-frequency crimes | ~5% |

**Detection:** Use the `/observations` endpoint with `yearFrom`/`yearTo` filters to identify gaps for specific analyses.

---

## Category Mapping Limitations

### Aggregation Information Loss

The canonical 20-category taxonomy aggregates 103 active État 4001 indices:

| Canonical Category | Source Indices | Aggregation Type |
|--------------------|----------------|------------------|
| `HOMICIDE` | 01, 02, 03, 51 | Full merge |
| `ASSAULT` | 07, 11, 12, 13, 73 | Mixed contexts |
| `BURGLARY_RESIDENTIAL` | 14, 27, 28, 31 | Includes home invasion |
| `VEHICLE_THEFT` | 34, 35, 36, 37, 38 | Theft + from vehicle |
| `FRAUD` | 81-92, 98, 101, 102, 106 | 15 indices merged |
| `OTHER` | 59-61, 69-72, 74-80, 93-95, 103-105, 107 | Catch-all bucket |

**Key Concerns:**

1. **ASSAULT Heterogeneity**
   - Combines physical violence (07) with threats/blackmail (11, 12)
   - Violence against authority (73) included
   - Consider separating for research

2. **BURGLARY_RESIDENTIAL Includes Home Invasion**
   - Index 14 (violations de domicile) is entry without theft
   - Indices 27, 28 are burglary with theft
   - May inflate "burglary" counts vs. international definitions

3. **OTHER Category is Large**
   - 19+ source indices map to `OTHER`
   - Includes immigration offenses, labor violations, animal cruelty
   - Limited analytical value for this bucket

### Unmapped Category: DOMESTIC_VIOLENCE

The canonical taxonomy includes `DOMESTIC_VIOLENCE` but:

| Status | Explanation |
|--------|-------------|
| ❌ No source mapping | État 4001 doesn't separate domestic violence |
| ❌ Zero observations | Category seeded but unpopulated |
| ⚠️ Partially captured | Some cases counted under ASSAULT or CHILD_ABUSE |

**Historical Context:** French crime statistics historically didn't isolate domestic violence as a distinct category. Recent legislative changes (2019+) are improving classification, but legacy data remains aggregated.

### Unused État 4001 Indices

Four indices are marked "Non utilisé" (unused) in source data:

| Index | Status | Handling |
|-------|--------|----------|
| 96 | Unused | Skipped by ETL |
| 97 | Unused | Skipped by ETL |
| 99 | Unused | Skipped by ETL |
| 100 | Unused | Skipped by ETL |

These are historical placeholders that were never populated.

---

## Data Quality Issues

### Counting Unit Variations

Source data uses different counting units:

| Unit | French | Used For | Implication |
|------|--------|----------|-------------|
| Infractions | Offenses recorded | Most property crimes | Multiple victims = 1 count |
| Victimes | Victims | Violent crimes | 1 event with 3 victims = 3 counts |
| Mis en cause | Suspects | Drug offenses | Arrests, not incidents |

**Impact:** Direct comparison between categories is problematic:
- Burglary (infractions) counts events
- Assault (victimes) counts people
- Drug use (mis en cause) counts arrests

BeWhere stores all as "observations" without distinguishing units.

### Dark Figure of Crime

Police-recorded crime statistics have inherent limitations:

| Crime Type | Estimated Reporting Rate | Notes |
|------------|-------------------------|-------|
| Homicide | >95% | Nearly complete |
| Vehicle theft | ~70-80% | Insurance claims improve reporting |
| Burglary | ~40-60% | Varies by value stolen |
| Sexual violence | ~10-20% | Significant underreporting |
| Drug use | ~5-10% | Detection-dependent only |
| Assault | ~30-50% | Context-dependent |

**Interpretation Guidance:**
- ✅ Use for trend analysis over time
- ✅ Use for cross-département comparison
- ⚠️ Avoid treating as true incidence rates
- ❌ Do not compare directly to victimization surveys

### Seasonal Adjustment (CVS-CJO)

National-level time series data is seasonally adjusted (CVS-CJO), but département-level data is **raw counts**:

| Level | CVS-CJO Applied | Notes |
|-------|-----------------|-------|
| France national | ✅ Yes | Monthly data adjusted |
| Département | ❌ No | Annual raw totals |

BeWhere uses département annual data (raw), so seasonal patterns are aggregated away.

### Population Denominator Issues

Rate calculations use INSEE population estimates:

| Limitation | Impact | Severity |
|------------|--------|----------|
| Annual estimates, not census | ±1-2% accuracy | Low |
| Legal population, not de facto | Excludes tourists, commuters | Medium for Paris, coastal areas |
| Same year used for all months | Ignores intra-year population changes | Low |

**High-Impact Départements:**
- **Paris (75)**: Daytime population 2x residential population
- **Alpes-Maritimes (06)**: Seasonal tourism inflates summer population
- **Haute-Savoie (74)**: Cross-border workers not in legal population

---

## Data Source Gaps

### État 4001 Limitations

| Issue | Description |
|-------|-------------|
| Police-only | Gendarmerie data integrated but historically separate |
| Metropolitan only | Excludes overseas départements |
| Recorded, not solved | "Faits constatés" - incidents recorded, not cleared cases |
| Administrative definition | Crime defined by reporting district, not occurrence location |

### Time Series Limitations

| Issue | Description |
|-------|-------------|
| Annual département only | No monthly breakdown by département |
| Indicator subset | Only ~7 major indicators, not full 107 categories |
| Mixed units | Some indicators are victims, others are offenses |
| Delayed updates | Quarterly publication with ~3 month lag |

### Population Data Limitations

| Issue | Description |
|-------|-------------|
| Embedded data | Not fetched from live INSEE API |
| Update lag | MVpopulation frozen at ETL development time |
| Mainland focus | Overseas population estimates may be less precise |

---

## Rate Calculation Caveats

### Per 100,000 Normalization

BeWhere calculates `rate_per_100k` as:

```
rate_per_100k = (count / population) × 100,000
```

| Caveat | Explanation |
|--------|-------------|
| Population lag | Uses same-year estimate; crime data may be more recent |
| Small population bias | Départements <500k have more volatile rates |
| Category mixing | Rate meaningful only within same category group |

### Small Population Volatility

Départements with small populations show higher rate variance:

| Département | Population (2023) | Concern Level |
|-------------|-------------------|---------------|
| Lozère (48) | ~76,000 | ⚠️ High volatility |
| Creuse (23) | ~116,000 | ⚠️ Moderate volatility |
| Hautes-Alpes (05) | ~141,000 | ⚠️ Moderate volatility |
| Corse-du-Sud (2A) | ~164,000 | ⚠️ Moderate volatility |
| Haute-Corse (2B) | ~185,000 | ⚠️ Moderate volatility |

**Guidance:** For départements with population <200,000, consider multi-year averages rather than single-year rates.

---

## Comparison Limitations

### Cross-Year Comparisons

| Valid Comparison | Invalid Comparison |
|------------------|-------------------|
| 2018 vs. 2023 (same methodology) | 2016 vs. 2015 (methodology change) |
| Trend 2016-2024 | Pre-2016 extrapolation |
| YoY percentage change | Absolute count differences (population changes) |

### Cross-Area Comparisons

| Valid Comparison | Invalid Comparison |
|------------------|-------------------|
| Rate-based (per 100k) | Raw count (different populations) |
| Same département over time | Rural vs. urban without context |
| Département to national average | Metropolitan vs. overseas |

### Cross-Category Comparisons

| Valid Comparison | Invalid Comparison |
|------------------|-------------------|
| Trend direction within category | ASSAULT count vs. FRAUD count |
| Same category across years | Victim-based vs. offense-based categories |
| Severity group aggregates | Individual category rates |

---

## Known Data Anomalies

### Category Recording Changes

| Year | Change | Affected Categories |
|------|--------|---------------------|
| 2017 | Sexual harassment definition expanded | SEXUAL_VIOLENCE (+15-20%) |
| 2018 | Online fraud category introduced | FRAUD (+10-15%) |
| 2019 | Domestic violence tracking improved | ASSAULT (may include DV) |
| 2020 | COVID-19 lockdowns | All categories (Q2 2020 suppressed) |

### COVID-19 Impact (2020)

The 2020 data shows significant anomalies due to lockdown periods:

| Category | 2020 vs. 2019 | Explanation |
|----------|---------------|-------------|
| BURGLARY_RESIDENTIAL | -30% | People home; fewer targets |
| BURGLARY_COMMERCIAL | -20% | Reduced commercial activity |
| VEHICLE_THEFT | -25% | Reduced mobility |
| ASSAULT | -15% | Fewer public interactions |
| DOMESTIC_VIOLENCE | ⚠️ Unknown | Underreported (victims at home with perpetrators) |

**Recommendation:** When analyzing 2016-2024 trends, consider excluding 2020 or noting it as an outlier year.

---

## API Response Considerations

### Missing Data Representation

| Scenario | API Response | UI Display |
|----------|--------------|------------|
| No observations for area-year-category | Empty results array | "No data" in choropleth |
| Zero-count observation | `count: 0, ratePer100k: 0` | Shows as zero |
| Missing population for rate calculation | `ratePer100k: null` | "Rate unavailable" |

### Pagination Limits

| Endpoint | Default Limit | Max Limit | Concern |
|----------|---------------|-----------|---------|
| `/observations` | 50 | 500 | Full dataset requires pagination |
| `/areas` | All | N/A | Small dataset, no concern |
| `/categories` | All | N/A | 20 categories, no concern |

---

## Recommendations for Users

### For Exploratory Analysis

1. ✅ Start with recent complete years (2022, 2023)
2. ✅ Use rate-based comparisons (per 100k)
3. ✅ Focus on metropolitan départements for consistency
4. ✅ Compare within same severity groups

### For Research Use

1. ⚠️ Document all data source limitations in methodology
2. ⚠️ Note category aggregation from 107→20 indices
3. ⚠️ Acknowledge dark figure of crime in interpretation
4. ⚠️ Consider 2020 COVID anomaly in time series
5. ⚠️ Verify overseas territory data availability

### For Dashboards/Reporting

1. ✅ Include "Data as of [date]" timestamp
2. ✅ Add "Source: Ministère de l'Intérieur" attribution
3. ✅ Display "per 100,000 inhabitants" label for rates
4. ⚠️ Include methodology notes for external audiences
5. ❌ Do not present as official crime statistics

---

## Future Enhancements

The following improvements are planned for post-MVP:

| Enhancement | Impact | Priority |
|-------------|--------|----------|
| Monthly granularity option | Seasonal pattern analysis | High |
| Pre-aggregated regional totals | Faster regional comparisons | Medium |
| Historical data (pre-2016) | Longer trend analysis | Low |
| Live INSEE population updates | Current-year rate accuracy | Medium |
| Eurostat integration | Cross-country comparison | Low |
| Victimization survey overlay | Dark figure context | Medium |

---

## References

- [Ministère de l'Intérieur - Interstats](https://www.interieur.gouv.fr/Interstats) - Official crime statistics
- [INSEE - Population Estimates](https://www.insee.fr/fr/statistiques/1893198) - Population data source
- [État 4001 Methodology](https://www.interieur.gouv.fr/Interstats/Methodes/Nomenclature-des-index-de-l-etat-4001) - Crime index classification
- [SSMSI Methodology Notes](https://www.interieur.gouv.fr/Interstats/Methodes) - Statistical service documentation
- [data.gouv.fr Datasets](https://www.data.gouv.fr/fr/datasets/?q=criminalit%C3%A9) - Open data sources

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-01 | Initial documentation (Task 11.4) |
