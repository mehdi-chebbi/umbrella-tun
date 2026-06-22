import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Identifiants incorrects. Veuillez réessayer.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          'linear-gradient(135deg, #1C1C1C 0%, #2D6A4F 50%, #1a4731 100%)',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white/3 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold tracking-[0.3em] text-umbrella-warm mb-2">
              UMBRELLA TUNISIE
            </h1>
            <p className="text-sm text-umbrella-text-secondary">
              Connexion Administration
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-umbrella-text mb-1.5"
              >
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-umbrella-border rounded-lg text-sm text-umbrella-text placeholder:text-umbrella-text-light focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300"
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-umbrella-text mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-umbrella-border rounded-lg text-sm text-umbrella-text placeholder:text-umbrella-text-light focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300"
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-umbrella-text-light hover:text-umbrella-text-secondary transition-colors duration-200"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-umbrella-accent text-white text-sm font-medium rounded-lg hover:bg-umbrella-accent/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connexion...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
