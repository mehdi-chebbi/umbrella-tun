import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import SectionTitle from '@/components/SectionTitle';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Leaf, MapPin, TreePine, Thermometer,
  BarChart3, Map, Mountain, Wind,
} from 'lucide-react';
import minEnvLogo from '@/assets/logo-min-environnement.png';

/* ─── Types ─── */
type Category = 'all' | 'principal' | 'national';

/* ─── Reveal wrapper ─── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} ${delay ? `reveal-delay-${delay}` : ''} ${className} h-full`}
    >
      {children}
    </div>
  );
}

/* ─── Data ─── */
const categories: { key: Category; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'principal', label: 'Principaux' },
  { key: 'national', label: 'Nationaux' },
];

const mainPartners = [
  {
    name: 'FEM',
    fullName: "Fonds pour l'Environnement Mondial",
    role: 'Financement',
    description:
      "Le FEM est le mécanisme financier de la Convention. Il finance les projets de lutte contre la dégradation des terres dans les pays en développement.",
    category: 'principal' as Category,
    logo: 'https://www.thegef.org/themes/custom/geftheme/logo.svg',
  },
  {
    name: 'PNUE',
    fullName: "Programme des Nations Unies pour l'Environnement",
    role: 'Mise en œuvre',
    description:
      "Le PNUE est l'agence d'exécution du projet, responsable de la coordination globale et du rapportage auprès des instances internationales.",
    category: 'principal' as Category,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/PNUMA_logo.png',
  },
  {
    name: 'OSS',
    fullName: 'Observatoire du Sahara et du Sahel',
    role: 'Appui technique',
    description:
      "L'OSS assure l'appui technique du projet, apportant son expertise régionale en matière de suivi de la désertification.",
    category: 'principal' as Category,
    logo: 'https://www.oss-online.org/sites/default/files/logo-h.png',
  },
  {
    name: 'Min. Environnement',
    fullName: "Ministère de l'Environnement de la Tunisie",
    role: 'Partenaire national',
    description:
      "Le Ministère est le point focal national du projet en Tunisie, assurant la coordination inter-institutionnelle.",
    category: 'principal' as Category,
    logo: minEnvLogo,
  },
];

const nationalInstitutions = [
  {
    icon: Leaf,
    name: 'CNLCD',
    fullName: 'Conseil National pour la Lutte Contre la Désertification',
    description: 'Coordination nationale de la lutte contre la désertification.',
    category: 'national' as Category,
  },
  {
    icon: MapPin,
    name: 'DGACTA',
    fullName: "Direction Générale d'Aménagement et de la Conservation des Terres Agricoles",
    description: 'Aménagement et conservation des terres agricoles.',
    category: 'national' as Category,
  },
  {
    icon: TreePine,
    name: 'DGF',
    fullName: 'Direction Générale des Forêts',
    description: 'Gestion et protection des forêts et des zones boisées.',
    category: 'national' as Category,
  },
  {
    icon: Map,
    name: 'CNCT',
    fullName: 'Centre National de la Cartographie et de la Télédétection',
    description: 'Cartographie et télédétection appliquées à la dégradation des terres.',
    category: 'national' as Category,
  },
  {
    icon: Thermometer,
    name: 'INM',
    fullName: 'Institut National de la Météorologie',
    description: 'Données climatiques et suivi des conditions météorologiques.',
    category: 'national' as Category,
  },
  {
    icon: BarChart3,
    name: 'INS',
    fullName: 'Institut National de Statistique',
    description: 'Données statistiques et indicateurs socio-économiques.',
    category: 'national' as Category,
  },
  {
    icon: Mountain,
    name: 'ANPE',
    fullName: "Agence Nationale de la Protection de l'Environnement",
    description: "Protection de l'environnement et contrôle de la qualité.",
    category: 'national' as Category,
  },
  {
    icon: Wind,
    name: 'IRA',
    fullName: 'Institut des Régions Arides, Médenine',
    description: 'Recherche sur les écosystèmes arides et semi-arides.',
    category: 'national' as Category,
  },
];

/* ─── Page ─── */
export default function Partners() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const showMain = activeCategory === 'all' || activeCategory === 'principal';
  const showNational = activeCategory === 'all' || activeCategory === 'national';

  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar />

      {/* ── Hero ── */}
      <Hero
        variant="dark"
        tagline="Partenaires"
        title="Une Collaboration"
        titleLine2="Internationale"
        subtitle="Le projet fédère des institutions internationales, des agences de l'ONU et des partenaires nationaux autour d'un objectif commun : la neutralité en matière de dégradation des terres."
        ctas={[
          { label: 'À Propos du Projet', to: '/a-propos', variant: 'outline' },
        ]}
      />

      {/* ── Filter Bar ── */}
      <section className="border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 py-12 md:py-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">
                Partenaires
              </p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
                Les Acteurs du Projet
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] border border-black/20 transition-all duration-300 ${
                    activeCategory === cat.key
                      ? 'bg-black text-white'
                      : 'hover:bg-black hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Partners ── */}
      {showMain && (
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-4 gap-px bg-black/10">
              {mainPartners.map((partner, i) => (
                <Reveal key={partner.name} delay={Math.min(i + 1, 4)}>
                  <div className="bg-white p-8 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default h-full">
                    <div className="flex justify-center items-end h-44 mb-6">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="w-auto max-w-full max-h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/30 group-hover:text-white/40 transition-colors mb-3">
                      {partner.role}
                    </p>
                    <p className="text-[12px] text-black/40 group-hover:text-white/40 transition-colors mb-3">
                      {partner.fullName}
                    </p>
                    <p className="text-sm font-light leading-relaxed text-black/50 group-hover:text-white/50 transition-colors">
                      {partner.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── National Institutions ── */}
      {showNational && (
        <section className="py-20 md:py-32 bg-stone-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            {activeCategory === 'all' && (
              <Reveal>
                <SectionTitle label="Institutions Nationales" title="Les Partenaires Tunisiens" />
              </Reveal>
            )}

            <div className="grid md:grid-cols-4 gap-px bg-black/10">
              {nationalInstitutions.map((inst, i) => {
                const Icon = inst.icon;
                return (
                  <Reveal key={inst.name} delay={Math.min(i + 1, 4)}>
                    <div className="bg-white p-8 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default h-full">
                      <Icon
                        size={28}
                        className="text-black/40 group-hover:text-white/60 transition-colors mb-6"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-sm font-medium mb-1">{inst.name}</h3>
                      <p className="text-[11px] text-black/40 group-hover:text-white/40 transition-colors mb-3 leading-relaxed">
                        {inst.fullName}
                      </p>
                      <p className="text-sm font-light leading-relaxed text-black/50 group-hover:text-white/50 transition-colors">
                        {inst.description}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
