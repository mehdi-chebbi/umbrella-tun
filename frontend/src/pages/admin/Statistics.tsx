import { useCallback, useEffect, useState } from 'react';
import { Database, Loader2, Play, RefreshCw, Trash2 } from 'lucide-react';
import api from '@/services/api';

interface StatisticsLayer {
  id: number;
  display_name: string;
  geoserver_name: string;
  group_name: string | null;
  clipped_count: number;
  computed_count: number;
  last_computed_at: string | null;
  is_running: boolean;
}

export default function AdminStatistics() {
  const [layers, setLayers] = useState<StatisticsLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const response = await api.get('/statistics/layers');
      setLayers(response.data.layers || []);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error || 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!layers.some(layer => layer.is_running)) return;
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, [layers, load]);

  const compute = async (layer: StatisticsLayer) => {
    try {
      await api.post(`/statistics/admin/layers/${layer.id}/compute`);
      setMessage(`Pré-calcul démarré pour ${layer.display_name}`);
      await load();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Impossible de démarrer le calcul');
    }
  };

  const clear = async (layer: StatisticsLayer) => {
    if (!window.confirm(`Supprimer les statistiques pré-calculées de ${layer.display_name} ?`)) return;
    try {
      await api.delete(`/statistics/admin/layers/${layer.id}`);
      setMessage('Statistiques supprimées');
      await load();
    } catch (clearError: any) {
      setMessage(clearError.response?.data?.error || 'Impossible de supprimer les statistiques');
    }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-umbrella-accent" /></div>;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-umbrella-accent">Données analytiques</p>
          <h1 className="text-2xl font-light text-umbrella-text md:text-3xl">Pré-calcul des statistiques</h1>
          <p className="mt-2 max-w-2xl text-sm text-umbrella-text-secondary">Calcule les statistiques des gouvernorats à partir des découpages existants. Deux calculs sont exécutés simultanément.</p>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-umbrella-border bg-white px-4 py-2.5 text-sm text-umbrella-text shadow-sm hover:bg-umbrella-bg-alt">
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {message && <div className="mb-5 rounded-lg border border-umbrella-accent/20 bg-umbrella-accent/5 px-4 py-3 text-sm text-umbrella-text">{message}</div>}
      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-umbrella-border bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-umbrella-border bg-umbrella-bg-alt px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-umbrella-text-light md:grid-cols-[minmax(0,1fr)_120px_120px_220px]">
          <span>Couche</span><span>Découpages</span><span className="hidden md:block">Calculées</span><span className="hidden md:block">Actions</span>
        </div>
        {layers.map(layer => {
          const complete = layer.clipped_count > 0 && layer.computed_count >= layer.clipped_count;
          return (
            <div key={layer.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-umbrella-border px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_120px_120px_220px] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-umbrella-text">{layer.display_name || layer.geoserver_name}</p>
                <p className="mt-1 truncate text-xs text-umbrella-text-light">{layer.group_name || 'Sans groupe'}</p>
              </div>
              <span className="text-sm text-umbrella-text-secondary">{layer.clipped_count}</span>
              <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:block">
                <span className={`text-sm font-semibold ${complete ? 'text-emerald-600' : 'text-amber-600'}`}>{layer.computed_count}/{layer.clipped_count}</span>
                {layer.last_computed_at && <span className="text-[10px] text-umbrella-text-light md:block">{new Date(layer.last_computed_at).toLocaleString('fr-FR')}</span>}
              </div>
              <div className="col-span-2 flex gap-2 md:col-span-1">
                <button disabled={layer.is_running || layer.clipped_count === 0} onClick={() => compute(layer)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-umbrella-accent px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  {layer.is_running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}{complete ? 'Recalculer' : 'Calculer'}
                </button>
                <button disabled={!layer.computed_count || layer.is_running} onClick={() => clear(layer)} className="rounded-lg border border-umbrella-border px-3 py-2 text-red-500 hover:bg-red-50 disabled:opacity-30" aria-label="Supprimer les statistiques"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
        {!layers.length && <div className="p-10 text-center"><Database className="mx-auto mb-3 text-umbrella-text-light" /><p className="text-sm text-umbrella-text-secondary">Aucune couche statistique configurée.</p></div>}
      </div>
    </div>
  );
}
