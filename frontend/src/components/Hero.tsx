import { Link } from 'react-router-dom';
import heroHome from '@/assets/hero-home.jpg';

interface HeroProps {
  tagline?: string;
  title: string;
  titleLine2?: string;
  titleLine3?: string;
  subtitle?: string;
  image?: 'home';
  ctas?: { label: string; to: string; variant?: 'primary' | 'outline' }[];
  showScrollIndicator?: boolean;
  variant?: 'split' | 'centered' | 'dark';
}

const imageMap: Record<string, string> = {
  home: heroHome,
};

export default function Hero({
  tagline,
  title,
  titleLine2,
  titleLine3,
  subtitle,
  image,
  ctas,
  variant = 'split',
}: HeroProps) {
  const bgImage = image ? imageMap[image] : undefined;

  /* ─── Shared animation helper ─── */
  const fadeUp = (delay: string) => ({
    className: 'animate-fade-up',
    style: { opacity: 0, animationDelay: delay },
  });

  /* ════════════════════════════════════════════════════════════════
     VARIANT: SPLIT — Home page (image left, text right)
     ════════════════════════════════════════════════════════════════ */
  if (variant === 'split') {
    return (
      <section className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Text Side */}
        <div className="flex flex-col justify-center bg-white p-8 md:p-16 lg:p-20 order-2 md:order-1">
          {tagline && (
            <div {...fadeUp('0.2s')}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40 mb-6">
                {tagline}
              </p>
            </div>
          )}

          <h1
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-black leading-[1] tracking-tight animate-fade-up"
            style={{ opacity: 0, animationDelay: '0.4s' }}
          >
            {title}
            {titleLine2 && <><br /><em className="text-black/50">{titleLine2}</em></>}
            {titleLine3 && <><br />{titleLine3}</>}
          </h1>

          {subtitle && (
            <div {...fadeUp('0.6s')}>
              <p className="mt-6 text-base md:text-lg font-light leading-relaxed text-black/50 max-w-lg">
                {subtitle}
              </p>
            </div>
          )}

          {ctas && ctas.length > 0 && (
            <div {...fadeUp('0.8s')}>
              <div className="mt-8 flex items-center gap-4 flex-wrap">
                {ctas.map((cta) => (
                  <Link
                    key={cta.label}
                    to={cta.to}
                    className={`inline-flex items-center gap-2 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
                      cta.variant === 'outline'
                        ? 'border border-black text-black hover:bg-black hover:text-white'
                        : 'bg-black text-white hover:bg-black/80'
                    }`}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Side */}
        <div className="relative overflow-hidden order-1 md:order-2 h-[45vh] md:h-auto">
          {bgImage ? (
            <img
              src={bgImage}
              alt=""
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
          {/* Subtle gradient edge */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-transparent" />
        </div>
      </section>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     VARIANT: CENTERED — About page (typography only, warm bg)
     ════════════════════════════════════════════════════════════════ */
  if (variant === 'centered') {
    return (
      <section className="min-h-[70vh] flex flex-col items-center justify-center bg-umbrella-bg-alt py-24 md:py-32 text-center px-6">
        {tagline && (
          <div {...fadeUp('0.2s')}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-umbrella-warm mb-6">
              {tagline}
            </p>
          </div>
        )}

        <h1
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-black leading-[1] tracking-tight animate-fade-up"
          style={{ opacity: 0, animationDelay: '0.4s' }}
        >
          {title}
          {titleLine2 && <><br /><em className="text-black/50">{titleLine2}</em></>}
          {titleLine3 && <><br />{titleLine3}</>}
        </h1>

        {/* Gold accent line */}
        <div {...fadeUp('0.6s')}>
          <div className="w-12 h-0.5 bg-umbrella-warm my-8 mx-auto" />
        </div>

        {subtitle && (
          <div {...fadeUp('0.7s')}>
            <p className="text-base font-light leading-relaxed text-black/50 max-w-xl mx-auto">
              {subtitle}
            </p>
          </div>
        )}

        {ctas && ctas.length > 0 && (
          <div {...fadeUp('0.9s')}>
            <div className="mt-8 flex items-center gap-4 justify-center flex-wrap">
              {ctas.map((cta) => (
                <Link
                  key={cta.label}
                  to={cta.to}
                  className={`inline-flex items-center gap-2 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
                    cta.variant === 'outline'
                      ? 'border border-black/15 text-black/50 hover:border-black hover:text-black'
                      : 'bg-umbrella-accent text-white hover:bg-umbrella-accent/90'
                  }`}
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     VARIANT: DARK — Partners page (left-aligned, dark bg)
     ════════════════════════════════════════════════════════════════ */
  return (
    <section className="min-h-[60vh] flex items-center bg-umbrella-dark py-24 md:py-32 px-6 md:px-16 relative overflow-hidden">
      {/* Corner accent */}
      <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-umbrella-warm/25 pointer-events-none" />

      <div className="max-w-3xl relative z-10">
        {tagline && (
          <div {...fadeUp('0.2s')}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-umbrella-warm/70 mb-4">
              {tagline}
            </p>
          </div>
        )}

        <h1
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1] tracking-tight animate-fade-up"
          style={{ opacity: 0, animationDelay: '0.4s' }}
        >
          {title}
          {titleLine2 && <><br /><em className="text-white/50">{titleLine2}</em></>}
          {titleLine3 && <><br />{titleLine3}</>}
        </h1>

        {/* Gold divider */}
        <div {...fadeUp('0.6s')}>
          <div className="w-9 h-0.5 bg-umbrella-warm my-6" />
        </div>

        {subtitle && (
          <div {...fadeUp('0.7s')}>
            <p className="text-base font-light leading-relaxed text-white/35 max-w-lg">
              {subtitle}
            </p>
          </div>
        )}

        {ctas && ctas.length > 0 && (
          <div {...fadeUp('0.9s')}>
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              {ctas.map((cta) => (
                <Link
                  key={cta.label}
                  to={cta.to}
                  className={`inline-flex items-center gap-2 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
                    cta.variant === 'outline'
                      ? 'text-white/45 border-b border-white/12 pb-[calc(0.75rem-1px)] hover:text-white/80 hover:border-white/35'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
