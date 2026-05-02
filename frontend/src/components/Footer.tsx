import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <p className="font-serif text-2xl mb-4">UMBRELLA TUNISIE</p>
            <p className="text-sm font-light leading-relaxed text-white/40 max-w-sm">
              Projet de renforcement des capacités pour la neutralité en matière
              de dégradation des terres en Tunisie. Une initiative FEM/PNUE/OSS.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">
              Navigation
            </p>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-white/50 hover:text-white transition-colors">
                Accueil
              </Link>
              <Link to="/a-propos" className="block text-sm text-white/50 hover:text-white transition-colors">
                À Propos
              </Link>
              <Link to="/partenaires" className="block text-sm text-white/50 hover:text-white transition-colors">
                Partenaires
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">
              Contact
            </p>
            <div className="space-y-2">
              <p className="text-sm text-white/50">
                OSS — Tunis, Tunisie
              </p>
              <a
                href="mailto:procurement@oss.org.tn"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                procurement@oss.org.tn
              </a>
              <a
                href="tel:+21671782075"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                +216 71 782 075
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-white/30">
            © 2026 Projet Umbrella Tunisie — OSS. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <span className="text-[11px] text-white/30 hover:text-white/60 transition-colors cursor-pointer">
              Politique de confidentialité
            </span>
            <span className="text-[11px] text-white/30 hover:text-white/60 transition-colors cursor-pointer">
              Mentions légales
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
