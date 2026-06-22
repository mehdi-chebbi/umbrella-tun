import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Target, Map, Globe, TrendingUp, Droplets, Wind, TreePine, Fish, Leaf, ArrowRight, Landmark, Layers, Sprout, ShieldCheck, Users } from 'lucide-react';

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

/* ─── Platform features ─── */
const platformFeatures = [
  { icon: Target, title: 'Améliorer la précision du suivi des dynamiques de dégradation' },
  { icon: Map, title: 'Soutenir la planification territoriale et agricole' },
  { icon: Globe, title: 'Répondre aux exigences de rapportage international' },
  { icon: TrendingUp, title: "Renforcer la prise de décision pour l'atteinte de la NDT" },
];

/* ─── Degradation forms ─── */
const degradationForms = [
  { icon: Wind, label: "L'érosion hydrique et éolienne des sols" },
  { icon: Map, label: "L'ensablement" },
  { icon: Droplets, label: "La salinisation des sols" },
  { icon: TreePine, label: "Le défrichement des formations forestières" },
  { icon: Leaf, label: "Le surpâturage" },
  { icon: Fish, label: "La perte de biodiversité" },
  { icon: Target, label: "La perte de fertilité des sols" },
  { icon: Droplets, label: "L'envasement des barrages" },
];

/* ─── NDT Platform contributions ─── */
const ndtContributions = [
  "Améliorer la précision du suivi de la dégradation des terres aux niveaux local et national",
  "Soutenir la planification durable de l'utilisation des terres et la gestion agricole",
  "Faciliter la mesure et le rapportage des progrès accomplis vers la Neutralité en matière de Dégradation des Terres (NDT), notamment à travers l'indicateur ODD 15.3.1",
  "Renforcer la prise de décision fondée sur des données probantes pour les politiques environnementales et les stratégies de restauration",
];

/* ─── Box 2: Degradation factors ─── */
const degradationFactors = [
  {
    title: "Les changements d'affectation des terres",
    description:
      "Les changements d'affectation des terres ont fortement perturbé les équilibres des écosystèmes. La conversion des terres de parcours en terres cultivées a notamment favorisé leur dégradation et accentué les phénomènes de surpâturage.",
  },
  {
    title: "La dégradation du couvert végétal par défrichement",
    description:
      "Les défrichements des formations sylvopastorales, réalisés pour répondre aux besoins domestiques ou pour l'extension des terres agricoles, ont affecté une grande partie du territoire tunisien au fil des siècles.",
  },
  {
    title: "L'érosion hydrique",
    description:
      "L'érosion hydrique est particulièrement marquée dans les zones montagneuses, les piémonts, les glacis et le long des berges des oueds, principalement dans le Nord et le Centre du pays. Chaque année, ce phénomène entraîne la perte de l'équivalent de 10 000 hectares de sols et le transport d'environ 45 millions de tonnes de terres. Environ 45 % des terres tunisiennes sont fortement affectées par l'érosion hydrique.",
  },
  {
    title: "L'érosion éolienne",
    description:
      "L'érosion éolienne touche l'ensemble du territoire tunisien à des degrés variables. Les régions les plus vulnérables se situent dans le Centre et le Sud du pays, notamment dans les zones steppiques sableuses. Environ 45 % des terres sont fortement affectées par ce phénomène.",
  },
  {
    title: "La salinisation des sols",
    description:
      "Les pratiques d'irrigation non durables utilisées dans certaines zones agricoles ont contribué à la dégradation chimique des eaux et à l'augmentation de la salinisation des sols. Environ 3,4 % des terres sont fortement touchées par la salinisation.",
  },
  {
    title: "La surexploitation des nappes phréatiques",
    description:
      "La mobilisation intensive des ressources en eau pour l'irrigation a conduit à une surexploitation des nappes phréatiques, notamment dans les zones côtières où l'intrusion marine constitue une menace importante. Actuellement, le taux d'exploitation atteint environ 105 % pour les nappes phréatiques et 80 % pour les nappes profondes.",
  },
];

