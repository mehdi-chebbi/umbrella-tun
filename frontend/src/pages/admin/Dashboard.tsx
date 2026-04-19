import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Users, FileText, Clock, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [userCount, setUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        const usersData = response.data.users;
        setUserCount(Array.isArray(usersData) ? usersData.length : 0);
      } catch {
        // Silently fail — will show 0
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const stats = [
    {
      label: 'Total utilisateurs',
      value: loading ? '...' : userCount.toString(),
      icon: Users,
      color: 'text-umbrella-accent',
      bg: 'bg-umbrella-accent-light',
    },
    {
      label: 'Pages de contenu',
      value: '4',
      icon: FileText,
      color: 'text-umbrella-warm',
      bg: 'bg-umbrella-warm-light',
    },
    {
      label: 'Dernière connexion',
      value: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-umbrella-text">
          Bienvenue, {user?.full_name || 'Administrateur'}
        </h1>
        <p className="text-sm text-umbrella-text-secondary mt-1">
          Tableau de bord du Projet Umbrella
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-lg border border-umbrella-border hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <Icon size={20} className={stat.color} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs text-umbrella-text-secondary uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-xl font-light text-umbrella-text mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-umbrella-border p-6 mb-8">
        <h2 className="text-base font-medium text-umbrella-text mb-4">
          Activité récente
        </h2>
        <div className="py-8 text-center">
          <Clock size={32} className="mx-auto text-umbrella-border mb-3" strokeWidth={1.5} />
          <p className="text-sm text-umbrella-text-light">
            Aucune activité récente
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/utilisateurs"
          className="flex items-center justify-between p-5 bg-white border border-umbrella-border rounded-lg hover:border-umbrella-accent/30 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center space-x-3">
            <Users size={20} className="text-umbrella-accent" strokeWidth={1.5} />
            <span className="text-sm font-medium text-umbrella-text">
              Gérer les utilisateurs
            </span>
          </div>
          <ArrowRight
            size={16}
            className="text-umbrella-text-light group-hover:text-umbrella-accent transition-colors duration-300"
          />
        </Link>
      </div>
    </div>
  );
}
