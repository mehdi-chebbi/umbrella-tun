/* ─── Soil Organic Carbon Data (Carbone organique du sol) ─── */

/* ─── 1. Évolution de la dégradation du SOC entre 2001 et 2015 ─── */
export const degradationSOC2001to2015 = {
  ameliore: { superficie: 392.63, pourcentage: 0.25 },
  stable: { superficie: 152710.23, pourcentage: 98.07 },
  degrade: { superficie: 2524.84, pourcentage: 1.62 },
  absenceDonnees: { superficie: 84.82, pourcentage: 0.05 },
  totale: { superficie: 155712.50, pourcentage: 100.00 },
  remarque: 'Des améliorations sont observées au niveau des terres arborées (12%) et des zones humides (37%), alors que les régressions sont enregistrées au niveau des prairies (28 %).',
  remarqueGenerale: 'Durant la période 2001-15, 98 % des terres sont caractérisées par une stabilité du carbone organique du sol. Les améliorations ne représentent que 0,25% alors que les dégradations atteignent 1,6% marquant un bilan négatif.',
};

/* ─── 2. Changement dans le SOC entre 2001 et 2015 (tonnes / ha) ─── */
export const changementSOC2001to2015 = [
  {
    categorie: 'Couvert d\u2019arbres',
    soc2001: 85.16,
    soc2015: 86.08,
    superficie2001: 3571,
    superficie2015: 3943,
    socTotal2001: 30413797,
    socTotal2015: 33941549,
    changement: 3527752.08,
    changementPct: 12,
  },
  {
    categorie: 'Prairie',
    soc2001: 24.51,
    soc2015: 21.62,
    superficie2001: 17474,
    superficie2015: 14318,
    socTotal2001: 42826963,
    socTotal2015: 30956085,
    changement: -11870878.03,
    changementPct: -28,
  },
  {
    categorie: 'Terres cultivées',
    soc2001: 44.03,
    soc2015: 43.32,
    superficie2001: 44644,
    superficie2015: 46890,
    socTotal2001: 196555478,
    socTotal2015: 203130638,
    changement: 6575160.49,
    changementPct: 3,
  },
  {
    categorie: 'Zone humide',
    soc2001: 78.27,
    soc2015: 87.87,
    superficie2001: 4,
    superficie2015: 5,
    socTotal2001: 33104,
    socTotal2015: 45293,
    changement: 12188.97,
    changementPct: 37,
  },
  {
    categorie: 'Zone artificialisée',
    soc2001: 41.99,
    soc2015: 37.83,
    superficie2001: 842,
    superficie2015: 1088,
    socTotal2001: 3537298,
    socTotal2015: 4116149,
    changement: 578850.27,
    changementPct: 16,
  },
  {
    categorie: 'Sol nu',
    soc2001: 16.56,
    soc2015: 16.45,
    superficie2001: 89177,
    superficie2015: 89475,
    socTotal2001: 147661316,
    socTotal2015: 147229178,
    changement: -432137.96,
    changementPct: 0,
  },
];

export const changementSOC2001to2015Total = {
  superficie2001: 155712.53,
  superficie2015: 155718.95,
  socTotal2001: 421027957.29,
  socTotal2015: 419418893.11,
  changement: -1609064.18,
};

/* ─── 3. Changement dans le SOC entre 2001 et 2015 selon le type de couverture (tonnes / ha) ─── */
export const changementSOCCouverture2001to2015 = {
  rowLabels: [
    'Couverture en arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
  ],
  colLabels: [
    'Couverture en arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
  ],
  /** rows = 2001, cols = 2015 */
  matrix: [
    [0.00, 0.00, -0.01, 0.00, -0.23, -0.10],
    [0.00, 0.00, -0.03, 0.00, -0.25, -0.48],
    [0.10, 0.16, 0.00, 0.16, -0.36, -0.55],
    [0.00, 0.00, 0.00, 0.02, 0.00, 0.00],
    [0.00, 0.00, 0.00, 0.00, -0.02, 0.00],
    [0.39, 0.40, 0.29, 0.43, 0.00, 0.00],
  ],
  rowTotals: [-0.38, -0.83, -0.48, 0.02, -0.02, 1.50],
  colTotals: [0.49, 0.56, 0.13, 0.67, -0.86, -1.13],
  grandTotal: -0.20,
};