/* ─── Umbrella project results ─── */
const umbrellaResults = [
  "Le renforcement des mécanismes institutionnels de coordination et de gouvernance du rapportage",
  "L'actualisation et l'opérationnalisation des bases de données nationales relatives à la dégradation des terres et aux indicateurs de la NDT",
  "L'amélioration des dispositifs de communication, de mobilisation des parties prenantes et d'appropriation nationale des résultats du rapportage",
  "La consolidation du système de suivi des indicateurs de la CNULCD à travers la mise en place et l'opérationnalisation de la plateforme nationale de suivi de la dégradation des terres au profit des institutions nationales impliquées dans la lutte contre la désertification en Tunisie",
];

/* ─── Box 3: Actors ─── */
const actorsByMinistry = [
  {
    ministry: "Le Ministère de l'Environnement et du Développement Durable",
    subItems: [
      "La Direction Générale de l'Environnement et de la Qualité de la Vie (DGEQV)",
      "L'Observatoire Tunisien de l'Environnement et du Développement Durable (OTEDD)",
      "L'Agence National de la Protection de l'Environnement (ANPE)",
    ],
  },
  {
    ministry: "La Direction Générale des Affaires Régionales (DGAR) du Ministère de l'Intérieur et du Développement Local",
    subItems: [],
  },
  {
    ministry: "La Direction Générale de l'Infrastructure au Ministère du Développement et de la Coopération Internationale",
    subItems: [],
  },
  {
    ministry: "La Direction Générale des Dépenses d'Investissement au Ministère des Finances",
    subItems: [],
  },
  {
    ministry: "Le Ministère de l'Éducation et de la Formation",
    subItems: [],
  },
  {
    ministry: "Le Ministère de l'équipement, de l'habitat et de l'Aménagement du territoire, à travers la Direction Générale de l'Aménagement du Territoire",
    subItems: [],
  },
  {
    ministry: "Le Ministère de l'Emploi et de l'Insertion Professionnelle des Jeunes",
    subItems: [],
  },
  {
    ministry: "Le Ministère de l'Agriculture et des Ressources Hydrauliques",
    subItems: [
      "La Direction Générale des Forêts",
      "La Direction Générale de l'Aménagement et de la Conservation des Terres Agricoles",
      "La Direction Générale des Ressources en Eaux",
    ],
  },
  {
    ministry: "Le Ministère des Affaires Sociales, de la Solidarité et des Tunisiens à l'étranger",
    subItems: [],
  },
  {
    ministry: "Le Ministère du domaine de l'État et des affaires foncières",
    subItems: [],
  },
];

const independentActors = [
  "L'Union nationale de la Femme Tunisienne",
  "L'Office « Rgim Mâatoug »",
  "L'Institut de Recherche et des Études Supérieures Agricoles",
  "L'Institut des Régions Arides (IRA) de Médenine",
  "L'Institut National de Météorologie (INM)",
  "Le Point Focal National de la CNULCD",
  "La Direction Générale d'Aménagement et de la Conservation des Terres Agricoles (DGACTA)",
  "La Direction Générale des Forêts (DGF)",
  "Le Centre National de la Cartographie et de la Télédétection (CNCT)",
  "L'Institut National de la Météorologie (INM)",
  "L'Institut National de Statistique (INS)",
  "L'Institut des Régions Arides (IRA) de Médenine",
  "Les associations travaillant dans le domaine de la lutte contre la désertification, désignée périodiquement pour une durée de trois ans par décision du ministre chargé de l'environnement",
  "Etc.",
];

