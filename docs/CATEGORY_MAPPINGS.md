# French Crime Category Mappings

> Task 0.2: Map French crime categories (107 État 4001 indices) to canonical taxonomy

This document provides the complete mapping from French crime data sources to BeWhere's canonical 20-category taxonomy.

---

## Overview

| Source Dataset | Source Categories | Canonical Categories | Coverage |
|----------------|-------------------|---------------------|----------|
| État 4001 | 107 indices (95 active) | 20 | 100% mapped |
| Time Series (Séries Chronologiques) | 7 indicators | 20 | 100% mapped |

---

## État 4001 → Canonical Taxonomy

### Complete Mapping Table

| Index | French Name (État 4001) | Canonical Category | Notes |
|-------|-------------------------|-------------------|-------|
| 01 | Règlements de compte entre malfaiteurs | `HOMICIDE` | Criminal settlements |
| 02 | Homicides pour voler et à l'occasion de vols | `HOMICIDE` | During robbery |
| 03 | Homicides pour d'autres motifs | `HOMICIDE` | Other motives |
| 04 | Tentatives d'homicides pour voler | `ATTEMPTED_HOMICIDE` | During robbery |
| 05 | Tentatives homicides pour d'autres motifs | `ATTEMPTED_HOMICIDE` | Other motives |
| 06 | Coups et blessures volontaires suivis de mort | `ATTEMPTED_HOMICIDE` | Assault resulting in death |
| 07 | Autres coups et blessures volontaires | `ASSAULT` | General assault/battery |
| 08 | Prises d'otages à l'occasion de vols | `KIDNAPPING` | During robbery |
| 09 | Prises d'otages dans un autre but | `KIDNAPPING` | Other purposes |
| 10 | Séquestrations | `KIDNAPPING` | Unlawful detention |
| 11 | Menaces ou chantages pour extorsion de fonds | `ASSAULT` | Threats/blackmail for money |
| 12 | Menaces ou chantages dans un autre but | `ASSAULT` | Threats/blackmail other |
| 13 | Atteintes à la dignité et à la personnalité | `ASSAULT` | Dignity offenses |
| 14 | Violations de domicile | `BURGLARY_RESIDENTIAL` | Home invasion (no theft) |
| 15 | Vols à main armée contre des établissements financiers | `ARMED_ROBBERY` | Banks/financial |
| 16 | Vols à main armée contre des établissements industriels ou commerciaux | `ARMED_ROBBERY` | Commercial/industrial |
| 17 | Vols à main armée contre des entreprises de transports de fonds | `ARMED_ROBBERY` | Cash transport |
| 18 | Vols à main armée contre des particuliers à leur domicile | `ARMED_ROBBERY` | Private homes |
| 19 | Autres vols à main armée | `ARMED_ROBBERY` | Other armed robbery |
| 20 | Vols avec armes blanches contre des établissements financiers, commerciaux ou industriels | `ARMED_ROBBERY` | Knife - commercial |
| 21 | Vols avec armes blanches contre des particuliers à leur domicile | `ARMED_ROBBERY` | Knife - homes |
| 22 | Autres vols avec armes blanches | `ARMED_ROBBERY` | Knife - other |
| 23 | Vols violents sans arme contre des établissements financiers, commerciaux ou industriels | `ROBBERY` | Violent - commercial |
| 24 | Vols violents sans arme contre des particuliers à leur domicile | `ROBBERY` | Violent - homes |
| 25 | Vols violents sans arme contre des femmes sur voie publique ou autre lieu public | `ROBBERY` | Street robbery - women |
| 26 | Autres vols violents sans arme | `ROBBERY` | Other violent theft |
| 27 | Cambriolages de locaux d'habitations principales | `BURGLARY_RESIDENTIAL` | Primary residence |
| 28 | Cambriolages de résidences secondaires | `BURGLARY_RESIDENTIAL` | Secondary residence |
| 29 | Cambriolages de locaux industriels, commerciaux ou financiers | `BURGLARY_COMMERCIAL` | Commercial/industrial |
| 30 | Cambriolages d'autres lieux | `BURGLARY_COMMERCIAL` | Other locations |
| 31 | Vols avec entrée par ruse en tous lieux | `BURGLARY_RESIDENTIAL` | Entry by deception |
| 32 | Vols à la tire | `THEFT_OTHER` | Pickpocketing |
| 33 | Vols à l'étalage | `THEFT_OTHER` | Shoplifting |
| 34 | Vols de véhicules de transport avec fret | `VEHICLE_THEFT` | Transport vehicles |
| 35 | Vols d'automobiles | `VEHICLE_THEFT` | Cars |
| 36 | Vols de véhicules motorisés à 2 roues | `VEHICLE_THEFT` | Motorcycles |
| 37 | Vols à la roulotte | `VEHICLE_THEFT` | Theft from vehicles |
| 38 | Vols d'accessoires sur véhicules à moteur immatriculés | `VEHICLE_THEFT` | Vehicle accessories |
| 39 | Vols simples sur chantier | `THEFT_OTHER` | Construction sites |
| 40 | Vols simples sur exploitations agricoles | `THEFT_OTHER` | Agricultural |
| 41 | Autres vols simples contre des établissements publics ou privés | `THEFT_OTHER` | Public/private premises |
| 42 | Autres vols simples contre des particuliers dans des locaux privés | `THEFT_OTHER` | Private premises |
| 43 | Autres vols simples contre des particuliers dans des locaux ou lieux publics | `THEFT_OTHER` | Public places |
| 44 | Recels | `THEFT_OTHER` | Receiving stolen goods |
| 45 | Proxénétisme | `HUMAN_TRAFFICKING` | Pimping/procuring |
| 46 | Viols sur des majeur(e)s | `SEXUAL_VIOLENCE` | Rape - adults |
| 47 | Viols sur des mineur(e)s | `SEXUAL_VIOLENCE` | Rape - minors |
| 48 | Harcèlements sexuels et autres agressions sexuelles contre des majeur(e)s | `SEXUAL_VIOLENCE` | Harassment - adults |
| 49 | Harcèlements sexuels et autres agressions sexuelles contre des mineur(e)s | `SEXUAL_VIOLENCE` | Harassment - minors |
| 50 | Atteintes sexuelles | `SEXUAL_VIOLENCE` | Sexual assault |
| 51 | Homicides commis contre enfants de moins de 15 ans | `HOMICIDE` | Child homicide |
| 52 | Violences, mauvais traitements et abandons d'enfants | `CHILD_ABUSE` | Abuse/neglect |
| 53 | Délits au sujet de la garde des mineurs | `CHILD_ABUSE` | Custody violations |
| 54 | Non versement de pension alimentaire | `CHILD_ABUSE` | Child support |
| 55 | Trafic et revente sans usage de stupéfiants | `DRUG_TRAFFICKING` | Trafficking only |
| 56 | Usage-revente de stupéfiants | `DRUG_TRAFFICKING` | Use + dealing |
| 57 | Usage de stupéfiants | `DRUG_USE` | Personal use |
| 58 | Autres infractions à la législation sur les stupéfiants | `DRUG_USE` | Other drug offenses |
| 59 | Délits de débits de boissons et ivresse publique | `OTHER` | Alcohol offenses |
| 60 | Fraudes alimentaires et infractions à l'hygiène | `OTHER` | Food fraud/hygiene |
| 61 | Autres délits contre santé publique et réglementation des professions médicales | `OTHER` | Health regulations |
| 62 | Incendies volontaires de biens publics | `ARSON` | Public property |
| 63 | Incendies volontaires de biens privés | `ARSON` | Private property |
| 64 | Attentats à l'explosif contre des biens publics | `ARSON` | Bombings - public |
| 65 | Attentats à l'explosif contre des biens privés | `ARSON` | Bombings - private |
| 66 | Autres destructions et dégradations de biens publics | `VANDALISM` | Public property |
| 67 | Autres destructions et dégradations de biens privés | `VANDALISM` | Private property |
| 68 | Destructions et dégradations de véhicules privés | `VANDALISM` | Vehicles |
| 69 | Infractions aux conditions générales d'entrée et de séjour des étrangers | `OTHER` | Immigration - entry |
| 70 | Aide à l'entrée, à la circulation et au séjour des étrangers | `OTHER` | Immigration - aiding |
| 71 | Autres infractions à la police des étrangers | `OTHER` | Immigration - other |
| 72 | Outrages à dépositaires de l'autorité | `OTHER` | Insulting authority |
| 73 | Violences à dépositaires de l'autorité | `ASSAULT` | Violence to authority |
| 74 | Port ou détention d'armes prohibées | `OTHER` | Weapons possession |
| 75 | Autres atteintes contre l'autorité de l'état | `OTHER` | Offenses vs. state |
| 76 | Destructions, cruautés et autres délits envers les animaux | `OTHER` | Animal cruelty |
| 77 | Atteintes à l'environnement | `OTHER` | Environmental |
| 78 | Chasse et pêche | `OTHER` | Hunting/fishing |
| 79 | Incitation à la haine raciale | `OTHER` | Hate speech |
| 80 | Autres délits | `OTHER` | Miscellaneous |
| 81 | Faux documents d'identité | `FRAUD` | Identity documents |
| 82 | Faux documents concernant la circulation des véhicules | `FRAUD` | Vehicle documents |
| 83 | Autres faux documents administratifs | `FRAUD` | Other admin docs |
| 84 | Faux en écriture publique et authentique | `FRAUD` | Public document forgery |
| 85 | Autres faux en écriture | `FRAUD` | Other forgery |
| 86 | Fausse monnaie | `FRAUD` | Counterfeiting |
| 87 | Contrefaçons et fraudes industrielles et commerciales | `FRAUD` | Commercial fraud |
| 88 | Contrefaçons littéraires et artistiques | `FRAUD` | IP violations |
| 89 | Falsifications et usages de chèques volés | `FRAUD` | Check fraud |
| 90 | Falsifications et usages de cartes de crédit | `FRAUD` | Credit card fraud |
| 91 | Escroqueries et abus de confiance | `FRAUD` | Swindling |
| 92 | Infractions à la législation sur les chèques | `FRAUD` | Check violations |
| 93 | Travail clandestin | `OTHER` | Illegal labor |
| 94 | Emploi d'étranger sans titre de travail | `OTHER` | Illegal employment |
| 95 | Marchandage - prêt de main d'œuvre | `OTHER` | Labor trafficking |
| 96 | Non utilisé | - | Unused |
| 97 | Non utilisé | - | Unused |
| 98 | Banqueroutes, abus de biens sociaux et autres délits de société | `FRAUD` | Corporate crimes |
| 99 | Non utilisé | - | Unused |
| 100 | Non utilisé | - | Unused |
| 101 | Prix illicites, publicité fausse et infractions aux règles de la concurrence | `FRAUD` | Competition violations |
| 102 | Achats et ventes sans factures | `FRAUD` | Invoice fraud |
| 103 | Infractions à l'exercice d'une profession réglementée | `OTHER` | Professional violations |
| 104 | Infractions au droit de l'urbanisme et de la construction | `OTHER` | Construction violations |
| 105 | Pollution, infractions aux règles de sécurité | `OTHER` | Safety violations |
| 106 | Autres délits économiques et financiers | `FRAUD` | Other financial crimes |
| 107 | Autres délits | `OTHER` | Miscellaneous |