/* ─── 4. Évolution de la dégradation du SOC entre 2016 et 2019 ─── */
export const degradationSOC2016to2019 = {
  ameliore: { superficie: 816.67, pourcentage: 0.52 },
  stable: { superficie: 153729.01, pourcentage: 98.72 },
  degrade: { superficie: 1089.52, pourcentage: 0.70 },
  absenceDonnees: { superficie: 83.63, pourcentage: 0.05 },
  totale: { superficie: 155718.80, pourcentage: 100.00 },
  remarque: 'Des améliorations sont observées au niveau des terres arborées (1 %) et des zones humides (2 %), alors que les régressions sont enregistrées au niveau des prairies (3%).',
  remarqueGenerale: 'Durant cette période, 98,7 % des terres sont caractérisées par une stabilité du carbone organique du sol. Les améliorations ne représentent que 0,5% alors que les dégradations atteignent 0,7 %, marquant un bilan presque neutre.',
};

/* ─── 5. Changement dans le SOC entre 2016 et 2019 (tonnes / ha) ─── */
export const changementSOC2016to2019 = [
  {
    categorie: 'Couvert d\u2019arbres',
    soc2016: 86.13,
    soc2019: 86.35,
    superficie2016: 3955,
    superficie2019: 3987,
    socTotal2016: 34066562,
    socTotal2019: 34426912,
    changement: 360350.13,
    changementPct: 1,
  },
  {
    categorie: 'Prairie',
    soc2016: 21.35,
    soc2019: 20.59,
    superficie2016: 14663,
    superficie2019: 15715,
    socTotal2016: 31309084,
    socTotal2019: 32362862,
    changement: 1053777.72,
    changementPct: 3,
  },
  {
    categorie: 'Terres cultivées',
    soc2016: 43.29,
    soc2019: 43.19,
    superficie2016: 46865,
    superficie2019: 46756,
    socTotal2016: 202873492,
    socTotal2019: 201917568,
    changement: -955923.13,
    changementPct: 0,
  },
  {
    categorie: 'Zone humide',
    soc2016: 88.60,
    soc2019: 92.95,
    superficie2016: 5,
    superficie2019: 5,
    socTotal2016: 45670,
    socTotal2019: 46768,
    changement: 1098.29,
    changementPct: 2,
  },
  {
    categorie: 'Zone artificialisée',
    soc2016: 37.49,
    soc2019: 36.19,
    superficie2016: 1088,
    superficie2019: 1239,
    socTotal2016: 4079210,
    socTotal2019: 4482732,
    changement: 403521.65,
    changementPct: 10,
  },
  {
    categorie: 'Sol nu',
    soc2016: 16.48,
    soc2019: 16.55,
    superficie2016: 89142,
    superficie2019: 88016,
    socTotal2016: 146904833,
    socTotal2019: 145654831,
    changement: -1250001.46,
    changementPct: -1,
  },
];

export const changementSOC2016to2019Total = {
  superficie2016: 155718.83,
  superficie2019: 155718.58,
  socTotal2016: 419278850.77,
  socTotal2019: 418891673.98,
  changement: -387176.80,
};

/* ─── 6. Changement dans le SOC entre 2016 et 2019 selon le type de couverture ─── */
export const changementSOCCouverture2016to2019 = {
  rowLabels: [
    'Couverture en arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
  ],
  colLabels: [
    'Couverture en arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
  ],
  /** rows = 2016, cols = 2019 */
  matrix: [
    [0.00, 0.01, -0.01, 0.00, -0.10, -0.03],
    [0.00, 0.00, -0.03, 0.00, -0.11, -0.07],
    [0.01, 0.02, 0.00, 0.00, -0.12, -0.11],
    [0.00, 0.00, 0.00, 0.02, 0.00, 0.00],
    [0.00, 0.00, 0.00, 0.00, -0.03, 0.00],
    [0.08, 0.03, 0.07, 0.00, 0.00, 0.00],
  ],
  rowTotals: [-0.12, -0.21, -0.20, 0.02, -0.03, 0.18],
  colTotals: [0.10, 0.07, 0.03, 0.02, -0.37, -0.20],
  grandTotal: -0.34,
};
