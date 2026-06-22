import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, Map, Satellite, PenTool, X, BarChart3, Loader2, Globe2, Download, FileDown, Image as ImageIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import 'leaflet-side-by-side';
import leafletImage from 'leaflet-image';
import Navbar from '@/components/Navbar';
import api from '@/services/api';

/* ─── Types ─── */

interface LegendItem {
  class?: string | { en: string; fr: string };
  label?: string;
  color: string;
}

interface LayerDef {
  id: number;
  name: string;
  geoserver_name: string;
  layerName: string;
  wmsUrl: string;
  hasStats: boolean;
  group_id: number | null;
  group_name: string | null;
  group_legend: LegendItem[] | null;
  legend: LegendItem[] | null;
}

interface LayerGroup {
  id: number;
  name: string;
  description: string | null;
  legend: LegendItem[] | null;
  parent_id: number | null;
  children: LayerGroup[];
  layers: LayerDef[];
}

interface StatClass {
  class_id: number;
  class_name: string;
  area_km2: number;
  percentage: number;
}

interface StatsResult {
  layer_name: string;
  total_area_km2: number;
  pixel_size_m: number;
  classes: StatClass[];
}

interface ClipInfo {
  country: string;
  clippedLayerName: string;
  bbox: [number, number, number, number] | null; // [west, south, east, north]
  downloadUrl?: string; // path to clipped .tif file, e.g. /files/{layer}/{id}.tif
}

const WMS_BASE = '/api/clip/wms';

type BaseMap = 'satellite' | 'osm';

const BASE_MAPS: Record<BaseMap, { url: string; opts: L.TileLayerOptions }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { maxZoom: 19, attribution: '&copy; Esri', crossOrigin: 'anonymous' },
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 19, attribution: '&copy; OpenStreetMap', crossOrigin: 'anonymous' },
  },
};

/* ─── Component ─── */

