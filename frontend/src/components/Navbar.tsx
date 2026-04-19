import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Lock } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-black/5 nav-scrolled'
          : 'bg-transparent nav-top'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className={`font-serif text-xl tracking-tight transition-all duration-300 ${
            scrolled ? 'text-black' : 'text-white'
          }`}
        >
          UMBRELLA
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { to: '/', label: 'Accueil', end: true },
            { to: '/a-propos', label: 'À Propos', end: false },
            { to: '/partenaires', label: 'Partenaires', end: false },
          ].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                scrolled
                  ? 'text-black/50 hover:text-black'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </NavLink>
          ))}

          <NavLink
            to="/admin/connexion"
            className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
              scrolled
                ? 'text-black/40 hover:text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Lock size={13} strokeWidth={1.5} />
            <span>Admin</span>
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden transition-all duration-300 ${
            scrolled ? 'text-black' : 'text-white'
          }`}
          aria-label="Menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="bg-black/95 backdrop-blur-md px-6 py-8 flex flex-col gap-6">
          <NavLink
            to="/"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
          >
            Accueil
          </NavLink>
          <NavLink
            to="/a-propos"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
          >
            À Propos
          </NavLink>
          <NavLink
            to="/partenaires"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
          >
            Partenaires
          </NavLink>
          <NavLink
            to="/admin/connexion"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
          >
            <Lock size={13} strokeWidth={1.5} />
            <span>Administration</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
