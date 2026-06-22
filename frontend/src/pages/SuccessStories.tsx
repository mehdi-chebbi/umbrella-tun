import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight, Shield, Sprout, TreePine, Droplets, Leaf, Sun, Globe, Recycle, BarChart3 } from 'lucide-react';

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

/* ─── Actions & Mesures ─── */
const actions = [
  {
    icon: Shield,
    text: (
      <>
        Le{' '}
        <a href="https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Plan d&apos;Action National de Lutte contre la Désertification (PAN-LCD)
        </a>{' '}
        couvrant la période 2018-2030.
      </>
    ),
  },
  {
    icon: Sprout,
    text: (
      <>
        La{' '}
        <a href="https://www.cbd.int/doc/world/tn/tn-nbsap-v3-fr.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Stratégie de la biodiversité (2018-2030)
        </a>
        , visant à renforcer les actions de protection, de restauration et d&apos;amélioration de la résilience des écosystèmes ainsi que des services écosystémiques.
      </>
    ),
  },
  {
    icon: TreePine,
    text: (
      <>
        La{' '}
        <a href="https://www.onagri.nat.tn/uploads/docagri/1-Forets.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Stratégie forêts et parcours
        </a>
        , destinée à préserver 47 500 hectares de forêts aménagées, 150 000 hectares de parcours collectifs prioritaires et 75 000 hectares de nappes alfatières.
      </>
    ),
  },
  {
    icon: Droplets,
    text: (
      <>
        La{' '}
        <a href="https://catalog.agridata.tn/dataset/rapport-final-strategie-de-conservation-des-eaux-et-du-sol/resource/494009b2-03d1-4b2b-9aee-18519956e28a" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Stratégie de Conservation des Eaux et des Sols (CES)
        </a>{' '}
        visant à protéger les terres contre l&apos;érosion hydrique et les barrages contre l&apos;envasement, à travers l&apos;élaboration et la mise en œuvre de projets d&apos;aménagement et de conservation des eaux et des sols en faveur d&apos;agroécosystèmes durables.
      </>
    ),
  },
  {
    icon: Leaf,
    text: (
      <>
        La{' '}
        <a href="https://www.environnement.gov.tn/developpement-durable/concretisation-du-developpement-durable-dans-les-plans-et-les-strategies-de-developpement/strategies-nationales-deconomies-verte-bleue-et-circulaire-en-tunisie" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Stratégie Économie Verte
        </a>
        , qui contribue à renforcer la gestion durable et adaptative des ressources forestières et pastorales grâce à des actions de lutte contre les feux de forêt, de reboisement, de réduction du surpâturage et d&apos;aménagement forestier.
      </>
    ),
  },
  {
    icon: Sun,
    text: (
      <>
        Le{' '}
        <a href="https://www.unccd.int/sites/default/files/country_profile_documents/Drought_Management_Plan_Tunisia_Final.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Plan national de la sécheresse
        </a>
        , visant à améliorer les dispositifs de surveillance et de prévision de la sécheresse ainsi qu&apos;à renforcer la résilience des écosystèmes et des communautés.
      </>
    ),
  },
  {
    icon: Globe,
    text: (
      <>
        Les{' '}
        <a href="https://unfccc.int/sites/default/files/NDC/2022-06/Tunisia%20Update%20NDC-french.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Contributions Nationales Déterminées (CDN)
        </a>
        , actualisées en 2021, intégrant des plans d&apos;action climatiques destinés à surveiller, protéger, réhabiliter et rationaliser l&apos;utilisation des ressources naturelles, tout en contribuant à l&apos;atteinte de la Neutralité en matière de Dégradation des Terres (NDT).
      </>
    ),
  },
  {
    icon: Droplets,
    text: (
      <>
        La{' '}
        <a href="https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Synthese-Eau-2050.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Stratégie Eau 2050
        </a>
        , mise en œuvre à travers plusieurs initiatives visant notamment :
      </>
    ),
    subItems: [
      'La gestion durable des zones humides',
      'L\u2019optimisation de l\u2019irrigation et de l\u2019efficience hydrique',
      'La valorisation et la réutilisation des eaux usées traitées',
      'La modernisation et la réhabilitation des périmètres publics irrigués',
      'L\u2019amélioration de la valorisation de l\u2019eau verte en agriculture pluviale',
      'Le dessalement des eaux saumâtres pour l\u2019irrigation complémentaire déficitaire des oliveraies en zones arides',
    ],
  },
  {
    icon: Recycle,
    text: (
      <>
        Les{' '}
        <a href="https://www.environnement.gov.tn/tunisie-environnement/les-changements-climatiques/engagements-et-priorites-de-la-tunisie-en-vertu-de-laccord-de-paris-sur-le-climat" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Mesures d&apos;Atténuation Appropriées au niveau National
        </a>{' '}
        (Nationally Appropriate Mitigation Actions, NAMAs), notamment à travers la promotion de l&apos;agriculture de conservation, de l&apos;agriculture biologique, de la culture des légumineuses et de la régénération artificielle des forêts.
      </>
    ),
  },
  {
    icon: BarChart3,
    text: (
      <>
        La{' '}
        <a href="https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/SNTE_version_FR.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
          Stratégie Nationale Transition écologique
        </a>
        , mise en œuvre à travers plusieurs initiatives portant sur :
      </>
    ),
    subItems: [
      'Le renforcement des capacités d\u2019adaptation et de résilience face au changement climatique afin de réduire l\u2019intensité de la dégradation des terres et d\u2019atteindre la NDT à l\u2019horizon 2050',
      'Le reboisement et la protection contre les incendies de forêt',
      'Le développement de modèles d\u2019adaptation et de résilience climatique, notamment dans les îles Kerkennah',
      'La mise en place de programmes d\u2019économie d\u2019eau et de réduction des pertes',
      'La cartographie des zones agricoles, y compris les zones favorables à l\u2019agroécologie et à l\u2019agroforesterie',
      'La mise en œuvre d\u2019un plan d\u2019action pour le développement durable des oasis traditionnelles',
    ],
  },
];

