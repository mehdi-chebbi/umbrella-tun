import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ShieldOff, Minimize2, RotateCcw, ArrowRight, MapPin, TreePine, Wheat, Sun, Palmtree, Layers, Target, Leaf, Droplets, Quote, Landmark, Handshake, Globe } from 'lucide-react';

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

/* ─── NDT Principles ─── */
const ndtPrinciples = [
  {
    icon: ShieldOff,
    label: 'Éviter',
    description: "Prévenir en amont toute nouvelle dégradation des sols (par exemple via une planification rigoureuse de l'aménagement du territoire).",
  },
  {
    icon: Minimize2,
    label: 'Réduire',
    description: "Minimiser les impacts négatifs de l'exploitation agricole, industrielle ou urbaine sur les terres encore en bonne santé.",
  },
  {
    icon: RotateCcw,
    label: 'Inverser (Restaurer)',
    description: "Réhabiliter les terres déjà dégradées pour restaurer leur biodiversité, leur fertilité et leur capacité de stockage du carbone.",
  },
];

/* ─── Strategic frameworks ─── */
const strategicFrameworks = [
  {
    title: "Plan d'Action National pour la Lutte contre la Désertification 2018-2030 (PAN-LCD)",
    url: 'https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf',
  },
  {
    title: "Stratégie et Plan d'Action Nationaux pour la Biodiversité 2018-2030",
    url: 'https://www.cbd.int/doc/world/tn/tn-nbsap-oth-fr.pdf',
  },
  {
    title: 'Stratégie Nationale de Développement et Gestion Durable des Forêts et Parcours 2015-2024',
    url: 'https://onagri.home.blog/2022/02/14/strategie-nationale-de-developpement-et-de-gestion-durable-des-forets-et-des-parcours-2015-2024/',
  },
  {
    title: "Stratégie d'Aménagement et de Conservation des Terres Agricoles à l'horizon 2050",
    url: 'https://www.onagri.nat.tn/uploads/docagri/167-AG.pdf',
  },
  {
    title: "Stratégie Nationale de l'Économie Verte",
    url: 'https://www.environnement.gov.tn/developpement-durable/concretisation-du-developpement-durable-dans-les-plans-et-les-strategies-de-developpement/strategies-nationales-deconomies-verte-bleue-et-circulaire-en-tunisie',
  },
  {
    title: 'Plan National Sécheresse',
    url: 'https://www.unccd.int/sites/default/files/country_profile_documents/Drought_Management_Plan_Tunisia_Final.pdf',
  },
  {
    title: 'Contribution Déterminée au Niveau National (CDN actualisée en 2021)',
    url: 'https://unfccc.int/sites/default/files/NDC/2022-06/Tunisia Update NDC-french.pdf',
  },
  {
    title: 'Stratégie Eau 2050',
    url: 'https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Synthese-Eau-2050.pdf',
  },
  {
    title: 'National Appropriate Mitigation Action/Agriculture (NAMA)',
    url: 'https://unfccc.int/sites/default/files/NDC/2022-06/INDC-Tunisia-English Version.pdf',
  },
  {
    title: 'Stratégie Nationale de la Transition Écologique',
    url: 'https://www.environnement.gov.tn/la-strategie-nationale-de-transition-ecologique/la-strategie-nationale-de-transition-ecologique',
  },
];

/* ─── Hotspots table ─── */
const hotspots = [
  { icon: TreePine, zone: "L'écosystème forestier du Nord", delegations: ['Aïn Draham', 'Fernana'] },
  { icon: Wheat, zone: "L'agrosystème grande cultures-arboriculture en sec du nord et centre-nord", delegations: ['Kef Est', 'Dahmani', 'Sers'] },
  { icon: Sun, zone: "L'agroécosystème complexe : cultures intensives irriguées-arboriculture-parcours", delegations: ['Sidi Bouzid Est', 'Jelma', 'Regueb'] },
  { icon: Palmtree, zone: 'Les systèmes agro-pastoraux du sud', delegations: ['Sidi Makhlouf', 'Médenine Sud', 'Ben Gardane'] },
  { icon: Palmtree, zone: 'Les systèmes oasiens', delegations: ['Souk Lahad'] },
];

