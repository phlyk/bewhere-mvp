# French Crime Datasets Documentation

> Task 0.5: Document French dataset structure

This document describes the structure and characteristics of the French crime statistics datasets used in BeWhere MVP.

---

## Overview

BeWhere uses two primary data sources from [data.gouv.fr](https://data.gouv.fr):

| Dataset | File Pattern | Granularity | Time Range | Rows |
|---------|--------------|-------------|------------|------|
| État 4001 Monthly Snapshots | `datagouv-juin-2012-*.csv` | Département | Monthly snapshots | ~112 |
| Time Series | `datagouv-serieschrono.csv` | National + Département | 2016-2025 | 36,716 |

---

## Dataset 1: État 4001 Monthly Snapshots

### Source
- **Origin**: Ministère de l'Intérieur (DCPJ - Direction Centrale de la Police Judiciaire)
- **Classification System**: État 4001 (official French crime index)
- **Update Frequency**: Monthly

### File Structure
```
Row 1: Title row (metadata)
Row 2: Empty
Row 3: Header row (département names)
Rows 4-110: Crime categories with counts per département
Row 111-112: Source attribution
```

### Encoding
- **Character Encoding**: Latin-1 (ISO-8859-1)
- **Delimiter**: Semicolon (`;`)
- **Notes**: Contains French accented characters (é, è, à, etc.) that appear garbled in UTF-8

### Columns
| Column | Description |
|--------|-------------|
| `N°Index` | Crime category index (01-107) |
| `Index de l'Etat 4001` | Crime category name in French |
| `Métropole` | National total for metropolitan France |
| Columns 4-99 | Individual département counts (96 départements) |

### Départements (96 total)
Columns represent all 96 metropolitan French départements:
- Ain (01), Aisne (02), Allier (03), ... Val-d'Oise (95)
- Plus Île-de-France split: Essonne (91), Hauts-de-Seine (92), Seine-Saint-Denis (93), Val-de-Marne (94)
- Note: Does NOT include overseas départements (971-976)

### Crime Categories (107 total, 95 active)

The État 4001 defines 107 crime category indices. Categories 96-97, 99-100 are marked "Non utilisé" (unused).

#### Category Groups

**Violent Crimes Against Persons (01-14)**
| Index | French Name | English Translation |
|-------|-------------|---------------------|
| 01 | Règlements de compte entre malfaiteurs | Criminal settlements |
| 02 | Homicides pour voler et à l'occasion de vols | Homicides during robbery |
| 03 | Homicides pour d'autres motifs | Homicides for other reasons |
| 04 | Tentatives d'homicides pour voler | Attempted robbery homicides |
| 05 | Tentatives homicides pour d'autres motifs | Other attempted homicides |
| 06 | Coups et blessures volontaires suivis de mort | Assault resulting in death |
| 07 | Autres coups et blessures volontaires | Other assault and battery |
| 08 | Prises d'otages à l'occasion de vols | Hostage-taking during robbery |
| 09 | Prises d'otages dans un autre but | Hostage-taking other purposes |
| 10 | Séquestrations | Unlawful detention |
| 11 | Menaces ou chantages pour extorsion | Threats/blackmail for extortion |
| 12 | Menaces ou chantages dans un autre but | Threats/blackmail other purposes |
| 13 | Atteintes à la dignité et à la personnalité | Dignity/personality offenses |
| 14 | Violations de domicile | Home invasions |

**Armed Robbery (15-26)**
| Index | French Name | English Translation |
|-------|-------------|---------------------|
| 15 | Vols à main armée contre établissements financiers | Armed robbery - banks |
| 16 | Vols à main armée contre établissements commerciaux | Armed robbery - commercial |
| 17 | Vols à main armée contre transports de fonds | Armed robbery - cash transport |
| 18 | Vols à main armée contre particuliers à domicile | Armed robbery - homes |
| 19 | Autres vols à main armée | Other armed robbery |
| 20-22 | Vols avec armes blanches... | Knife robberies (3 subtypes) |
| 23-26 | Vols violents sans arme... | Violent theft without weapons |

**Burglary & Theft (27-44)**
| Index | French Name | English Translation |
|-------|-------------|---------------------|
| 27 | Cambriolages de locaux d'habitations principales | Burglary - primary residences |
| 28 | Cambriolages de résidences secondaires | Burglary - secondary residences |
| 29 | Cambriolages de locaux industriels/commerciaux | Burglary - commercial |
| 30 | Cambriolages d'autres lieux | Burglary - other locations |
| 31 | Vols avec entrée par ruse | Theft by deception |
| 32 | Vols à la tire | Pickpocketing |
| 33 | Vols à l'étalage | Shoplifting |
| 34-38 | Vols de véhicules... | Vehicle theft (5 subtypes) |
| 39-43 | Autres vols simples... | Simple theft (5 subtypes) |
| 44 | Recels | Receiving stolen goods |

**Sexual Offenses (45-50)**
| Index | French Name | English Translation |
|-------|-------------|---------------------|
| 45 | Proxénétisme | Pimping/procuring |
| 46 | Viols sur des majeur(e)s | Rape of adults |
| 47 | Viols sur des mineur(e)s | Rape of minors |
| 48 | Harcèlements sexuels... contre majeur(e)s | Sexual harassment - adults |
| 49 | Harcèlements sexuels... contre mineur(e)s | Sexual harassment - minors |
| 50 | Atteintes sexuelles | Sexual assault |

**Crimes Against Children (51-54)**
| Index | French Name | English Translation |
|-------|-------------|---------------------|
| 51 | Homicides commis contre enfants < 15 ans | Child homicides |
| 52 | Violences, mauvais traitements, abandons d'enfants | Child abuse/neglect |
| 53 | Délits au sujet de la garde des mineurs | Custody violations |
| 54 | Non versement de pension alimentaire | Non-payment child support |

**Drug Offenses (55-58)**
| Index | French Name | English Translation |
|-------|-------------|---------------------|
| 55 | Trafic et revente sans usage de stupéfiants | Drug trafficking (no personal use) |
| 56 | Usage-revente de stupéfiants | Drug dealing with personal use |
| 57 | Usage de stupéfiants | Drug use |
| 58 | Autres infractions législation stupéfiants | Other drug offenses |

**Property Destruction (62-68)**
| Index | French Name | English Translation |
|-------|-------------|---------------------|
| 62 | Incendies volontaires de biens publics | Arson - public property |
| 63 | Incendies volontaires de biens privés | Arson - private property |
| 64-65 | Attentats à l'explosif... | Bombings (rarely used) |
| 66 | Autres destructions biens publics | Vandalism - public |
| 67 | Autres destructions biens privés | Vandalism - private |
| 68 | Destructions et dégradations véhicules privés | Vehicle vandalism |

**Immigration (69-71)**
| Index | French Name |
|-------|-------------|
| 69 | Infractions conditions entrée/séjour étrangers |
| 70 | Aide à l'entrée/circulation/séjour étrangers |
| 71 | Autres infractions police des étrangers |

**Public Order & Weapons (72-80)**
| Index | French Name |
|-------|-------------|
| 72 | Outrages à dépositaires autorité |
| 73 | Violences à dépositaires autorité |
| 74 | Port ou détention armes prohibées |
| 75-80 | Various public order offenses |

**Fraud & Financial (81-106)**
| Index | French Name |
|-------|-------------|
| 81-88 | Document fraud (identity, vehicle, administrative) |
| 89-92 | Check/credit card fraud, swindling |
| 93-95 | Labor violations |
| 98-106 | Financial/economic crimes |

**Other (107)**
| Index | French Name |
|-------|-------------|
| 107 | Autres délits (miscellaneous) |

### Data Quality Notes
- Values are integer counts (some use space as thousands separator: "1 097")
- Zero values are explicit "0"
- Categories 96-97, 99-100 are unused (historical placeholders)
- Data represents "faits constatés" (recorded incidents), not convictions

---

## Dataset 2: Time Series (Séries Chronologiques)

### Source
- **Origin**: SSMSI (Service Statistique Ministériel de la Sécurité Intérieure)
- **Base**: Base statistique communale de la délinquance
- **Census Data**: INSEE recensement de la population

### File Structure
- **Encoding**: Latin-1 (ISO-8859-1)  
- **Delimiter**: Semicolon (`;`)
- **Quote Character**: Double quote (`"`)
- **Header Row**: Row 1

### Columns (15 total)

| Column | French Name | Description | Example Values |
|--------|-------------|-------------|----------------|
| 1 | `Valeurs` | Numeric value | `18593`, `5.596925` |
| 2 | `Unite_temps` | Time period | `2016M01`, `2024`, `2025M06` |
| 3 | `Titre` | Full indicator title | "Cambriolages de logement..." |
| 4 | `Ordonnees` | Y-axis label | "Nombre d'infractions", "Nombre de victime pour 1000 habitants" |
| 5 | `Indicateur` | Primary indicator category | "Cambriolages et tentatives" |
| 6 | `SourceGraphique` | Data source | "SSMSI, base statistique..." |
| 7 | `Sous_indicateur` | Sub-indicator | "Logements (résidences principales et secondaires)" |
| 8 | `Nomenclature` | Classification scheme | "Non Renseigné" |
| 9 | `Declinaison` | Breakdown type | "Non Renseigné" |
| 10 | `Statistique` | Statistic type | "Nombre", "Taux pour 1000 habitants" |
| 11 | `Zone_geographique` | Geographic zone | "France", "43-Haute-Loire", "75-Paris" |
| 12 | `Champ` | Geographic scope | Same as Zone_geographique |
| 13 | `Periodicite` | Periodicity | "Mensuelle", "Annuelle" |
| 14 | `Unite_de_compte` | Counting unit | "Infractions", "Victimes", "Mis en cause" |
| 15 | `Detail_complementaire` | Additional detail | "Série CVS-CJO", "Non Renseigné" |

### Time Format
- Monthly: `YYYYMNN` (e.g., `2016M01` = January 2016)
- Annual: `YYYY` (e.g., `2024`)

### Geographic Granularity

The dataset contains two levels:

1. **National ("France")**: Aggregated monthly time series (CVS-CJO adjusted)
2. **Département-level**: Annual victim counts with format `XX-DépartementName`

#### Département Codes Found
```
01-Ain, 02-Aisne, 03-Allier, ... 95-Val-d'Oise
Plus overseas:
971-Guadeloupe, 972-Martinique, 973-Guyane, 974-La Réunion, 976-Mayotte
```

### Indicators (Primary Categories)

| Indicateur | Sub-indicators | Unit Types |
|------------|----------------|------------|
| Cambriolages et tentatives | Logements (résidences principales et secondaires) | Infractions |
| Destructions et dégradations volontaires | (none) | Infractions |
| Homicides et tentatives d'homicide | Homicides, Tentatives | Victimes |
| Infractions à la législation sur les stupéfiants | Trafic de stupéfiants, Usage de stupéfiants | Mis en cause |
| Escroqueries et les fraudes aux moyens de paiements | (none) | Victimes |
| Vols avec violence | (various subtypes) | Victimes |
| Coups et blessures volontaires | (various subtypes) | Victimes |

### Statistic Types

| `Statistique` Value | Description |
|---------------------|-------------|
| Nombre | Raw count |
| Taux pour 1000 habitants | Rate per 1,000 population |

### Counting Units

| `Unite_de_compte` Value | Description |
|-------------------------|-------------|
| Infractions | Recorded offenses |
| Victimes | Victims |
| Mis en cause | Suspects/accused persons |

### CVS-CJO Adjustment
- **CVS**: Correction des Variations Saisonnières (Seasonal adjustment)
- **CJO**: Correction des Jours Ouvrables (Working day adjustment)
- Monthly national series are adjusted; annual département data is raw

### Data Quality Notes
- Decimal values use comma (`,`) as separator: `5,596925`
- Integer values have no decimals: `1277`
- "Non Renseigné" indicates missing/not applicable field
- Time coverage: 2016M01 to 2025M06 (at time of analysis)
- National monthly data is seasonally adjusted
- Département annual data is raw counts

---

## Mapping Considerations

### État 4001 → Canonical Taxonomy
The État 4001's 95+ categories should be mapped to ~15-20 canonical categories for MVP:

| Canonical Category | État 4001 Indices |
|--------------------|-------------------|
| Homicide | 01, 02, 03, 51 |
| Attempted Homicide | 04, 05 |
| Assault | 06, 07 |
| Sexual Violence | 45-50 |
| Armed Robbery | 15-19 |
| Robbery (other) | 20-26 |
| Burglary - Residential | 27, 28 |
| Burglary - Commercial | 29, 30 |
| Vehicle Theft | 34-38 |
| Other Theft | 31-33, 39-44 |
| Drug Trafficking | 55, 56 |
| Drug Use | 57, 58 |
| Arson | 62-65 |
| Vandalism | 66-68 |
| Fraud | 81-92 |

### Time Series → Canonical Taxonomy
The time series indicators map more directly:

| Time Series Indicateur | Canonical Category |
|------------------------|-------------------|
| Homicides et tentatives d'homicide | Homicide, Attempted Homicide |
| Coups et blessures volontaires | Assault |
| Cambriolages et tentatives | Burglary |
| Destructions et dégradations volontaires | Vandalism |
| Escroqueries et fraudes | Fraud |
| Infractions législation stupéfiants | Drug Offenses |

---

## ETL Considerations

### Encoding Handling
```python
# Python example for reading État 4001
import pandas as pd
df = pd.read_csv('datagouv-juin-2012-*.csv', 
                 encoding='latin-1', 
                 sep=';',
                 skiprows=2)  # Skip title and blank row
```

### Thousand Separator
```python
# Handle space as thousand separator
df['Métropole'] = df['Métropole'].str.replace(' ', '').astype(int)
```

### Time Parsing (Time Series)
```python
# Parse YYYYMNN format
def parse_unite_temps(val):
    if 'M' in val:
        year, month = val.split('M')
        return pd.Timestamp(year=int(year), month=int(month), day=1)
    else:
        return pd.Timestamp(year=int(val), month=1, day=1)
```

### Decimal Handling
```python
# Handle comma decimal separator
df['Valeurs'] = df['Valeurs'].str.replace(',', '.').astype(float)
```

---

## Known Limitations

1. **Time Coverage Gap**: État 4001 monthly files are individual snapshots; historical comparison requires multiple files
2. **Geographic Mismatch**: État 4001 excludes overseas territories; time series includes them
3. **Aggregation Level**: Time series département data is annual only; monthly data is national only
4. **Category Evolution**: État 4001 categories may change over time (unused indices suggest historical changes)
5. **Population Data**: Rate calculations require separate INSEE population data (not included in crime datasets)

---

## References

- [data.gouv.fr - Criminalité et délinquance](https://www.data.gouv.fr/fr/datasets/?q=criminalit%C3%A9)
- [SSMSI - Service Statistique](https://www.interieur.gouv.fr/Interstats)
- [État 4001 Classification](https://www.interieur.gouv.fr/Interstats/Methodes/Nomenclature-des-index-de-l-etat-4001)
- [INSEE - Population départementale](https://www.insee.fr/fr/statistiques/series/102760671)
