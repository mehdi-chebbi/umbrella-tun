import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Map, Download, BarChart3, Search, ArrowRight, MousePointerClick, MapPin, Clock, Eye, Layers, Database, FileDown } from 'lucide-react';

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

/* ─── Key features ─── */
const keyFeatures = [
  {
    icon: Map,
    title: 'Des cartes interactives sur la dégradation des terres',
    description: 'mettant en évidence l\'indicateur ODD 15.3.1',
  },
  {
    icon: Download,
    title: 'Des jeux de données géospatiales téléchargeables',
    description: 'par pays et par région, dans des formats compatibles avec les outils SIG',
  },
  {
    icon: Database,
    title: 'Des ressources en données et en indicateurs',
    description: 'dédiées au suivi de l\'environnement, de la végétation, des terres et du climat, permettant de mieux comprendre les écosystèmes et leurs dynamiques',
  },
  {
    icon: Search,
    title: 'Des outils de requêtes et d\'analyse spatiotemporelle',
    description: 'à diverses échelles (du local au national)',
  },
];

/* ─── Steps ─── */
const steps = [
  { icon: MousePointerClick, label: 'Choisir un indicateur ou un jeu de données' },
  { icon: MapPin, label: 'Sélectionner une zone d\'intérêt (une zone personnalisée, une délégation, un gouvernorat, le pays en entier)' },
  { icon: Clock, label: 'Ajuster la période temporelle' },
  { icon: Eye, label: 'Visualiser les résultats sur la carte interactive' },
  { icon: Layers, label: 'Comparer les couches thématiques' },
  { icon: BarChart3, label: 'Générer les statistiques' },
  { icon: FileDown, label: 'Télécharger les données ou les intégrer dans votre analyse' },
];

/* ─── Page ─── */
export default function Apercu() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />

      {/* ── Hero ── */}
      <section className="min-h-[60vh] flex items-center bg-black text-white py-24 md:py-32 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-white/15 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-white/15 pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4">
            Géoportail
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.1] tracking-tight mb-6">
            Explorer les cartes.<br />Visualiser les données.<br />Découvrir des informations.
          </h1>
          <div className="w-9 h-0.5 bg-white/20 my-6" />
          <div className="space-y-5 text-base font-light leading-relaxed text-white/50">
            <p>
              Le Géoportail permet d&apos;accéder à des cartes interactives relatives à la dégradation des terres en Tunisie. À travers une interface intuitive, il offre un accès à des jeux de données géospatiales, à des indicateurs spatiaux ainsi qu&apos;à des ressources statistiques alignées sur les objectifs stratégiques de la Convention des Nations Unies sur la Lutte contre la Désertification (CNULCD).
            </p>
            <p>
              Le Géoportail est ainsi une composante géospatiale qui contribue à une meilleure compréhension des dynamiques de dégradation des terres et soutient l&apos;analyse ainsi que la prise de décision.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="w-full">
              <img src="/images/geoportal_image_1.webp" alt="Géoportail Umbrella" className="w-full h-auto rounded-lg" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section className="py-20 md:py-32 border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">
              Fonctionnalités
            </p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-16">
              Fonctionnalités et capacités clés du Géoportail
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-px bg-black/10">
            {keyFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={i + 1}>
                  <div className="bg-white p-8 md:p-10 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default h-full">
                    <Icon
                      size={28}
                      className="text-black/40 group-hover:text-white/60 transition-colors mb-6"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-serif text-xl tracking-tight mb-3">{feature.title}</h3>
                    <p className="text-sm font-light leading-relaxed text-black/50 group-hover:text-white/50 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <Reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">
                  Guide
                </p>
                <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">
                  Ce que vous pouvez faire avec le géoportail
                </h2>
                <p className="text-sm font-light leading-relaxed text-black/60">
                  Commencer en quelques étapes :
                </p>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div className="space-y-0">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.label}
                      className={`flex items-start gap-4 py-5 ${
                        i < steps.length - 1 ? 'border-b border-black/10' : ''
                      }`}
                    >
                      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center border border-black/15 text-[11px] font-semibold text-black/40">
                        {i + 1}
                      </span>
                      <div className="flex items-start gap-3">
                        <Icon size={16} className="text-black/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p className="text-sm font-light leading-relaxed text-black/60">{step.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
