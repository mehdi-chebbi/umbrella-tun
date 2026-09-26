import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight, BarChart3, TrendingUp, Filter, Eye, Layers, Leaf, Users, Sun, Globe, Image } from 'lucide-react';

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

/* ─── OS Indicators ─── */
const osIndicators = [
  {
    id: 'OS 1',
    label: 'Écosystèmes',
    title: 'OS 1 (Écosystèmes) : Améliorer les écosystèmes affectés et promouvoir la gestion durable des terres',
    icon: Leaf,
    indicators: [
      'OS 1-1 – Tendances de l\u2019occupation des terres (ou couverture terrestre)',
      'OS 1-2 – Tendances de la productivité ou du fonctionnement des terres',
      'OS 1-3 – Tendances des stocks de carbone au-dessus et au-dessous du sol',
      'OS 1-4 – Proportion des terres dégradées par rapport à la superficie totale des terres (indicateur ODD 15.3.1)',
    ],
  },
  {
    id: 'OS 2',
    label: 'Populations',
    title: 'OS 2 (Populations) : Améliorer les conditions de vie des populations affectées',
    icon: Users,
    indicators: [
      'OS 2-1 – Tendances de la population vivant sous le seuil de pauvreté relative ou des inégalités de revenus dans les zones affectées',
      'OS 2-2 – Tendances de l\u2019accès à l\u2019eau potable dans les zones affectées',
      'OS 2-3 – Tendances de la proportion de la population exposée à la dégradation des terres, ventilée par sexe',
    ],
  },
  {
    id: 'OS 3',
    label: 'Sécheresse',
    title: 'OS 3 (Sécheresse) : Atténuer les effets de la sécheresse afin de renforcer la résilience',
    icon: Sun,
    indicators: [
      'OS 3-1 – Tendances de la proportion des terres touchées par la sécheresse par rapport à la superficie totale',
      'OS 3-2 – Tendances de la proportion de la population exposée à la sécheresse',
      'OS 3-3 – Tendances du degré de vulnérabilité à la sécheresse',
    ],
  },
  {
    id: 'OS 4',
    label: 'Bénéfices environnementaux',
    title: 'OS 4 (Bénéfices environnementaux) : Générer des bénéfices environnementaux mondiaux à travers la mise en œuvre de la Convention',
    icon: Globe,
    indicators: [
      'OS 4-1 – Tendances des stocks de carbone au-dessus et en dessous du sol',
      'OS 4-2 – Tendances de l\u2019abondance et de la répartition des espèces sélectionnées',
      'OS 4-3 – Tendances de la couverture des aires protégées dans les zones importantes pour la biodiversité',
    ],
  },
];

/* ─── Fonctionnalités ─── */
const fonctionnalites = [
  { icon: BarChart3, text: 'Analyse aux niveaux local, régional et national' },
  { icon: TrendingUp, text: 'Visualisation des tendances à travers des séries temporelles' },
  { icon: Filter, text: 'Outils personnalisés de filtrage et de comparaison' },
  { icon: Eye, text: 'Graphiques et visualisations interactives pour une exploration approfondie des données' },
  { icon: Layers, text: 'Vues thématiques alignées sur les Objectifs Stratégiques (OS) de la CNULCD' },
];

/* ─── Pourquoi important ─── */
const pourquoiImportant = [
  'Comprendre les tendances et les dynamiques de la DT au fil du temps',
  'Suivre les progrès vers la NDT à travers l\u2019indicateur ODD 15.3.1',
  'Soutenir les processus nationaux de rapportage et de planification',
  'Générer des visualisations personnalisées pour faciliter la prise de décision fondée sur les données',
];

