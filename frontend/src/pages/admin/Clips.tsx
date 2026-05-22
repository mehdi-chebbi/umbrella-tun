import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  RefreshCw, Scissors, Trash2, Check, X, AlertTriangle, ArrowLeft,
  ChevronRight, Database, Clock, HardDrive, Search, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────

interface LayerClipStatus {
  id: number;
  geoserver_name: string;
  display_name: string;
  file_path: string;
  style_name: string | null;
  clippedCountries: number;
  totalCountries: number;
  totalSizeBytes: number;
  fullyClipped: boolean;
  isRunning: boolean;
  canClip: boolean;
}

interface ClippedCountriesResponse {
  total: number;
  clipped: string[];
  remaining: string[];
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function ClipManagement() {
  const { user, isAdmin } = useAuth();
  const [layers, setLayers] = useState<LayerClipStatus[]>([]);
  const [totalCountries, setTotalCountries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clippingLayerId, setClippingLayerId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Country detail modal
  const [modalLayer, setModalLayer] = useState<LayerClipStatus | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<ClippedCountriesResponse | null>(null);
  const [countrySearch, setCountrySearch] = useState('');

  // Delete states
  const [deletingCountry, setDeletingCountry] = useState<string | null>(null);
  const [deletingLayerId, setDeletingLayerId] = useState<number | null>(null);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (user && isAdmin) fetchStatus();
  }, [user, isAdmin]);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/clip/batch-status');
      setLayers(response.data.layers);
      setTotalCountries(response.data.totalCountries);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh while clipping
  useEffect(() => {
    const anyRunning = layers.some(l => l.isRunning);
    if (!anyRunning) return;
    const interval = setInterval(() => fetchStatus(), 5000);
    return () => clearInterval(interval);
  }, [layers, fetchStatus]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const handleStartClip = async (layer: LayerClipStatus) => {
    if (!layer.canClip) {
      showToast('Aucun style assigné. Synchronisez d\'abord la couche.', 'error');
      return;
    }
    if (layer.isRunning) {
      showToast('Découpage déjà en cours', 'info');
      return;
    }

    setClippingLayerId(layer.id);
    setError('');
    try {
      const response = await api.post('/clip/batch', { layerId: layer.id });
      showToast(`Découpage démarré pour ${layer.display_name} (${response.data.totalCountries} pays)`, 'success');
      fetchStatus();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Échec du démarrage', 'error');
    } finally {
      setClippingLayerId(null);
    }
  };

  const handleOpenCountryModal = async (layer: LayerClipStatus) => {
    setModalLayer(layer);
    setModalData(null);
    setCountrySearch('');
    setModalLoading(true);
    try {
      const response = await api.get(`/clip/layer/${layer.id}/clipped-countries`);
      setModalData(response.data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Échec du chargement', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalLayer(null);
    setModalData(null);
    setCountrySearch('');
  };

  const handleDeleteCountry = (layer: LayerClipStatus, country: string) => {
    setConfirmAction({
      title: 'Supprimer le découpage',
      message: `Supprimer la couche découpée pour ${country} (${layer.display_name}) ?`,
      onConfirm: async () => {
        setConfirmAction(null);
        setDeletingCountry(country);
        try {
          await api.delete('/clip/clipped-layer', { data: { layerId: layer.id, countryFile: `${country}.geojson` } });
          showToast(`Découpage supprimé pour ${country}`, 'success');
          handleOpenCountryModal(layer);
          fetchStatus();
        } catch (err: any) {
          showToast(err.response?.data?.error || 'Échec de la suppression', 'error');
        } finally {
          setDeletingCountry(null);
        }
      }
    });
  };

  const handleDeleteAllForLayer = (layer: LayerClipStatus) => {
    const sizeStr = formatBytes(layer.totalSizeBytes);
    setConfirmAction({
      title: 'Supprimer tous les découpages',
      message: `Supprimer les ${layer.clippedCountries} couches découpées pour ${layer.display_name} (${sizeStr}) ?`,
      onConfirm: async () => {
        setConfirmAction(null);
        setDeletingLayerId(layer.id);
        try {
          const response = await api.delete('/clip/batch-delete', { data: { layerId: layer.id } });
          if (response.data.status === 'partial') {
            showToast(response.data.message, 'warning');
          } else {
            showToast(`Tous les découpages supprimés pour ${layer.display_name}`, 'success');
          }
          fetchStatus();
          if (modalLayer?.id === layer.id) handleCloseModal();
        } catch (err: any) {
          showToast(err.response?.data?.error || 'Échec de la suppression', 'error');
        } finally {
          setDeletingLayerId(null);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-umbrella-accent mx-auto" />
          <p className="mt-4 text-umbrella-text-secondary">Chargement…</p>
        </div>
      </div>
    );
  }

  const fullyClippedCount = layers.filter(l => l.fullyClipped).length;
  const partiallyClippedCount = layers.filter(l => l.clippedCountries > 0 && !l.fullyClipped).length;
  const notClippedCount = layers.filter(l => l.clippedCountries === 0).length;
  const runningCount = layers.filter(l => l.isRunning).length;
  const totalStorageBytes = layers.reduce((sum, l) => sum + (l.totalSizeBytes || 0), 0);

  const getProgressPercentage = (layer: LayerClipStatus) => {
    if (layer.totalCountries === 0) return 0;
    return Math.round((layer.clippedCountries / layer.totalCountries) * 100);
  };

  const filteredClipped = modalData?.clipped.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())) || [];
  const filteredRemaining = modalData?.remaining.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-umbrella-bg-alt rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-umbrella-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-umbrella-text font-serif">Gestion des découpages</h1>
            <p className="text-umbrella-text-secondary mt-1">Découper les couches raster par pays et gérer le cache</p>
          </div>
        </div>
        <button onClick={fetchStatus} className="px-4 py-2 bg-umbrella-bg-alt text-umbrella-text rounded-lg hover:bg-gray-200 transition font-medium text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${toastType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : toastType === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : toastType === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
          {toastType === 'success' && <Check className="w-5 h-5 shrink-0" />}
          {toastType === 'error' && <X className="w-5 h-5 shrink-0" />}
          {toastType === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {toastType === 'info' && <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-xs sm:text-sm">Rasters</p>
          <p className="text-2xl sm:text-3xl font-bold text-umbrella-text">{layers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-xs sm:text-sm">Complets</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{fullyClippedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-xs sm:text-sm">Partiels</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600">{partiallyClippedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-xs sm:text-sm">Non découpés</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{notClippedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-xs sm:text-sm">En cours</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{runningCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-xs sm:text-sm">Stockage</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatBytes(totalStorageBytes)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-umbrella-border">
        <div className="px-6 py-4 border-b border-umbrella-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-umbrella-text">
            Couches raster <span className="text-sm font-normal text-umbrella-text-light ml-2">({totalCountries} pays par raster)</span>
          </h2>
          {runningCount > 0 && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Actualisation auto</span>
            </div>
          )}
        </div>

        {layers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Database className="w-12 h-12 text-umbrella-text-light mx-auto mb-4" />
            <p className="text-umbrella-text-secondary">Aucune couche découpable</p>
            <p className="text-umbrella-text-light text-sm mt-1">Ajoutez des couches avec un file_path et synchronisez les styles depuis GeoServer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-umbrella-bg-alt">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Couche</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Progression</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Statut</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Stockage</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-umbrella-border">
                {layers.map(layer => {
                  const progress = getProgressPercentage(layer);
                  return (
                    <tr key={layer.id} className={`hover:bg-umbrella-bg-alt ${layer.isRunning ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-umbrella-text">{layer.display_name}</div>
                        <div className="text-xs text-umbrella-text-light">{layer.geoserver_name}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleOpenCountryModal(layer)} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition group">
                          <span className="text-sm font-medium text-umbrella-text-secondary min-w-[60px]">{layer.clippedCountries}/{layer.totalCountries}</span>
                          <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 relative">
                            <div className={`h-2 rounded-full transition-all duration-300 ${layer.fullyClipped ? 'bg-green-500' : layer.clippedCountries > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-umbrella-text-light">{progress}%</span>
                          <ChevronRight className="w-3.5 h-3.5 text-umbrella-text-light group-hover:text-umbrella-text-secondary transition" />
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {layer.isRunning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Découpage
                          </span>
                        ) : layer.fullyClipped ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            <Check className="w-3 h-3" /> Complet
                          </span>
                        ) : layer.clippedCountries > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Partiel</span>
                        ) : !layer.canClip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Pas de style</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Non découpé</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {layer.clippedCountries > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <HardDrive className="w-4 h-4 text-umbrella-text-light" />
                            <span className="text-sm font-medium text-umbrella-text-secondary">{formatBytes(layer.totalSizeBytes)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-umbrella-text-light">—</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {layer.isRunning ? (
                            <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                              <RefreshCw className="w-4 h-4 animate-spin" /> Traitement
                            </span>
                          ) : (
                            <>
                              {!layer.fullyClipped && (
                                <button onClick={() => handleStartClip(layer)} disabled={clippingLayerId === layer.id || !layer.canClip} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${!layer.canClip ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-umbrella-dark text-white hover:bg-umbrella-text'} ${clippingLayerId === layer.id ? 'opacity-50' : ''}`}>
                                  <Scissors className="w-4 h-4" />
                                  <span className="hidden sm:inline">{layer.clippedCountries > 0 ? 'Découper le reste' : 'Tout découper'}</span>
                                  <span className="sm:hidden">Découper</span>
                                </button>
                              )}
                              {layer.clippedCountries > 0 && (
                                <button onClick={() => handleDeleteAllForLayer(layer)} disabled={deletingLayerId === layer.id || layer.isRunning} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${deletingLayerId === layer.id ? 'opacity-50 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
                                  {deletingLayerId === layer.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  <span className="hidden sm:inline">Tout supprimer</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-umbrella-bg-alt border border-umbrella-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-umbrella-text mb-2">Comment ça marche</h3>
        <ul className="text-sm text-umbrella-text-secondary space-y-1">
          <li>• Cliquez sur la barre de progression pour voir les détails par pays</li>
          <li>• « Tout découper » lance le découpage pour les {totalCountries} pays</li>
          <li>• « Découper le reste » reprend uniquement les pays manquants</li>
          <li>• Les gros pays peuvent prendre 10-15 minutes</li>
          <li>• L'actualisation est automatique pendant le traitement</li>
          <li>• Le découpage peut être repris si interrompu</li>
        </ul>
      </div>

      {/* ─── Country Detail Modal ────────────────────────────────────── */}
      {modalLayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-umbrella-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-umbrella-text">{modalLayer.display_name}</h3>
                <p className="text-sm text-umbrella-text-light mt-0.5">
                  {modalLayer.clippedCountries}/{modalLayer.totalCountries} pays découpés
                  {modalLayer.totalSizeBytes > 0 && <span className="ml-2 text-purple-600 font-medium">({formatBytes(modalLayer.totalSizeBytes)})</span>}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-umbrella-bg-alt rounded-lg transition">
                <X className="w-5 h-5 text-umbrella-text-light" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-umbrella-accent" />
                </div>
              ) : modalData ? (
                <>
                  {/* Progress bar in modal */}
                  <div className="mb-5">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all duration-500 ${modalLayer.fullyClipped ? 'bg-green-500' : modalLayer.clippedCountries > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${getProgressPercentage(modalLayer)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-umbrella-text-light">
                      <span>{getProgressPercentage(modalLayer)}% complété</span>
                      <span>{modalData.total - modalLayer.clippedCountries} restant(s)</span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-umbrella-text-light" />
                    <input type="text" value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Rechercher un pays…" className="w-full pl-9 pr-3 py-2 border border-umbrella-border rounded-lg text-sm focus:ring-2 focus:ring-umbrella-accent focus:border-transparent" />
                  </div>

                  {/* Clipped Countries */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Découpés ({countrySearch ? filteredClipped.length : modalData.clipped.length})
                      </span>
                      {modalData.clipped.length > 0 && !modalLayer.isRunning && (
                        <button onClick={() => handleDeleteAllForLayer(modalLayer)} disabled={deletingLayerId === modalLayer.id} className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition">
                          {deletingLayerId === modalLayer.id ? 'Suppression…' : 'Tout supprimer'}
                        </button>
                      )}
                    </h4>
                    <div className="max-h-48 overflow-y-auto border border-green-200 rounded-lg bg-green-50/50">
                      {filteredClipped.length === 0 ? (
                        <p className="text-sm text-umbrella-text-light py-3 px-3">Aucun résultat</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 p-2">
                          {filteredClipped.map(country => (
                            <span key={country} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-md text-xs font-medium group/clip">
                              {deletingCountry === country ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  {country}
                                  {!modalLayer.isRunning && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCountry(modalLayer, country); }} className="ml-0.5 text-green-400 hover:text-red-600 transition">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remaining Countries */}
                  {filteredRemaining.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-umbrella-text-light mb-2 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Restants ({countrySearch ? filteredRemaining.length : modalData.remaining.length})
                      </h4>
                      <div className="max-h-48 overflow-y-auto border border-umbrella-border rounded-lg bg-umbrella-bg-alt/50">
                        <div className="flex flex-wrap gap-1.5 p-2">
                          {filteredRemaining.map(country => (
                            <span key={country} className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-umbrella-text-secondary rounded-md text-xs font-medium">{country}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-umbrella-text-light text-sm text-center py-8">Échec du chargement des détails</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Dialog ───────────────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-umbrella-text">{confirmAction.title}</h3>
              </div>
              <p className="text-sm text-umbrella-text-secondary mb-6">{confirmAction.message}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-umbrella-text-secondary bg-umbrella-bg-alt rounded-lg hover:bg-gray-200 transition">Annuler</button>
                <button onClick={confirmAction.onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
