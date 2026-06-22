import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  Layers, FolderTree, Plus, Pencil, Trash2, RefreshCw, Check, X, AlertTriangle,
  ChevronDown, ArrowLeft, Scissors
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────

interface LegendItem {
  class: string | { en: string; fr: string };
  color: string;
}

interface Layer {
  id: number;
  geoserver_name: string;
  display_name: string | null;
  group_id: number | null;
  group_name: string | null;
  group_legend: LegendItem[] | null;
  file_path: string | null;
  class_labels: { [key: string]: string } | null;
  legend: LegendItem[] | null;
  style_name: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Group {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  description: string | null;
  legend: LegendItem[] | null;
  sort_order: number;
  layer_count: string;
  child_count: string;
}

const defaultClassLabels = {
  "1": "Forêt",
  "2": "Parcours",
  "3": "Agriculture irriguée",
  "4": "Agriculture pluviale",
  "5": "Oasis",
  "6": "Plan d'eau",
  "7": "Urbain",
  "8": "Sol nu",
  "9": "Étendue dunaire"
};

// ─── Component ──────────────────────────────────────────────────────────

export default function LayerManagement() {
  const { user, isAdmin } = useAuth();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; total: number } | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'layers' | 'groups'>('layers');

  // Layer form state
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null);
  const [layerFormData, setLayerFormData] = useState({
    geoserver_name: '',
    display_name: '',
    group_id: '',
    file_path: '',
    class_labels: JSON.stringify(defaultClassLabels, null, 2),
    legend: [] as LegendItem[],
    is_active: true,
    sort_order: 0
  });
  const [layerFormError, setLayerFormError] = useState('');
  const [isLayerSubmitting, setIsLayerSubmitting] = useState(false);

  // Group form state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    parent_id: '',
    description: '',
    legend: [] as LegendItem[],
    sort_order: 0
  });
  const [groupFormError, setGroupFormError] = useState('');
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [layersRes, groupsRes] = await Promise.all([
        api.get('/layers'),
        api.get('/groups')
      ]);
      setLayers(layersRes.data.layers || []);
      setGroups(groupsRes.data.groups || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Sync from GeoServer ────────────────────────────────────────────
  const handleSyncFromGeoServer = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const response = await api.post('/clip/layers/sync');
      setSyncResult({
        added: response.data.added,
        updated: response.data.updated,
        total: response.data.total
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Layer handlers ─────────────────────────────────────────────────
  const handleOpenLayerModal = (layer?: Layer) => {
    if (layer) {
      setEditingLayer(layer);
      setLayerFormData({
        geoserver_name: layer.geoserver_name,
        display_name: layer.display_name || '',
        group_id: layer.group_id ? String(layer.group_id) : '',
        file_path: layer.file_path || '',
        class_labels: layer.class_labels ? JSON.stringify(layer.class_labels, null, 2) : JSON.stringify(defaultClassLabels, null, 2),
        legend: layer.legend || [],
        is_active: layer.is_active,
        sort_order: layer.sort_order
      });
    } else {
      setEditingLayer(null);
      setLayerFormData({
        geoserver_name: '',
        display_name: '',
        group_id: '',
        file_path: '',
        class_labels: JSON.stringify(defaultClassLabels, null, 2),
        legend: [],
        is_active: true,
        sort_order: 0
      });
    }
    setLayerFormError('');
    setIsLayerModalOpen(true);
  };

  const handleCloseLayerModal = () => {
    setIsLayerModalOpen(false);
    setEditingLayer(null);
    setLayerFormError('');
  };

  const handleSubmitLayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLayerFormError('');
    setIsLayerSubmitting(true);

    try {
      let classLabelsObj = null;
      if (layerFormData.class_labels.trim()) {
        try {
          classLabelsObj = JSON.parse(layerFormData.class_labels);
        } catch {
          setLayerFormError('Format JSON invalide pour les class_labels');
          setIsLayerSubmitting(false);
          return;
        }
      }

      const payload = {
        geoserver_name: layerFormData.geoserver_name,
        display_name: layerFormData.display_name || null,
        group_id: layerFormData.group_id ? parseInt(layerFormData.group_id) : null,
        file_path: layerFormData.file_path || null,
        class_labels: classLabelsObj,
        legend: layerFormData.legend.length > 0 ? layerFormData.legend : null,
        is_active: layerFormData.is_active,
        sort_order: layerFormData.sort_order
      };

      if (editingLayer) {
        await api.put(`/layers/${editingLayer.id}`, payload);
      } else {
        await api.post('/layers', payload);
      }

      handleCloseLayerModal();
      fetchData();
    } catch (err: any) {
      setLayerFormError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLayerSubmitting(false);
    }
  };

  const handleDeleteLayer = async (id: number) => {
    if (!confirm('Supprimer cette couche ?')) return;
    try {
      await api.delete(`/layers/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la suppression');
    }
  };

  const handleToggleLayerActive = async (layer: Layer) => {
    try {
      await api.put(`/layers/${layer.id}`, { is_active: !layer.is_active });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la mise à jour');
    }
  };

  // ─── Group handlers ─────────────────────────────────────────────────
  const handleOpenGroupModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        name: group.name,
        parent_id: group.parent_id ? String(group.parent_id) : '',
        description: group.description || '',
        legend: group.legend || [],
        sort_order: group.sort_order
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({ name: '', parent_id: '', description: '', legend: [], sort_order: 0 });
    }
    setGroupFormError('');
    setIsGroupModalOpen(true);
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setEditingGroup(null);
    setGroupFormError('');
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupFormError('');
    setIsGroupSubmitting(true);

    try {
      const payload = {
        name: groupFormData.name,
        parent_id: groupFormData.parent_id ? parseInt(groupFormData.parent_id) : null,
        description: groupFormData.description || null,
        legend: groupFormData.legend.length > 0 ? groupFormData.legend : null,
        sort_order: groupFormData.sort_order
      };

      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, payload);
      } else {
        await api.post('/groups', payload);
      }

      handleCloseGroupModal();
      fetchData();
    } catch (err: any) {
      setGroupFormError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setIsGroupSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Supprimer ce groupe ? Les sous-groupes seront aussi supprimés et les couches seront dissociées.')) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la suppression');
    }
  };

  // ─── Group tree helpers ─────────────────────────────────────────────
  const buildGroupTree = () => {
    const groupMap: { [key: number]: any } = {};
    groups.forEach(g => { groupMap[g.id] = { ...g, children: [] }; });

    const rootGroups: any[] = [];
    groups.forEach(g => {
      if (g.parent_id && groupMap[g.parent_id]) {
        groupMap[g.parent_id].children.push(groupMap[g.id]);
      } else {
        rootGroups.push(groupMap[g.id]);
      }
    });

    const sortChildren = (list: any[]) => {
      list.forEach(g => {
        if (g.children?.length > 0) {
          g.children.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          sortChildren(g.children);
        }
      });
    };
    sortChildren(rootGroups);
    rootGroups.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return rootGroups;
  };

  const getFlatGroupOptions = () => {
    const options: { id: number; name: string; path: string }[] = [];
    const addGroup = (list: any[], parentPath = '') => {
      list.forEach(g => {
        const currentPath = parentPath ? `${parentPath} → ${g.name}` : g.name;
        options.push({ id: g.id, name: g.name, path: currentPath });
        if (g.children?.length > 0) addGroup(g.children, currentPath);
      });
    };
    addGroup(buildGroupTree());
    return options;
  };

  const renderGroupTree = (groupList: any[], depth = 0) => {
    return groupList.map(group => (
      <div key={group.id}>
        <div
          className="p-4 hover:bg-umbrella-bg-alt flex justify-between items-center"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="flex items-center gap-2">
            {group.children?.length > 0 && (
              <ChevronDown className="w-4 h-4 text-umbrella-text-light" />
            )}
            <div>
              <h3 className="font-semibold text-umbrella-text">{group.name}</h3>
              {group.description && <p className="text-umbrella-text-secondary text-sm">{group.description}</p>}
              <div className="flex gap-4 text-xs text-umbrella-text-light mt-1">
                <span>{group.layer_count || 0} couche(s)</span>
                <span>{group.child_count || 0} sous-groupe(s)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleOpenGroupModal(group)} className="text-umbrella-accent hover:text-umbrella-dark font-medium text-sm flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
            <button onClick={() => handleDeleteGroup(group.id)} className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
        {group.children?.length > 0 && renderGroupTree(group.children, depth + 1)}
      </div>
    ));
  };

  // ─── Stats ──────────────────────────────────────────────────────────
  const configuredForStats = layers.filter(l => l.file_path && l.class_labels).length;
  const activeLayers = layers.filter(l => l.is_active).length;
  const ungroupedLayers = layers.filter(l => !l.group_id).length;

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-umbrella-bg-alt rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-umbrella-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-umbrella-text font-serif">Gestion des couches</h1>
            <p className="text-umbrella-text-secondary mt-1">Synchroniser, organiser et configurer les couches géospatiales</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/decoupages"
            className="px-4 py-2 bg-umbrella-dark text-white rounded-lg hover:bg-umbrella-text transition font-medium flex items-center gap-2"
          >
            <Scissors className="w-4 h-4" /> Découpages
          </Link>
          <button
            onClick={handleSyncFromGeoServer}
            disabled={isSyncing}
            className={`px-4 py-2 bg-umbrella-accent text-white rounded-lg hover:bg-umbrella-accent/90 transition font-medium flex items-center gap-2 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation…' : 'Synchroniser depuis GeoServer'}
          </button>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 shrink-0" />
          <span className="font-medium">Synchronisation terminée</span>
          <span>{syncResult.added} ajoutée(s), {syncResult.updated} mise(s) à jour, {syncResult.total} au total</span>
          <button onClick={() => setSyncResult(null)} className="ml-auto text-green-700 hover:text-green-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-sm">Total couches</p>
          <p className="text-3xl font-bold text-umbrella-text">{layers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-sm">Actives</p>
          <p className="text-3xl font-bold text-green-600">{activeLayers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-sm">Groupes</p>
          <p className="text-3xl font-bold text-umbrella-accent">{groups.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-sm">Stats prêtes</p>
          <p className="text-3xl font-bold text-purple-600">{configuredForStats}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-umbrella-border">
          <p className="text-umbrella-text-secondary text-sm">Non groupées</p>
          <p className="text-3xl font-bold text-amber-600">{ungroupedLayers}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-umbrella-border mb-6">
        <button
          onClick={() => setActiveTab('layers')}
          className={`px-6 py-3 text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'layers' ? 'text-umbrella-text border-b-2 border-umbrella-accent' : 'text-umbrella-text-light hover:text-umbrella-text-secondary'}`}
        >
          <Layers className="w-4 h-4" /> Couches ({layers.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-3 text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'groups' ? 'text-umbrella-text border-b-2 border-umbrella-accent' : 'text-umbrella-text-light hover:text-umbrella-text-secondary'}`}
        >
          <FolderTree className="w-4 h-4" /> Groupes ({groups.length})
        </button>
      </div>

      {/* Layers Tab */}
      {activeTab === 'layers' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-umbrella-border">
          <div className="px-6 py-4 border-b border-umbrella-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-umbrella-text">Toutes les couches</h2>
            <button
              onClick={() => handleOpenLayerModal()}
              className="px-4 py-2 bg-umbrella-dark text-white rounded-lg hover:bg-umbrella-text transition font-medium text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>

          {layers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Layers className="w-12 h-12 text-umbrella-text-light mx-auto mb-4" />
              <p className="text-umbrella-text-secondary">Aucune couche trouvée</p>
              <p className="text-umbrella-text-light text-sm mt-1">Cliquez sur « Synchroniser depuis GeoServer » pour importer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-umbrella-bg-alt">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Couche</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Groupe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-umbrella-text-light uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-umbrella-border">
                  {layers.map(layer => (
                    <tr key={layer.id} className={`hover:bg-umbrella-bg-alt ${!layer.is_active ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-umbrella-text">{layer.display_name || layer.geoserver_name}</div>
                          <div className="text-xs text-umbrella-text-light">{layer.geoserver_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {layer.group_name ? (
                          <span className="px-2 py-1 bg-umbrella-accent-light text-umbrella-accent rounded text-xs font-medium">{layer.group_name}</span>
                        ) : (
                          <span className="text-umbrella-text-light text-sm">Non groupée</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleLayerActive(layer)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${layer.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {layer.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {layer.file_path && layer.class_labels ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm"><Check className="w-4 h-4" /> Prêt</span>
                        ) : (
                          <span className="text-amber-600 text-sm">À configurer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleOpenLayerModal(layer)} className="text-umbrella-accent hover:text-umbrella-dark mr-4 font-medium flex items-center gap-1 inline-flex">
                          <Pencil className="w-3.5 h-3.5" /> Modifier
                        </button>
                        <button onClick={() => handleDeleteLayer(layer.id)} className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1 inline-flex">
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-umbrella-border">
          <div className="px-6 py-4 border-b border-umbrella-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-umbrella-text">Groupes de couches (imbriqués)</h2>
            <button
              onClick={() => handleOpenGroupModal()}
              className="px-4 py-2 bg-umbrella-dark text-white rounded-lg hover:bg-umbrella-text transition font-medium text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter un groupe
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderTree className="w-12 h-12 text-umbrella-text-light mx-auto mb-4" />
              <p className="text-umbrella-text-secondary">Aucun groupe créé</p>
              <p className="text-umbrella-text-light text-sm mt-1">Créez des groupes pour organiser les couches</p>
            </div>
          ) : (
            <div className="divide-y divide-umbrella-border">
              {renderGroupTree(buildGroupTree())}
            </div>
          )}
        </div>
      )}

      {/* ─── Layer Modal ──────────────────────────────────────────────── */}
      {isLayerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseLayerModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-umbrella-border">
              <h3 className="text-lg font-semibold text-umbrella-text">{editingLayer ? 'Modifier la couche' : 'Ajouter une couche'}</h3>
            </div>

            <form onSubmit={handleSubmitLayer} className="p-6 space-y-4">
              {layerFormError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{layerFormError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Nom GeoServer *</label>
                <input type="text" value={layerFormData.geoserver_name} onChange={e => setLayerFormData({ ...layerFormData, geoserver_name: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent" placeholder="ex: LC:LandcoverOSS2000" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Nom d'affichage</label>
                <input type="text" value={layerFormData.display_name} onChange={e => setLayerFormData({ ...layerFormData, display_name: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent" placeholder="Nom visible par l'utilisateur" />
              </div>

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Groupe</label>
                <select value={layerFormData.group_id} onChange={e => setLayerFormData({ ...layerFormData, group_id: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent">
                  <option value="">Aucun groupe (non groupée)</option>
                  {getFlatGroupOptions().map(g => (
                    <option key={g.id} value={g.id}>{g.path}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Chemin du fichier raster</label>
                <input type="text" value={layerFormData.file_path} onChange={e => setLayerFormData({ ...layerFormData, file_path: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent" placeholder="/data/rasters/layer.tif" />
              </div>

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Class Labels (JSON)</label>
                <textarea value={layerFormData.class_labels} onChange={e => setLayerFormData({ ...layerFormData, class_labels: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent font-mono text-sm" rows={8} />
              </div>

              {/* Legend Editor */}
              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Légende</label>
                <div className="border border-umbrella-border rounded-lg overflow-hidden">
                  <div className="bg-umbrella-bg-alt px-3 py-2 border-b border-umbrella-border flex justify-between items-center">
                    <span className="text-xs font-medium text-umbrella-text-secondary">Classe / Couleur</span>
                    <button type="button" onClick={() => setLayerFormData({ ...layerFormData, legend: [...layerFormData.legend, { class: '', color: '#000000' }] })} className="text-sm text-umbrella-accent hover:text-umbrella-dark font-medium flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {layerFormData.legend.length === 0 ? (
                      <div className="px-3 py-6 text-center text-umbrella-text-light text-sm">Aucun élément de légende</div>
                    ) : (
                      layerFormData.legend.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 border-b border-umbrella-border last:border-b-0">
                          <input type="text" value={typeof item.class === 'object' ? (item.class as any).fr || (item.class as any).en : item.class} onChange={e => { const newLegend = [...layerFormData.legend]; newLegend[index] = { ...newLegend[index], class: e.target.value }; setLayerFormData({ ...layerFormData, legend: newLegend }); }} placeholder="Nom de la classe" className="flex-1 px-2 py-1 border border-umbrella-border rounded text-sm" />
                          <input type="color" value={item.color} onChange={e => { const newLegend = [...layerFormData.legend]; newLegend[index] = { ...newLegend[index], color: e.target.value }; setLayerFormData({ ...layerFormData, legend: newLegend }); }} className="w-10 h-8 border border-umbrella-border rounded cursor-pointer" />
                          <button type="button" onClick={() => setLayerFormData({ ...layerFormData, legend: layerFormData.legend.filter((_, i) => i !== index) })} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={layerFormData.is_active} onChange={e => setLayerFormData({ ...layerFormData, is_active: e.target.checked })} className="h-4 w-4 text-umbrella-accent rounded" />
                  <span className="text-sm text-umbrella-text">Active sur la carte</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-umbrella-text mb-1">Ordre</label>
                  <input type="number" value={layerFormData.sort_order} onChange={e => setLayerFormData({ ...layerFormData, sort_order: parseInt(e.target.value) || 0 })} className="w-24 px-3 py-2 border border-umbrella-border rounded-lg" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-umbrella-border">
                <button type="button" onClick={handleCloseLayerModal} className="px-4 py-2 text-sm font-medium text-umbrella-text-secondary bg-umbrella-bg-alt rounded-lg hover:bg-gray-200 transition">Annuler</button>
                <button type="submit" disabled={isLayerSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-umbrella-accent rounded-lg hover:bg-umbrella-accent/90 transition disabled:opacity-50">
                  {isLayerSubmitting ? 'Enregistrement…' : editingLayer ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Group Modal ──────────────────────────────────────────────── */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseGroupModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-umbrella-border">
              <h3 className="text-lg font-semibold text-umbrella-text">{editingGroup ? 'Modifier le groupe' : 'Ajouter un groupe'}</h3>
            </div>

            <form onSubmit={handleSubmitGroup} className="p-6 space-y-4">
              {groupFormError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{groupFormError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Nom du groupe *</label>
                <input type="text" value={groupFormData.name} onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Groupe parent</label>
                <select value={groupFormData.parent_id} onChange={e => setGroupFormData({ ...groupFormData, parent_id: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent">
                  <option value="">Aucun (racine)</option>
                  {getFlatGroupOptions().filter(g => g.id !== editingGroup?.id).map(g => (
                    <option key={g.id} value={g.id}>{g.path}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Description</label>
                <textarea value={groupFormData.description} onChange={e => setGroupFormData({ ...groupFormData, description: e.target.value })} className="w-full px-3 py-2 border border-umbrella-border rounded-lg focus:ring-2 focus:ring-umbrella-accent focus:border-transparent" rows={3} />
              </div>

              {/* Group Legend Editor */}
              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Légende du groupe</label>
                <div className="border border-umbrella-border rounded-lg overflow-hidden">
                  <div className="bg-umbrella-bg-alt px-3 py-2 border-b border-umbrella-border flex justify-between items-center">
                    <span className="text-xs font-medium text-umbrella-text-secondary">Classe / Couleur</span>
                    <button type="button" onClick={() => setGroupFormData({ ...groupFormData, legend: [...groupFormData.legend, { class: '', color: '#000000' }] })} className="text-sm text-umbrella-accent hover:text-umbrella-dark font-medium flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {groupFormData.legend.length === 0 ? (
                      <div className="px-3 py-6 text-center text-umbrella-text-light text-sm">Aucun élément de légende</div>
                    ) : (
                      groupFormData.legend.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 border-b border-umbrella-border last:border-b-0">
                          <input type="text" value={typeof item.class === 'object' ? (item.class as any).fr || (item.class as any).en : item.class} onChange={e => { const newLegend = [...groupFormData.legend]; newLegend[index] = { ...newLegend[index], class: e.target.value }; setGroupFormData({ ...groupFormData, legend: newLegend }); }} placeholder="Nom de la classe" className="flex-1 px-2 py-1 border border-umbrella-border rounded text-sm" />
                          <input type="color" value={item.color} onChange={e => { const newLegend = [...groupFormData.legend]; newLegend[index] = { ...newLegend[index], color: e.target.value }; setGroupFormData({ ...groupFormData, legend: newLegend }); }} className="w-10 h-8 border border-umbrella-border rounded cursor-pointer" />
                          <button type="button" onClick={() => setGroupFormData({ ...groupFormData, legend: groupFormData.legend.filter((_, i) => i !== index) })} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-umbrella-text mb-2">Ordre de tri</label>
                <input type="number" value={groupFormData.sort_order} onChange={e => setGroupFormData({ ...groupFormData, sort_order: parseInt(e.target.value) || 0 })} className="w-24 px-3 py-2 border border-umbrella-border rounded-lg" />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-umbrella-border">
                <button type="button" onClick={handleCloseGroupModal} className="px-4 py-2 text-sm font-medium text-umbrella-text-secondary bg-umbrella-bg-alt rounded-lg hover:bg-gray-200 transition">Annuler</button>
                <button type="submit" disabled={isGroupSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-umbrella-accent rounded-lg hover:bg-umbrella-accent/90 transition disabled:opacity-50">
                  {isGroupSubmitting ? 'Enregistrement…' : editingGroup ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
