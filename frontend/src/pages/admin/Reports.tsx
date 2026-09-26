import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, ChevronRight, Eye, Loader2, MapPin, RefreshCw, Trash2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

interface DataReport {
  id: number;
  layer_id: number | null;
  layer_name: string;
  layer_display_name: string;
  selected_clip: string | null;
  geometry: any;
  comment: string;
  status: 'pending' | 'fixed';
  created_at: string;
  updated_at: string;
}

type Filter = 'all' | 'pending' | 'fixed';

const formatDate = (value: string) => new Intl.DateTimeFormat('fr-TN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

export default function AdminReports() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<DataReport[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteArmed, setDeleteArmed] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports');
      setReports(response.data.reports || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du chargement des signalements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchReports();
  }, [fetchReports, isAdmin]);

  const counts = useMemo(() => ({
    all: reports.length,
    pending: reports.filter(report => report.status === 'pending').length,
    fixed: reports.filter(report => report.status === 'fixed').length,
  }), [reports]);

  const filteredReports = useMemo(
    () => filter === 'all' ? reports : reports.filter(report => report.status === filter),
    [filter, reports]
  );
  const selectedReport = reports.find(report => report.id === selectedId) || null;

  const updateStatus = async (status: DataReport['status']) => {
    if (!selectedReport) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await api.patch(`/reports/${selectedReport.id}/status`, { status });
      setReports(current => current.map(report => report.id === selectedReport.id ? response.data.report : report));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteReport = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    setError('');
    try {
      await api.delete(`/reports/${selectedReport.id}`);
      setReports(current => current.filter(report => report.id !== selectedReport.id));
      setSelectedId(null);
      setDeleteArmed(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Cette page est réservée aux administrateurs.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-umbrella-text">Signalements cartographiques</h1>
          <p className="mt-1 text-sm text-umbrella-text-secondary">Examinez les zones signalées comme incorrectes.</p>
        </div>
        <button onClick={fetchReports} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-umbrella-border bg-white px-4 py-2 text-sm text-umbrella-text transition hover:bg-umbrella-bg-alt disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-umbrella-border bg-white p-3">
        {([
          ['all', 'Tous', counts.all],
          ['pending', 'À traiter', counts.pending],
          ['fixed', 'Corrigés', counts.fixed],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => { setFilter(value); setSelectedId(null); setDeleteArmed(false); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${filter === value ? 'bg-umbrella-dark text-white' : 'bg-umbrella-bg-alt text-umbrella-text-secondary hover:text-umbrella-text'}`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center rounded-xl border border-umbrella-border bg-white">
              <Loader2 className="animate-spin text-umbrella-accent" size={24} />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-xl border border-umbrella-border bg-white px-6 py-14 text-center">
              <Check className="mx-auto mb-3 text-umbrella-accent" size={28} />
              <p className="text-sm font-medium text-umbrella-text">Aucun signalement dans cette catégorie</p>
            </div>
          ) : filteredReports.map(report => (
            <button
              key={report.id}
              onClick={() => { setSelectedId(report.id); setDeleteArmed(false); }}
              className={`w-full rounded-xl border bg-white p-5 text-left transition ${selectedId === report.id ? 'border-umbrella-dark ring-1 ring-umbrella-dark' : 'border-umbrella-border hover:border-black/25'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${report.status === 'pending' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {report.status === 'pending' ? 'À traiter' : 'Corrigé'}
                    </span>
                    <span className="text-xs text-umbrella-text-light">#{report.id}</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-medium text-umbrella-text">{report.comment}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-umbrella-text-secondary">
                    <span className="flex items-center gap-1.5"><MapPin size={13} /> {report.layer_display_name}</span>
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>
                <ChevronRight className="mt-1 shrink-0 text-umbrella-text-light" size={18} />
              </div>
            </button>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-umbrella-border bg-white p-5 lg:sticky lg:top-6">
          {!selectedReport ? (
            <div className="py-14 text-center">
              <AlertTriangle className="mx-auto mb-3 text-black/15" size={32} />
              <p className="font-medium text-umbrella-text">Sélectionnez un signalement</p>
              <p className="mt-1 text-sm text-umbrella-text-light">Les détails et actions apparaîtront ici.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs text-umbrella-text-light">Signalement #{selectedReport.id}</p>
                  <h2 className="mt-1 text-lg font-semibold text-umbrella-text">Détails</h2>
                </div>
                <button onClick={() => setSelectedId(null)} className="rounded p-1 text-umbrella-text-light hover:bg-umbrella-bg-alt" aria-label="Fermer"><X size={17} /></button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="mb-1 text-xs text-umbrella-text-light">Commentaire</p>
                  <p className="rounded-lg bg-umbrella-bg-alt p-3 leading-relaxed text-umbrella-text">{selectedReport.comment}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-y-2 text-xs">
                  <span className="text-umbrella-text-light">Couche</span>
                  <span className="break-words text-right font-medium text-umbrella-text">{selectedReport.layer_display_name}</span>
                  {selectedReport.selected_clip && <>
                    <span className="text-umbrella-text-light">Étendue</span>
                    <span className="break-words text-right text-umbrella-text">{selectedReport.selected_clip.split(':').pop()}</span>
                  </>}
                  <span className="text-umbrella-text-light">Créé</span>
                  <span className="text-right text-umbrella-text">{formatDate(selectedReport.created_at)}</span>
                  <span className="text-umbrella-text-light">Mis à jour</span>
                  <span className="text-right text-umbrella-text">{formatDate(selectedReport.updated_at)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-umbrella-border pt-5">
                {selectedReport.status === 'pending' ? (
                  <button onClick={() => updateStatus('fixed')} disabled={actionLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                    <Check size={16} /> Marquer comme corrigé
                  </button>
                ) : (
                  <button onClick={() => updateStatus('pending')} disabled={actionLoading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-umbrella-border px-4 py-2.5 text-sm font-medium text-umbrella-text transition hover:bg-umbrella-bg-alt disabled:opacity-50">
                    Rouvrir le signalement
                  </button>
                )}
                <Link to={`/admin/signalements/${selectedReport.id}/carte`} className="flex w-full items-center justify-center gap-2 rounded-lg bg-umbrella-dark px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black">
                  <Eye size={16} /> Voir sur la carte
                </Link>
                {!deleteArmed ? (
                  <button onClick={() => setDeleteArmed(true)} disabled={actionLoading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                    <Trash2 size={16} /> Supprimer
                  </button>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="mb-3 text-xs text-red-700">Supprimer définitivement ce signalement ?</p>
                    <div className="flex gap-2">
                      <button onClick={deleteReport} disabled={actionLoading} className="flex-1 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirmer</button>
                      <button onClick={() => setDeleteArmed(false)} className="flex-1 rounded-md bg-white px-3 py-2 text-xs font-medium text-umbrella-text">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