---

## Mapping by Canonical Category

### 1. HOMICIDE
**État 4001 Indices**: 01, 02, 03, 51

| Index | French Name |
|-------|-------------|
| 01 | Règlements de compte entre malfaiteurs |
| 02 | Homicides pour voler et à l'occasion de vols |
| 03 | Homicides pour d'autres motifs |
| 51 | Homicides commis contre enfants de moins de 15 ans |

---

### 2. ATTEMPTED_HOMICIDE
**État 4001 Indices**: 04, 05, 06

| Index | French Name |
|-------|-------------|
| 04 | Tentatives d'homicides pour voler |
| 05 | Tentatives homicides pour d'autres motifs |
| 06 | Coups et blessures volontaires suivis de mort |

---

### 3. ASSAULT
**État 4001 Indices**: 07, 11, 12, 13, 73

| Index | French Name |
|-------|-------------|
| 07 | Autres coups et blessures volontaires |
| 11 | Menaces ou chantages pour extorsion de fonds |
| 12 | Menaces ou chantages dans un autre but |
| 13 | Atteintes à la dignité et à la personnalité |
| 73 | Violences à dépositaires de l'autorité |

---

### 4. SEXUAL_VIOLENCE
**État 4001 Indices**: 46, 47, 48, 49, 50

| Index | French Name |
|-------|-------------|
| 46 | Viols sur des majeur(e)s |
| 47 | Viols sur des mineur(e)s |
| 48 | Harcèlements sexuels et autres agressions sexuelles contre des majeur(e)s |
| 49 | Harcèlements sexuels et autres agressions sexuelles contre des mineur(e)s |
| 50 | Atteintes sexuelles |

