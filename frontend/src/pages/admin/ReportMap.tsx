import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Calendar, Layers, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';

interface DataReport {
  id: number;
  layer_name: string;
  layer_display_name: string;
  selected_clip: string | null;
  geometry: any;
  comment: string;
  status: 'pending' | 'fixed';
  created_at: string;
}

export default function AdminReportMap() {
  const { id } = useParams();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<DataReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then(response => setReport(response.data.report))
      .catch((err: any) => setError(err.response?.data?.error || 'Échec du chargement du signalement'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!report || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([34.0, 9.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
      crossOrigin: 'anonymous',
    }).addTo(map);

    const workspace = report.layer_name.includes(':') ? report.layer_name.split(':')[0] : 'default';
    L.tileLayer.wms(`/api/clip/wms?workspace=${encodeURIComponent(workspace)}`, {
      layers: report.selected_clip || report.layer_name,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
      opacity: 0.78,
    }).addTo(map);

    const reportedArea = L.geoJSON({
      type: 'Feature',
      properties: {},
      geometry: report.geometry,
    } as any, {
      style: {
        color: '#dc2626',
        weight: 3,
        dashArray: '9 7',
        fillColor: '#ef4444',
        fillOpacity: 0.2,
      },
    }).addTo(map);

    const bounds = reportedArea.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    return () => map.remove();
  }, [report]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-umbrella-bg-alt"><Loader2 className="animate-spin text-umbrella-accent" size={28} /></div>;
  if (error || !report) return <div className="flex min-h-screen items-center justify-center bg-umbrella-bg-alt p-6"><div className="rounded-xl border border-red-200 bg-white p-6 text-red-700">{error || 'Signalement introuvable'}</div></div>;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white md:flex-row">
      <aside className="z-10 flex w-full shrink-0 flex-col border-r border-umbrella-border bg-white md:w-80">
        <div className="border-b border-umbrella-border p-5">
          <Link to="/admin/signalements" className="mb-5 inline-flex items-center gap-2 text-sm text-umbrella-text-secondary hover:text-umbrella-text">
            <ArrowLeft size={16} /> Retour aux signalements
          </Link>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold text-umbrella-text">Signalement #{report.id}</h1>
            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${report.status === 'pending' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {report.status === 'pending' ? 'À traiter' : 'Corrigé'}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-umbrella-text-light"><Layers size={14} /> Couche</p>
            <p className="text-sm font-medium text-umbrella-text">{report.layer_display_name}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-umbrella-text-light">Commentaire</p>
            <p className="rounded-lg bg-umbrella-bg-alt p-3 text-sm leading-relaxed text-umbrella-text">{report.comment}</p>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-umbrella-text-light"><Calendar size={14} /> Date du signalement</p>
            <p className="text-sm text-umbrella-text">{new Intl.DateTimeFormat('fr-TN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(report.created_at))}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-red-700"><AlertTriangle size={14} /> La zone rouge correspond à la zone signalée.</p>
          </div>
        </div>
      </aside>

      <main className="relative min-h-[65vh] flex-1 md:min-h-0">
        <div ref={mapContainerRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-5 z-[500] -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xl">
          Zone signalée #{report.id}
        </div>
      </main>
    </div>
  );
}