/* ─── NDT sub-indicators ─── */
const subIndicators = [
  {
    icon: Layers,
    title: 'Le changement de couverture des terres',
    description: 'qui permet de suivre les transitions entre les forêts, les terres cultivées, les prairies et les autres types d\'occupation des sols',
  },
  {
    icon: Target,
    title: 'La dynamique de la productivité des terres',
    description: "qui mesure l'état de la végétation et la productivité biologique",
  },
  {
    icon: Droplets,
    title: 'Le carbone organique des sols',
    description: 'qui renseigne sur la qualité des sols et leur capacité de stockage du carbone',
  },
];

/* ─── CNV objectives ─── */
const cnvObjectives = [
  "Stopper la conversion des forêts, des prairies et des parcours steppiques en terres cultivées, notamment à travers la restauration de 738 600 hectares, y compris la réhabilitation de 177 200 hectares de terres non viabilisées",
  "Améliorer la productivité des forêts, des arbustes, des prairies, des zones à végétation clairsemée, des parcours steppiques et des terres cultivées en déclin ou présentant des signes de dégradation sur environ 1,45 million d'hectares",
  "Renforcer la séquestration du carbone sur 177 200 hectares grâce à diverses techniques, telles que le reboisement, l'agriculture durable et l'apport de matière organique",
];

/* ─── PAN-LCD strategic orientations ─── */
const panlcdOrientations = [
  "Les écosystèmes, la lutte contre la désertification (LCD) et la NDT",
  "L'amélioration des conditions de vie des populations touchées",
  "Les bénéfices environnementaux globaux",
  "La mobilisation des ressources financières et non financières",
];

/* ─── Institutional achievements ─── */
const institutionalAchievements = [
  {
    title: "Le Plan d'Action National de Lutte contre la Désertification (PAN-LCD)",
    description: "complété par des plans régionaux et locaux",
    url: 'https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf',
  },
  {
    title: "Le Conseil National de la Désertification (CND)",
    description: "organe national de coordination des actions de lutte contre la désertification, présidé par le ministre chargé de l'Environnement",
  },
  {
    title: "Les groupes de travail sur la NDT",
    description: "placés sous la responsabilité du Ministère de l'Environnement et associant des représentants des structures gouvernementales et non gouvernementales",
  },
  {
    title: "Les initiatives d'appui à la NDT",
    description: "mises en œuvre avec le soutien technique et financier de plusieurs partenaires internationaux, notamment l'AFD, la FAO, le FIDA, le PNUD, la GIZ, la BAD, le WWF et l'OSS",
  },
];

/* ─── Key initiatives ─── */
const keyInitiatives = [
  "Le Programme d'Adaptation au Changement Climatique des Territoires (PACTE)",
  "Le Projet de Protection et de Réhabilitation des Sols Dégradés en Tunisie (PROSOL), mis en œuvre par la Direction Générale de l'Aménagement et de la Conservation des Terres Agricoles (DGACTA) relevant du Ministère de l'Agriculture, des Ressources Hydrauliques et de la Pêche (MARHP)",
  "Le Projet de Gestion Intégrée des Paysages Forestiers (PGIPF), mis en œuvre par la Direction Générale des Forêts (DGF)",
];