---

### 5. HUMAN_TRAFFICKING
**État 4001 Indices**: 45

| Index | French Name |
|-------|-------------|
| 45 | Proxénétisme |

---

### 6. KIDNAPPING
**État 4001 Indices**: 08, 09, 10

| Index | French Name |
|-------|-------------|
| 08 | Prises d'otages à l'occasion de vols |
| 09 | Prises d'otages dans un autre but |
| 10 | Séquestrations |

---

### 7. ARMED_ROBBERY
**État 4001 Indices**: 15, 16, 17, 18, 19, 20, 21, 22

| Index | French Name |
|-------|-------------|
| 15 | Vols à main armée contre des établissements financiers |
| 16 | Vols à main armée contre des établissements industriels ou commerciaux |
| 17 | Vols à main armée contre des entreprises de transports de fonds |
| 18 | Vols à main armée contre des particuliers à leur domicile |
| 19 | Autres vols à main armée |
| 20 | Vols avec armes blanches contre des établissements financiers, commerciaux ou industriels |
| 21 | Vols avec armes blanches contre des particuliers à leur domicile |
| 22 | Autres vols avec armes blanches |

---

### 8. ROBBERY
**État 4001 Indices**: 23, 24, 25, 26

| Index | French Name |
|-------|-------------|
| 23 | Vols violents sans arme contre des établissements financiers, commerciaux ou industriels |
| 24 | Vols violents sans arme contre des particuliers à leur domicile |
| 25 | Vols violents sans arme contre des femmes sur voie publique ou autre lieu public |
| 26 | Autres vols violents sans arme |