export default function Geoportail() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const activeWmsRef = useRef<L.TileLayer.WMS | null>(null);
  const activeLayerRef = useRef<LayerDef | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const selectedClipRef = useRef<string | null>(null); // mirror of selectedClip for use in draw handler
  const compareLeftLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const compareRightLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const compareControlRef = useRef<L.Control.SideBySide | null>(null);

  const [baseMap, setBaseMap] = useState<BaseMap>('satellite');
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  const [layerOpacity, setLayerOpacity] = useState(1);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});
  const [groups, setGroups] = useState<LayerGroup[]>([]);
  const [ungroupedLayers, setUngroupedLayers] = useState<LayerDef[]>([]);
  const [layersLoading, setLayersLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [statsResult, setStatsResult] = useState<StatsResult | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  // Clips (per-city clipped layers) for the active source layer
  const [clips, setClips] = useState<ClipInfo[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [selectedClip, setSelectedClip] = useState<string | null>(null); // null = full extent

  // Compare mode state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showComparePicker, setShowComparePicker] = useState(false);
  const [leftLayerId, setLeftLayerId] = useState<number | null>(null);
  const [rightLayerId, setRightLayerId] = useState<number | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const activeLayer = activeLayerId
    ? [...ungroupedLayers, ...getAllLayers(groups)].find(l => l.id === activeLayerId) || null
    : null;

  const activeLegend = activeLayer?.legend || activeLayer?.group_legend || null;

  // TIFF download URL for the currently selected clip (if any)
  const activeClipDownloadUrl = selectedClip
    ? clips.find(c => c.clippedLayerName === selectedClip)?.downloadUrl ?? null
    : null;

  const allLayersFlat = [...ungroupedLayers, ...getAllLayers(groups)];
  const leftLayer = leftLayerId ? allLayersFlat.find(l => l.id === leftLayerId) || null : null;
  const rightLayer = rightLayerId ? allLayersFlat.find(l => l.id === rightLayerId) || null : null;
  const leftLegend = leftLayer?.legend || leftLayer?.group_legend || null;
  const rightLegend = rightLayer?.legend || rightLayer?.group_legend || null;

  // Keep selectedClipRef in sync with selectedClip state (for use in draw handler)
  useEffect(() => {
    selectedClipRef.current = selectedClip;
  }, [selectedClip]);

  /* Helper: flatten all layers from nested groups */
  function getAllLayers(groups: LayerGroup[]): LayerDef[] {
    const result: LayerDef[] = [];
    for (const g of groups) {
      result.push(...g.layers);
      if (g.children.length > 0) result.push(...getAllLayers(g.children));
    }
    return result;
  }

  /* Helper: flatten layers with their group path for the compare picker */
  function flattenLayersWithPath(groupList: LayerGroup[], ungrouped: LayerDef[]): { layer: LayerDef; path: string }[] {
    const result: { layer: LayerDef; path: string }[] = [];
    const walk = (gl: LayerGroup[], parentPath = '') => {
      for (const g of gl) {
        const currentPath = parentPath ? `${parentPath} › ${g.name}` : g.name;
        for (const l of g.layers) result.push({ layer: l, path: currentPath });
        if (g.children.length > 0) walk(g.children, currentPath);
      }
    };
    walk(groupList);
    for (const l of ungrouped) result.push({ layer: l, path: 'Autres' });
    return result;
  }

  /* Helper: get legend label from item */
  function getLegendLabel(item: LegendItem): string {
    if (item.label) return item.label;
    if (item.class) {
      if (typeof item.class === 'object') return item.class.fr || item.class.en;
      return item.class;
    }
    return '';
  }

  /* Load layers from API */
  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const response = await api.get('/clip/layers');
        setGroups(response.data.groups || []);
        setUngroupedLayers(response.data.ungroupedLayers || []);
      } catch {
        // Silently fail — map still works without layers
      } finally {
        setLayersLoading(false);
      }
    };
    fetchLayers();
  }, []);

  /* Initialize map */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [33.8869, 9.5375],
      zoom: 6,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    baseLayerRef.current = L.tileLayer(
      BASE_MAPS.satellite.url,
      BASE_MAPS.satellite.opts
    ).addTo(map);

    // Initialize drawn items layer
    const drawnItems = new L.FeatureGroup();
    drawnItems.addTo(map);
    drawnItemsRef.current = drawnItems;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Switch base map */
  useEffect(() => {
    if (!mapRef.current || !baseLayerRef.current) return;
    mapRef.current.removeLayer(baseLayerRef.current);
    baseLayerRef.current = L.tileLayer(
      BASE_MAPS[baseMap].url,
      BASE_MAPS[baseMap].opts
    ).addTo(mapRef.current);
    baseLayerRef.current.bringToBack();
  }, [baseMap]);

  /* Cancel any active drawing */
  const cancelDrawing = useCallback(() => {
    if (!mapRef.current) return;
    const drawControl = (mapRef.current as any)._drawControlRef;
    if (drawControl) {
      try { mapRef.current.removeControl(drawControl); } catch {}
      delete (mapRef.current as any)._drawControlRef;
    }
    setIsDrawing(false);
  }, []);

  /* Exit compare mode */
  const exitCompare = useCallback(() => {
    if (!mapRef.current) return;
    if (compareControlRef.current) {
      compareControlRef.current.remove();
      compareControlRef.current = null;
    }
    if (compareLeftLayerRef.current) {
      mapRef.current.removeLayer(compareLeftLayerRef.current);
      compareLeftLayerRef.current = null;
    }
    if (compareRightLayerRef.current) {
      mapRef.current.removeLayer(compareRightLayerRef.current);
      compareRightLayerRef.current = null;
    }
    setIsCompareMode(false);
    setLeftLayerId(null);
    setRightLayerId(null);
  }, []);

  /* Start compare mode with two layers side by side */
  const startCompare = useCallback(() => {
    const leftL = [...ungroupedLayers, ...getAllLayers(groups)].find(l => l.id === leftLayerId);
    const rightL = [...ungroupedLayers, ...getAllLayers(groups)].find(l => l.id === rightLayerId);
    if (!leftL || !rightL || !mapRef.current) return;
    if (leftL.id === rightL.id) return;

    // Remove active single-layer WMS if any
    if (activeWmsRef.current) {
      mapRef.current.removeLayer(activeWmsRef.current);
      activeWmsRef.current = null;
    }
    activeLayerRef.current = null;
    setActiveLayerId(null);
    setSelectedClip(null);
    setStatsResult(null);
    setStatsError('');
    drawnItemsRef.current?.clearLayers();
    cancelDrawing();

    // Remove any existing compare layers
    if (compareLeftLayerRef.current) mapRef.current.removeLayer(compareLeftLayerRef.current);
    if (compareRightLayerRef.current) mapRef.current.removeLayer(compareRightLayerRef.current);
    if (compareControlRef.current) compareControlRef.current.remove();

    const leftWMS = L.tileLayer.wms(leftL.wmsUrl, {
      layers: leftL.layerName,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
    }).addTo(mapRef.current);

    const rightWMS = L.tileLayer.wms(rightL.wmsUrl, {
      layers: rightL.layerName,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
    }).addTo(mapRef.current);

    compareLeftLayerRef.current = leftWMS;
    compareRightLayerRef.current = rightWMS;
    compareControlRef.current = L.control.sideBySide(leftWMS, rightWMS).addTo(mapRef.current);

    setIsCompareMode(true);
    setShowComparePicker(false);
  }, [leftLayerId, rightLayerId, groups, ungroupedLayers, cancelDrawing]);

  /* Select a layer */
  const selectLayer = useCallback((layer: LayerDef) => {
    // Cancel any active drawing when switching layers
    cancelDrawing();
    // Exit compare mode if active
    if (isCompareMode) exitCompare();

    if (activeLayerRef.current?.id === layer.id) {
      // Toggle off
      if (activeWmsRef.current && mapRef.current) {
        mapRef.current.removeLayer(activeWmsRef.current);
      }
      activeWmsRef.current = null;
      activeLayerRef.current = null;
      setActiveLayerId(null);
      // Clear clips state when no layer is active
      setClips([]);
      setSelectedClip(null);
      return;
    }

    if (activeWmsRef.current && mapRef.current) {
      mapRef.current.removeLayer(activeWmsRef.current);
    }

    // Reset clip selection on layer switch (new layer may not have this city clipped).
    // Zoom is intentionally NOT changed per requirement.
    setSelectedClip(null);

    const wms = L.tileLayer.wms(layer.wmsUrl, {
      layers: layer.layerName,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
      opacity: layerOpacity,
    });
    if (mapRef.current) wms.addTo(mapRef.current);
    activeWmsRef.current = wms;
    activeLayerRef.current = layer;
    setActiveLayerId(layer.id);
  }, [layerOpacity, cancelDrawing, isCompareMode, exitCompare]);

  /* Fetch clipped layers for the active source layer */
  useEffect(() => {
    if (!activeLayerId) {
      setClips([]);
      setSelectedClip(null);
      return;
    }
    let cancelled = false;
    setClipsLoading(true);
    api.get(`/clip/layer/${activeLayerId}/clips`)
      .then(res => {
        if (cancelled) return;
        setClips(res.data.clips || []);
      })
      .catch(() => {
        if (cancelled) return;
        setClips([]);
      })
      .finally(() => {
        if (!cancelled) setClipsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeLayerId]);

  /* Select a clipped city (or null for full extent) */
  const handleSelectClip = useCallback((clipName: string | null) => {
    const layer = activeLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    // Remove current WMS layer
    if (activeWmsRef.current) {
      map.removeLayer(activeWmsRef.current);
    }

    // Determine which WMS layer name to use
    const wmsLayerName = clipName ?? layer.layerName;

    const wms = L.tileLayer.wms(layer.wmsUrl, {
      layers: wmsLayerName,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
      opacity: layerOpacity,
    });
    wms.addTo(map);
    activeWmsRef.current = wms;
    setSelectedClip(clipName);

    // Auto-zoom to city bbox when a clip is selected (NOT on reset)
    if (clipName) {
      const clip = clips.find(c => c.clippedLayerName === clipName);
      if (clip?.bbox) {
        const [west, south, east, north] = clip.bbox;
        // Leaflet fitBounds expects [[south, west], [north, east]]
        map.fitBounds([[south, west], [north, east]], { padding: [30, 30] });
      }
    }

    // Clear any previous stats when switching extent
    drawnItemsRef.current?.clearLayers();
    setStatsResult(null);
    setStatsError('');
  }, [layerOpacity, clips]);

  /* Change opacity */
  const changeOpacity = useCallback((value: number) => {
    setLayerOpacity(value);
    if (activeWmsRef.current) activeWmsRef.current.setOpacity(value);
  }, []);

  /* Toggle group accordion */
  const toggleGroup = (groupId: number) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  /* ─── Draw polygon & compute stats ─── */
  const startDrawing = useCallback(() => {
    if (!mapRef.current || !drawnItemsRef.current) return;

    // Clear previous drawings
    drawnItemsRef.current.clearLayers();
    setStatsResult(null);
    setStatsError('');
    setIsDrawing(true);

    // Remove existing draw control if any
    const existingControl = (mapRef.current as any)._drawControlRef;
    if (existingControl) {
      try { mapRef.current.removeControl(existingControl); } catch {}
    }

    const drawControl = new (L as any).Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          shapeOptions: { color: '#2D6A4F', weight: 2, fillOpacity: 0.1 },
          showArea: true,
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItemsRef.current,
      },
    });

    mapRef.current.addControl(drawControl);
    (mapRef.current as any)._drawControlRef = drawControl;

    // Auto-trigger polygon draw tool
    const polygonBtn = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
    if (polygonBtn) polygonBtn.click();
  }, []);

  /* Listen for draw:complete */
  useEffect(() => {
    if (!mapRef.current) return;

    const handleDrawCreated = async (e: any) => {
      const layer = e.layer;
      drawnItemsRef.current?.addLayer(layer);
      setIsDrawing(false);

      // Remove the draw control toolbar after completing
      const drawControl = (mapRef.current as any)?._drawControlRef;
      if (drawControl) {
        try { mapRef.current?.removeControl(drawControl); } catch {}
        if (mapRef.current) delete (mapRef.current as any)._drawControlRef;
      }

      const activeL = activeLayerRef.current;
      if (!activeL || !activeL.hasStats) {
        setStatsError('Sélectionnez une couche avec des statistiques disponibles pour calculer les stats.');
        return;
      }

      // Get polygon GeoJSON
      const geojson = layer.toGeoJSON();
      const polygon = geojson.geometry;

      setStatsLoading(true);
      setStatsError('');
      setStatsResult(null);

      try {
        const response = await api.post('/clip/stats', {
          layer_name: activeL.geoserver_name,
          polygon,
          // If a clipped city is currently displayed, compute stats on the clipped tiff.
          clippedLayerName: selectedClipRef.current ?? undefined,
        });
        setStatsResult(response.data);
      } catch (err: any) {
        setStatsError(err.response?.data?.error || 'Erreur lors du calcul des statistiques');
      } finally {
        setStatsLoading(false);
      }
    };

    mapRef.current.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      mapRef.current?.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, []);

  /* Clear stats & polygon */
  const clearStats = useCallback(() => {
    drawnItemsRef.current?.clearLayers();
    setStatsResult(null);
    setStatsError('');
  }, []);

  /* Close export menu on outside click */
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  /* Export current map view as JPEG using leaflet-image */
  const handleExportJPEG = useCallback(() => {
    if (!mapRef.current) return;
    setShowExportMenu(false);
    setIsExporting(true);
    leafletImage(mapRef.current, (err, canvas) => {
      if (err) {
        console.error('Export failed:', err);
        setIsExporting(false);
        return;
      }
      const link = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `geoportail-export-${ts}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
      setIsExporting(false);
    });
  }, []);

  /* ─── Render groups recursively ─── */
  const renderGroup = (group: LayerGroup, depth = 0) => (
    <div key={group.id}>
      <button
        onClick={() => toggleGroup(group.id)}
        className="flex items-center gap-2 w-full py-2.5 px-2 rounded hover:bg-white/5 transition-colors text-left"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.12em]">
          {group.name}
        </span>
        {openGroups[group.id] ? (
          <ChevronDown size={13} className="text-white/30 ml-auto" />
        ) : (
          <ChevronRight size={13} className="text-white/30 ml-auto" />
        )}
      </button>

      {openGroups[group.id] && (
        <div style={{ paddingLeft: `${depth * 8}px` }}>
          {/* Sub-groups */}
          {group.children.map(child => renderGroup(child, depth + 1))}
          {/* Layers in this group */}
          {group.layers.map(layer => renderLayerItem(layer))}
        </div>
      )}
    </div>
  );

  const renderLayerItem = (layer: LayerDef) => (
    <div
      key={layer.id}
      className={`rounded px-3 py-2 transition-colors cursor-pointer ${
        activeLayerId === layer.id
          ? 'bg-umbrella-accent/20 border border-umbrella-accent/40'
          : 'hover:bg-white/5'
      }`}
      onClick={() => selectLayer(layer)}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium transition-colors ${activeLayerId === layer.id ? 'text-umbrella-accent-light' : 'text-white/50'}`}>
          {layer.name}
        </span>
        <div className="flex items-center gap-1.5">
          {layer.hasStats && <BarChart3 size={10} className="text-umbrella-accent/50" />}
          <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${activeLayerId === layer.id ? 'border-umbrella-accent' : 'border-white/20'}`}>
            {activeLayerId === layer.id && <span className="w-1.5 h-1.5 rounded-full bg-umbrella-accent" />}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />

      <div className="relative w-full h-screen overflow-hidden pt-16">
        {/* Map */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Legend overlay — bottom right */}
        {activeLegend && activeLegend.length > 0 && (
          <div className="absolute bottom-6 right-6 z-[998] bg-umbrella-dark/90 backdrop-blur-md rounded-lg shadow-xl p-3 min-w-[160px]">
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">Légende</p>
            <div className="space-y-1">
              {activeLegend.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0 border border-white/10" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-white/70 leading-none">{getLegendLabel(item)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Étendue panel (per-city clipped view) ───
            Floating to the right of the sidebar. Only shown when a layer is active
            and either loading clips or has at least one clip available. */}
        {activeLayerId && (clipsLoading || clips.length > 0) && (
          <div className="absolute top-20 left-72 z-[997]">
            <div className="bg-umbrella-dark/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Globe2 size={13} className="text-umbrella-accent" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Étendue</p>
                </div>
              </div>
              <div className="p-3">
                {clipsLoading ? (
                  <div className="flex items-center gap-2 py-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-umbrella-accent" />
                    <span className="text-[11px] text-white/50">Chargement…</span>
                  </div>
                ) : (
                  <select
                    value={selectedClip ?? ''}
                    onChange={e => handleSelectClip(e.target.value === '' ? null : e.target.value)}
                    className="w-full bg-white/5 text-white text-[12px] font-medium rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-umbrella-accent/40 focus:border-transparent cursor-pointer appearance-none"
                    style={{
                      backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.6rem center',
                      backgroundSize: '0.9rem',
                      paddingRight: '2rem',
                    }}
                  >
                    <option value="" className="bg-umbrella-dark text-white">Tunisie (total)</option>
                    {clips.map(clip => (
                      <option key={clip.clippedLayerName} value={clip.clippedLayerName} className="bg-umbrella-dark text-white">
                        {clip.country}
                      </option>
                    ))}
                  </select>
                )}
                {selectedClip && (
                  <p className="mt-2 text-[10px] text-white/35 leading-snug">
                    Vue par gouvernorat · zoom auto-ajusté
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Stats Panel ─── */}
        {(statsLoading || statsResult || statsError) && (
          <div className="absolute top-20 right-4 z-[998] bg-white rounded-xl shadow-2xl border border-umbrella-border max-w-sm w-full overflow-hidden">
            <div className="px-4 py-3 border-b border-umbrella-border flex items-center justify-between bg-umbrella-bg-alt">
              <h3 className="text-sm font-semibold text-umbrella-text flex items-center gap-2">
                <BarChart3 size={16} className="text-umbrella-accent" /> Statistiques
              </h3>
              <button onClick={clearStats} className="p-1 hover:bg-gray-200 rounded transition">
                <X size={14} className="text-umbrella-text-secondary" />
              </button>
            </div>

            {statsLoading && (
              <div className="p-6 flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-umbrella-accent" />
                <span className="text-sm text-umbrella-text-secondary">Calcul en cours…</span>
              </div>
            )}

            {statsError && (
              <div className="p-4 text-sm text-red-600 bg-red-50">{statsError}</div>
            )}

            {statsResult && (
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-umbrella-text-secondary">Surface totale</span>
                  <span className="font-semibold text-umbrella-text">{statsResult.total_area_km2.toFixed(1)} km²</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-umbrella-text-secondary">Résolution pixel</span>
                  <span className="font-semibold text-umbrella-text">{statsResult.pixel_size_m} m</span>
                </div>

                {/* Class breakdown */}
                <div className="space-y-2 pt-2 border-t border-umbrella-border">
                  {statsResult.classes
                    .filter(c => c.percentage > 0)
                    .sort((a, b) => b.percentage - a.percentage)
                    .map(cls => (
                      <div key={cls.class_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-umbrella-text font-medium">{cls.class_name}</span>
                          <span className="text-umbrella-text-secondary">{cls.percentage}% · {cls.area_km2.toFixed(1)} km²</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-umbrella-accent h-1.5 rounded-full transition-all" style={{ width: `${Math.min(cls.percentage, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Compare + Export buttons (top center) ─── */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[997] flex items-center gap-2">
          {!isCompareMode && !isDrawing && (
            <button
              onClick={() => setShowComparePicker(true)}
              className="bg-umbrella-dark/90 hover:bg-umbrella-dark text-white text-sm font-medium px-4 py-2 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 transition"
            >
              <span className="text-lg leading-none">⇔</span>
              Comparer
            </button>
          )}

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="bg-umbrella-dark/90 hover:bg-umbrella-dark text-white text-sm font-medium px-4 py-2 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download size={15} />
              )}
              {isExporting ? 'Export…' : 'Exporter'}
              <ChevronDown size={13} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-umbrella-dark rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                <button
                  onClick={handleExportJPEG}
                  disabled={isExporting}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2.5 transition disabled:opacity-50"
                >
                  <ImageIcon size={15} className="text-white/50" />
                  JPEG (carte)
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    if (activeClipDownloadUrl) {
                      window.open(activeClipDownloadUrl, '_blank');
                    }
                  }}
                  disabled={!activeClipDownloadUrl}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 border-t border-white/5 transition ${
                    activeClipDownloadUrl
                      ? 'text-white/80 hover:bg-white/5 cursor-pointer'
                      : 'text-white/25 cursor-not-allowed'
                  }`}
                  title={!activeClipDownloadUrl ? 'Sélectionnez un gouvernorat découpé pour télécharger le raster .tif' : 'Télécharger le raster .tif de la zone affichée'}
                >
                  <FileDown size={15} className={activeClipDownloadUrl ? 'text-white/50' : 'text-white/20'} />
                  TIFF (raster)
                  {!activeClipDownloadUrl && <span className="ml-auto text-[10px] opacity-60">🔒</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {isCompareMode && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[1000] bg-umbrella-dark/90 backdrop-blur-md text-white text-sm font-medium px-4 py-2 rounded-xl shadow-2xl border border-white/10 flex items-center gap-4 max-w-[90vw]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white/40 text-xs shrink-0">G:</span>
              <span className="break-words truncate">{leftLayer?.name || '—'}</span>
            </div>
            <span className="text-white/20 shrink-0">|</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white/40 text-xs shrink-0">D:</span>
              <span className="break-words truncate">{rightLayer?.name || '—'}</span>
            </div>
            <button onClick={exitCompare} className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-semibold hover:bg-white/20 transition shrink-0 ml-2">
              Quitter
            </button>
          </div>
        )}

        {/* Compare legends */}
        {isCompareMode && leftLegend && leftLegend.length > 0 && (
          <div className="absolute bottom-6 left-72 z-[998] bg-umbrella-dark/90 backdrop-blur-md rounded-lg shadow-xl p-3 min-w-[160px]">
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">Légende G</p>
            <div className="space-y-1">
              {leftLegend.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0 border border-white/10" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-white/70 leading-none">{getLegendLabel(item)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {isCompareMode && rightLegend && rightLegend.length > 0 && (
          <div className="absolute bottom-6 right-6 z-[998] bg-umbrella-dark/90 backdrop-blur-md rounded-lg shadow-xl p-3 min-w-[160px]">
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">Légende D</p>
            <div className="space-y-1">
              {rightLegend.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0 border border-white/10" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-white/70 leading-none">{getLegendLabel(item)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compare picker modal */}
        {showComparePicker && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50" onClick={() => setShowComparePicker(false)}>
            <div className="bg-umbrella-dark rounded-2xl shadow-2xl border border-white/10 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-serif text-white mb-6">Comparer deux couches</h3>
              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Couche gauche</label>
                <select
                  value={leftLayerId ?? ''}
                  onChange={e => setLeftLayerId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-umbrella-accent/40 cursor-pointer appearance-none"
                >
                  <option value="" className="bg-umbrella-dark text-white">Choisir…</option>
                  {flattenLayersWithPath(groups, ungroupedLayers).map(({ layer, path }) => (
                    <option key={layer.id} value={layer.id} className="bg-umbrella-dark text-white">{path} › {layer.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Couche droite</label>
                <select
                  value={rightLayerId ?? ''}
                  onChange={e => setRightLayerId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-umbrella-accent/40 cursor-pointer appearance-none"
                >
                  <option value="" className="bg-umbrella-dark text-white">Choisir…</option>
                  {flattenLayersWithPath(groups, ungroupedLayers).map(({ layer, path }) => (
                    <option key={layer.id} value={layer.id} className="bg-umbrella-dark text-white">{path} › {layer.name}</option>
                  ))}
                </select>
              </div>
              {leftLayerId && rightLayerId && leftLayerId === rightLayerId && (
                <p className="text-sm text-red-400 mb-4">Veuillez choisir deux couches différentes</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={startCompare}
                  disabled={!leftLayerId || !rightLayerId || leftLayerId === rightLayerId}
                  className="flex-1 bg-umbrella-accent text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Comparer
                </button>
                <button
                  onClick={() => { setShowComparePicker(false); setLeftLayerId(null); setRightLayerId(null); }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2.5 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Sidebar ─── */}
        <div className="absolute top-16 left-0 z-[999]">
          <div className="h-[calc(100vh-4rem)] w-72 bg-umbrella-dark flex flex-col">
            {/* Header */}
            <div className="px-5 py-5 border-b border-white/10">
              <h2 className="font-serif text-lg text-white tracking-tight">Géoportail</h2>
              <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-[0.2em] font-semibold">Couches cartographiques</p>
            </div>

            {/* Base map selector */}
            <div className="px-5 py-4 border-b border-white/10">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Fond de carte</p>
              <div className="flex gap-2">
                {([
                  { key: 'satellite' as BaseMap, label: 'Satellite', icon: <Satellite size={13} /> },
                  { key: 'osm' as BaseMap, label: 'OSM', icon: <Map size={13} /> },
                ]).map((bm) => (
                  <button key={bm.key} onClick={() => setBaseMap(bm.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all ${baseMap === bm.key ? 'bg-umbrella-accent text-white shadow-md' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'}`}>
                    {bm.icon}{bm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw tool */}
            {activeLayerId && activeLayer?.hasStats && (
              <div className="px-5 py-3 border-b border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Statistiques</p>
                {isDrawing ? (
                  <div className="flex gap-2">
                    <p className="text-[11px] text-umbrella-accent-light flex-1">Dessinez un polygone sur la carte…</p>
                    <button onClick={cancelDrawing} className="px-3 py-1.5 rounded text-[11px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">Annuler</button>
                  </div>
                ) : (
                  <button onClick={startDrawing} className="flex items-center gap-2 px-3 py-2 rounded text-[11px] font-semibold bg-umbrella-accent/20 text-umbrella-accent-light hover:bg-umbrella-accent/30 transition w-full">
                    <PenTool size={13} /> Dessiner une zone de calcul
                  </button>
                )}
              </div>
            )}

            {/* Layer groups */}
            <div className="flex-1 overflow-y-auto px-4 py-3 geo-sidebar-scroll">
              {layersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-umbrella-accent" />
                </div>
              ) : (
                <>
                  {/* Groups */}
                  {groups.map(group => renderGroup(group))}

                  {/* Ungrouped layers */}
                  {ungroupedLayers.length > 0 && (
                    <div className="mt-2">
                      {groups.length > 0 && (
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2 px-2">Non groupées</p>
                      )}
                      {ungroupedLayers.map(layer => renderLayerItem(layer))}
                    </div>
                  )}

                  {groups.length === 0 && ungroupedLayers.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-[11px] text-white/40">Aucune couche disponible</p>
                      <p className="text-[10px] text-white/25 mt-1">Synchronisez depuis l'admin</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Opacity slider */}
            {activeLayerId && (
              <div className="px-5 py-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-white/40 font-semibold uppercase tracking-widest">Opacité</span>
                  <input type="range" min={0} max={1} step={0.05} value={layerOpacity} onChange={e => changeOpacity(parseFloat(e.target.value))} className="flex-1 h-1 appearance-none bg-white/10 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-umbrella-accent [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-umbrella-accent [&::-moz-range-thumb]:border-0" />
                  <span className="text-[10px] text-white/50 font-mono w-8 text-right">{Math.round(layerOpacity * 100)}%</span>
                </div>
              </div>
            )}

            {/* Footer info */}
            <div className="px-5 py-3 border-t border-white/10">
              <p className="text-[9px] text-white/25 leading-relaxed">
                Data © OSS — Observatoire du Sahara et du Sahel<br />
                Projet LDN Tunisie — Financement FEM/PNUE
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}