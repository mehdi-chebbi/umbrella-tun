import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Users, LogOut, Menu, X, ChevronRight } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/connexion');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-umbrella-accent/10 text-umbrella-accent font-medium'
        : 'text-umbrella-text-secondary hover:bg-umbrella-bg-alt hover:text-umbrella-text'
    }`;

  return (
    <div className="min-h-screen bg-umbrella-bg-alt flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-umbrella-border flex flex-col transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-umbrella-border">
          <span className="text-base font-semibold tracking-[0.3em] text-umbrella-warm">
            UMBRELLA
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-umbrella-text-light hover:text-umbrella-text"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/admin" end className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={18} strokeWidth={1.5} />
            <span>Tableau de bord</span>
          </NavLink>
          <NavLink to="/admin/utilisateurs" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <Users size={18} strokeWidth={1.5} />
            <span>Utilisateurs</span>
          </NavLink>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-umbrella-border">
          {user && (
            <div className="mb-3 px-4">
              <p className="text-sm font-medium text-umbrella-text truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-umbrella-text-light truncate">
                {user.email}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-umbrella-accent-light text-umbrella-accent text-xs rounded">
                {user.role === 'admin' ? 'Administrateur' : 'Observateur'}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-umbrella-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar (mobile) */}
        <header className="md:hidden bg-white border-b border-umbrella-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-umbrella-text hover:text-umbrella-accent transition-colors duration-200"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium text-umbrella-text">Administration</span>
          <button
            onClick={handleLogout}
            className="p-2 text-umbrella-text-light hover:text-red-500 transition-colors duration-200"
            aria-label="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