---

### 9. BURGLARY_RESIDENTIAL
**État 4001 Indices**: 14, 27, 28, 31

| Index | French Name |
|-------|-------------|
| 14 | Violations de domicile |
| 27 | Cambriolages de locaux d'habitations principales |
| 28 | Cambriolages de résidences secondaires |
| 31 | Vols avec entrée par ruse en tous lieux |

**Note**: Index 31 (entry by deception) is mapped here as it primarily occurs at residences and aligns with residential burglary patterns.

---

### 10. BURGLARY_COMMERCIAL
**État 4001 Indices**: 29, 30

| Index | French Name |
|-------|-------------|
| 29 | Cambriolages de locaux industriels, commerciaux ou financiers |
| 30 | Cambriolages d'autres lieux |

---

### 11. VEHICLE_THEFT
**État 4001 Indices**: 34, 35, 36, 37, 38

| Index | French Name |
|-------|-------------|
| 34 | Vols de véhicules de transport avec fret |
| 35 | Vols d'automobiles |
| 36 | Vols de véhicules motorisés à 2 roues |
| 37 | Vols à la roulotte |
| 38 | Vols d'accessoires sur véhicules à moteur immatriculés |

---

### 12. THEFT_OTHER
**État 4001 Indices**: 32, 33, 39, 40, 41, 42, 43, 44

