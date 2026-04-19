import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-umbrella-bg">
        <Loader2 className="animate-spin text-umbrella-accent" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/connexion" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
