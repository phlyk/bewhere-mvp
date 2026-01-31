# Canonical Crime Category Taxonomy

> Task 0.1: Define canonical crime category taxonomy (15-20 categories)

This document defines the canonical crime categories used throughout BeWhere MVP. The taxonomy is designed to:
- Aggregate granular source categories into analyst-friendly groups
- Enable meaningful cross-dataset comparisons
- Balance specificity with usability (15-20 categories)

---

## Taxonomy Overview

| ID | Canonical Category | Description | Severity |
|----|-------------------|-------------|----------|
| 1 | `HOMICIDE` | Intentional killing including criminal settlements | Critical |
| 2 | `ATTEMPTED_HOMICIDE` | Attempted murder, assault resulting in death | Critical |
| 3 | `ASSAULT` | Intentional physical violence not resulting in death | High |
| 4 | `SEXUAL_VIOLENCE` | Rape, sexual assault, sexual harassment | Critical |
| 5 | `HUMAN_TRAFFICKING` | Pimping, procuring, exploitation | Critical |
| 6 | `KIDNAPPING` | Hostage-taking, unlawful detention, sequestration | Critical |
| 7 | `ARMED_ROBBERY` | Robbery with firearms or bladed weapons | High |
| 8 | `ROBBERY` | Violent theft without weapons, mugging | High |
| 9 | `BURGLARY_RESIDENTIAL` | Break-ins at homes (primary + secondary residences) | Medium |
| 10 | `BURGLARY_COMMERCIAL` | Break-ins at businesses, industrial sites, other locations | Medium |
| 11 | `VEHICLE_THEFT` | Theft of cars, motorcycles, mopeds, bicycles | Medium |
| 12 | `THEFT_OTHER` | Pickpocketing, shoplifting, simple theft, receiving stolen goods | Low |
| 13 | `DRUG_TRAFFICKING` | Drug dealing, trafficking, supply offenses | High |
| 14 | `DRUG_USE` | Personal drug use, possession for personal use | Low |
| 15 | `ARSON` | Intentional fires, bombings | High |
| 16 | `VANDALISM` | Property destruction, graffiti, vehicle damage | Low |
| 17 | `FRAUD` | Swindling, check fraud, credit card fraud, identity fraud | Medium |
| 18 | `CHILD_ABUSE` | Violence against children, neglect, custody violations | Critical |
| 19 | `DOMESTIC_VIOLENCE` | Intrafamily violence (when identifiable) | High |
| 20 | `OTHER` | Miscellaneous offenses not fitting other categories | Low |

---

## Category Definitions

### 1. HOMICIDE
**Definition**: Intentional killing of another person, including premeditated murder, manslaughter during criminal activity, and criminal settlements between offenders.

**Includes**:
- Murder (premeditated)
- Manslaughter during robbery or other crimes
- Criminal settlements ("règlements de compte")
- Homicides of children under 15

**Excludes**:
- Accidental deaths
- Negligent homicide (unless during crime)

**Severity**: Critical

---

### 2. ATTEMPTED_HOMICIDE
**Definition**: Failed attempts to kill, and assaults so severe they result in the victim's death (but were not premeditated as murder).

**Includes**:
- Attempted murder during robbery
- Attempted murder for other motives
- Assault and battery resulting in death

**Excludes**:
- Successful homicides (→ HOMICIDE)
- Aggravated assault without death (→ ASSAULT)

**Severity**: Critical

---

### 3. ASSAULT
**Definition**: Intentional physical violence against persons not resulting in death.

**Includes**:
- Battery and bodily harm
- Aggravated assault
- Violence against authority figures
- Threats and blackmail with violence

**Excludes**:
- Sexual violence (→ SEXUAL_VIOLENCE)
- Violence against children (→ CHILD_ABUSE)
- Domestic violence (→ DOMESTIC_VIOLENCE when identifiable)
- Assault resulting in death (→ ATTEMPTED_HOMICIDE)

**Severity**: High

---

### 4. SEXUAL_VIOLENCE
**Definition**: Sexual offenses including rape, sexual assault, and harassment.

**Includes**:
- Rape of adults
- Rape of minors
- Sexual harassment of adults
- Sexual harassment of minors
- Other sexual assault ("atteintes sexuelles")

**Excludes**:
- Human trafficking/pimping (→ HUMAN_TRAFFICKING)

**Severity**: Critical

---

### 5. HUMAN_TRAFFICKING
**Definition**: Exploitation of persons for commercial sex or labor.

**Includes**:
- Pimping and procuring ("proxénétisme")
- Forced labor
- Modern slavery

**Excludes**:
- Immigration violations (→ OTHER)
- Rape/sexual assault (→ SEXUAL_VIOLENCE)

**Severity**: Critical

---

### 6. KIDNAPPING
**Definition**: Unlawful restriction of a person's freedom of movement.

**Includes**:
- Hostage-taking during robbery
- Hostage-taking for other purposes
- Unlawful detention/sequestration
- Home invasion with detention