| Index | French Name |
|-------|-------------|
| 32 | Vols à la tire |
| 33 | Vols à l'étalage |
| 39 | Vols simples sur chantier |
| 40 | Vols simples sur exploitations agricoles |
| 41 | Autres vols simples contre des établissements publics ou privés |
| 42 | Autres vols simples contre des particuliers dans des locaux privés |
| 43 | Autres vols simples contre des particuliers dans des locaux ou lieux publics |
| 44 | Recels |

---

### 13. DRUG_TRAFFICKING
**État 4001 Indices**: 55, 56

| Index | French Name |
|-------|-------------|
| 55 | Trafic et revente sans usage de stupéfiants |
| 56 | Usage-revente de stupéfiants |

---

### 14. DRUG_USE
**État 4001 Indices**: 57, 58

| Index | French Name |
|-------|-------------|
| 57 | Usage de stupéfiants |
| 58 | Autres infractions à la législation sur les stupéfiants |

---

### 15. ARSON
**État 4001 Indices**: 62, 63, 64, 65

| Index | French Name |
|-------|-------------|
| 62 | Incendies volontaires de biens publics |
| 63 | Incendies volontaires de biens privés |
| 64 | Attentats à l'explosif contre des biens publics |
| 65 | Attentats à l'explosif contre des biens privés |

---

### 16. VANDALISM
**État 4001 Indices**: 66, 67, 68

| Index | French Name |
|-------|-------------|
| 66 | Autres destructions et dégradations de biens publics |
| 67 | Autres destructions et dégradations de biens privés |
| 68 | Destructions et dégradations de véhicules privés |

---

### 17. FRAUD
**État 4001 Indices**: 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 98, 101, 102, 106

| Index | French Name |
|-------|-------------|
| 81 | Faux documents d'identité |
| 82 | Faux documents concernant la circulation des véhicules |
| 83 | Autres faux documents administratifs |
| 84 | Faux en écriture publique et authentique |
| 85 | Autres faux en écriture |
| 86 | Fausse monnaie |
| 87 | Contrefaçons et fraudes industrielles et commerciales |
| 88 | Contrefaçons littéraires et artistiques |
| 89 | Falsifications et usages de chèques volés |
| 90 | Falsifications et usages de cartes de crédit |
| 91 | Escroqueries et abus de confiance |
| 92 | Infractions à la législation sur les chèques |
| 98 | Banqueroutes, abus de biens sociaux et autres délits de société |
| 101 | Prix illicites, publicité fausse et infractions aux règles de la concurrence |
| 102 | Achats et ventes sans factures |
| 106 | Autres délits économiques et financiers |

---

### 18. CHILD_ABUSE
**État 4001 Indices**: 52, 53, 54

| Index | French Name |
|-------|-------------|
| 52 | Violences, mauvais traitements et abandons d'enfants |
| 53 | Délits au sujet de la garde des mineurs |
| 54 | Non versement de pension alimentaire |

---

### 19. DOMESTIC_VIOLENCE
**État 4001 Indices**: None directly mapped

**Note**: The État 4001 classification (pre-2020) does not have dedicated domestic violence indices. Domestic violence cases are distributed across other categories (primarily ASSAULT index 07). The time series dataset may include domestic violence as a sub-indicator in more recent data.

---

### 20. OTHER
**État 4001 Indices**: 59, 60, 61, 69, 70, 71, 72, 74, 75, 76, 77, 78, 79, 80, 93, 94, 95, 103, 104, 105, 107

