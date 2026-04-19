import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import SectionTitle from '@/components/SectionTitle';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Database, BarChart3, FileText } from 'lucide-react';

/* ─── Reveal wrapper ─── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} ${delay ? `reveal-delay-${delay}` : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Data ─── */
const pillars = [
  {
    icon: Database,
    title: 'Collecte et gestion des données',
    description:
      'Centralisation et structuration des données nationales sur la dégradation des terres à travers des bases de données harmonisées et interopérables.',
  },
  {
    icon: BarChart3,
    title: 'Analyse et visualisation',
    description:
      "Outils d'analyse spatiale et de visualisation des tendances de dégradation des terres pour éclairer les décisions politiques.",
  },
  {
    icon: FileText,
    title: 'Rapportage automatisé',
    description:
      "Mise en place de mécanismes de rapportage automatisés conformes aux exigences de la CNULCD et des ODD.",
  },
];

const tools = [
  'Télédétection',
  'SIG Open Source',
  'Bases de données harmonisées',
  'Indicateurs NDT',
  'Rapportage UNCCD',
];

const timeline = [
  {
    phase: 'Phase I',
    period: '2006 – 2010',
    title: 'Initialisation',
    description:
      'Premier cycle du projet avec le développement des outils conceptuels et méthodologiques pour le suivi de la dégradation des terres.',
  },
  {
    phase: 'Phase II',
    period: '2011 – 2015',
    title: 'Déploiement régional',
    description:
      "Expansion à 17 pays. Consolidation des bases de données nationales et formation des cadres techniques.",
  },
  {
    phase: 'Phase III',
    period: '2016 – 2020',
    title: 'Renforcement',
    description:
      "Élargissement à 21 pays. Intégration des données de télédétection et renforcement de la plateforme régionale.",
  },
  {
    phase: 'Phase IV',
    period: '2021 – 2026',
    title: 'Consolidation et pérennisation',
    description:
      "Extension à 28 pays. Pérennisation des acquis, intégration du genre et rapportage ND.",
  },
];

const phase4Features = [
  {
    title: 'Consolidation des bases de données',
    desc: "Harmonisation et mise à jour des bases de données nationales sur la dégradation des terres dans les 28 pays participants.",
  },
  {
    title: 'Coordination institutionnelle',
    desc: "Renforcement des mécanismes de coordination entre les différentes institutions nationales.",
  },
  {
    title: 'Intégration genre et inclusion',
    desc: "Intégration systématique des dimensions de genre, de jeunesse et de groupes vulnérables.",
  },
  {
    title: 'Communication et visibilité',
    desc: "Amélioration de la communication et de la visibilité des résultats du projet.",
  },
];

/* ─── Page ─── */
export default function About() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar />

      {/* ── Hero ── */}
      <Hero
        tagline="À Propos"
        title="Le Projet"
        titleLine2="Umbrella"
        image="about"
        ctas={[
          { label: 'Nos Partenaires', to: '/partenaires' },
        ]}
      />

      {/* ── Context — Featured Artwork Detail style ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">
              Le Contexte
            </p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-14">
              La Tunisie et la Désertification
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Text */}
            <Reveal delay={1}>
              <div>
                <h3 className="font-serif text-3xl tracking-tight mb-2">
                  75% du territoire menacé
                </h3>
                <p className="text-sm text-black/40 mb-8">
                  Un défi environnemental majeur pour l'Afrique du Nord
                </p>

                <div className="space-y-4 text-sm font-light leading-relaxed text-black/60 border-t border-black/10 pt-8">
                  <p>
                    La Tunisie est l'un des pays les plus touchés par la désertification en
                    Afrique du Nord. Avec environ 75% de son territoire menacé par la
                    désertification, le pays fait face à des défis majeurs liés à la
                    dégradation des terres, à l'érosion des sols et à la raréfaction des
                    ressources en eau.
                  </p>
                  <p>
                    Les changements climatiques, la pression démographique et les pratiques
                    agricoles non durables exacerbent ces phénomènes, mettant en péril la
                    sécurité alimentaire et les moyens de subsistance des populations rurales.
                  </p>
                  <p>
                    En tant que partie à la Convention des Nations Unies sur la lutte contre
                    la Désertification (CNULCD), la Tunisie s'est engagée à atteindre la
                    Neutralité en matière de Dégradation des Terres (NDT) d'ici 2030.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Detail cards — like camera settings grid */}
            <Reveal delay={2}>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="border-t border-black/10 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">
                    Convention
                  </p>
                  <p className="text-sm">CNULCD / UNCCD</p>
                </div>
                <div className="border-t border-black/10 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">
                    Financement
                  </p>
                  <p className="text-sm">FEM / GEF</p>
                </div>
                <div className="border-t border-black/10 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">
                    Agence d'exécution
                  </p>
                  <p className="text-sm">PNUE / UNEP</p>
                </div>
                <div className="border-t border-black/10 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">
                    Appui technique
                  </p>
                  <p className="text-sm">OSS</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Phase IV — Dark section ── */}
      <section className="bg-black text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-3">
              Phase IV
            </p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-14">
              Consolidation et Pérennisation
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <Reveal delay={1}>
              <div className="space-y-5 text-sm font-light leading-relaxed text-white/60">
                <p>
                  La Phase IV actuelle du Projet Umbrella (2021–2026) s'inscrit dans la
                  continuité des phases précédentes tout en apportant des innovations
                  majeures pour répondre aux nouveaux défis liés à la dégradation des
                  terres.
                </p>
                <p>
                  Cette phase met l'accent sur la consolidation des bases de données
                  nationales, le renforcement de la coordination institutionnelle et
                  l'amélioration des systèmes de rapportage auprès de la CNULCD.
                </p>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <div className="space-y-0">
                {phase4Features.map((item, i) => (
                  <div
                    key={item.title}
                    className={`flex justify-between items-center py-4 ${
                      i < phase4Features.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white/80">{item.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Approach — Tools + Timeline ── */}
      <section className="py-20 md:py-32 border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <SectionTitle label="Notre Approche" title="Trois Piliers Fondamentaux" />
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-black/10 mb-20">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <Reveal key={pillar.title} delay={i + 1}>
                  <div className="bg-white p-8 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default">
                    <Icon
                      size={28}
                      className="text-black/40 group-hover:text-white/60 transition-colors mb-6"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-serif text-xl tracking-tight mb-3">{pillar.title}</h3>
                    <p className="text-sm font-light leading-relaxed text-black/50 group-hover:text-white/50 transition-colors">
                      {pillar.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Tools — like photography tools pills */}
          <Reveal>
            <div className="pt-8 border-t border-black/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30 mb-4">
                Outils et Méthodologies
              </p>
              <div className="flex flex-wrap gap-3">
                {tools.map((tool) => (
                  <span key={tool} className="px-3 py-1.5 border border-black/20 text-[11px] text-black/50 hover:bg-black hover:text-white hover:border-black transition-all duration-300 cursor-default">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Timeline — Awards-style list ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <SectionTitle label="Historique" title="L'Évolution du Projet" />
          </Reveal>

          <Reveal delay={1}>
            <div className="space-y-0">
              {timeline.map((item, i) => (
                <div
                  key={item.phase}
                  className={`flex justify-between items-center py-5 ${
                    i < timeline.length - 1 ? 'border-b border-black/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40">
                      {item.phase}
                    </span>
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[11px] text-black/30 hidden sm:block max-w-xs text-right leading-relaxed">
                      {item.description}
                    </span>
                    <span className="text-[11px] text-black/30 flex-shrink-0">
                      {item.period}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