**Excludes**:
- Brief restraint during robbery (→ ROBBERY)
- Custody violations (→ CHILD_ABUSE)

**Severity**: Critical

---

### 7. ARMED_ROBBERY
**Definition**: Theft using or threatening use of firearms or bladed weapons.

**Includes**:
- Armed robbery of banks and financial institutions
- Armed robbery of commercial establishments
- Armed robbery of cash-in-transit
- Armed robbery of private homes
- Other armed robbery
- Robbery with knives/bladed weapons

**Excludes**:
- Violent theft without weapons (→ ROBBERY)

**Severity**: High

---

### 8. ROBBERY
**Definition**: Theft involving violence or threat of violence, without weapons.

**Includes**:
- Violent theft without weapons (various subtypes)
- Mugging
- Street robbery
- Purse snatching with force

**Excludes**:
- Armed robbery (→ ARMED_ROBBERY)
- Pickpocketing without violence (→ THEFT_OTHER)
- Burglary (→ BURGLARY_*)

**Severity**: High

---

### 9. BURGLARY_RESIDENTIAL
**Definition**: Unlawful entry into private homes with intent to commit crime.

**Includes**:
- Burglary of primary residences
- Burglary of secondary residences (vacation homes)
- Attempted burglary of residences
- Theft by deception at residences (entry by ruse)

**Excludes**:
- Commercial burglary (→ BURGLARY_COMMERCIAL)
- Home invasion with violence (→ ROBBERY or KIDNAPPING)

**Severity**: Medium

---

### 10. BURGLARY_COMMERCIAL
**Definition**: Unlawful entry into business or non-residential premises with intent to commit crime.

**Includes**:
- Burglary of industrial premises
- Burglary of commercial establishments
- Burglary of other locations (public buildings, etc.)

**Excludes**:
- Residential burglary (→ BURGLARY_RESIDENTIAL)
- Armed robbery of businesses (→ ARMED_ROBBERY)

**Severity**: Medium

---

### 11. VEHICLE_THEFT
**Definition**: Theft of motor vehicles and other transport.

**Includes**:
- Theft of automobiles
- Theft of two-wheeled motor vehicles (motorcycles)
- Theft of mopeds/scooters
- Theft of bicycles
- Theft from vehicles

**Excludes**:
- Vehicle vandalism (→ VANDALISM)
- Carjacking with violence (→ ROBBERY or ARMED_ROBBERY)

**Severity**: Medium

---

### 12. THEFT_OTHER
**Definition**: Non-violent theft not covered by other categories.

**Includes**:
- Pickpocketing ("vol à la tire")
- Shoplifting
- Simple theft (various locations)
- Receiving stolen goods ("recel")

**Excludes**:
- Vehicle theft (→ VEHICLE_THEFT)
- Burglary (→ BURGLARY_*)
- Robbery (→ ROBBERY, ARMED_ROBBERY)
- Fraud (→ FRAUD)

**Severity**: Low

---

### 13. DRUG_TRAFFICKING
**Definition**: Supply-side drug offenses including dealing and trafficking.

**Includes**:
- Drug trafficking without personal use
- Drug dealing with personal use
- Large-scale distribution

**Excludes**:
- Personal drug use only (→ DRUG_USE)

**Severity**: High

---

### 14. DRUG_USE
**Definition**: Drug offenses related to personal consumption.

**Includes**:
- Drug use (personal)
- Simple possession
- Other drug legislation violations (minor)

**Excludes**:
- Trafficking (→ DRUG_TRAFFICKING)
- Dealing (→ DRUG_TRAFFICKING)

**Severity**: Low

---

### 15. ARSON
**Definition**: Intentional destruction of property by fire or explosives.

**Includes**:
- Arson of public property
- Arson of private property
- Bombings (explosive attacks)

**Excludes**:
- Accidental fires
- Vehicle fires (→ VANDALISM unless targeted arson)

**Severity**: High

---

### 16. VANDALISM
**Definition**: Intentional destruction or damage to property without fire.

**Includes**:
- Destruction of public property
- Destruction of private property
- Vehicle damage/destruction
- Graffiti

**Excludes**:
- Arson (→ ARSON)
- Destruction during burglary (→ BURGLARY_*)

**Severity**: Low

---

### 17. FRAUD
**Definition**: Financial crimes involving deception for gain.

**Includes**:
- Swindling/scams ("escroqueries")
- Check fraud (issuing, falsifying)
- Credit card fraud
- Identity fraud (document forgery)
- Vehicle registration fraud
- Administrative document fraud

**Excludes**:
- Theft (→ THEFT_OTHER)
- Embezzlement by employees (→ OTHER)
- Tax fraud (typically not in crime stats)

**Severity**: Medium

---

### 18. CHILD_ABUSE
**Definition**: Crimes specifically targeting children and minors.

**Includes**:
- Violence against children
- Child maltreatment and neglect
- Custody violations ("délits garde des mineurs")
- Non-payment of child support
- Child abandonment

**Excludes**:
- Sexual violence against minors (→ SEXUAL_VIOLENCE)
- Homicide of children (→ HOMICIDE)