| Index | French Name | Subcategory |
|-------|-------------|-------------|
| 59 | Délits de débits de boissons et ivresse publique | Alcohol |
| 60 | Fraudes alimentaires et infractions à l'hygiène | Food safety |
| 61 | Autres délits contre santé publique et réglementation des professions médicales | Health |
| 69 | Infractions aux conditions générales d'entrée et de séjour des étrangers | Immigration |
| 70 | Aide à l'entrée, à la circulation et au séjour des étrangers | Immigration |
| 71 | Autres infractions à la police des étrangers | Immigration |
| 72 | Outrages à dépositaires de l'autorité | Public order |
| 74 | Port ou détention d'armes prohibées | Weapons |
| 75 | Autres atteintes contre l'autorité de l'état | Public order |
| 76 | Destructions, cruautés et autres délits envers les animaux | Animal welfare |
| 77 | Atteintes à l'environnement | Environmental |
| 78 | Chasse et pêche | Environmental |
| 79 | Incitation à la haine raciale | Hate crimes |
| 80 | Autres délits | Miscellaneous |
| 93 | Travail clandestin | Labor |
| 94 | Emploi d'étranger sans titre de travail | Labor |
| 95 | Marchandage - prêt de main d'œuvre | Labor |
| 103 | Infractions à l'exercice d'une profession réglementée | Professional |
| 104 | Infractions au droit de l'urbanisme et de la construction | Construction |
| 105 | Pollution, infractions aux règles de sécurité | Safety |
| 107 | Autres délits | Miscellaneous |

---

### Unused Indices
**État 4001 Indices**: 96, 97, 99, 100

These indices are marked "Non utilisé" (unused) in the État 4001 classification and should be skipped during ETL processing.

---

## Time Series → Canonical Taxonomy

The time series dataset uses aggregated indicators that map to our canonical categories.

| Time Series Indicateur | Canonical Category | Notes |
|------------------------|-------------------|-------|
| Homicides | `HOMICIDE` | Completed homicides only |
| Tentatives d'homicide | `ATTEMPTED_HOMICIDE` | Attempted only |
| Coups et blessures volontaires | `ASSAULT` | May include intrafamily |
| Coups et blessures volontaires intrafamiliaux | `DOMESTIC_VIOLENCE` | If sub-indicator exists |
| Coups et blessures volontaires hors cadre familial | `ASSAULT` | Non-domestic |
| Vols avec violence | `ROBBERY` | Aggregates armed + unarmed |
| Cambriolages et tentatives | `BURGLARY_RESIDENTIAL` + `BURGLARY_COMMERCIAL` | Combined, split by sub-indicator |
| Destructions et dégradations volontaires | `VANDALISM` | Includes vehicle damage |
| Escroqueries et fraudes aux moyens de paiements | `FRAUD` | Payment fraud focus |
| Infractions à la législation sur les stupéfiants | `DRUG_TRAFFICKING` + `DRUG_USE` | Split by sub-indicator |
| Trafic de stupéfiants | `DRUG_TRAFFICKING` | Sub-indicator |
| Usage de stupéfiants | `DRUG_USE` | Sub-indicator |

### Time Series Sub-indicators

When `Sous_indicateur` is populated, use it for more precise mapping:

| Indicateur | Sous_indicateur | Canonical Category |
|------------|-----------------|-------------------|
| Cambriolages et tentatives | Logements (résidences principales et secondaires) | `BURGLARY_RESIDENTIAL` |
| Cambriolages et tentatives | Autres lieux | `BURGLARY_COMMERCIAL` |
| Homicides et tentatives d'homicide | Homicides | `HOMICIDE` |
| Homicides et tentatives d'homicide | Tentatives | `ATTEMPTED_HOMICIDE` |
| Infractions à la législation sur les stupéfiants | Trafic de stupéfiants | `DRUG_TRAFFICKING` |
| Infractions à la législation sur les stupéfiants | Usage de stupéfiants | `DRUG_USE` |

---

## Mapping Statistics

### Coverage Summary

