import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight, Layers, TrendingUp, TreePine, BarChart3, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

/* ─── Data imports ─── */
import {
  couvertureAnnuelle,
  transition2001to2015,
  changement2001to2015,
  degradation2001to2015,
  transition2016to2019,
  changement2016to2019,
  degradation2016to2019,
} from '@/data/tableauDeBord/couvertureTerrestre';

import {
  degradationProductivite2001to2015,
  productiviteAugmentee2001to2015,
  productiviteDiminuee2001to2015,
  degradationProductivite2016to2019,
  productiviteAugmentee2016to2019,
  productiviteDiminuee2016to2019,
} from '@/data/tableauDeBord/productiviteTerrestre';

import {
  degradationSOC2001to2015,
  changementSOC2001to2015,
  changementSOC2001to2015Total,
  changementSOCCouverture2001to2015,
  degradationSOC2016to2019,
  changementSOC2016to2019,
  changementSOC2016to2019Total,
  changementSOCCouverture2016to2019,
} from '@/data/tableauDeBord/carboneOrganiqueSol';

import {
  espacePRAISIntro,
  objectifsStrategiques,
} from '@/data/tableauDeBord/espacePRAIS';

/* ─── Reveal wrapper ─── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''} ${delay ? `reveal-delay-${delay}` : ''} ${className} h-full`}>
      {children}
    </div>
  );
}

/* ─── Types ─── */
type TabId = 'couverture' | 'productivite' | 'soc' | 'prais';
type Period = '2001-2015' | '2016-2019';

interface DegradationSummary {
  amelioree?: { superficie: number; pourcentage: number };
  ameliore?: { superficie: number; pourcentage: number };
  stable: { superficie: number; pourcentage: number };
  degradee?: { superficie: number; pourcentage: number };
  degrade?: { superficie: number; pourcentage: number };
  absenceDonnees?: { superficie: number; pourcentage: number };
  totale: { superficie: number; pourcentage: number };
  remarque?: string;
  remarqueGenerale?: string;
}

interface TransitionData {
  rowLabels: string[];
  colLabels: string[];
  matrix: number[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
  remarque?: string;
}

const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
  { id: 'couverture', label: 'Couverture terrestre', icon: Layers },
  { id: 'productivite', label: 'Productivité des terres', icon: TrendingUp },
  { id: 'soc', label: 'Carbone organique du sol', icon: TreePine },
  { id: 'prais', label: 'Espace PRAIS', icon: BarChart3 },
];

/* ─── Colors ─── */
const PIE_COLORS = { amelioree: '#22c55e', stable: '#9ca3af', degradee: '#ef4444', absence: '#fbbf24' };

/* ─── Helpers ─── */
function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtInt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function getImproved(d: DegradationSummary) {
  return d.amelioree || d.ameliore!;
}
function getDegraded(d: DegradationSummary) {
  return d.degradee || d.degrade!;
}

/* ─── KPI Card ─── */
function KPICard({ label, superficie, pourcentage, color }: { label: string; superficie: number; pourcentage: number; color: string }) {
  return (
    <div className="border-t-4 bg-white shadow-lg p-6 md:p-8 text-center" style={{ borderTopColor: color }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40 mb-2">{label}</p>
      <p className="font-serif text-3xl md:text-4xl tracking-tight mb-1" style={{ color }}>{pourcentage.toFixed(2)}%</p>
      <p className="text-sm font-light text-black/50">{fmt(superficie)} km²</p>
    </div>
  );
}

/* ─── Remarque box ─── */
function Remarque({ text }: { text: string }) {
  return (
    <div className="bg-black text-white p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-white/15 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-white/15 pointer-events-none" />
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-white/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-sm font-light leading-relaxed text-white/70">{text}</p>
      </div>
    </div>
  );
}

/* ─── Custom Pie Tooltip ─── */
function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { pourcentage: number } }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-black/10 shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-black/80">{d.name}</p>
      <p className="text-black/60">{fmt(d.value)} km²</p>
      <p className="text-black/60">{d.payload.pourcentage.toFixed(2)}%</p>
    </div>
  );
}

