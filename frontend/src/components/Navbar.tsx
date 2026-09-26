import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Map, LogIn, ChevronDown, Eye, BarChart3 } from 'lucide-react';

interface NavbarProps {
  darkOnInit?: boolean;
}

export default function Navbar({ darkOnInit = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [geoOpen, setGeoOpen] = useState(false);
  const [tdbOpen, setTdbOpen] = useState(false);
  const [mobileGeoOpen, setMobileGeoOpen] = useState(false);
  const [mobileTdbOpen, setMobileTdbOpen] = useState(false);
  const location = useLocation();

  const isDark = scrolled || darkOnInit;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setMobileGeoOpen(false);
    setMobileTdbOpen(false);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => { setGeoOpen(false); setTdbOpen(false); };
    if (geoOpen || tdbOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [geoOpen, tdbOpen]);

  const navLinkClass = (dimmed = false) =>
    `text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
      isDark
        ? dimmed
          ? 'text-black/40 hover:text-black'
          : 'text-black/50 hover:text-black'
        : dimmed
          ? 'text-white/60 hover:text-white'
          : 'text-white/80 hover:text-white'
    }`;

  const dropdownBtnClass = (isActive: boolean) =>
    `flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
      isActive
        ? isDark ? 'text-black' : 'text-white'
        : isDark ? 'text-black/50 hover:text-black' : 'text-white/80 hover:text-white'
    }`;

  const isGeoActive = location.pathname === '/geoportail' || location.pathname === '/apercu';
  const isTdbActive = location.pathname === '/tableau-de-bord' || location.pathname === '/tableau-de-bord-ndt';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[3000] transition-all duration-500 ${
        isDark
          ? 'bg-white/95 backdrop-blur-md border-b border-black/5 nav-scrolled'
          : 'bg-transparent nav-top'
      }`}
    >
      <div className="w-full px-6 lg:px-10 xl:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className={`font-serif text-xl tracking-tight transition-all duration-300 ${
            isDark ? 'text-black' : 'text-white'
          }`}
        >
          UMBRELLA TUNISIE
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass()}>
            Accueil
          </NavLink>
          <NavLink to="/ndt-en-tunisie" className={navLinkClass()}>
            NDT en Tunisie
          </NavLink>

          {/* Géoportail Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setGeoOpen(true)}
            onMouseLeave={() => setGeoOpen(false)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setGeoOpen(!geoOpen); }}
              className={dropdownBtnClass(isGeoActive)}
            >
              <Map size={13} strokeWidth={1.5} />
              Géoportail
              <ChevronDown size={12} className={`transition-transform duration-200 ${geoOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              className={`absolute top-full left-0 mt-2 min-w-[180px] border border-black/10 bg-white shadow-xl transition-all duration-200 ${
                geoOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
              }`}
            >
              <NavLink to="/geoportail" className="flex items-center gap-2.5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-black/60 hover:text-black hover:bg-black/5 transition-colors">
                <Map size={14} strokeWidth={1.5} />
                Carte
              </NavLink>
              <NavLink to="/apercu" className="flex items-center gap-2.5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-black/60 hover:text-black hover:bg-black/5 transition-colors border-t border-black/5">
                <Eye size={14} strokeWidth={1.5} />
                Aperçu
              </NavLink>
            </div>
          </div>

          {/* Tableau de bord Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setTdbOpen(true)}
            onMouseLeave={() => setTdbOpen(false)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setTdbOpen(!tdbOpen); }}
              className={dropdownBtnClass(isTdbActive)}
            >
              <BarChart3 size={13} strokeWidth={1.5} />
              Tableau de bord
              <ChevronDown size={12} className={`transition-transform duration-200 ${tdbOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              className={`absolute top-full left-0 mt-2 min-w-[220px] border border-black/10 bg-white shadow-xl transition-all duration-200 ${
                tdbOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
              }`}
            >
              <NavLink to="/tableau-de-bord" className="flex items-center gap-2.5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-black/60 hover:text-black hover:bg-black/5 transition-colors">
                <Eye size={14} strokeWidth={1.5} />
                Aperçu
              </NavLink>
              <NavLink to="/tableau-de-bord-ndt" className="flex items-center gap-2.5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-black/60 hover:text-black hover:bg-black/5 transition-colors border-t border-black/5">
                <BarChart3 size={14} strokeWidth={1.5} />
                Tableau de bord NDT
              </NavLink>
            </div>
          </div>

          <NavLink to="/acquis-et-success-stories" className={navLinkClass()}>
            Acquis et success stories
          </NavLink>
          <NavLink to="/ressources" className={navLinkClass()}>
            Ressources
          </NavLink>

          <NavLink to="/admin/connexion" className={navLinkClass(true)}>
            <span className="flex items-center gap-1.5">
              <LogIn size={13} strokeWidth={1.5} />
              Connexion
            </span>
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`lg:hidden transition-all duration-300 ${
            isDark ? 'text-black' : 'text-white'
          }`}
          aria-label="Menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-black/95 backdrop-blur-md px-6 py-8 flex flex-col gap-5">
          <NavLink to="/" onClick={() => setIsOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
            Accueil
          </NavLink>
          <NavLink to="/ndt-en-tunisie" onClick={() => setIsOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
            NDT en Tunisie
          </NavLink>

          {/* Mobile Géoportail Accordion */}
          <div>
            <button
              onClick={() => setMobileGeoOpen(!mobileGeoOpen)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors w-full ${isGeoActive ? 'text-white' : ''}`}
            >
              <Map size={13} strokeWidth={1.5} />
              Géoportail
              <ChevronDown size={12} className={`transition-transform duration-200 ml-auto ${mobileGeoOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-4 mt-3 space-y-4 overflow-hidden transition-all duration-300 ${mobileGeoOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <NavLink to="/geoportail" onClick={() => setIsOpen(false)} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors">
                <Map size={12} strokeWidth={1.5} />
                Carte
              </NavLink>
              <NavLink to="/apercu" onClick={() => setIsOpen(false)} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors">
                <Eye size={12} strokeWidth={1.5} />
                Aperçu
              </NavLink>
            </div>
          </div>

          {/* Mobile Tableau de bord Accordion */}
          <div>
            <button
              onClick={() => setMobileTdbOpen(!mobileTdbOpen)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors w-full ${isTdbActive ? 'text-white' : ''}`}
            >
              <BarChart3 size={13} strokeWidth={1.5} />
              Tableau de bord
              <ChevronDown size={12} className={`transition-transform duration-200 ml-auto ${mobileTdbOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-4 mt-3 space-y-4 overflow-hidden transition-all duration-300 ${mobileTdbOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <NavLink to="/tableau-de-bord" onClick={() => setIsOpen(false)} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors">
                <Eye size={12} strokeWidth={1.5} />
                Aperçu
              </NavLink>
              <NavLink to="/tableau-de-bord-ndt" onClick={() => setIsOpen(false)} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors">
                <BarChart3 size={12} strokeWidth={1.5} />
                Tableau de bord NDT
              </NavLink>
            </div>
          </div>

          <NavLink to="/acquis-et-success-stories" onClick={() => setIsOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
            Acquis et success stories
          </NavLink>
          <NavLink to="/ressources" onClick={() => setIsOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
            Ressources
          </NavLink>
          <NavLink to="/admin/connexion" onClick={() => setIsOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5">
            <LogIn size={13} strokeWidth={1.5} />
            Connexion
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