| Canonical Category | État 4001 Indices Count | % of Active Indices |
|--------------------|------------------------|---------------------|
| `HOMICIDE` | 4 | 4.2% |
| `ATTEMPTED_HOMICIDE` | 3 | 3.2% |
| `ASSAULT` | 5 | 5.3% |
| `SEXUAL_VIOLENCE` | 5 | 5.3% |
| `HUMAN_TRAFFICKING` | 1 | 1.1% |
| `KIDNAPPING` | 3 | 3.2% |
| `ARMED_ROBBERY` | 8 | 8.4% |
| `ROBBERY` | 4 | 4.2% |
| `BURGLARY_RESIDENTIAL` | 4 | 4.2% |
| `BURGLARY_COMMERCIAL` | 2 | 2.1% |
| `VEHICLE_THEFT` | 5 | 5.3% |
| `THEFT_OTHER` | 8 | 8.4% |
| `DRUG_TRAFFICKING` | 2 | 2.1% |
| `DRUG_USE` | 2 | 2.1% |
| `ARSON` | 4 | 4.2% |
| `VANDALISM` | 3 | 3.2% |
| `FRAUD` | 16 | 16.8% |
| `CHILD_ABUSE` | 3 | 3.2% |
| `DOMESTIC_VIOLENCE` | 0 | 0% |
| `OTHER` | 21 | 22.1% |
| **Total mapped** | **95** | **100%** |
| Unused indices | 4 | - |

---

## ETL Implementation

### Mapping Lookup Table

For ETL implementation, use this lookup structure:

```typescript
// TypeScript mapping object for ETL
export const ETAT_4001_MAPPING: Record<number, string> = {
  1: 'HOMICIDE',
  2: 'HOMICIDE',
  3: 'HOMICIDE',
  4: 'ATTEMPTED_HOMICIDE',
  5: 'ATTEMPTED_HOMICIDE',
  6: 'ATTEMPTED_HOMICIDE',
  7: 'ASSAULT',
  8: 'KIDNAPPING',
  9: 'KIDNAPPING',
  10: 'KIDNAPPING',
  11: 'ASSAULT',
  12: 'ASSAULT',
  13: 'ASSAULT',
  14: 'BURGLARY_RESIDENTIAL',
  15: 'ARMED_ROBBERY',
  16: 'ARMED_ROBBERY',
  17: 'ARMED_ROBBERY',
  18: 'ARMED_ROBBERY',
  19: 'ARMED_ROBBERY',
  20: 'ARMED_ROBBERY',
  21: 'ARMED_ROBBERY',
  22: 'ARMED_ROBBERY',
  23: 'ROBBERY',
  24: 'ROBBERY',
  25: 'ROBBERY',
  26: 'ROBBERY',
  27: 'BURGLARY_RESIDENTIAL',
  28: 'BURGLARY_RESIDENTIAL',
  29: 'BURGLARY_COMMERCIAL',
  30: 'BURGLARY_COMMERCIAL',
  31: 'BURGLARY_RESIDENTIAL',
  32: 'THEFT_OTHER',
  33: 'THEFT_OTHER',
  34: 'VEHICLE_THEFT',
  35: 'VEHICLE_THEFT',
  36: 'VEHICLE_THEFT',
  37: 'VEHICLE_THEFT',
  38: 'VEHICLE_THEFT',
  39: 'THEFT_OTHER',
  40: 'THEFT_OTHER',
  41: 'THEFT_OTHER',
  42: 'THEFT_OTHER',
  43: 'THEFT_OTHER',
  44: 'THEFT_OTHER',
  45: 'HUMAN_TRAFFICKING',
  46: 'SEXUAL_VIOLENCE',
  47: 'SEXUAL_VIOLENCE',
  48: 'SEXUAL_VIOLENCE',
  49: 'SEXUAL_VIOLENCE',
  50: 'SEXUAL_VIOLENCE',
  51: 'HOMICIDE',
  52: 'CHILD_ABUSE',
  53: 'CHILD_ABUSE',
  54: 'CHILD_ABUSE',
  55: 'DRUG_TRAFFICKING',
  56: 'DRUG_TRAFFICKING',
  57: 'DRUG_USE',
  58: 'DRUG_USE',
  59: 'OTHER',
  60: 'OTHER',
  61: 'OTHER',
  62: 'ARSON',
  63: 'ARSON',
  64: 'ARSON',
  65: 'ARSON',
  66: 'VANDALISM',
  67: 'VANDALISM',
  68: 'VANDALISM',
  69: 'OTHER',
  70: 'OTHER',
  71: 'OTHER',
  72: 'OTHER',
  73: 'ASSAULT',
  74: 'OTHER',
  75: 'OTHER',
  76: 'OTHER',
  77: 'OTHER',
  78: 'OTHER',
  79: 'OTHER',
  80: 'OTHER',
  81: 'FRAUD',
  82: 'FRAUD',
  83: 'FRAUD',
  84: 'FRAUD',
  85: 'FRAUD',
  86: 'FRAUD',
  87: 'FRAUD',
  88: 'FRAUD',
  89: 'FRAUD',
  90: 'FRAUD',
  91: 'FRAUD',
  92: 'FRAUD',
  93: 'OTHER',
  94: 'OTHER',
  95: 'OTHER',
  // 96, 97 unused
  98: 'FRAUD',
  // 99, 100 unused
  101: 'FRAUD',
  102: 'FRAUD',
  103: 'OTHER',
  104: 'OTHER',
  105: 'OTHER',
  106: 'FRAUD',
  107: 'OTHER',
};

// Skip these indices during ETL (unused)
export const UNUSED_INDICES = [96, 97, 99, 100];
```