/* ─── Faits marquants ─── */
const faitsMarquants = [
  {
    number: 1,
    title: "Ratification précoce de la Convention des Nations Unies sur la lutte contre la désertification",
    content: "La Tunisie figure parmi les premiers pays à avoir ratifié la Convention des Nations Unies sur la Lutte contre la Désertification (CNULCD/UNCCD). Dès 1998, le pays a élaboré son Plan d'Action National de Lutte contre la Désertification (PAN-LCD).",
    url: 'https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf',
  },
  {
    number: 2,
    title: "Adoption d'une stratégie alignée sur les Objectifs de Développement Durable",
    content: "La Tunisie a révisé son PAN-LCD afin de l'aligner sur le cadre stratégique 2018-2030 de la CNULCD ainsi que sur l'Objectif de Développement Durable (ODD) 15, notamment la cible 15.3 relative à la Neutralité en matière de Dégradation des Terres (NDT).",
  },
  {
    number: 3,
    title: "Définition d'un objectif national de NDT à l'horizon 2030",
    content: "Le pays s'est fixé une cible volontaire ambitieuse consistant à restaurer ou neutraliser la dégradation des terres sur environ 2,2 millions d'hectares d'ici 2030.",
  },
  {
    number: 4,
    title: "Lancement de grands projets de restauration des terres",
    content: "Plusieurs projets structurants ont été lancés ces dernières années, notamment :",
    subItems: [
      "Le Projet PARFD (Projet d'agroforesterie et de restauration des paysages forestiers dégradés), soutenu par la Banque africaine de développement, visant la restauration de 33 200 hectares à l'horizon 2050",
      "Le Projet ProSol (2019-2025), mis en œuvre avec l'appui de la coopération allemande (GIZ) dans plusieurs gouvernorats du Nord-Ouest et du Centre-Ouest afin de protéger et restaurer les sols agricoles dégradés",
      "Les programmes PACTE, PGIPF et d'autres initiatives nationales de restauration des écosystèmes",
    ],
  },
  {
    number: 5,
    title: "Promotion de l'agroforesterie et des solutions fondées sur la nature",
    content: "La Tunisie renforce progressivement le recours à des approches durables telles que :",
    subItems: [
      "L'agroforesterie",
      "La restauration des paysages forestiers",
      "La gestion durable des sols et de l'eau",
      "La valorisation des plantes aromatiques et médicinales",
      "Les approches agroécologiques",
    ],
  },
  {
    number: 6,
    title: "Renforcement des capacités institutionnelles et scientifiques",
    content: "Le pays a consolidé la coopération entre plusieurs institutions nationales, notamment la DGACTA, la Direction Générale des Forêts, l'Institut des Régions Arides (IRA), l'ANPE, l'INM et le CNCT. Des systèmes de suivi de la dégradation des terres fondés sur la télédétection et les données climatiques ont également été développés.",
  },
  {
    number: 7,
    title: "Mise en œuvre d'un Plan National de la Sécheresse",
    content: "Depuis 2020, la Tunisie dispose d'un Plan National de la Sécheresse visant à renforcer la résilience des territoires ruraux face à la multiplication des épisodes de sécheresse.",
  },
  {
    number: 8,
    title: 'Projet national de « Ceinture verte »',
    content: "Le gouvernement tunisien a annoncé le lancement, à partir de 2026, d'un vaste programme national de reboisement appelé « Ceinture verte », destiné à :",
    subItems: [
      "Freiner l'avancée de la désertification",
      "Restaurer les écosystèmes dégradés",
      "Améliorer la biodiversité",
    ],
  },
  {
    number: 9,
    title: "Mobilisation des communautés locales",
    content: "Plusieurs initiatives récentes mettent l'accent sur l'implication des populations rurales dans la gestion durable des ressources naturelles et des terres.",
  },
  {
    number: 10,
    title: "Renforcement de la coopération internationale",
    content: "La Tunisie développe une coopération active avec plusieurs partenaires internationaux, notamment la FAO, la BAD, la GIZ, l'OSS, les Nations Unies ainsi que plusieurs pays africains et méditerranéens, autour des solutions de gestion durable des terres et des ressources en eau.",
  },
];