/* ─── Transition Heatmap ─── */
function TransitionHeatmap({ data, title }: { data: TransitionData; title: string }) {
  const flatVals = data.matrix.flat().filter((v) => v > 0);
  const maxVal = Math.max(...flatVals, 1);

  const shortLabel = (l: string) => {
    const map: Record<string, string> = {
      'Couverture d\u2019arbres': 'Arbres',
      'Couverture en arbres': 'Arbres',
      'Prairie': 'Prairie',
      'Terre cultivée': 'Cultivée',
      'Terres cultivées': 'Cultivées',
      'Zone humide': 'Humide',
      'Zone artificialisée': 'Artific.',
      'Sol nu': 'Sol nu',
      'Plan d\u2019eau': 'Eau',
      'Étendue d\u2019eau': 'Eau',
    };
    return map[l] || l;
  };

  const getOpacity = (val: number) => {
    if (val === 0) return 0.03;
    return Math.min(val / maxVal, 1) * 0.85;
  };

  return (
    <div className="overflow-x-auto">
      <h3 className="font-serif text-xl md:text-2xl tracking-tight mb-6">{title}</h3>
      <table className="w-full text-[11px] md:text-xs border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left p-2 bg-black text-white font-semibold border border-black/10"></th>
            {data.colLabels.map((col) => (
              <th key={col} className="p-2 bg-black text-white font-semibold text-center border border-black/10 whitespace-nowrap">
                {shortLabel(col)}
              </th>
            ))}
            <th className="p-2 bg-black text-white font-semibold text-center border border-black/10">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.matrix.map((row, ri) => (
            <tr key={ri}>
              <td className="p-2 bg-stone-100 font-semibold text-black/70 border border-black/10 whitespace-nowrap">
                {shortLabel(data.rowLabels[ri])}
              </td>
              {row.map((val, ci) => {
                const isDiag = ri === ci;
                const opacity = getOpacity(val);
                const textColor = val === 0 ? 'rgba(0,0,0,0.3)' : opacity > 0.3 ? 'white' : 'rgba(0,0,0,0.7)';
                return (
                  <td
                    key={ci}
                    className="p-2 text-center border border-black/10"
                    style={{
                      backgroundColor: `rgba(0,0,0,${opacity})`,
                      color: textColor,
                      fontWeight: isDiag ? 600 : 400,
                    }}
                  >
                    {fmt(val)}
                  </td>
                );
              })}
              <td className="p-2 text-center bg-stone-50 font-semibold text-black/70 border border-black/10">
                {fmt(data.rowTotals[ri])}
              </td>
            </tr>
          ))}
          <tr>
            <td className="p-2 bg-stone-100 font-semibold text-black/70 border border-black/10">Total</td>
            {data.colTotals.map((val, ci) => (
              <td key={ci} className="p-2 text-center bg-stone-50 font-semibold text-black/70 border border-black/10">
                {fmt(val)}
              </td>
            ))}
            <td className="p-2 text-center bg-black text-white font-semibold border border-black/10">
              {fmt(data.grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Couverture Change Table ─── */
function CouvertureChangeTable({ data, periodLabels }: { data: typeof changement2001to2015 | typeof changement2016to2019; periodLabels: [string, string] }) {
  const supKey1 = periodLabels[0] === '2001' ? 'superficie2001' : 'superficie2016';
  const supKey2 = periodLabels[1] === '2015' ? 'superficie2015' : 'superficie2019';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-black text-white">
            <th className="text-left p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">Catégorie</th>
            <th className="text-right p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">{periodLabels[0]} (km²)</th>
            <th className="text-right p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">{periodLabels[1]} (km²)</th>
            <th className="text-right p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">Changement (km²)</th>
            <th className="text-right p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">Changement (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const pct = row.changementPct;
            const isPositive = pct > 0;
            const isNegative = pct < 0;
            const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-black/40';
            const bgClass = i % 2 === 1 ? 'bg-stone-50' : 'bg-white';
            return (
              <tr key={row.categorie} className={`${bgClass} hover:bg-black hover:text-white transition-colors duration-200`}>
                <td className="p-4 font-medium">{row.categorie}</td>
                <td className="p-4 text-right font-light text-black/60">{fmt(row[supKey1 as keyof typeof row] as number)}</td>
                <td className="p-4 text-right font-light text-black/60">{fmt(row[supKey2 as keyof typeof row] as number)}</td>
                <td className={`p-4 text-right font-semibold ${colorClass}`}>{row.changement > 0 ? '+' : ''}{fmt(row.changement)}</td>
                <td className={`p-4 text-right font-semibold ${colorClass}`}>{row.changementPct > 0 ? '+' : ''}{row.changementPct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── SOC Change Table ─── */
function SOCChangeTable({ data, total, periodLabels }: { data: typeof changementSOC2001to2015 | typeof changementSOC2016to2019; total: typeof changementSOC2001to2015Total | typeof changementSOC2016to2019Total; periodLabels: [string, string] }) {
  const [y1, y2] = periodLabels;
  const socKey1 = y1 === '2001' ? 'soc2001' : 'soc2016';
  const socKey2 = y2 === '2015' ? 'soc2015' : 'soc2019';
  const supKey1 = y1 === '2001' ? 'superficie2001' : 'superficie2016';
  const supKey2 = y2 === '2015' ? 'superficie2015' : 'superficie2019';
  const totKey1 = y1 === '2001' ? 'socTotal2001' : 'socTotal2016';
  const totKey2 = y2 === '2015' ? 'socTotal2015' : 'socTotal2019';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = total as Record<string, number>;
  const totalSup1 = t[`superficie${y1}`];
  const totalSup2 = t[`superficie${y2}`];
  const totalSoc1 = t[`socTotal${y1}`];
  const totalSoc2 = t[`socTotal${y2}`];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs md:text-sm border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-black text-white">
            <th className="text-left p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">Catégorie</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">SOC {y1} (t/ha)</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">SOC {y2} (t/ha)</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">Sup. {y1} (km²)</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">Sup. {y2} (km²)</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">SOC total {y1} (t)</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">SOC total {y2} (t)</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">Changement (t)</th>
            <th className="text-right p-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">Changement (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const pct = row.changementPct;
            const isPositive = pct > 0;
            const isNegative = pct < 0;
            const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-black/40';
            const bgClass = i % 2 === 1 ? 'bg-stone-50' : 'bg-white';
            return (
              <tr key={row.categorie} className={`${bgClass} hover:bg-black hover:text-white transition-colors duration-200`}>
                <td className="p-3 font-medium">{row.categorie}</td>
                <td className="p-3 text-right font-light text-black/60">{(row[socKey1 as keyof typeof row] as number).toFixed(2)}</td>
                <td className="p-3 text-right font-light text-black/60">{(row[socKey2 as keyof typeof row] as number).toFixed(2)}</td>
                <td className="p-3 text-right font-light text-black/60">{fmtInt(row[supKey1 as keyof typeof row] as number)}</td>
                <td className="p-3 text-right font-light text-black/60">{fmtInt(row[supKey2 as keyof typeof row] as number)}</td>
                <td className="p-3 text-right font-light text-black/60">{fmtInt(row[totKey1 as keyof typeof row] as number)}</td>
                <td className="p-3 text-right font-light text-black/60">{fmtInt(row[totKey2 as keyof typeof row] as number)}</td>
                <td className={`p-3 text-right font-semibold ${colorClass}`}>{row.changement > 0 ? '+' : ''}{fmtInt(row.changement)}</td>
                <td className={`p-3 text-right font-semibold ${colorClass}`}>{row.changementPct > 0 ? '+' : ''}{row.changementPct}%</td>
              </tr>
            );
          })}
          <tr className="bg-black text-white font-semibold">
            <td className="p-3">Total</td>
            <td className="p-3 text-right"></td>
            <td className="p-3 text-right"></td>
            <td className="p-3 text-right">{fmtInt(totalSup1)}</td>
            <td className="p-3 text-right">{fmtInt(totalSup2)}</td>
            <td className="p-3 text-right">{fmtInt(totalSoc1)}</td>
            <td className="p-3 text-right">{fmtInt(totalSoc2)}</td>
            <td className="p-3 text-right">{total.changement > 0 ? '+' : ''}{fmtInt(total.changement)}</td>
            <td className="p-3 text-right"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Couverture Terrestre Tab ─── */
function CouvertureTab({ period }: { period: Period }) {
  const degradation = period === '2001-2015' ? degradation2001to2015 : degradation2016to2019;
  const transition = period === '2001-2015' ? transition2001to2015 : transition2016to2019;
  const changement = period === '2001-2015' ? changement2001to2015 : changement2016to2019;
  const periodLabels: [string, string] = period === '2001-2015' ? ['2001', '2015'] : ['2016', '2019'];

  const pieData = [
    { name: 'Améliorée', value: degradation.amelioree.superficie, pourcentage: degradation.amelioree.pourcentage, fill: PIE_COLORS.amelioree },
    { name: 'Stable', value: degradation.stable.superficie, pourcentage: degradation.stable.pourcentage, fill: PIE_COLORS.stable },
    { name: 'Dégradée', value: degradation.degradee.superficie, pourcentage: degradation.degradee.pourcentage, fill: PIE_COLORS.degradee },
  ];

  const lineKeys = ['Couverture d\u2019arbres', 'Prairie', 'Terre cultivée', 'Zone artificialisée', 'Sol nu', 'Plan d\u2019eau'];
  const lineColors: Record<string, string> = {
    'Couverture d\u2019arbres': '#22c55e',
    'Prairie': '#a3e635',
    'Terre cultivée': '#f59e0b',
    'Zone artificialisée': '#ef4444',
    'Sol nu': '#9ca3af',
    'Plan d\u2019eau': '#3b82f6',
  };

  return (
    <div className="space-y-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Améliorée" superficie={degradation.amelioree.superficie} pourcentage={degradation.amelioree.pourcentage} color={PIE_COLORS.amelioree} />
        <KPICard label="Stable" superficie={degradation.stable.superficie} pourcentage={degradation.stable.pourcentage} color={PIE_COLORS.stable} />
        <KPICard label="Dégradée" superficie={degradation.degradee.superficie} pourcentage={degradation.degradee.pourcentage} color={PIE_COLORS.degradee} />
      </div>

      {/* Pie + Change Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
          <h3 className="font-serif text-xl tracking-tight mb-6">Répartition de la couverture</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} strokeWidth={2} stroke="#fff">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-[11px] text-black/60">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
          <h3 className="font-serif text-xl tracking-tight mb-6">Changement dans l&apos;occupation du sol ({periodLabels[0]} → {periodLabels[1]})</h3>
          <CouvertureChangeTable data={changement} periodLabels={periodLabels} />
        </div>
      </div>

      {/* Remarque */}
      {degradation.remarque && <Remarque text={degradation.remarque} />}

      {/* Line chart */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <h3 className="font-serif text-xl md:text-2xl tracking-tight mb-6">Évolution annuelle de la couverture terrestre (km²)</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={couvertureAnnuelle} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: unknown) => fmt(Number(value))} labelFormatter={(l) => `Année ${l}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {lineKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={lineColors[key] || '#666'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transition heatmap */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <TransitionHeatmap
          data={transition}
          title={`Matrice de transition (${periodLabels[0]} → ${periodLabels[1]})`}
        />
      </div>

      {/* Transition remarque */}
      {transition.remarque && <Remarque text={transition.remarque} />}
    </div>
  );
}

/* ─── Productivité Tab ─── */
function ProductiviteTab({ period }: { period: Period }) {
  const degradation = period === '2001-2015' ? degradationProductivite2001to2015 : degradationProductivite2016to2019;
  const augmentee = period === '2001-2015' ? productiviteAugmentee2001to2015 : productiviteAugmentee2016to2019;
  const diminuee = period === '2001-2015' ? productiviteDiminuee2001to2015 : productiviteDiminuee2016to2019;

  const pieData = [
    { name: 'Améliorée', value: degradation.amelioree.superficie, pourcentage: degradation.amelioree.pourcentage, fill: PIE_COLORS.amelioree },
    { name: 'Stable', value: degradation.stable.superficie, pourcentage: degradation.stable.pourcentage, fill: PIE_COLORS.stable },
    { name: 'Dégradée', value: degradation.degradee.superficie, pourcentage: degradation.degradee.pourcentage, fill: PIE_COLORS.degradee },
    { name: 'Absence données', value: degradation.absenceDonnees.superficie, pourcentage: degradation.absenceDonnees.pourcentage, fill: PIE_COLORS.absence },
  ];

  return (
    <div className="space-y-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Améliorée" superficie={degradation.amelioree.superficie} pourcentage={degradation.amelioree.pourcentage} color={PIE_COLORS.amelioree} />
        <KPICard label="Stable" superficie={degradation.stable.superficie} pourcentage={degradation.stable.pourcentage} color={PIE_COLORS.stable} />
        <KPICard label="Dégradée" superficie={degradation.degradee.superficie} pourcentage={degradation.degradee.pourcentage} color={PIE_COLORS.degradee} />
        <KPICard label="Absence données" superficie={degradation.absenceDonnees.superficie} pourcentage={degradation.absenceDonnees.pourcentage} color={PIE_COLORS.absence} />
      </div>

      {/* Pie */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <h3 className="font-serif text-xl tracking-tight mb-6">Répartition de la productivité des terres ({period})</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={55} strokeWidth={2} stroke="#fff">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-[11px] text-black/60">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>

      {degradation.remarque && <Remarque text={degradation.remarque} />}

      {/* Augmentée transition */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <TransitionHeatmap
          data={augmentee}
          title={`Surface des terres dont la productivité a augmenté (${period})`}
        />
      </div>

      {augmentee.remarque && <Remarque text={augmentee.remarque} />}

      {/* Diminuée transition */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <TransitionHeatmap
          data={diminuee}
          title={`Surface des terres dont la productivité a diminué (${period})`}
        />
      </div>
    </div>
  );
}

/* ─── SOC Tab ─── */
function SOCTab({ period }: { period: Period }) {
  const degradation = period === '2001-2015' ? degradationSOC2001to2015 : degradationSOC2016to2019;
  const changement = period === '2001-2015' ? changementSOC2001to2015 : changementSOC2016to2019;
  const total = period === '2001-2015' ? changementSOC2001to2015Total : changementSOC2016to2019Total;
  const couverture = period === '2001-2015' ? changementSOCCouverture2001to2015 : changementSOCCouverture2016to2019;
  const periodLabels: [string, string] = period === '2001-2015' ? ['2001', '2015'] : ['2016', '2019'];

  const improved = getImproved(degradation);
  const degraded = getDegraded(degradation);

  const pieData = [
    { name: 'Amélioré', value: improved.superficie, pourcentage: improved.pourcentage, fill: PIE_COLORS.amelioree },
    { name: 'Stable', value: degradation.stable.superficie, pourcentage: degradation.stable.pourcentage, fill: PIE_COLORS.stable },
    { name: 'Dégradé', value: degraded.superficie, pourcentage: degraded.pourcentage, fill: PIE_COLORS.degradee },
  ];
  if (degradation.absenceDonnees) {
    pieData.push({ name: 'Absence données', value: degradation.absenceDonnees.superficie, pourcentage: degradation.absenceDonnees.pourcentage, fill: PIE_COLORS.absence });
  }

  return (
    <div className="space-y-12">
      {degradation.remarqueGenerale && <Remarque text={degradation.remarqueGenerale} />}

      {/* KPI Cards */}
      <div className={degradation.absenceDonnees ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}>
        <KPICard label="Amélioré" superficie={improved.superficie} pourcentage={improved.pourcentage} color={PIE_COLORS.amelioree} />
        <KPICard label="Stable" superficie={degradation.stable.superficie} pourcentage={degradation.stable.pourcentage} color={PIE_COLORS.stable} />
        <KPICard label="Dégradé" superficie={degraded.superficie} pourcentage={degraded.pourcentage} color={PIE_COLORS.degradee} />
        {degradation.absenceDonnees && (
          <KPICard label="Absence données" superficie={degradation.absenceDonnees.superficie} pourcentage={degradation.absenceDonnees.pourcentage} color={PIE_COLORS.absence} />
        )}
      </div>

      {/* Pie */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <h3 className="font-serif text-xl tracking-tight mb-6">Répartition du carbone organique du sol ({period})</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={55} strokeWidth={2} stroke="#fff">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-[11px] text-black/60">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>

      {degradation.remarque && <Remarque text={degradation.remarque} />}

      {/* SOC change table */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <h3 className="font-serif text-xl md:text-2xl tracking-tight mb-6">Changement dans le carbone organique du sol ({periodLabels[0]} → {periodLabels[1]})</h3>
        <SOCChangeTable data={changement} total={total} periodLabels={periodLabels} />
      </div>

      {/* Couverture transition heatmap */}
      <div className="border-t-4 border-t-black bg-white shadow-lg p-6 md:p-8">
        <TransitionHeatmap
          data={couverture}
          title={`Changement dans le SOC selon le type de couverture (${periodLabels[0]} → ${periodLabels[1]}, tonnes/ha)`}
        />
      </div>
    </div>
  );
}

/* ─── PRAIS Tab ─── */
function PRAISTab() {
  const [openOS, setOpenOS] = useState<number | null>(null);

  return (
    <div className="space-y-12">
      <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
        <p className="text-sm font-light leading-relaxed text-black/60">{espacePRAISIntro}</p>
      </div>

      <div className="border-t-4 border-t-black bg-white shadow-lg">
        {objectifsStrategiques.map((os) => {
          const isOpen = openOS === os.numero;
          return (
            <div key={os.numero} className={os.numero < objectifsStrategiques.length ? 'border-b border-black/10' : ''}>
              <button
                onClick={() => setOpenOS(isOpen ? null : os.numero)}
                className="w-full flex items-start gap-4 p-6 md:p-8 hover:bg-black/3 transition-colors text-left"
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-black text-white text-[11px] font-bold">
                  {os.numero}
                </span>
                <div className="flex-1">
                  <h3 className="font-serif text-base md:text-lg tracking-tight text-black/80">{os.titre}</h3>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {isOpen ? <ChevronDown size={18} className="text-black/30" /> : <ChevronRight size={18} className="text-black/30" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-6 md:px-8 pb-6 md:pb-8 ml-12">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40 mb-3">Indicateurs</p>
                  <div className="space-y-0">
                    {os.indicateurs.map((ind, i) => (
                      <div key={i} className={`flex items-start gap-3 py-3 ${i < os.indicateurs.length - 1 ? 'border-b border-black/5' : ''}`}>
                        <ArrowRight size={14} className="text-black/25 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p className="text-sm font-light leading-relaxed text-black/60">{ind}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TableauDeBordNDT() {
  const [activeTab, setActiveTab] = useState<TabId>('couverture');
  const [period, setPeriod] = useState<Period>('2001-2015');

  return (
    <div className="bg-stone-50 text-black font-sans antialiased">
      <Navbar darkOnInit />

      {/* Header */}
      <section className="bg-black text-white py-16 md:py-20 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4">Tableau de bord</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.1] tracking-tight mb-4">
            Tableau de bord NDT
          </h1>
          <p className="text-base font-light leading-relaxed text-white/50 max-w-2xl">
            Statistiques clés sur la dégradation des terres en Tunisie — couverture terrestre, productivité, carbone organique du sol et rapportage PRAIS.
          </p>
        </div>
      </section>

      {/* Tabs + Period Filter */}
      <div className="sticky top-16 z-40 bg-white border-b border-black/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-0 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 md:px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap border-b-2 transition-all ${
                      isActive ? 'border-black text-black' : 'border-transparent text-black/40 hover:text-black/70'
                    }`}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab !== 'prais' && (
              <div className="flex items-center gap-1 bg-stone-100 p-1">
                <button
                  onClick={() => setPeriod('2001-2015')}
                  className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
                    period === '2001-2015' ? 'bg-black text-white' : 'text-black/40 hover:text-black/70'
                  }`}
                >
                  2001-2015
                </button>
                <button
                  onClick={() => setPeriod('2016-2019')}
                  className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
                    period === '2016-2019' ? 'bg-black text-white' : 'text-black/40 hover:text-black/70'
                  }`}
                >
                  2016-2019
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {activeTab === 'couverture' && <CouvertureTab period={period} />}
          {activeTab === 'productivite' && <ProductiviteTab period={period} />}
          {activeTab === 'soc' && <SOCTab period={period} />}
          {activeTab === 'prais' && <PRAISTab />}
        </div>
      </section>

      <Footer />
    </div>
  );
}
