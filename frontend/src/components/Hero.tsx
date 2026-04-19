import { Link } from 'react-router-dom';
import heroHome from '@/assets/hero-home.jpg';
import heroAbout from '@/assets/hero-about.jpg';
import heroPartners from '@/assets/hero-partners.jpg';

interface HeroProps {
  tagline?: string;
  title: string;
  titleLine2?: string;
  titleLine3?: string;
  subtitle?: string;
  image?: 'home' | 'about' | 'partners';
  ctas?: { label: string; to: string; variant?: 'primary' | 'outline' }[];
  showScrollIndicator?: boolean;
}

const imageMap: Record<string, string> = {
  home: heroHome,
  about: heroAbout,
  partners: heroPartners,
};

export default function Hero({
  tagline,
  title,
  titleLine2,
  titleLine3,
  subtitle,
  image,
  ctas,
  showScrollIndicator = true,
}: HeroProps) {
  const bgImage = image ? imageMap[image] : undefined;

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        {bgImage ? (
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover opacity-60 animate-fade-in"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-black via-gray-900 to-black" />
        )}
        {/* Gradient overlay — from black at bottom, via semi-transparent, to transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>

      {/* Content — bottom-aligned like the reference */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Tagline */}
        {tagline && (
          <div className="animate-fade-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 mb-4">
              {tagline}
            </p>
          </div>
        )}

        {/* Title */}
        <h1
          className="font-serif text-5xl md:text-7xl lg:text-[6.5rem] font-normal text-white leading-[0.95] tracking-tight animate-fade-up"
          style={{ opacity: 0, animationDelay: '0.5s' }}
        >
          {title}
          {titleLine2 && <><br /><em className="text-white/80">{titleLine2}</em></>}
          {titleLine3 && <><br />{titleLine3}</>}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <div className="animate-fade-up" style={{ opacity: 0, animationDelay: '0.7s' }}>
            <p className="mt-6 text-white/60 text-base md:text-lg font-light leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          </div>
        )}

        {/* CTAs */}
        {ctas && ctas.length > 0 && (
          <div
            className="mt-8 flex items-center gap-6 animate-fade-up"
            style={{ opacity: 0, animationDelay: '0.9s' }}
          >
            {ctas.map((cta) => (
              <Link
                key={cta.label}
                to={cta.to}
                className={`inline-flex items-center gap-2 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-300 ${
                  cta.variant === 'outline'
                    ? 'border border-white/20 text-white hover:bg-white/10'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                <span>{cta.label}</span>
                {cta.variant === 'outline' ? (
                  <></>
                ) : (
                  <></>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Scroll Indicator — right side, vertical text */}
        {showScrollIndicator && (
          <div
            className="absolute bottom-8 right-6 md:right-12 animate-fade-up"
            style={{ opacity: 0, animationDelay: '1s' }}
          >
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-[9px] uppercase tracking-[0.2em] text-white/30"
                style={{ writingMode: 'vertical-rl' }}
              >
                Scroll
              </span>
              <div className="w-px h-12 bg-white/20 relative overflow-hidden">
                <div className="w-full h-1/2 bg-white/60 scroll-line" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