/* ─── Page ─── */
export default function NDTTunisie() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />

      {/* ── Hero ── */}
      <section className="min-h-[60vh] flex items-center bg-black text-white py-24 md:py-32 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-white/15 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-white/15 pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4">NDT en Tunisie</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.1] tracking-tight mb-6">
            Qu&apos;est-ce que la Neutralité en matière de Dégradation des Terres ?
          </h1>
          <div className="w-9 h-0.5 bg-white/20 my-6" />
          <p className="text-base font-light leading-relaxed text-white/50">
            La Neutralité en matière de Dégradation des Terres est un objectif mondial visant à maintenir ou à améliorer la quantité et la qualité des ressources foncières. La NDT est un axe majeur de la Convention des Nations Unies sur la lutte contre la désertification (CNULD) et constitue la{' '}
            <a href="https://odd-dashboard.cd/15/" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
              cible 15.3 des Objectifs de Développement Durable (ODD)
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── Three Principles ── */}
      <section className="py-20 md:py-32 border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">Principes</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-16">Les trois principes fondamentaux de la NDT</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-px bg-black/10">
            {ndtPrinciples.map((principle, i) => {
              const Icon = principle.icon;
              return (
                <Reveal key={principle.label} delay={i + 1}>
                  <div className="bg-white p-8 md:p-10 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <Icon size={24} className="text-black/40 group-hover:text-white/60 transition-colors" strokeWidth={1.5} />
                      <h3 className="font-serif text-2xl tracking-tight">{principle.label}</h3>
                    </div>
                    <p className="text-sm font-light leading-relaxed text-black/50 group-hover:text-white/50 transition-colors">{principle.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Strategic Frameworks ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">Aperçu des principaux cadres stratégiques mis en œuvre en Tunisie</h2>
              <p className="text-sm font-light leading-relaxed text-black/60 mb-10 max-w-3xl">
                En Tunisie, plusieurs cadres stratégiques nationaux relatifs à la lutte contre la dégradation des terres et à la restauration des écosystèmes ont été élaborés et mis en œuvre. Parmi les principaux dispositifs figurent notamment :
              </p>
              <div className="space-y-0">
                {strategicFrameworks.map((framework, i) => (
                  <div key={framework.title} className={`flex items-start gap-4 py-4 ${i < strategicFrameworks.length - 1 ? 'border-b border-black/10' : ''}`}>
                    <ArrowRight size={14} className="text-black/30 flex-shrink-0 mt-1" strokeWidth={1.5} />
                    <a href={framework.url} target="_blank" rel="noopener noreferrer" className="text-sm font-light leading-relaxed text-black/70 hover:text-black hover:underline underline-offset-2 transition-colors">
                      {framework.title}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Image Placeholder ── */}
      <section className="py-20 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="w-full h-[300px] md:h-[450px] bg-black/5 border border-black/10 flex items-center justify-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/30">Image placeholder</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Hotspots ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-4">Hotspots</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">Zone d&apos;action du Projet Umbrella en Tunisie</h2>
            <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 max-w-3xl mb-12">
              <p>L&apos;étude de référence menée dans le cadre du Projet Umbrella par le Ministère tunisien de l&apos;Environnement, avec l&apos;appui de l&apos;Observatoire du Sahara et du Sahel (OSS), a permis d&apos;identifier cinq principaux hotspots nationaux de dégradation des terres.</p>
              <p>Ces hotspots représentent les différents agroécosystèmes ainsi que les principales formes de dégradation observées en Tunisie. Leur sélection et leur validation ont été réalisées par le groupe de travail NDT, placé sous la responsabilité du Ministère de l&apos;Environnement et associant des représentants des structures gouvernementales et non gouvernementales, ainsi que le{' '}
                <a href="https://www.environnement.gov.tn/tunisie-environnement/la-lutte-contre-la-desertification-et-la-degradation-des-terres/du-cote-institutionnel" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                  Conseil National de Lutte contre la Désertification (CNLCD)
                </a>.
              </p>
              <p>La répartition de ces hotspots selon les zones agroécologiques est présentée dans le tableau ci-dessous.</p>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="border-t-4 border-t-black bg-white shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60 px-6 py-4">Zones agroécologiques</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60 px-6 py-4">Hotspot ou Délégations choisis</th>
                  </tr>
                </thead>
                <tbody>
                  {hotspots.map((hotspot, i) => {
                    const Icon = hotspot.icon;
                    return (
                      <tr key={hotspot.zone} className={`${i < hotspots.length - 1 ? 'border-b border-black/10' : ''} ${i % 2 === 1 ? 'bg-stone-50' : 'bg-white'} hover:bg-black hover:text-white transition-colors duration-300`}>
                        <td className="px-6 py-5">
                          <div className="flex items-start gap-3">
                            <Icon size={18} className="text-black/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                            <span className="text-sm font-medium">{hotspot.zone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <ul className="space-y-1">
                            {hotspot.delegations.map((d) => (
                              <li key={d} className="flex items-center gap-2">
                                <MapPin size={12} className="text-black/30 flex-shrink-0" strokeWidth={1.5} />
                                <span className="text-sm font-light text-black/60">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Carte de situation des hotspots ── */}
      <section className="py-20 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-8">Carte de situation des hotspots du Projet Umbrella en Tunisie</h2>
            <div className="w-full h-[300px] md:h-[500px] bg-black/5 border border-black/10 flex items-center justify-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/30">Image placeholder</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Box 5: NDT et Cible Nationale Volontaire ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">NDT et Cible Nationale Volontaire en Tunisie</h2>
              <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 mb-10">
                <p>
                  La Cible Nationale Volontaire (CNV) de la Tunisie vise à atteindre la Neutralité en matière de Dégradation des Terres sur une superficie totale de 2,2 millions d&apos;hectares, répartie sur l&apos;ensemble du territoire national, d&apos;ici 2030.
                </p>
                <p>Le suivi de cette cible repose sur l&apos;évaluation de la NDT à travers trois sous-indicateurs clés :</p>
              </div>

              {/* Sub-indicators */}
              <div className="grid md:grid-cols-3 gap-px bg-black/10 mb-10">
                {subIndicators.map((ind, i) => {
                  const Icon = ind.icon;
                  return (
                    <div key={ind.title} className="bg-white p-6 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default h-full">
                      <Icon size={22} className="text-black/40 group-hover:text-white/60 transition-colors mb-4" strokeWidth={1.5} />
                      <h3 className="font-serif text-base tracking-tight mb-2">{ind.title}</h3>
                      <p className="text-xs font-light leading-relaxed text-black/50 group-hover:text-white/50 transition-colors">{ind.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 mb-10">
                <p>
                  Ces sous-indicateurs sont combinés afin de produire l&apos;{' '}
                  <a href="https://docs.trends.earth/fr/1.0.10/background/understanding_indicators15.html" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                    indicateur ODD 15.3.1
                  </a>{' '}
                  : « Proportion des terres dégradées par rapport à la superficie totale des terres ».
                </p>
                <p>La Cible Nationale Volontaire de la Tunisie a été définie afin de :</p>
              </div>

              {/* CNV Objectives */}
              <div className="space-y-0">
                {cnvObjectives.map((obj, i) => (
                  <div key={i} className={`flex items-start gap-4 py-5 ${i < cnvObjectives.length - 1 ? 'border-b border-black/10' : ''}`}>
                    <ArrowRight size={16} className="text-black/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm font-light leading-relaxed text-black/60">{obj}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Acquis et réalisations ── */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">Acquis</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-10">Acquis et réalisations en matière de lutte contre la désertification</h2>
          </Reveal>
          <Reveal>
            <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 max-w-3xl mb-12">
              <p>
                En Tunisie, la désertification et la dégradation des terres sont considérées comme des contraintes majeures au développement économique et social du pays. Dans ce contexte, la Tunisie a ratifié la Convention des Nations Unies sur la Lutte contre la Désertification (CNULCD) et a élaboré, dès 1998, son{' '}
                <a href="https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                  Plan d&apos;Action National de Lutte contre la Désertification (PAN-LCD)
                </a>.
              </p>
              <p>
                Ce plan a été actualisé en 2019 puis approuvé par le Conseil National de la Désertification (CND), organe rattaché au Ministère de l&apos;Environnement et du Développement Durable. Le{' '}
                <a href="https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                  PAN-LCD
                </a>{' '}
                définit la vision nationale en matière de lutte contre la désertification et d&apos;atteinte de la Neutralité en matière de Dégradation des Terres comme suit :
              </p>
            </div>
          </Reveal>

          {/* Fancy quote */}
          <Reveal>
            <div className="bg-black text-white py-16 md:py-20 px-8 md:px-16 mb-12 relative overflow-hidden">
              <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-white/15 pointer-events-none" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-white/15 pointer-events-none" />
              <Quote size={36} className="text-white/15 mb-6" strokeWidth={1} />
              <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl leading-snug tracking-tight mb-8 max-w-3xl">
                « Une Tunisie préservée contre la désertification, ayant atteint la Neutralité en matière de Dégradation des Terres et bâtie des écosystèmes résilients aux changements climatiques, servant de levier au développement socio-économique des territoires grâce à la participation de l&apos;ensemble des acteurs concernés. »
              </blockquote>
              <div className="w-12 h-0.5 bg-white/20" />
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mt-4">Vision nationale PAN-LCD</p>
            </div>
          </Reveal>

          {/* Strategic orientations */}
          <Reveal>
            <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 max-w-3xl mb-6">
              <p>
                Les orientations stratégiques retenues dans le cadre du nouveau{' '}
                <a href="https://www.environnement.gov.tn/fileadmin/Bibliotheque/SNTE/Rapport-Principal-PAN-LCD.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                  PAN-LCD
                </a>{' '}
                portent notamment sur :
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mb-16">
              {panlcdOrientations.map((orient) => (
                <span key={orient} className="px-4 py-2 border border-black/20 text-[11px] text-black/50 hover:bg-black hover:text-white hover:border-black transition-all duration-300 cursor-default">
                  {orient}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Principaux acquis institutionnels ── */}
      <section className="py-20 md:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">Dispositifs</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">Principaux acquis institutionnels et opérationnels</h2>
            <p className="text-sm font-light leading-relaxed text-white/50 max-w-3xl mb-12">
              Les acquis et réalisations de la Tunisie en matière de lutte contre la désertification peuvent être résumés par la mise en place et l&apos;opérationnalisation des dispositifs suivants :
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-px bg-white/10 mb-16">
            {institutionalAchievements.map((ach, i) => {
              const icons = [Landmark, Handshake, Globe, Leaf];
              const Icon = icons[i % icons.length];
              return (
                <Reveal key={ach.title} delay={i + 1}>
                  <div className="bg-black p-8 group hover:bg-white hover:text-black transition-colors duration-500 cursor-default h-full">
                    <Icon size={24} className="text-white/30 group-hover:text-black/40 transition-colors mb-4" strokeWidth={1.5} />
                    <h3 className="font-serif text-lg tracking-tight mb-3">
                      {ach.url ? (
                        <a href={ach.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
                          {ach.title}
                        </a>
                      ) : (
                        ach.title
                      )}
                    </h3>
                    <p className="text-sm font-light leading-relaxed text-white/50 group-hover:text-black/50 transition-colors">{ach.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Key initiatives */}
          <Reveal>
            <p className="text-sm font-light leading-relaxed text-white/50 mb-8">Parmi les principales initiatives engagées figurent notamment :</p>
            <div className="space-y-0 max-w-3xl">
              {keyInitiatives.map((init, i) => (
                <div key={i} className={`flex items-start gap-4 py-5 ${i < keyInitiatives.length - 1 ? 'border-b border-white/10' : ''}`}>
                  <ArrowRight size={16} className="text-white/30 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-sm font-light leading-relaxed text-white/60">{init}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Faits marquants ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">Faits marquants sur la lutte contre la dégradation des terres en Tunisie</h2>
              <p className="text-sm font-light leading-relaxed text-black/60 mb-10 max-w-3xl">
                La Tunisie a enregistré plusieurs avancées importantes dans la lutte contre la dégradation des terres et la désertification, un enjeu majeur puisque près de 80 % du territoire national est exposé à l&apos;aridité et aux effets du changement climatique.
              </p>
              <p className="text-sm font-light leading-relaxed text-black/60 mb-10">Les principaux faits marquants peuvent être résumés comme suit :</p>

              <div className="space-y-0">
                {faitsMarquants.map((fait) => (
                  <div key={fait.number} className="py-6 border-b border-black/10 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/30 flex-shrink-0 pt-1 min-w-[2rem]">
                        {fait.number}.
                      </span>
                      <div>
                        <h3 className="font-serif text-lg tracking-tight mb-2">{fait.title}</h3>
                        <p className="text-sm font-light leading-relaxed text-black/60">
                          {fait.content}
                          {fait.url && (
                            <>
                              {' '}
                              <a href={fait.url} target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                                (PAN-LCD)
                              </a>
                            </>
                          )}
                        </p>
                        {fait.subItems && (
                          <ul className="mt-3 ml-1 space-y-1.5">
                            {fait.subItems.map((sub) => (
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
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final Image Placeholder ── */}
      <section className="py-20 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="w-full h-[300px] md:h-[450px] bg-black/5 border border-black/10 flex items-center justify-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/30">Image placeholder</p>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
