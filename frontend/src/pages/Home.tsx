import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import SectionTitle from '@/components/SectionTitle';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Shield, BarChart3, FileText, Zap, Quote } from 'lucide-react';
import missionImg from '@/assets/mission.jpg';

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
const keyFigures = [
  { number: '28', label: 'Pays participants' },
  { number: '4', label: 'Phases du projet' },
  { number: '50+', label: 'Experts formés' },
  { number: '2030', label: 'Objectif ODD' },
];

const objectives = [
  {
    icon: Shield,
    title: 'Lutte contre la désertification',
    description:
      "Mise en œuvre de stratégies intégrées pour combattre la désertification et la dégradation des terres à travers des approches participatives et scientifiquement fondées.",
  },
  {
    icon: BarChart3,
    title: 'Gestion durable des terres',
    description:
      "Promotion de pratiques de gestion durable des terres adaptées aux contextes locaux pour restaurer les écosystèmes dégradés et préserver les sols productifs.",
  },
  {
    icon: FileText,
    title: 'Suivi et rapportage CNULCD',
    description:
      "Renforcement du système de suivi-évaluation et amélioration du rapportage national auprès de la Convention des Nations Unies sur la lutte contre la désertification.",
  },
  {
    icon: Zap,
    title: 'Renforcement des capacités',
    description:
      "Développement des compétences nationales et régionales en matière de collecte, d'analyse et de gestion des données environnementales.",
  },
];

/* ─── Page ─── */
export default function Home() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Hero ── */}
      <Hero
        tagline="FEM · PNUE · OSS"
        title="Projet"
        titleLine2="Umbrella"
        image="home"
        ctas={[
          { label: 'Découvrir le Projet', to: '/a-propos' },
          { label: 'Nos Partenaires', to: '/partenaires', variant: 'outline' },
        ]}
      />

      {/* ── Stats Bar ── */}
      <section className="border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-black/10">
            {keyFigures.map((fig) => (
              <div key={fig.label} className="py-8 px-4 text-center">
                <p className="font-serif text-3xl md:text-4xl tracking-tight">{fig.number}</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-black/40 mt-1">{fig.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Objectives — Services-style with color inversion ── */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">
                Objectifs
              </p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
                Nos Axes Stratégiques
              </h2>
            </div>
          </Reveal>

          {/* 4-col grid with gap-px and bg-black/10 — exact match from reference */}
          <div className="grid md:grid-cols-4 gap-px bg-black/10">
            {objectives.map((obj, i) => {
              const Icon = obj.icon;
              return (
                <Reveal key={obj.title} delay={i + 1}>
                  <div className="bg-white p-8 group hover:bg-black hover:text-white transition-colors duration-500 cursor-default">
                    <Icon
                      size={28}
                      className="text-black/40 group-hover:text-white/60 transition-colors mb-6"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-serif text-xl tracking-tight mb-3">{obj.title}</h3>
                    <p className="text-sm font-light leading-relaxed text-black/50 group-hover:text-white/50 transition-colors">
                      {obj.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mission — About-style split layout ── */}
      <section className="bg-black text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Text */}
            <Reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">
                  Notre Mission
                </p>
                <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">
                  Neutralité en matière<br />de Dégradation des Terres
                </h2>
                <div className="space-y-5 text-sm font-light leading-relaxed text-white/60">
                  <p>
                    Le Projet Umbrella vise à renforcer les capacités institutionnelles et
                    techniques de la Tunisie pour atteindre la Neutralité en matière de
                    Dégradation des Terres (NDT), un objectif central de la CNULCD.
                  </p>
                  <p>
                    Financé par le Fonds pour l'Environnement Mondial (FEM) et mis en œuvre
                    par le PNUE, ce projet s'appuie sur l'expertise de l'Observatoire du
                    Sahara et du Sahel (OSS).
                  </p>
                  <p>
                    La dégradation des terres constitue l'un des défis environnementaux les
                    plus pressants auxquels fait face la Tunisie. Le projet répond à cette
                    urgence en développant des outils de suivi, des bases de données
                    nationales et des mécanismes de coordination inter-institutionnelle.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Image with grayscale hover + stats badge */}
            <Reveal delay={2}>
              <div className="relative">
                <div className="overflow-hidden">
                  <img
                    src={missionImg}
                    alt="Gestion durable des terres en Tunisie"
                    className="w-full h-[500px] md:h-[650px] object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 border border-white/10 p-4 md:p-6 bg-black">
                  <p className="font-serif text-3xl md:text-4xl">75%</p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1">
                    Territoire menacé
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="py-20 md:py-28 bg-black text-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <Quote size={40} className="text-white/20 mb-8 mx-auto" strokeWidth={1} />
            <blockquote className="font-serif text-2xl md:text-4xl leading-snug tracking-tight mb-8">
              « La neutralité en matière de dégradation des terres est un concept
              simple mais puissant : chaque hectare de terre dégradée doit être
              restauré ou compensé par un hectare de terre amélioré. »
            </blockquote>
            <div>
              <p className="text-sm font-medium">CNULCD</p>
              <p className="text-xs text-white/40 mt-1">Décision 3/COP.12</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">
              Rejoignez-nous
            </p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">
              Ensemble pour un Avenir Durable
            </h2>
            <p className="text-sm font-light leading-relaxed text-black/50 max-w-xl mx-auto mb-10">
              Contribuez à la lutte contre la désertification et à la construction
              d'un avenir durable pour la Tunisie et la région du Sahara et du Sahel.
            </p>
            <Link
              to="/partenaires"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] hover:bg-black/80 transition-colors duration-300"
            >
              <span>Découvrir nos partenaires</span>
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