/* ─── Réalisations ─── */
const realisations = [
  "L\u2019identification et la caractérisation des principaux hotspots de dégradation des terres en collaboration avec les principaux acteurs nationaux",
  "La cartographie des institutions nationales et des parties prenantes intervenant dans le suivi de la dégradation et de la restauration des terres en Tunisie",
  <>
    L&apos;identification du portefeuille de projets prioritaires du{' '}
    <a href="https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
      Plan d&apos;Action National de Lutte contre la Désertification (PAN-LCD)
    </a>{' '}
    ainsi que des opportunités stratégiques liées au processus NDT
  </>,
  "La mise en place d\u2019une base de données géospatiales et d\u2019indicateurs thématiques dédiés au suivi de la dégradation des terres et au rapportage de la NDT",
  "L\u2019évaluation de la dégradation des terres au niveau des hotspots identifiés, sur la base de l\u2019approche de l\u2019indicateur ODD 15.3.1",
  "L\u2019élaboration du rapport national sur la NDT en Tunisie, en cohérence avec les objectifs stratégiques de la CNULCD",
  "Le renforcement des capacités techniques des parties prenantes impliquées dans le processus de suivi et de rapportage",
];

/* ─── Page ─── */
export default function SuccessStories() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />

      {/* ── Hero ── */}
      <section className="min-h-[60vh] flex items-center bg-black text-white py-24 md:py-32 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-white/15 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-white/15 pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4">
            Acquis et success stories
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.1] tracking-tight mb-6">
            Actions et mesures phares pour l&apos;atteinte de la NDT
          </h1>
          <div className="w-9 h-0.5 bg-white/20 my-6" />
          <div className="space-y-5 text-base font-light leading-relaxed text-white/50">
            <p>
              En vue d&apos;atteindre la Neutralité en matière de Dégradation des Terres, la Tunisie a adopté une diversité de stratégies et d&apos;activités visant à éviter, réduire et atteindre la stabilité des terres dégradées.
            </p>
            <p>
              Ces actions ont essentiellement porté sur les initiatives suivantes.
            </p>
          </div>
        </div>
      </section>

      {/* ── Actions et mesures ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <div className="space-y-0">
                {actions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={i}
                      className={`py-6 ${i < actions.length - 1 ? 'border-b border-black/10' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-black/5 text-black/40">
                          <Icon size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-light leading-relaxed text-black/70">
                            {action.text}
                          </p>
                          {action.subItems && (
                            <ul className="mt-4 ml-1 space-y-2">
                              {action.subItems.map((sub) => (
                                <li key={sub} className="flex items-start gap-2 text-sm font-light leading-relaxed text-black/50">
                                  <span className="text-black/25 mt-1.5 flex-shrink-0">○</span>
                                  <span>{sub}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Réalisations et histoires à succès ── */}
      <section className="py-20 md:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-3">
                Réalisations
              </p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">
                Réalisations et histoires à succès
              </h2>
              <p className="font-serif text-lg md:text-xl text-white/60 tracking-tight mb-8">
                Résultats et impacts du Projet Umbrella en Tunisie
              </p>
              <div className="w-9 h-0.5 bg-white/20 mb-8" />
              <div className="space-y-5 text-base font-light leading-relaxed text-white/50 mb-12">
                <p>
                  La mise en œuvre du Projet Umbrella en Tunisie a principalement porté sur le renforcement du système national de suivi et de rapportage de la Neutralité en matière de Dégradation des Terres (NDT), conformément aux exigences et aux normes de la Convention des Nations Unies sur la Lutte contre la Désertification (CNULCD).
                </p>
                <p>
                  Cette dynamique a été soutenue par plusieurs actions majeures menées avec succès, notamment :
                </p>
              </div>
            </Reveal>

            <div className="space-y-0">
              {realisations.map((item, i) => (
                <Reveal key={i} delay={i + 1}>
                  <div className={`flex items-start gap-4 py-5 ${i < realisations.length - 1 ? 'border-b border-white/10' : ''}`}>
                    <ArrowRight size={16} className="text-white/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm font-light leading-relaxed text-white/60">{item}</p>
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