**Severity**: Critical

---

### 19. DOMESTIC_VIOLENCE
**Definition**: Violence occurring within family or intimate partner relationships.

**Includes**:
- Intimate partner violence
- Intrafamily violence

**Note**: This category may have limited data in État 4001 as it was not originally tracked as a separate index. Time series data (post-2020) may include specific domestic violence indicators.

**Severity**: High

---

### 20. OTHER
**Definition**: Offenses not fitting other canonical categories.

**Includes**:
- Immigration violations
- Public order offenses
- Weapons violations (not used in other crimes)
- Labor law violations
- Economic/financial crimes not classified as fraud
- Miscellaneous offenses

**Excludes**:
- Anything fitting specific categories above

**Severity**: Low

---

## Category Hierarchy

```
VIOLENT CRIMES
├── HOMICIDE (Critical)
├── ATTEMPTED_HOMICIDE (Critical)
├── ASSAULT (High)
├── SEXUAL_VIOLENCE (Critical)
├── HUMAN_TRAFFICKING (Critical)
├── KIDNAPPING (Critical)
├── DOMESTIC_VIOLENCE (High)
└── CHILD_ABUSE (Critical)

PROPERTY CRIMES - THEFT
├── ARMED_ROBBERY (High)
├── ROBBERY (High)
├── BURGLARY_RESIDENTIAL (Medium)
├── BURGLARY_COMMERCIAL (Medium)
├── VEHICLE_THEFT (Medium)
└── THEFT_OTHER (Low)

PROPERTY CRIMES - DESTRUCTION
├── ARSON (High)
└── VANDALISM (Low)

DRUG OFFENSES
├── DRUG_TRAFFICKING (High)
└── DRUG_USE (Low)

FINANCIAL CRIMES
└── FRAUD (Medium)

OTHER
└── OTHER (Low)
```

---

## Severity Levels

| Level | Description | Example Categories |
|-------|-------------|-------------------|
| **Critical** | Life-threatening or causing severe trauma | HOMICIDE, SEXUAL_VIOLENCE, KIDNAPPING |
| **High** | Serious harm to persons or significant criminal enterprise | ASSAULT, ARMED_ROBBERY, DRUG_TRAFFICKING |
| **Medium** | Property crimes with significant impact | BURGLARY_*, VEHICLE_THEFT, FRAUD |
| **Low** | Minor offenses or victimless crimes | THEFT_OTHER, VANDALISM, DRUG_USE |

---

## Design Rationale

### Why 20 Categories?

The taxonomy balances:
1. **Granularity**: Enough detail for meaningful analysis (e.g., separating residential vs. commercial burglary)
2. **Simplicity**: Few enough categories to be comprehensible at a glance
3. **Mappability**: Categories that align with French (État 4001) source classifications
4. **Extensibility**: Structure allows adding more countries later without redesign

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate HOMICIDE from ATTEMPTED_HOMICIDE | Different legal/social implications; allows trend analysis |
| Split burglary into RESIDENTIAL/COMMERCIAL | Critical distinction for urban planning and policy |
| Separate DRUG_TRAFFICKING from DRUG_USE | Supply-side vs. demand-side policy implications differ |
| Include DOMESTIC_VIOLENCE | Growing policy focus, even if historical data is limited |
| Include CHILD_ABUSE as separate category | Distinct victim population with specific policy responses |
| HUMAN_TRAFFICKING separate from SEXUAL_VIOLENCE | Distinct crime type focused on exploitation/commerce |
| Catch-all OTHER category | Ensures completeness; no data is lost in mapping |

### Alignment with International Standards

This taxonomy is informed by:
- UN Office on Drugs and Crime (UNODC) International Classification of Crime for Statistical Purposes (ICCS)
- Eurostat crime categories
- FBI Uniform Crime Reporting (UCR) categories

---

## Usage in BeWhere

### Database Schema
```sql
CREATE TABLE crime_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,  -- e.g., 'HOMICIDE'
    name VARCHAR(100) NOT NULL,         -- e.g., 'Homicide'
    description TEXT,
    severity VARCHAR(20),               -- 'Critical', 'High', 'Medium', 'Low'
    parent_group VARCHAR(50),           -- e.g., 'VIOLENT_CRIMES'
    display_order INTEGER
);
```

### API Response Example
```json
{
  "categories": [
    {
      "id": 1,
      "code": "HOMICIDE",
      "name": "Homicide",
      "severity": "Critical",
      "parentGroup": "VIOLENT_CRIMES"
    }
  ]
}
```

### Frontend Display
Categories should be displayed:
- Grouped by parent_group in selectors
- Color-coded by severity in visualizations
- Sorted by display_order for consistent UX

---

## Mapping Reference

See [CATEGORY_MAPPINGS.md](CATEGORY_MAPPINGS.md) (Task 0.2) for detailed mappings from:
- French État 4001 indices → Canonical categories
- French Time Series indicators → Canonical categories

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial taxonomy with 20 categories |