/* ─── Box 4: Priority projects ─── */
const priorityProjects = [
  {
    number: 1,
    title: "Restauration des nappes alfatières et promotion de la filière alfa en Tunisie centrale",
    description: "Ce projet vise à restaurer les nappes alfatières, composantes essentielles des écosystèmes steppiques, tout en développant la chaîne de valeur de l'alfa afin de créer des opportunités économiques pour les communautés locales. Régions concernées : Kasserine, Sidi Bouzid, Kairouan et Gafsa.",
  },
  {
    number: 2,
    title: "Gestion participative et durable des parcours collectifs dans le Sud-Est tunisien",
    description: "Cette initiative vise à promouvoir une gestion durable des parcours collectifs en impliquant les populations locales afin de préserver les ressources pastorales et renforcer leur résilience face aux changements climatiques.",
  },
  {
    number: 3,
    title: "Restauration et amélioration de la cogestion des subéraies de Jendouba et des pinèdes de pin d'Alep dans la dorsale tunisienne",
    description: "Le projet combine des actions de restauration écologique et des mécanismes de gouvernance participative afin de préserver des écosystèmes forestiers stratégiques tout en soutenant les moyens de subsistance des populations locales.",
  },
  {
    number: 4,
    title: "Développement des plantations de caroubiers et valorisation des caroubes dans le Nord et le Centre de la Tunisie",
    description: "Ce projet mise sur le potentiel économique du caroubier afin de diversifier les activités agricoles et contribuer à la lutte contre la dégradation des sols.",
  },
  {
    number: 5,
    title: "Valorisation et gestion durable des produits forestiers non ligneux dans le gouvernorat de Zaghouan",
    description: "Cette initiative soutient les femmes rurales et les ménages vulnérables à travers le développement d'activités génératrices de revenus basées sur les produits forestiers non ligneux.",
  },
  {
    number: 6,
    title: "Protection contre l'érosion et l'envasement dans le bassin versant de Sidi Salem",
    description: "L'objectif est de limiter l'érosion des sols et de promouvoir une gestion durable des ressources hydriques dans cette zone stratégique.",
  },
  {
    number: 7,
    title: "Recharge des nappes pour l'adaptation aux changements climatiques dans les zones semi-arides tunisiennes",
    description: "Ce projet explore des solutions innovantes de recharge des nappes phréatiques afin de renforcer la résilience hydrique des régions semi-arides.",
  },
  {
    number: 8,
    title: "Développement agricole et rural durable autour des lacs collinaires",
    description: "Cette initiative vise à promouvoir des approches agricoles durables afin de renforcer la sécurité alimentaire et restaurer les écosystèmes locaux.",
  },
  {
    number: 9,
    title: "Aménagement et développement territorial intégrés dans le gouvernorat de Jendouba",
    description: "Ce projet s'appuie sur l'opérationnalisation des PADIT (Projets d'Aménagement et de Développement Intégré du Territoire) afin de répondre aux enjeux écologiques, sociaux et économiques de la région.",
  },
  {
    number: 10,
    title: "Mise à l'échelle des bonnes pratiques agricoles pour la restauration des terres",
    description: "Ce projet vise à promouvoir et diffuser des pratiques agricoles éprouvées permettant de restaurer les terres dégradées et d'améliorer durablement les rendements agricoles.",
  },
  {
    number: 11,
    title: "Aménagement intégré des terres agricoles dans les sebkhas tunisiennes",
    description: "Cette initiative cible les zones humides salines afin de restaurer ces écosystèmes fragiles et d'optimiser leur valorisation agricole.",
  },
  {
    number: 12,
    title: "Mise en place d'un réseau d'observatoires de la désertification et des impacts de la sécheresse",
    description: "Le projet repose sur des collaborations avec des institutions de recherche afin de renforcer le suivi et l'évaluation des impacts socio-économiques et écologiques de la désertification.",
  },
  {
    number: 13,
    title: "Ceinture verte de lutte contre la désertification et la dégradation des terres dans les écosystèmes steppiques de la Tunisie centrale",
    description: "Cette initiative ambitieuse vise à mettre en place une barrière écologique destinée à freiner l'avancée de la désertification et à restaurer les terres steppiques dégradées.",
  },
];

