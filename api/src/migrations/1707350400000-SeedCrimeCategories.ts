import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Seed canonical crime categories
 *
 * This migration populates the crime_categories table with the 20 canonical
 * crime categories defined in the BeWhere taxonomy (docs/CRIME_TAXONOMY.md).
 *
 * The taxonomy is designed to:
 * - Aggregate granular source categories into analyst-friendly groups
 * - Enable meaningful cross-dataset comparisons
 * - Balance specificity with usability (20 categories)
 * - Align with international standards (UNODC ICCS, Eurostat, FBI UCR)
 *
 * @see docs/CRIME_TAXONOMY.md for full category definitions
 */
export class SeedCrimeCategories1707350400000 implements MigrationInterface {
  name = 'SeedCrimeCategories1707350400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert all 20 canonical crime categories
    await queryRunner.query(`
      INSERT INTO "crime_categories" (
        "code", 
        "name", 
        "nameFr", 
        "description", 
        "severity", 
        "categoryGroup", 
        "sortOrder", 
        "isActive"
      ) VALUES
      -- Violent Crimes (Critical/High Severity)
      (
        'HOMICIDE',
        'Homicide',
        'Homicide',
        'Intentional killing including criminal settlements. Includes murder (premeditated), manslaughter during criminal activity, and homicides of children under 15.',
        'critical',
        'violent_crimes',
        1,
        true
      ),
      (
        'ATTEMPTED_HOMICIDE',
        'Attempted Homicide',
        'Tentative d''homicide',
        'Failed attempts to kill and assaults resulting in death. Includes attempted murder during robbery and assault/battery resulting in death.',
        'critical',
        'violent_crimes',
        2,
        true
      ),
      (
        'ASSAULT',
        'Assault',
        'Coups et blessures',
        'Intentional physical violence not resulting in death. Includes battery, bodily harm, aggravated assault, violence against authority figures, threats with violence.',
        'high',
        'violent_crimes',
        3,
        true
      ),
      (
        'SEXUAL_VIOLENCE',
        'Sexual Violence',
        'Violences sexuelles',
        'Sexual offenses including rape, sexual assault, and harassment. Covers adults and minors, and other sexual assault (atteintes sexuelles).',
        'critical',
        'violent_crimes',
        4,
        true
      ),
      (
        'HUMAN_TRAFFICKING',
        'Human Trafficking',
        'Traite des êtres humains',
        'Exploitation of persons for commercial sex or labor. Includes pimping, procuring (proxénétisme), forced labor, and modern slavery.',
        'critical',
        'violent_crimes',
        5,
        true
      ),
      (
        'KIDNAPPING',
        'Kidnapping',
        'Enlèvement et séquestration',
        'Unlawful restriction of freedom of movement. Includes hostage-taking, unlawful detention, sequestration, and home invasion with detention.',
        'critical',
        'violent_crimes',
        6,
        true
      ),
      (
        'ARMED_ROBBERY',
        'Armed Robbery',
        'Vol à main armée',
        'Theft using or threatening use of firearms or bladed weapons. Includes armed robbery of banks, commercial establishments, cash-in-transit, and private homes.',
        'high',
        'violent_crimes',
        7,
        true
      ),
      (
        'ROBBERY',
        'Robbery',
        'Vol avec violence',
        'Theft involving violence or threat of violence, without weapons. Includes mugging, street robbery, and purse snatching with force.',
        'high',
        'violent_crimes',
        8,
        true
      ),
      
      -- Property Crimes (Medium/Low Severity)
      (
        'BURGLARY_RESIDENTIAL',
        'Residential Burglary',
        'Cambriolage de résidence',
        'Unlawful entry into private homes with intent to commit crime. Includes burglary of primary and secondary residences, attempted burglary, and theft by deception.',
        'medium',
        'property_crimes',
        9,
        true
      ),
      (
        'BURGLARY_COMMERCIAL',
        'Commercial Burglary',
        'Cambriolage commercial',
        'Unlawful entry into business or non-residential premises with intent to commit crime. Includes burglary of industrial, commercial, and public buildings.',
        'medium',
        'property_crimes',
        10,
        true
      ),
      (
        'VEHICLE_THEFT',
        'Vehicle Theft',
        'Vol de véhicule',
        'Theft of motor vehicles and other transport. Includes theft of automobiles, motorcycles, mopeds/scooters, bicycles, and theft from vehicles.',
        'medium',
        'property_crimes',
        11,
        true
      ),
      (
        'THEFT_OTHER',
        'Other Theft',
        'Autres vols',
        'Non-violent theft not covered by other categories. Includes pickpocketing (vol à la tire), shoplifting, simple theft, and receiving stolen goods (recel).',
        'low',
        'property_crimes',
        12,
        true
      ),
      (
        'ARSON',
        'Arson',
        'Incendie volontaire',
        'Intentional fires and bombings. Includes arson of buildings, vehicles, and other property destruction by fire or explosives.',
        'high',
        'property_crimes',
        13,
        true
      ),
      (
        'VANDALISM',
        'Vandalism',
        'Vandalisme',
        'Property destruction not involving fire. Includes graffiti, vehicle damage, and intentional destruction of public or private property.',
        'low',
        'property_crimes',
        14,
        true
      ),
      (
        'FRAUD',
        'Fraud',
        'Escroquerie',
        'Deceptive practices for financial gain. Includes swindling, check fraud, credit card fraud, identity fraud, and false pretenses.',
        'medium',
        'property_crimes',
        15,
        true
      ),
      
      -- Drug Offenses
      (
        'DRUG_TRAFFICKING',
        'Drug Trafficking',
        'Trafic de stupéfiants',
        'Supply-side drug offenses including dealing and trafficking. Includes manufacturing, distribution, and sale of controlled substances.',
        'high',
        'drug_offenses',
        16,
        true
      ),
      (
        'DRUG_USE',
        'Drug Use',
        'Usage de stupéfiants',
        'Personal drug use and possession for personal use. Demand-side offenses without intent to distribute.',
        'low',
        'drug_offenses',
        17,
        true
      ),
      
      -- Other Offenses
      (
        'CHILD_ABUSE',
        'Child Abuse',
        'Maltraitance d''enfants',
        'Violence against children, neglect, and custody violations. Includes physical abuse, neglect, and non-representation of minor children.',
        'critical',
        'other_offenses',
        18,
        true
      ),
      (
        'DOMESTIC_VIOLENCE',
        'Domestic Violence',
        'Violences intrafamiliales',
        'Intrafamily violence when identifiable in source data. May overlap with assault categories in historical data.',
        'high',
        'other_offenses',
        19,
        true
      ),
      (
        'OTHER',
        'Other',
        'Autres',
        'Miscellaneous offenses not fitting other categories. Catch-all for uncommon or unclassifiable offenses.',
        'low',
        'other_offenses',
        20,
        true
      )
    `);

    // Log the seeded categories count
    const result = await queryRunner.query(
      `SELECT COUNT(*) as count FROM "crime_categories"`
    );
    console.log(`Seeded ${result[0].count} canonical crime categories`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete all seeded categories
    // Note: This will fail if there are FK references (crime_observations, category_mappings)
    // In that case, those tables must be cleared first
    await queryRunner.query(`
      DELETE FROM "crime_categories" 
      WHERE "code" IN (
        'HOMICIDE',
        'ATTEMPTED_HOMICIDE',
        'ASSAULT',
        'SEXUAL_VIOLENCE',
        'HUMAN_TRAFFICKING',
        'KIDNAPPING',
        'ARMED_ROBBERY',
        'ROBBERY',
        'BURGLARY_RESIDENTIAL',
        'BURGLARY_COMMERCIAL',
        'VEHICLE_THEFT',
        'THEFT_OTHER',
        'ARSON',
        'VANDALISM',
        'FRAUD',
        'DRUG_TRAFFICKING',
        'DRUG_USE',
        'CHILD_ABUSE',
        'DOMESTIC_VIOLENCE',
        'OTHER'
      )
    `);
  }
}