/* ─── Page ─── */
export default function TableauDeBord() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />

      {/* ── Hero ── */}
      <section className="min-h-[60vh] flex items-center bg-black text-white py-24 md:py-32 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-white/15 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-white/15 pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4">
            Tableau de bord
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.1] tracking-tight mb-6">
            Tableau de bord sur la NDT en Tunisie
          </h1>
          <p className="font-serif text-lg md:text-xl text-white/60 tracking-tight mb-6">
            Dégradation des terres et indicateurs de l&apos;ODD 15.3.1
          </p>
          <div className="w-9 h-0.5 bg-white/20 my-6" />
          <div className="space-y-5 text-base font-light leading-relaxed text-white/50">
            <p>
              Analysez l&apos;indicateur ODD 15.3.1, explorez les tendances et évaluez les progrès réalisés en termes de{' '}
              <a href="https://catalogue.unccd.int/877_LDN_TS%20_FRE.pdf" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                Neutralité en matière de Dégradation des Terres (NDT)
              </a>{' '}
              en Tunisie.
            </p>
            <p>
              Le Tableau de bord met à disposition des outils interactifs de visualisation des données pour le suivi de la dégradation des terres en Tunisie. Il permet aux utilisateurs d&apos;explorer, d&apos;analyser et d&apos;interpréter les principaux indicateurs liés à la{' '}
              <a href="https://catalogue.unccd.int/877_LDN_TS%20_FRE.pdf" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                NDT
              </a>{' '}
              et à l&apos;{' '}
              <a href="https://docs.trends.earth/fr/1.0.10/background/understanding_indicators15.html" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                Indicateur ODD 15.3.1
              </a>.
            </p>
            <p>
              Il offre également la possibilité de visualiser des ressources thématiques alignées sur les cinq Objectifs Stratégiques (OS) de la{' '}
              <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                Convention des Nations Unies sur la lutte contre la désertification (CNULCD)
              </a>
              , fournissant ainsi une perspective structurée et pertinente pour l&apos;élaboration des politiques relatives à la dynamique de dégradation des terres.
            </p>
            <p>
              Grâce à des graphiques dynamiques, des outils de comparaison et des visualisations interactives, le Tableau de bord soutient l&apos;analyse fondée sur des données probantes et facilite la prise de décision aux niveaux local, régional et national.
            </p>
          </div>
        </div>
      </section>

      {/* ── Principaux indicateurs OS ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">
                Principaux indicateurs liés aux cinq Objectifs Stratégiques (OS) de la CNULCD
              </h2>
              <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 mb-10 max-w-3xl">
                <p>
                  Le Tableau de bord intègre des indicateurs clés répartis selon les{' '}
                  <a href="https://prais4-reporting-manual.unccd.int/fr/2022/introduction.html" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                    Objectifs Stratégiques (OS)
                  </a>{' '}
                  de la{' '}
                  <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                    CNULCD
                  </a>{' '}
                  et utilisés pour le suivi de la dégradation des terres ainsi que pour l&apos;élaboration des rapports sur la NDT :
                </p>
              </div>

              {/* OS sections */}
              <div className="space-y-0">
                {osIndicators.map((os, i) => {
                  const Icon = os.icon;
                  return (
                    <div
                      key={os.id}
                      className={`py-6 ${i < osIndicators.length - 1 ? 'border-b border-black/10' : ''}`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-black text-white text-[10px] font-bold">
                          {os.id.replace('OS ', '')}
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40 mb-1">{os.label}</p>
                          <h3 className="font-serif text-base md:text-lg tracking-tight text-black/80">{os.title}</h3>
                        </div>
                      </div>
                      <ul className="ml-12 space-y-2">
                        {os.indicators.map((ind) => (
                          <li key={ind} className="flex items-start gap-2">
                            <ArrowRight size={12} className="text-black/25 flex-shrink-0 mt-1" strokeWidth={1.5} />
                            <span className="text-sm font-light leading-relaxed text-black/60">{ind}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Conclusion */}
              <div className="mt-10 pt-8 border-t border-black/10">
                <p className="text-sm font-light leading-relaxed text-black/60 max-w-3xl">
                  Ces objectifs contribuent directement à la cible 15.3 des Objectifs de Développement Durable (ODD), avec un accent particulier sur la Neutralité en matière de Dégradation des Terres (NDT), la résilience à la sécheresse et la mobilisation des ressources.
                </p>
              </div>

              <div className="mt-10 w-full">
                <img src="/images/tableau_bord_image_1.webp" alt="Tableau de bord NDT" className="w-full h-auto rounded-lg" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Fonctionnalités du Tableau de bord ── */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">
              Fonctionnalités
            </p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-16">
              Fonctionnalités du Tableau de bord
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-px bg-black/10">
            {fonctionnalites.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <Reveal key={feat.text} delay={i + 1}>
                  <div className="bg-white p-8 md:p-10 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default h-full">
                    <Icon
                      size={28}
                      className="text-black/40 group-hover:text-white/60 transition-colors mb-6"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm font-light leading-relaxed text-black/60 group-hover:text-white/50 transition-colors">
                      {feat.text}
                      {i === fonctionnalites.length - 1 && (
                        <>
                          {' '}de la{' '}
                          <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 group-hover:text-white/80 hover:text-white transition-colors">
                            CNULCD
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pourquoi ce Tableau de bord est important ── */}
      <section className="py-20 md:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-3">
                Importance
              </p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">
                Pourquoi ce Tableau de bord est important
              </h2>
              <p className="text-base font-light leading-relaxed text-white/50 mb-12">
                Le Tableau de bord transforme des ensembles de données complexes en visualisations claires et interactives, permettant aux utilisateurs de :
              </p>
            </Reveal>

            <div className="space-y-0">
              {pourquoiImportant.map((item, i) => (
                <Reveal key={item} delay={i + 1}>
                  <div className={`flex items-start gap-4 py-5 ${i < pourquoiImportant.length - 1 ? 'border-b border-white/10' : ''}`}>
                    <ArrowRight size={16} className="text-white/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm font-light leading-relaxed text-white/60">
                      {i === 1 ? (
                        <>
                          Suivre les progrès vers la NDT à travers l&apos;{' '}
                          <a href="https://docs.trends.earth/fr/1.0.10/background/understanding_indicators15.html" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                            indicateur ODD 15.3.1
                          </a>
                        </>
                      ) : (
                        item
                      )}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
