import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ChevronDown, FileText, Download, FolderOpen } from 'lucide-react';

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

/* ─── Types ─── */
interface Document {
  filename: string;
  title: string;
  size: string;
  sizeBytes: number;
  url: string;
}

interface Category {
  category: string;
  documents: Document[];
}

/* ─── Accordion Item ─── */
function AccordionCategory({ cat }: { cat: Category }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-black/10 rounded-xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 md:px-8 py-5 md:py-6 bg-white hover:bg-stone-50 transition-colors text-left"
      >
        <div className="flex-1">
          <h3 className="font-serif text-lg md:text-xl tracking-tight text-black/90">{cat.category}</h3>
          <p className="text-xs text-black/40 mt-1">{cat.documents.length} document{cat.documents.length > 1 ? 's' : ''}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-black/30 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
      >
        <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-3">
          {cat.documents.map((doc) => (
            <a
              key={doc.filename}
              href={doc.url}
              download
              className="group flex items-center gap-4 p-4 bg-stone-50/80 hover:bg-stone-100 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-black/10 flex items-center justify-center shrink-0 group-hover:border-black/20 transition-colors">
                <FileText className="w-5 h-5 text-black/30 group-hover:text-black/50 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black/80 group-hover:text-black transition-colors truncate">
                  {doc.title}
                </p>
                <p className="text-[11px] text-black/30 mt-0.5">{doc.size}</p>
              </div>
              <Download className="w-4 h-4 text-black/20 group-hover:text-black/50 transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function Resources() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/resources')
      .then(res => res.json())
      .then((data: Category[]) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const totalDocs = categories.reduce((sum, c) => sum + c.documents.length, 0);

  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-4">Bibliothèque</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-tight mb-6">Ressources</h1>
            <p className="text-base md:text-lg font-light leading-relaxed text-black/50 max-w-2xl">
              Rapports, études et stratégies liées à la Neutralité en matière de Dégradation des Terres en Tunisie.
              Téléchargez les documents pour approfondir vos connaissances.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Stats bar */}
      {!loading && categories.length > 0 && (
        <section className="pb-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <Reveal>
              <div className="flex items-center gap-6 py-4 border-t border-black/10">
                <div className="flex items-center gap-2 text-sm text-black/40">
                  <FolderOpen className="w-4 h-4" />
                  <span>{categories.length} catégorie{categories.length > 1 ? 's' : ''}</span>
                </div>
                <div className="w-px h-4 bg-black/10" />
                <div className="flex items-center gap-2 text-sm text-black/40">
                  <FileText className="w-4 h-4" />
                  <span>{totalDocs} document{totalDocs > 1 ? 's' : ''}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Accordion */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-stone-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <Reveal>
              <div className="text-center py-20">
                <FolderOpen className="w-12 h-12 text-black/10 mx-auto mb-4" />
                <p className="text-sm text-black/30">Aucun document disponible pour le moment.</p>
              </div>
            </Reveal>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, i) => (
                <Reveal key={cat.category} delay={i}>
                  <AccordionCategory cat={cat} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
