/* ─── Land Cover Data (Couverture terrestre) ─── */

/* ─── Types ─── */
export type LandCoverCategory =
  | 'Couverture d\u2019arbres'
  | 'Prairie'
  | 'Terre cultivée'
  | 'Terres cultivées'
  | 'Zone humide'
  | 'Zone artificialisée'
  | 'Sol nu'
  | 'Plan d\u2019eau';

/* ─── 1. Estimations de la couverture annuelle des terres (km²) ─── */
export const couvertureAnnuelle = [
  {
    annee: 2001,
    'Couverture d\u2019arbres': 3571.25,
    'Prairie': 17473.85,
    'Terre cultivée': 44643.83,
    'Zone humide': 4.23,
    'Zone artificialisée': 842.41,
    'Sol nu': 89176.96,
    'Plan d\u2019eau': 904.92,
  },
  {
    annee: 2005,
    'Couverture d\u2019arbres': 3817.68,
    'Prairie': 17129.67,
    'Terre cultivée': 44507.23,
    'Zone humide': 6.45,
    'Zone artificialisée': 1121.05,
    'Sol nu': 89132.46,
    'Plan d\u2019eau': 902.91,
  },
  {
    annee: 2010,
    'Couverture d\u2019arbres': 3928.60,
    'Prairie': 16721.13,
    'Terre cultivée': 44453.07,
    'Zone humide': 6.77,
    'Zone artificialisée': 934.90,
    'Sol nu': 89670.24,
    'Plan d\u2019eau': 902.74,
  },
  {
    annee: 2015,
    'Couverture d\u2019arbres': 3943.18,
    'Prairie': 14318.31,
    'Terre cultivée': 46889.52,
    'Zone humide': 5.15,
    'Zone artificialisée': 1087.94,
    'Sol nu': 89474.85,
    'Plan d\u2019eau': 898.50,
  },
  {
    annee: 2016,
    'Couverture d\u2019arbres': 3955.14,
    'Prairie': 14662.92,
    'Terre cultivée': 46865.50,
    'Zone humide': 5.15,
    'Zone artificialisée': 1088.00,
    'Sol nu': 89142.11,
    'Plan d\u2019eau': 898.62,
  },
  {
    annee: 2019,
    'Couverture d\u2019arbres': 3987.13,
    'Prairie': 15715.10,
    'Terre cultivée': 46756.23,
    'Zone humide': 5.03,
    'Zone artificialisée': 1238.59,
    'Sol nu': 88016.50,
    'Plan d\u2019eau': 898.87,
  },
];

/* ─── 2. Transition matrix: 2001 → 2015 (km²) ─── */
export const transitionLabels = [
  'Couverture d\u2019arbres',
  'Prairie',
  'Terre cultivée',
  'Zone humide',
  'Zone artificialisée',
  'Sol nu',
  'Plan d\u2019eau',
] as const;

export const transition2001to2015 = {
  rowLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terre cultivée',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Plan d\u2019eau',
  ],
  colLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terre cultivée',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Plan d\u2019eau',
  ],
  /** rows = 2001, cols = 2015 */
  matrix: [
    [3566.44, 0.19, 4.44, 0.00, 0.06, 0.12, 0.00],
    [2.19, 14222.60, 2796.70, 0.00, 3.09, 449.09, 0.19],
    [366.03, 32.93, 44053.47, 0.43, 182.91, 0.88, 7.18],
    [0.00, 0.00, 0.00, 4.11, 0.00, 0.00, 0.12],
    [0.00, 0.00, 0.00, 0.00, 842.41, 0.00, 0.00],
    [8.53, 62.59, 34.51, 0.62, 57.03, 89013.18, 0.50],
    [0.00, 0.00, 0.39, 0.00, 2.44, 11.58, 890.51],
  ],
  rowTotals: [3571.25, 17473.85, 44643.83, 4.23, 842.41, 89176.96, 904.92],
  colTotals: [3943.18, 14318.31, 46889.52, 5.15, 1087.94, 89474.85, 898.50],
  grandTotal: 156617.45,
  remarque: 'Existence d\u2019une dégradation élevée au niveau des prairies au profit des terres cultivées',
};

