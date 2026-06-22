/* ─── Land Productivity Data (Productivité des terres) ─── */

/* ─── 1. Dégradation de la productivité des terres entre 2001 et 2015 ─── */
export const degradationProductivite2001to2015 = {
  amelioree: { superficie: 20993.74, pourcentage: 13.40 },
  stable: { superficie: 123128.73, pourcentage: 78.62 },
  degradee: { superficie: 11500.46, pourcentage: 7.34 },
  absenceDonnees: { superficie: 994.51, pourcentage: 0.63 },
  totale: { superficie: 156617.40, pourcentage: 100.00 },
  remarque: 'Les augmentations de productivité ont été observées au niveau des terres arborées (11 %) et des terres cultivées (3,7%).',
};

/* ─── 2. Surface des terres dont la productivité a augmenté (2001-2015) ─── */
export const productiviteAugmentee2001to2015 = {
  rowLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  colLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  /** rows = 2001, cols = 2015 */
  matrix: [
    [1955.01, 0.00, 1.54, 0.00, 0.06, 0.12, 0.00],
    [1.19, 2738.61, 713.30, 0.00, 0.25, 62.28, 0.00],
    [210.21, 1.01, 12672.53, 0.06, 33.87, 0.13, 0.12],
    [0.00, 0.00, 0.00, 0.43, 0.00, 0.00, 0.00],
    [0.00, 0.00, 0.00, 0.00, 192.25, 0.00, 0.00],
    [6.86, 15.73, 12.81, 0.19, 7.03, 2331.24, 0.00],
    [0.00, 0.00, 0.00, 0.00, 0.19, 2.46, 34.28],
  ],
  rowTotals: [1956.74, 3515.63, 12917.92, 0.43, 192.25, 2373.86, 36.92],
  colTotals: [2173.26, 2755.34, 13400.18, 0.68, 233.64, 2396.23, 34.40],
  grandTotal: 20993.74,
  remarque: 'Les diminutions de productivité sont observées au niveau des prairies (5 %) et des zones artificialisées (39 %).',
};

/* ─── 3. Surface des terres dont la productivité a diminué (2001-2015) ─── */
export const productiviteDiminuee2001to2015 = {
  rowLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  colLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  /** rows = 2001, cols = 2015 */
  matrix: [
    [89.55, 0.12, 0.06, 0.00, 0.00, 0.00, 0.00],
    [0.25, 58.60, 2.14, 0.00, 0.31, 0.90, 0.00],
    [9.23, 0.82, 510.66, 0.06, 38.12, 0.06, 0.06],
    [0.00, 0.00, 0.00, 0.13, 0.00, 0.00, 0.00],
    [0.00, 0.00, 0.00, 0.00, 115.09, 0.00, 0.00],
    [0.31, 0.06, 0.00, 0.12, 6.71, 446.53, 0.00],
    [0.00, 0.00, 0.00, 0.00, 0.38, 0.00, 18.40],
  ],
  rowTotals: [89.73, 62.20, 559.01, 0.13, 115.09, 453.73, 18.78],
  colTotals: [99.33, 59.61, 512.86, 0.31, 160.60, 447.50, 18.46],
  grandTotal: 1298.60,
};

/* ─── 4. Dégradation de la productivité des terres entre 2016 et 2019 ─── */
export const degradationProductivite2016to2019 = {
  amelioree: { superficie: 18317.84, pourcentage: 11.70 },
  stable: { superficie: 136771.83, pourcentage: 87.33 },
  degradee: { superficie: 383.92, pourcentage: 0.25 },
  absenceDonnees: { superficie: 1143.85, pourcentage: 0.73 },
  totale: { superficie: 156617.40, pourcentage: 100.00 },
  remarque: 'Les augmentations de productivité ont été observées au niveau des terres arborées (0,9 %) et des prairies (0,7%).',
};

/* ─── 5. Surface des terres dont la productivité a augmenté (2016-2019) ─── */
export const productiviteAugmentee2016to2019 = {
  rowLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  colLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  /** rows = 2016, cols = 2019 */
  matrix: [
    [1369.44, 0.82, 0.31, 0.00, 0.06, 0.00, 0.00],
    [1.94, 3118.47, 16.01, 0.00, 0.62, 0.25, 0.00],
    [10.38, 6.79, 10883.82, 0.00, 18.81, 0.19, 0.00],
    [0.00, 0.00, 0.00, 0.25, 0.00, 0.00, 0.00],
    [0.00, 0.00, 0.00, 0.00, 196.39, 0.00, 0.00],
    [0.75, 22.47, 1.28, 0.00, 6.28, 2646.21, 0.00],
    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16.31],
  ],
  rowTotals: [1370.63, 3137.29, 10919.99, 0.25, 196.39, 2676.98, 16.31],
  colTotals: [1382.50, 3148.55, 10901.43, 0.25, 222.16, 2646.65, 16.31],
  grandTotal: 18317.84,
  remarque: 'Les diminutions de productivité sont observées au niveau des zones cultivées (2,8%).',
};

/* ─── 6. Surface des terres dont la productivité a diminué (2016-2019) ─── */
export const productiviteDiminuee2016to2019 = {
  rowLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  colLabels: [
    'Couverture d\u2019arbres',
    'Prairie',
    'Terres cultivées',
    'Zone humide',
    'Zone artificialisée',
    'Sol nu',
    'Étendue d\u2019eau',
  ],
  /** rows = 2016, cols = 2019 */
  matrix: [
    [9.04, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    [0.00, 7.52, 0.00, 0.00, 0.06, 0.00, 0.00],
    [0.00, 0.06, 52.18, 0.00, 1.12, 0.25, 0.00],
    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    [0.00, 0.00, 0.00, 0.00, 5.77, 0.00, 0.00],
    [0.00, 0.19, 0.00, 0.00, 0.12, 304.67, 0.00],
    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2.93],
  ],
  rowTotals: [9.04, 7.58, 53.62, 0.00, 5.77, 304.98, 2.93],
  colTotals: [9.04, 7.77, 52.18, 0.00, 7.08, 304.92, 2.93],
  grandTotal: 383.92,
};
