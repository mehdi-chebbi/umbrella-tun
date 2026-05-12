import { useScrollReveal } from '@/hooks/useScrollReveal';

interface SectionTitleProps {
  label?: string;
  title: string;
  dark?: boolean;
  align?: 'center' | 'left';
}

export default function SectionTitle({
  label,
  title,
  dark = false,
  align = 'left',
}: SectionTitleProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} mb-12 md:mb-14 ${
        align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      {label && (
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 ${
            dark ? 'text-white/40' : 'text-black/40'
          }`}
        >
          {label}
        </p>
      )}
      <h2 className={`font-serif text-4xl md:text-5xl tracking-tight ${dark ? 'text-white' : 'text-black'}`}>
        {title}
      </h2>
    </div>
  );
}