/* ─── 3. Changement dans l'occupation du sol (2001 vs 2015) ─── */
export const changement2001to2015 = [
  { categorie: 'Couverture d\u2019arbres', superficie2001: 3571.25, superficie2015: 3943.18, changement: 371.93, changementPct: 10 },
  { categorie: 'Prairie', superficie2001: 17473.85, superficie2015: 14318.31, changement: -3155.54, changementPct: -18 },
  { categorie: 'Terre cultivée', superficie2001: 44643.83, superficie2015: 46889.52, changement: 2245.69, changementPct: 5 },
  { categorie: 'Zone humide', superficie2001: 4.23, superficie2015: 5.15, changement: 0.93, changementPct: 22 },
  { categorie: 'Zone artificialisée', superficie2001: 842.41, superficie2015: 1087.94, changement: 245.53, changementPct: 29 },
  { categorie: 'Sol nu', superficie2001: 89176.96, superficie2015: 89474.85, changement: 297.89, changementPct: 0 },
  { categorie: 'Plan d\u2019eau', superficie2001: 904.92, superficie2015: 898.50, changement: -6.42, changementPct: -1 },
];

/* ─── 4. Dégradation de la couverture des terres (2001 à 2015) ─── */
export const degradation2001to2015 = {
  amelioree: { superficie: 3271.17, pourcentage: 2.09 },
  stable: { superficie: 152615.11, pourcentage: 97.44 },
  degradee: { superficie: 731.17, pourcentage: 0.47 },
  totale: { superficie: 156617.40, pourcentage: 100.00 },
  remarque: 'Les milieux arborés (zones caractérisées par des couvertures d\u2019arbres), les zones cultivées ainsi que les milieux artificialisés ont enregistré des augmentations respectives de 10 %, 5 % et 29 %.',
};

/* ─── 5. Transition matrix: 2016 → 2019 (km²) ─── */
export const transition2016to2019 = {
  rowLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Plan d\u2019eau',
  ],
  colLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Plan d\u2019eau',
  ],
  /** rows = 2016, cols = 2019 */
  matrix: [
    [3949.30, 1.13, 3.16, 0.00, 1.30, 0.12, 0.12],
    [4.87, 14617.28, 34.89, 0.00, 3.88, 2.01, 0.00],
    [31.02, 16.67, 46711.44, 0.00, 104.07, 2.30, 0.00],
    [0.00, 0.00, 0.00, 5.03, 0.00, 0.00, 0.12],
    [0.00, 0.00, 0.00, 0.00, 1088.00, 0.00, 0.00],
    [1.93, 1080.02, 6.75, 0.00, 41.35, 88012.06, 0.00],
    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 898.62],
  ],
  rowTotals: [3955.14, 14662.92, 46865.50, 5.15, 1088.00, 89142.11, 898.62],
  colTotals: [3987.13, 15715.10, 46756.23, 5.03, 1238.59, 88016.50, 898.87],
  grandTotal: 156617.45,
  remarque: 'La période 2016-19 a été marquée par une nette stabilité de la couverture terrestre (99,2% stable), une très légère amélioration (0,7%) a été enregistrée, alors que la dégradation est presque nulle (0,11%).',
};

/* ─── 6. Changement dans l'occupation des sols (2016 vs 2019) ─── */
export const changement2016to2019 = [
  { categorie: 'Couverture d\u2019arbres', superficie2016: 3955.14, superficie2019: 3987.13, changement: 31.99, changementPct: 1 },
  { categorie: 'Prairie', superficie2016: 14662.92, superficie2019: 15715.10, changement: 1052.18, changementPct: 7 },
  { categorie: 'Terres cultivées', superficie2016: 46865.50, superficie2019: 46756.23, changement: -109.26, changementPct: 0 },
  { categorie: 'Zone humide', superficie2016: 5.15, superficie2019: 5.03, changement: -0.12, changementPct: -2 },
  { categorie: 'Zone artificialisée', superficie2016: 1088.00, superficie2019: 1238.59, changement: 150.59, changementPct: 14 },
  { categorie: 'Sol nu', superficie2016: 89142.11, superficie2019: 88016.50, changement: -1125.62, changementPct: -1 },
  { categorie: 'Plan d\u2019eau', superficie2016: 898.62, superficie2019: 898.87, changement: 0.25, changementPct: 0 },
];

/* ─── 7. Dégradation de la couverture des terres (2016 à 2019) ─── */
export const degradation2016to2019 = {
  amelioree: { superficie: 1159.48, pourcentage: 0.74 },
  stable: { superficie: 155281.99, pourcentage: 99.15 },
  degradee: { superficie: 175.98, pourcentage: 0.11 },
  totale: { superficie: 156617.40, pourcentage: 100.00 },
  remarque: 'Les prairies, ainsi que les milieux artificialisés, ont enregistré des augmentations respectives de 7 et 14 %.',
};