### Time Series Mapping

```typescript
// Time series indicator mapping
export const TIME_SERIES_MAPPING: Record<string, string | ((subIndicator: string) => string)> = {
  'Homicides': 'HOMICIDE',
  'Tentatives d\'homicide': 'ATTEMPTED_HOMICIDE',
  'Homicides et tentatives d\'homicide': (sub) => 
    sub === 'Homicides' ? 'HOMICIDE' : 'ATTEMPTED_HOMICIDE',
  'Coups et blessures volontaires': (sub) =>
    sub?.includes('intrafamili') ? 'DOMESTIC_VIOLENCE' : 'ASSAULT',
  'Vols avec violence': 'ROBBERY', // Aggregated
  'Cambriolages et tentatives': (sub) =>
    sub?.includes('Logements') ? 'BURGLARY_RESIDENTIAL' : 'BURGLARY_COMMERCIAL',
  'Destructions et dégradations volontaires': 'VANDALISM',
  'Escroqueries et fraudes aux moyens de paiements': 'FRAUD',
  'Infractions à la législation sur les stupéfiants': (sub) =>
    sub?.includes('Trafic') ? 'DRUG_TRAFFICKING' : 'DRUG_USE',
};
```

---

## Design Decisions

### Mapping Rationale

| Decision | Rationale |
|----------|-----------|
| Index 06 → ATTEMPTED_HOMICIDE | "Assault resulting in death" implies intent to harm but not kill, distinct from premeditated murder |
| Index 14 → BURGLARY_RESIDENTIAL | Home invasion is functionally similar to burglary for residential analysis |
| Indices 20-22 → ARMED_ROBBERY | Knife robberies are armed robberies (bladed weapon = arm) |
| Index 31 → BURGLARY_RESIDENTIAL | Entry by deception typically targets homes (elderly victims) |
| Index 51 → HOMICIDE | Child homicide is still homicide, not child abuse |
| Index 73 → ASSAULT | Violence against authority is still assault |
| Immigration indices → OTHER | Policy-specific, not core crime analytics focus |
| Labor indices → OTHER | Economic/regulatory, not core crime |
| DOMESTIC_VIOLENCE has no direct mapping | Historical data limitation; may improve with newer datasets |

### Aggregation Strategy

When multiple État 4001 indices map to one canonical category, the ETL should:
1. Sum the counts for each département
2. Store the aggregated value under the canonical category
3. Optionally preserve source breakdown in metadata for drill-down

---

## Validation Checklist

- [x] All 95 active État 4001 indices are mapped
- [x] All 20 canonical categories have at least one mapping (except DOMESTIC_VIOLENCE)
- [x] Unused indices (96, 97, 99, 100) are documented
- [x] Time series indicators are mapped with sub-indicator handling
- [x] ETL implementation code provided
- [x] Design decisions documented

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial complete mapping of 107 État 4001 indices to 20 canonical categories |