/* ─── Page ─── */
export default function Home() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      {/* ── Navbar ── */}
      <Navbar darkOnInit />

      {/* ── Hero ── */}
      <Hero
        variant="split"
        title="Bienvenue sur le SSDT"
        titleLine2="Système de Suivi de la Dégradation et de la Gestion Durable des Terres en Tunisie"
        image="home"
      />

      {/* ── About the Platform — Split layout ── */}
      <section className="py-20 md:py-32 border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            {/* Left column */}
            <Reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-4">
                  La Plateforme
                </p>
                <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-10">
                  Le Projet Umbrella
                </h2>
                <div className="space-y-5 text-sm font-light leading-relaxed text-black/60">
                  <p>
                    Cette plateforme a été développée dans le cadre du{' '}
                    <a href="https://umbrella-tun.oss-online.org/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                      Projet Umbrella
                    </a>
                    , une initiative financée par le{' '}
                    <a href="https://www.thegef.org/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                      Fonds pour l'Environnement Mondial (FEM)
                    </a>{' '}
                    et mise en œuvre par le{' '}
                    <a href="https://www.unep.org/fr" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                      Programme des Nations Unies pour l'Environnement (PNUE)
                    </a>
                    . Elle est dédiée au suivi de la dégradation des terres et des progrès réalisés vers l'atteinte de la{' '}
                    <a href="https://catalogue.unccd.int/877_LDN_TS_FRE.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                      Neutralité en matière de Dégradation des Terres (NDT)
                    </a>{' '}
                    en Tunisie.
                  </p>
                  <p>
                    Le{' '}
                    <a href="https://umbrella-tun.oss-online.org/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                      Projet Umbrella
                    </a>
                    , également appelé « projet Parapluie », est actuellement dans sa deuxième phase de mise en œuvre. Il s'agit d'une initiative nationale visant à renforcer les capacités institutionnelles et professionnelles de la Tunisie afin de soutenir la prise de décision pour l'atteinte de la Neutralité en matière de Dégradation des Terres (NDT). Le projet est mis en œuvre par le Ministère tunisien de l'Environnement, avec l'appui de l'
                    <a href="https://www.oss-online.org/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                      Observatoire du Sahara et du Sahel (OSS)
                    </a>
                    .
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Right column — detail grid */}
            <Reveal delay={2}>
              <div>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="border-t border-black/10 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">Financement</p>
                    <p className="text-sm">FEM / GEF</p>
                  </div>
                  <div className="border-t border-black/10 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">Mise en œuvre</p>
                    <p className="text-sm">PNUE / UNEP</p>
                  </div>
                  <div className="border-t border-black/10 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">Appui technique</p>
                    <p className="text-sm">OSS</p>
                  </div>
                  <div className="border-t border-black/10 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/30 mb-1">Phase actuelle</p>
                    <p className="text-sm">Phase II</p>
                  </div>
                </div>
                <div className="border-t border-black/10 pt-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30 mb-4">Partenaires clés</p>
                  <div className="flex flex-wrap gap-3">
                    {['FEM', 'PNUE', 'OSS', 'CNULCD', "Ministère de l'Environnement"].map((partner) => (
                      <span key={partner} className="px-3 py-1.5 border border-black/20 text-[11px] text-black/50 hover:bg-black hover:text-white hover:border-black transition-all duration-300 cursor-default">
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Context — Dark section ── */}
      <section className="bg-black text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <Reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">Contexte</p>
                <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">
                  Lutte contre la<br />Désertification
                </h2>
                <div className="space-y-5 text-sm font-light leading-relaxed text-white/60">
                  <p>
                    Depuis plusieurs années, la Tunisie a adopté une approche structurée pour lutter contre la dégradation des terres et la désertification. Dans ce cadre, le pays s'est engagé dans la modernisation de ses outils de suivi et d'évaluation, notamment à travers le développement d'une plateforme numérique nationale dédiée au suivi de la dégradation des terres, de la sécheresse et des indicateurs de la{' '}
                    <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                      Convention des Nations Unies sur la Lutte contre la Désertification (CNULCD)
                    </a>
                    .
                  </p>
                  <p>
                    Le Projet Umbrella contribue à la mise en place de cette plateforme nationale afin de répondre aux besoins de rapportage des institutions tunisiennes en matière de NDT. La plateforme intègre des fonctionnalités et des ressources permettant de :
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={2}>
              <div className="space-y-0">
                {platformFeatures.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className={`flex items-start gap-4 py-5 ${i < platformFeatures.length - 1 ? 'border-b border-white/10' : ''}`}>
                      <Icon size={20} className="text-white/40 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-white/80">{feature.title}</p>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Box 1: La dégradation des terres en Tunisie ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-10">La dégradation des terres en Tunisie</h2>
              <div className="space-y-5 text-sm font-light leading-relaxed text-black/60">
                <p>La Tunisie figure parmi les pays du sud de la Méditerranée les plus touchés par la désertification. Ce phénomène, associé à la dégradation des terres et à la sécheresse, menace près de 85 % des superficies agricoles du pays. Les sols connaissent un niveau de dégradation préoccupant : environ 45 % des terres sont affectées par une forte érosion hydrique ou éolienne, tandis que 13 % subissent une salinisation importante.</p>
                <p>Le coût de la dégradation de l'environnement en Tunisie est estimé entre 2,1 % du PIB par an (Banque mondiale, 2004) et 2,7 % par an (Direction Générale des Forêts, 2024). Cette situation souligne l'urgence de renforcer les actions de conservation, de valorisation et de gestion durable des agroécosystèmes. La dégradation des terres et des écosystèmes exerce en effet des impacts négatifs significatifs sur l'économie nationale.</p>
                <p>La majorité des terres forestières est aujourd'hui considérée comme dégradée et nécessite des actions de réhabilitation. Les steppes sont également fortement affectées : une part importante des terres steppiques a été convertie en terres agricoles ou dégradée sous l'effet du surpâturage.</p>
                <p>Les principales formes de dégradation des terres observées en Tunisie sont notamment :</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-black/10 mt-8 mb-8">
                {degradationForms.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-white p-5 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default">
                      <Icon size={20} className="text-black/40 group-hover:text-white/60 transition-colors mb-3" strokeWidth={1.5} />
                      <p className="text-xs font-light leading-relaxed text-black/60 group-hover:text-white/50 transition-colors">{item.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-5 text-sm font-light leading-relaxed text-black/60">
                <p>Face à cette situation, la Tunisie est appelée à renforcer ses efforts afin d'atteindre la Neutralité en matière de Dégradation des Terres (NDT) à travers une approche transformationnelle et durable.</p>
                <p className="text-xs text-black/30">
                  Source :{' '}
                  <a href="https://umbrella-tun.oss-online.org" target="_blank" rel="noopener noreferrer" className="text-black/40 underline underline-offset-2 hover:text-black/60">
                    Rapport NDT Tunisie, juin 2024
                  </a>
                </p>
              </div>
              <div className="mt-10 w-full">
                <img src="/images/Home_Image_1.png" alt="Dégradation des terres en Tunisie" className="w-full h-auto rounded-lg" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Le rôle de la plateforme NDT ── */}
      <section className="py-20 md:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <Reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">La Plateforme</p>
                <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">Le rôle de la plateforme NDT en Tunisie</h2>
                <div className="space-y-5 text-sm font-light leading-relaxed text-white/60">
                  <p>
                    Cette{' '}
                    <a href="https://umbrella-tun.oss-online.org" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                      Plateforme NDT
                    </a>{' '}
                    représente le « Système de suivi de la Dégradation et de la Gestion Durable des Terres en Tunisie (SSDT) ». Elle constitue un système centralisé de suivi de la dégradation des terres en Tunisie. Elle intègre, au sein d'un point d'accès unique, des données environnementales, géospatiales et hydrologiques destinées à soutenir l'analyse, le suivi et la prise de décision.
                  </p>
                  <p>
                    Grâce à des processus automatisés, la plateforme fournit un accès à des données et à des ressources informationnelles conformes aux objectifs stratégiques et aux indicateurs de rapportage de la{' '}
                    <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                      CNULCD
                    </a>
                    . Elle contribue notamment à :
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={2}>
              <div className="space-y-0">
                {ndtContributions.map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 py-5 ${i < ndtContributions.length - 1 ? 'border-b border-white/10' : ''}`}>
                    <ArrowRight size={16} className="text-white/40 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm font-light leading-relaxed text-white/70">{item}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal>
            <div className="mt-16 pt-10 border-t border-white/10 max-w-3xl">
              <p className="text-sm font-light leading-relaxed text-white/50">
                La plateforme offre ainsi l'accès aux ressources en données et en informations thématiques, engagées dans la lutte contre la désertification pour mieux comprendre les dynamiques de dégradation des terres et mettre en œuvre des actions efficaces pour atteindre la Neutralité en matière de Dégradation des Terres.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Box 2: Facteurs de dégradation ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-10">Facteurs de dégradation des terres en Tunisie</h2>
              <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 mb-10">
                <p>Les principaux facteurs de dégradation des terres en Tunisie sont essentiellement liés à des modes d'exploitation inappropriés et non durables des ressources naturelles. Ils se présentent comme suit :</p>
              </div>
              <div className="space-y-0">
                {degradationFactors.map((factor, i) => (
                  <div key={factor.title} className={`py-6 ${i < degradationFactors.length - 1 ? 'border-b border-black/10' : ''}`}>
                    <h3 className="font-serif text-lg tracking-tight mb-3">{factor.title}</h3>
                    <p className="text-sm font-light leading-relaxed text-black/60">{factor.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-black/10">
                <p className="text-xs text-black/30">
                  Source :{' '}
                  <a href="https://umbrella-tun.oss-online.org" target="_blank" rel="noopener noreferrer" className="text-black/40 underline underline-offset-2 hover:text-black/60">
                    Rapport NDT Tunisie, juin 2024
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Le Projet Umbrella en Tunisie ── */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-4">Le Projet</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-16">Le Projet Umbrella en Tunisie</h2>
          </Reveal>

          {/* Objectif */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-20">
            <Reveal>
              <div>
                <h3 className="font-serif text-2xl tracking-tight mb-6">Quel est l'objectif du Projet Umbrella ?</h3>
                <p className="text-sm font-light leading-relaxed text-black/60">
                  Le Projet Umbrella vise à renforcer les capacités institutionnelles et professionnelles des pays parties afin d'améliorer le suivi et le rapportage dans le cadre de la{' '}
                  <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                    CNULCD
                  </a>
                  . À travers cette initiative, le projet ambitionne d'accompagner les pays africains dans l'atteinte et la pérennisation des objectifs mondiaux de protection de l'environnement.
                </p>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 border border-black/10 flex items-center justify-center">
                  <Landmark size={36} className="text-black/30" strokeWidth={1} />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Résultats phares */}
          <Reveal>
            <h3 className="font-serif text-2xl tracking-tight mb-4">Résultats phares du Projet Umbrella</h3>
            <p className="text-sm font-light leading-relaxed text-black/60 mb-8">
              En Tunisie, la deuxième phase du Projet Umbrella s'inscrit dans une dynamique de continuité et de consolidation des acquis, notamment en matière de suivi et de rapportage des indicateurs de la{' '}
              <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                CNULCD
              </a>
              . Parmi les principaux résultats attendus figurent :
            </p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-px bg-black/10 mb-20">
            {umbrellaResults.map((result, i) => (
              <Reveal key={i} delay={i + 1}>
                <div className="bg-white p-8 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default h-full">
                  <Layers size={24} className="text-black/40 group-hover:text-white/60 transition-colors mb-4" strokeWidth={1.5} />
                  <p className="text-sm font-light leading-relaxed text-black/60 group-hover:text-white/50 transition-colors">{result}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Acteurs et bénéficiaires */}
          <Reveal>
            <h3 className="font-serif text-2xl tracking-tight mb-6">Acteurs et bénéficiaires</h3>
          </Reveal>
          <Reveal>
            <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 max-w-3xl">
              <p>
                Mis en œuvre par le{' '}
                <a href="https://www.environnement.gov.tn/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                  Ministère tunisien de l'Environnement
                </a>{' '}
                avec l'appui de l'Observatoire du Sahara et du Sahel (OSS), le Projet Umbrella accompagne la Tunisie dans le respect de ses engagements envers la{' '}
                <a href="https://www.unccd.int/" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                  CNULCD
                </a>
                . Cet appui se traduit notamment par la mise en place d'un mécanisme permanent de suivi et de rapportage, ainsi que par la mise en œuvre d'actions visant à préserver durablement la qualité et la quantité des ressources en terres afin d'atteindre la{' '}
                <a href="https://catalogue.unccd.int/877_LDN_TS_FRE.pdf" target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2 hover:text-black/80">
                  Neutralité en matière de Dégradation des Terres (NDT)
                </a>
                .
              </p>
              <p>
                Les principaux acteurs et bénéficiaires du projet sont les membres du Conseil National de Lutte contre la Désertification (CNLCD), les techniciens des différents ministères intervenant dans ce domaine, ainsi que les représentants de plusieurs institutions nationales concernées.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Box 3: Liste des acteurs ── */}
      <section className="py-20 md:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">Liste des principaux acteurs et bénéficiaires du projet Umbrella</h2>
              <p className="text-sm font-light leading-relaxed text-black/60 mb-10">
                La liste non-exhaustive des acteurs et bénéficiaires du projet Umbrella en Tunisie comprend les institutions suivantes.
              </p>

              {/* Ministries with sub-items */}
              <div className="space-y-0 mb-8">
                {actorsByMinistry.map((actor, i) => (
                  <div key={actor.ministry} className={`py-4 ${i < actorsByMinistry.length - 1 ? 'border-b border-black/10' : ''}`}>
                    <p className="text-sm font-medium text-black/80">{actor.ministry}</p>
                    {actor.subItems.length > 0 && (
                      <ul className="mt-2 ml-6 space-y-1">
                        {actor.subItems.map((sub) => (
                          <li key={sub} className="text-sm font-light leading-relaxed text-black/60 flex items-start gap-2">
                            <span className="text-black/30 mt-1.5 flex-shrink-0">○</span>
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Independent actors */}
              <div className="pt-6 border-t border-black/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {independentActors.map((actor) => (
                    <div key={actor} className="px-3 py-2 border border-black/10 text-xs font-light text-black/60">
                      {actor}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Box 4: Projets prioritaires NDT ── */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="border-t-4 border-t-black bg-white shadow-lg p-8 md:p-14">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">L'objectif de la NDT en Tunisie : quels projets prioritaires y sont alignés ?</h2>
              <div className="space-y-5 text-sm font-light leading-relaxed text-black/60 mb-10">
                <p>
                  Le Ministère tunisien de l'Environnement, en collaboration avec l'Observatoire du Sahara et du Sahel (OSS), a conduit une étude visant à identifier et sélectionner des projets prioritaires alignés sur les objectifs de la Neutralité en matière de Dégradation des Terres (NDT) en Tunisie.
                </p>
                <p>
                  Cette sélection a pour objectif d'orienter les efforts et les ressources vers des initiatives présentant un fort potentiel d'impact, de faisabilité et de contribution à la lutte contre la dégradation des terres.
                </p>
                <p>Les principaux projets prioritaires identifiés sont les suivants :</p>
              </div>

              {/* Projects list */}
              <div className="space-y-0">
                {priorityProjects.map((project, i) => (
                  <div key={i} className={`py-6 ${i < priorityProjects.length - 1 ? 'border-b border-black/10' : ''}`}>
                    <div className="flex items-start gap-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/30 flex-shrink-0 pt-1">
                        Projet {project.number}
                      </span>
                      <div>
                        <h3 className="font-serif text-base tracking-tight mb-2">{project.title}</h3>
                        <p className="text-sm font-light leading-relaxed text-black/60">{project.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-black/10">
                <p className="text-xs text-black/30">
                  Source : Rapport sur le portefeuille de projets, 2024
                </p>
              </div>

              <div className="mt-10 w-full">
                <img src="/images/Home_Image_2.png" alt="Projets et partenaires" className="w-full h-auto rounded-lg" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
