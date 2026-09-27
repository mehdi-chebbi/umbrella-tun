import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, Map, Satellite, PenTool, X, BarChart3, Loader2, Globe2, Download, FileDown, Image as ImageIcon, Flag, Send, CheckCircle2, Layers, Sparkles } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import 'leaflet-side-by-side';
import leafletImage from 'leaflet-image';
import Navbar from '@/components/Navbar';
import ChatAgent from '@/components/ChatAgent';
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
  hasRasterDownload: boolean;
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
  boundaryUrl?: string;
}

interface CompareGovernorateOption {
  country: string;
  leftClipName: string;
  rightClipName: string;
  bbox: [number, number, number, number] | null;
  boundaryUrl?: string;
}

interface HierarchicalLayerPickerProps {
  label: string;
  groups: LayerGroup[];
  value: number | null;
  onChange: (layerId: number | null) => void;
}

function findLayerGroupPath(groupList: LayerGroup[], layerId: number, path: number[] = []): number[] | null {
  for (const group of groupList) {
    const currentPath = [...path, group.id];
    if (group.layers.some(layer => layer.id === layerId)) return currentPath;
    const childPath = findLayerGroupPath(group.children, layerId, currentPath);
    if (childPath) return childPath;
  }
  return null;
}

function HierarchicalLayerPicker({ label, groups, value, onChange }: HierarchicalLayerPickerProps) {
  const [groupPath, setGroupPath] = useState<number[]>([]);

  useEffect(() => {
    if (!value) return;
    setGroupPath(findLayerGroupPath(groups, value) || []);
  }, [groups, value]);

  const selectedGroups: LayerGroup[] = [];
  let availableGroups = groups;
  for (const groupId of groupPath) {
    const group = availableGroups.find(candidate => candidate.id === groupId);
    if (!group) break;
    selectedGroups.push(group);
    availableGroups = group.children;
  }

  const selectedGroup = selectedGroups[selectedGroups.length - 1] || null;

  const selectGroup = (depth: number, rawValue: string) => {
    const nextPath = groupPath.slice(0, depth);
    if (rawValue) nextPath.push(Number(rawValue));
    setGroupPath(nextPath);
    onChange(null);
  };

  const selectClass = 'w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-umbrella-accent/40 cursor-pointer appearance-none';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">{label}</p>
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-medium text-white/45">Groupe</label>
          <select value={groupPath[0] ?? ''} onChange={event => selectGroup(0, event.target.value)} className={selectClass}>
            <option value="" className="bg-umbrella-dark text-white">Choisir un groupe…</option>
            {groups.map(group => (
              <option key={group.id} value={group.id} className="bg-umbrella-dark text-white">{group.name}</option>
            ))}
          </select>
        </div>

        {selectedGroups.map((group, index) => group.children.length > 0 && (
          <div key={`${group.id}-${index}`}>
            <label className="mb-1.5 block text-[10px] font-medium text-white/45">
              {index === 0 ? 'Sous-groupe' : `Sous-groupe ${index + 1}`}
            </label>
            <select
              value={groupPath[index + 1] ?? ''}
              onChange={event => selectGroup(index + 1, event.target.value)}
              className={selectClass}
            >
              <option value="" className="bg-umbrella-dark text-white">Choisir…</option>
              {group.children.map(child => (
                <option key={child.id} value={child.id} className="bg-umbrella-dark text-white">{child.name}</option>
              ))}
            </select>
          </div>
        ))}

        {selectedGroup && selectedGroup.children.length === 0 && (
          <div>
            <label className="mb-1.5 block text-[10px] font-medium text-white/45">Couche</label>
            <select
              value={value ?? ''}
              onChange={event => onChange(event.target.value ? Number(event.target.value) : null)}
              className={selectClass}
              disabled={selectedGroup.layers.length === 0}
            >
              <option value="" className="bg-umbrella-dark text-white">
                {selectedGroup.layers.length === 0 ? 'Aucune couche disponible' : 'Choisir une couche…'}
              </option>
              {selectedGroup.layers.map(layer => (
                <option key={layer.id} value={layer.id} className="bg-umbrella-dark text-white">{layer.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
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
  const governorateBoundaryRef = useRef<L.GeoJSON | null>(null);
  const boundaryRequestIdRef = useRef(0);
  const selectedGovernorateRef = useRef<string | null>(null);
  const selectedClipRef = useRef<string | null>(null); // mirror of selectedClip for use in draw handler
  const compareLeftLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const compareRightLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const compareControlRef = useRef<L.Control.SideBySide | null>(null);
  const statsRequestIdRef = useRef(0);
  const drawModeRef = useRef<DrawMode>(null);
  const deepLinkHandledRef = useRef(false);

  const [baseMap, setBaseMap] = useState<BaseMap>('satellite');
  const [showBaseMapPicker, setShowBaseMapPicker] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
  const [aiAnalysisRequest, setAiAnalysisRequest] = useState<{
    id: number;
    prompt: string;
    context: { layerId: number; governorate: string };
  } | null>(null);

  // Anonymous incorrect-data reporting
  const [reportMode, setReportMode] = useState(false);
  const [reportGeometry, setReportGeometry] = useState<any>(null);
  const [reportComment, setReportComment] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccessId, setReportSuccessId] = useState<number | null>(null);
  const [reportSuccessVisible, setReportSuccessVisible] = useState(false);

  // Clips (per-city clipped layers) for the active source layer
  const [clips, setClips] = useState<ClipInfo[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [selectedClip, setSelectedClip] = useState<string | null>(null); // null = full extent

  // Compare mode state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showComparePicker, setShowComparePicker] = useState(false);
  const [leftLayerId, setLeftLayerId] = useState<number | null>(null);
  const [rightLayerId, setRightLayerId] = useState<number | null>(null);
  const [compareGovernorate, setCompareGovernorate] = useState('');
  const [compareGovernorates, setCompareGovernorates] = useState<CompareGovernorateOption[]>([]);
  const [compareGovernoratesLoading, setCompareGovernoratesLoading] = useState(false);
  const [compareExtentError, setCompareExtentError] = useState('');

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const activeLayer = activeLayerId
    ? [...ungroupedLayers, ...getAllLayers(groups)].find(l => l.id === activeLayerId) || null
    : null;

  const activeLegend = activeLayer?.legend || activeLayer?.group_legend || null;

  // Download the selected governorate clip, or the full Tunisia raster by default.
  const activeRasterDownloadUrl = selectedClip
    ? clips.find(c => c.clippedLayerName === selectedClip)?.downloadUrl ?? null
    : activeLayer?.hasRasterDownload
      ? `/api/clip/layer/${activeLayer.id}/download`
      : null;

  const allLayersFlat = [...ungroupedLayers, ...getAllLayers(groups)];
  const compareGroups: LayerGroup[] = ungroupedLayers.length > 0
    ? [...groups, {
        id: -1,
        name: 'Autres couches',
        description: null,
        legend: null,
        parent_id: null,
        children: [],
        layers: ungroupedLayers,
      }]
    : groups;
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
    drawModeRef.current = null;
    setIsDrawing(false);
    setReportMode(false);
    setReportGeometry(null);
    setReportComment('');
    setReportError('');
    setReportSuccessId(null);
    setReportSuccessVisible(false);
  }, []);

  const clearGovernorateBoundary = useCallback(() => {
    boundaryRequestIdRef.current += 1;
    if (governorateBoundaryRef.current && mapRef.current) {
      mapRef.current.removeLayer(governorateBoundaryRef.current);
    }
    governorateBoundaryRef.current = null;
  }, []);

  const mountCompareLayers = useCallback((left: LayerDef, right: LayerDef, leftLayerName: string, rightLayerName: string) => {
    if (!mapRef.current) return;

    if (compareControlRef.current) compareControlRef.current.remove();
    if (compareLeftLayerRef.current) mapRef.current.removeLayer(compareLeftLayerRef.current);
    if (compareRightLayerRef.current) mapRef.current.removeLayer(compareRightLayerRef.current);

    const leftWMS = L.tileLayer.wms(left.wmsUrl, {
      layers: leftLayerName,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
    }).addTo(mapRef.current);

    const rightWMS = L.tileLayer.wms(right.wmsUrl, {
      layers: rightLayerName,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
    }).addTo(mapRef.current);

    compareLeftLayerRef.current = leftWMS;
    compareRightLayerRef.current = rightWMS;
    compareControlRef.current = L.control.sideBySide(leftWMS, rightWMS).addTo(mapRef.current);
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
    setCompareGovernorate('');
    setCompareGovernorates([]);
    setCompareExtentError('');
    clearGovernorateBoundary();
  }, [clearGovernorateBoundary]);

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
    selectedGovernorateRef.current = null;
    setStatsResult(null);
    setStatsError('');
    drawnItemsRef.current?.clearLayers();
    clearGovernorateBoundary();
    cancelDrawing();

    mountCompareLayers(leftL, rightL, leftL.layerName, rightL.layerName);

    setCompareGovernorate('');
    setCompareExtentError('');
    setIsCompareMode(true);
    setShowComparePicker(false);
    setShowExportMenu(false);
  }, [leftLayerId, rightLayerId, groups, ungroupedLayers, cancelDrawing, clearGovernorateBoundary, mountCompareLayers]);

  useEffect(() => {
    if (!isCompareMode || !leftLayerId || !rightLayerId) return;

    let cancelled = false;
    setCompareGovernoratesLoading(true);
    setCompareExtentError('');

    Promise.all([
      api.get(`/clip/layer/${leftLayerId}/clips`),
      api.get(`/clip/layer/${rightLayerId}/clips`),
    ])
      .then(([leftResponse, rightResponse]) => {
        if (cancelled) return;
        const leftClips: ClipInfo[] = leftResponse.data.clips || [];
        const rightClips: ClipInfo[] = rightResponse.data.clips || [];
        const rightByCountry = new globalThis.Map<string, ClipInfo>(
          rightClips.map(clip => [clip.country, clip])
        );

        const sharedGovernorates = leftClips
          .map(leftClip => {
            const rightClip = rightByCountry.get(leftClip.country);
            if (!rightClip) return null;
            return {
              country: leftClip.country,
              leftClipName: leftClip.clippedLayerName,
              rightClipName: rightClip.clippedLayerName,
              bbox: leftClip.bbox || rightClip.bbox,
              boundaryUrl: leftClip.boundaryUrl || rightClip.boundaryUrl,
            } satisfies CompareGovernorateOption;
          })
          .filter((option): option is CompareGovernorateOption => option !== null)
          .sort((a, b) => a.country.localeCompare(b.country, 'fr'));

        setCompareGovernorates(sharedGovernorates);
      })
      .catch(() => {
        if (!cancelled) {
          setCompareGovernorates([]);
          setCompareExtentError('Impossible de charger les gouvernorats disponibles.');
        }
      })
      .finally(() => {
        if (!cancelled) setCompareGovernoratesLoading(false);
      });

    return () => { cancelled = true; };
  }, [isCompareMode, leftLayerId, rightLayerId]);

  const changeCompareGovernorate = useCallback((country: string) => {
    if (!leftLayer || !rightLayer || !mapRef.current) return;

    setCompareExtentError('');
    clearGovernorateBoundary();

    if (!country) {
      mountCompareLayers(leftLayer, rightLayer, leftLayer.layerName, rightLayer.layerName);
      setCompareGovernorate('');
      mapRef.current.fitBounds([[30.23, 7.52], [37.77, 11.60]], { padding: [20, 20] });
      return;
    }

    const governorate = compareGovernorates.find(option => option.country === country);
    if (!governorate) {
      setCompareExtentError('Ce gouvernorat n’est pas disponible pour les deux couches.');
      return;
    }

    mountCompareLayers(leftLayer, rightLayer, governorate.leftClipName, governorate.rightClipName);
    setCompareGovernorate(country);

    if (governorate.bbox) {
      const [west, south, east, north] = governorate.bbox;
      mapRef.current.fitBounds([[south, west], [north, east]], { padding: [30, 30] });
    }

    if (governorate.boundaryUrl) {
      const boundaryRequestId = boundaryRequestIdRef.current;
      api.get(governorate.boundaryUrl)
        .then(response => {
          if (boundaryRequestId !== boundaryRequestIdRef.current || !mapRef.current) return;
          const boundary = L.geoJSON(response.data, {
            style: {
              color: '#2563EB',
              weight: 2.5,
              opacity: 1,
              fill: false,
              fillOpacity: 0,
            },
            interactive: false,
          }).addTo(mapRef.current);
          boundary.bringToFront();
          governorateBoundaryRef.current = boundary;
        })
        .catch(() => setCompareExtentError('La limite du gouvernorat n’a pas pu être affichée.'));
    }
  }, [leftLayer, rightLayer, compareGovernorates, clearGovernorateBoundary, mountCompareLayers]);

  /* Select a layer */
  const selectLayer = useCallback((layer: LayerDef) => {
    // Cancel any active drawing when switching layers
    cancelDrawing();
    clearGovernorateBoundary();
    drawnItemsRef.current?.clearLayers();
    statsRequestIdRef.current += 1;
    setStatsResult(null);
    setStatsError('');
    setStatsLoading(false);
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
      selectedGovernorateRef.current = null;
      return;
    }

    if (activeWmsRef.current && mapRef.current) {
      mapRef.current.removeLayer(activeWmsRef.current);
    }

    // The generated clip layer name is source-specific, but the governorate
    // name is retained and resolved again after the new layer's clips load.
    setClips([]);
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
  }, [layerOpacity, cancelDrawing, clearGovernorateBoundary, isCompareMode, exitCompare]);

  // Assistant chart links can open the matching layer and governorate directly.
  useEffect(() => {
    if (layersLoading || deepLinkHandledRef.current) return;
    deepLinkHandledRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const layerId = Number(params.get('layer'));
    if (!Number.isInteger(layerId)) return;
    const layer = [...ungroupedLayers, ...getAllLayers(groups)].find(candidate => candidate.id === layerId);
    if (!layer) return;
    selectedGovernorateRef.current = params.get('governorate') || null;
    selectLayer(layer);
  }, [groups, layersLoading, selectLayer, ungroupedLayers]);

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
        const nextClips: ClipInfo[] = res.data.clips || [];
        const retainedGovernorate = selectedGovernorateRef.current;
        if (retainedGovernorate && !nextClips.some(clip => clip.country === retainedGovernorate)) {
          selectedGovernorateRef.current = null;
        }
        setClips(nextClips);
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
    const selectedGovernorateClip = clipName
      ? clips.find(clip => clip.clippedLayerName === clipName)
      : undefined;
    selectedGovernorateRef.current = selectedGovernorateClip?.country ?? null;
    cancelDrawing();
    clearGovernorateBoundary();

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
      const clip = selectedGovernorateClip;
      if (clip?.bbox) {
        const [west, south, east, north] = clip.bbox;
        // Leaflet fitBounds expects [[south, west], [north, east]]
        map.fitBounds([[south, west], [north, east]], { padding: [30, 30] });
      }

      if (clip?.boundaryUrl) {
        const boundaryRequestId = boundaryRequestIdRef.current;
        api.get(clip.boundaryUrl)
          .then(response => {
            if (boundaryRequestId !== boundaryRequestIdRef.current || !mapRef.current) return;

            const boundary = L.geoJSON(response.data, {
              style: {
                color: '#2563EB',
                weight: 2.5,
                opacity: 1,
                fill: false,
                fillOpacity: 0,
              },
              interactive: false,
            }).addTo(mapRef.current);

            boundary.bringToFront();
            governorateBoundaryRef.current = boundary;
          })
          .catch(() => {
            // The clipped raster remains usable if its outline cannot be loaded.
          });
      }
    }

    // Clear any previous stats when switching extent
    drawnItemsRef.current?.clearLayers();
    const statsRequestId = ++statsRequestIdRef.current;
    setStatsResult(null);
    setStatsError('');

    // Complete-governorate statistics are precomputed by administrators.
    // Only arbitrary polygons use the live raster calculation endpoint.
    if (clipName && layer.hasStats && selectedGovernorateClip?.country) {
      setStatsLoading(true);
      api.get(`/statistics/layer/${layer.id}/governorate/${encodeURIComponent(selectedGovernorateClip.country)}`)
        .then(response => {
          if (statsRequestId === statsRequestIdRef.current) setStatsResult(response.data);
        })
        .catch((err: any) => {
          if (statsRequestId === statsRequestIdRef.current) {
            setStatsError(err.response?.data?.error || 'Statistiques pré-calculées indisponibles');
          }
        })
        .finally(() => {
          if (statsRequestId === statsRequestIdRef.current) setStatsLoading(false);
        });
    } else {
      setStatsLoading(false);
    }
  }, [layerOpacity, clips, cancelDrawing, clearGovernorateBoundary]);

  // Preserve the selected governorate when switching thematic layers. Each
  // source has a different generated clip name, so resolve it by country.
  useEffect(() => {
    const governorate = selectedGovernorateRef.current;
    if (!governorate || clipsLoading || selectedClip || clips.length === 0) return;

    const matchingClip = clips.find(clip => clip.country === governorate);
    if (matchingClip) handleSelectClip(matchingClip.clippedLayerName);
  }, [clips, clipsLoading, selectedClip, handleSelectClip]);

  /* Change opacity */
  const changeOpacity = useCallback((value: number) => {
    setLayerOpacity(value);
    if (activeWmsRef.current) activeWmsRef.current.setOpacity(value);
  }, []);

  /* Toggle group accordion */
  const toggleGroup = (groupId: number) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  /* ─── Shared polygon drawing tool ─── */
  const beginPolygonDrawing = useCallback((mode: Exclude<DrawMode, null>) => {
    if (!mapRef.current || !drawnItemsRef.current) return;

    drawnItemsRef.current.clearLayers();
    drawModeRef.current = mode;
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

  /* ─── Draw polygon & compute stats ─── */
  const startDrawing = useCallback(() => {
    setMobileSidebarOpen(false);
    setReportMode(false);
    setReportGeometry(null);
    setStatsResult(null);
    setStatsError('');
    beginPolygonDrawing('stats');
  }, [beginPolygonDrawing]);

  /* ─── Draw polygon & report incorrect data ─── */
  const startReportDrawing = useCallback(() => {
    if (!activeLayerRef.current || isCompareMode) return;
    setMobileSidebarOpen(false);
    statsRequestIdRef.current += 1;
    setStatsResult(null);
    setStatsError('');
    setStatsLoading(false);
    setReportMode(true);
    setReportGeometry(null);
    setReportComment('');
    setReportError('');
    setReportSuccessId(null);
    setReportSuccessVisible(false);
    beginPolygonDrawing('report');
  }, [beginPolygonDrawing, isCompareMode]);

  const cancelReport = useCallback(() => {
    cancelDrawing();
    drawnItemsRef.current?.clearLayers();
  }, [cancelDrawing]);

  useEffect(() => {
    if (!reportSuccessId) return;

    const fadeTimer = window.setTimeout(() => setReportSuccessVisible(false), 4250);
    const dismissTimer = window.setTimeout(cancelReport, 5000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [reportSuccessId, cancelReport]);

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

      const drawMode = drawModeRef.current;
      drawModeRef.current = null;

      if (drawMode === 'report') {
        const geojson = layer.toGeoJSON();
        setReportGeometry(geojson.geometry);
        setReportError('');
        return;
      }

      if (drawMode !== 'stats') return;

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
      const statsRequestId = ++statsRequestIdRef.current;

      try {
        const response = await api.post('/clip/stats', {
          layer_name: activeL.geoserver_name,
          polygon,
          // If a clipped city is currently displayed, compute stats on the clipped tiff.
          clippedLayerName: selectedClipRef.current ?? undefined,
        });
        if (statsRequestId === statsRequestIdRef.current) setStatsResult(response.data);
      } catch (err: any) {
        if (statsRequestId === statsRequestIdRef.current) {
          setStatsError(err.response?.data?.error || 'Erreur lors du calcul des statistiques');
        }
      } finally {
        if (statsRequestId === statsRequestIdRef.current) setStatsLoading(false);
      }
    };

    mapRef.current.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      mapRef.current?.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, []);

  /* Clear stats & polygon */
  const clearStats = useCallback(() => {
    statsRequestIdRef.current += 1;
    drawnItemsRef.current?.clearLayers();
    setStatsResult(null);
    setStatsError('');
  }, []);

  const submitReport = useCallback(async () => {
    const layer = activeLayerRef.current;
    const comment = reportComment.trim();
    if (!layer || !reportGeometry) return;
    if (comment.length < 5) {
      setReportError('Veuillez décrire le problème en au moins 5 caractères.');
      return;
    }

    setReportSubmitting(true);
    setReportError('');
    try {
      const response = await api.post('/reports', {
        layer_id: layer.id,
        selected_clip: selectedClipRef.current,
        geometry: reportGeometry,
        comment,
      });
      setReportSuccessId(response.data.report.id);
      setReportSuccessVisible(true);
    } catch (err: any) {
      setReportError(err.response?.data?.error || 'Échec de l’envoi du signalement');
    } finally {
      setReportSubmitting(false);
    }
  }, [reportComment, reportGeometry]);

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
      onClick={() => {
        selectLayer(layer);
        setMobileSidebarOpen(false);
      }}
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

      <div className={`geoportail-map-shell relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden pt-16 ${isCompareMode ? 'geoportail-compare-mode' : ''}`}>
        {/* Map */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Mobile layers drawer trigger */}
        {!isCompareMode && (
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="absolute left-3 top-20 z-[1000] flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-umbrella-dark/95 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md active:scale-[0.98] lg:hidden"
            aria-label="Ouvrir les couches cartographiques"
          >
            <Layers size={17} className="text-umbrella-accent-light" />
            <span className="hidden min-[390px]:inline">Couches</span>
            {activeLayerId && <span className="h-1.5 w-1.5 rounded-full bg-umbrella-accent-light" aria-hidden="true" />}
          </button>
        )}

        {/* Visual basemap picker — kept on the map so it remains available in compare mode */}
        <div className={`absolute z-[1000] transition-all duration-300 ${
          isCompareMode ? 'bottom-36 left-3 lg:bottom-6 lg:left-5' : 'bottom-3 left-3 lg:bottom-6 lg:left-[18.5rem]'
        }`}>
          <div className="relative">
            {showBaseMapPicker && (
              <div className="absolute bottom-[calc(100%+0.6rem)] left-0 flex gap-2 rounded-xl border border-white/15 bg-umbrella-dark/95 p-2 shadow-2xl backdrop-blur-md">
                {([
                  {
                    key: 'osm' as BaseMap,
                    label: 'Plan',
                    icon: <Map size={13} />,
                    preview: 'https://a.tile.openstreetmap.org/6/33/25.png',
                  },
                  {
                    key: 'satellite' as BaseMap,
                    label: 'Satellite',
                    icon: <Satellite size={13} />,
                    preview: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/33',
                  },
                ]).map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setBaseMap(option.key);
                      setShowBaseMapPicker(false);
                    }}
                    aria-pressed={baseMap === option.key}
                    className={`group relative h-[76px] w-[106px] overflow-hidden rounded-lg border-2 bg-slate-200 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${
                      baseMap === option.key ? 'border-umbrella-accent ring-2 ring-umbrella-accent/30' : 'border-white/60 hover:border-white'
                    }`}
                  >
                    <img src={option.preview} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2.5 pb-2 pt-5 text-[11px] font-semibold text-white">
                      <span className="flex items-center gap-1.5">{option.icon}{option.label}</span>
                      {baseMap === option.key && <CheckCircle2 size={13} className="text-emerald-300" />}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowBaseMapPicker(current => !current)}
              aria-expanded={showBaseMapPicker}
              aria-label="Choisir le fond de carte"
              className="group relative h-[78px] w-[104px] overflow-hidden rounded-xl border-2 border-white/90 bg-slate-200 text-left shadow-2xl transition hover:-translate-y-0.5 hover:border-umbrella-accent focus:outline-none focus:ring-2 focus:ring-umbrella-accent focus:ring-offset-2"
            >
              <img
                src={baseMap === 'osm'
                  ? 'https://a.tile.openstreetmap.org/6/33/25.png'
                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/25/33'}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/55 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-semibold text-white">
                <span>{baseMap === 'osm' ? 'Plan' : 'Satellite'}</span>
                <ChevronDown size={13} className={`transition-transform ${showBaseMapPicker ? 'rotate-180' : ''}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Legend overlay */}
        {activeLegend && activeLegend.length > 0 && (
          <div className="absolute bottom-3 right-3 z-[998] max-h-36 w-[47vw] max-w-[190px] overflow-y-auto rounded-lg bg-umbrella-dark/90 p-3 shadow-xl backdrop-blur-md lg:bottom-6 lg:right-6 lg:max-h-none lg:w-auto lg:min-w-[160px] lg:max-w-none lg:overflow-visible">
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
          <div className="absolute left-3 right-3 top-32 z-[997] hidden lg:block lg:left-72 lg:right-auto lg:top-20">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-umbrella-dark/90 shadow-xl backdrop-blur-md lg:min-w-56">
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
          <div className="absolute inset-x-3 bottom-3 z-[1100] max-h-[55dvh] overflow-hidden rounded-xl border border-umbrella-border bg-white shadow-2xl lg:inset-x-auto lg:bottom-auto lg:right-4 lg:top-20 lg:max-h-none lg:w-full lg:max-w-sm">
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
              <div className="max-h-[calc(55dvh-3rem)] space-y-3 overflow-y-auto p-4 lg:max-h-80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-umbrella-text-secondary">Surface totale</span>
                  <span className="font-semibold text-umbrella-text">{statsResult.total_area_km2.toFixed(1)} km²</span>
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
                {selectedClip && activeLayer && (() => {
                  const governorate = clips.find(clip => clip.clippedLayerName === selectedClip)?.country;
                  if (!governorate) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => setAiAnalysisRequest({
                        id: Date.now(),
                        prompt: `Analyse les résultats de la couche « ${activeLayer.name} » pour le gouvernorat de ${governorate}.`,
                        context: { layerId: activeLayer.id, governorate },
                      })}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-umbrella-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-umbrella-accent/90 active:scale-[0.98]"
                    >
                      <Sparkles size={15} strokeWidth={1.5} />
                      Analyser avec l’IA
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* On the map, the assistant sits in the right-side analysis rail. */}
        <ChatAgent
          placement="geoportal"
          geoportalHasStats={Boolean(statsLoading || statsResult || statsError)}
          analysisRequest={aiAnalysisRequest}
        />

        {/* Anonymous report comment form */}
        {reportMode && reportGeometry && !isCompareMode && (
          <div className={`absolute bottom-3 left-3 right-3 z-[1200] rounded-xl border border-white/10 bg-umbrella-dark/95 p-4 text-white shadow-2xl backdrop-blur-md transition-opacity duration-700 sm:left-1/2 sm:right-auto sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 lg:bottom-6 ${reportSuccessId && !reportSuccessVisible ? 'opacity-0' : 'opacity-100'}`}>
            {reportSuccessId ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Signalement envoyé</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">Merci pour votre contribution. Notre équipe examinera votre signalement dans les meilleurs délais.</p>
                </div>
                <button onClick={cancelReport} className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Fermer">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Décrivez l’anomalie observée</p>
                    <p className="mt-1 text-xs text-white/45">Couche : {activeLayer?.name}</p>
                  </div>
                  <button onClick={cancelReport} className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Annuler le signalement">
                    <X size={16} />
                  </button>
                </div>
                <textarea
                  value={reportComment}
                  onChange={event => setReportComment(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  autoFocus
                  placeholder="Expliquez brièvement ce qui semble incorrect dans cette zone…"
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-umbrella-accent focus:outline-none focus:ring-2 focus:ring-umbrella-accent/30"
                />
                <div className="mt-2 flex items-center justify-between gap-4">
                  <div>
                    {reportError && <p className="text-xs text-red-300">{reportError}</p>}
                    {!reportError && <p className="text-[10px] text-white/30">{reportComment.length}/2000 caractères</p>}
                  </div>
                  <button
                    onClick={submitReport}
                    disabled={reportSubmitting || reportComment.trim().length < 5}
                    className="inline-flex items-center gap-2 rounded-lg bg-umbrella-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-umbrella-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {reportSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Envoyer
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Compare + Export buttons (top center) ─── */}
        <div className="absolute right-3 top-20 z-[997] flex items-center gap-1.5 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:gap-2">
          {/* Mobile governorate selector, positioned between Layers and Export */}
          {activeLayerId && (clipsLoading || clips.length > 0) && (
            <div className="relative w-[clamp(7rem,36vw,10.25rem)] lg:hidden">
              {clipsLoading ? (
                <div className="flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-umbrella-dark/90 px-3 text-white shadow-xl backdrop-blur-md">
                  <Loader2 size={15} className="animate-spin text-umbrella-accent-light" />
                  <span className="ml-2 truncate text-[10px] text-white/60">Gouvernorats</span>
                </div>
              ) : (
                <select
                  value={selectedClip ?? ''}
                  onChange={event => handleSelectClip(event.target.value === '' ? null : event.target.value)}
                  aria-label="Choisir un gouvernorat"
                  className="min-h-11 w-full cursor-pointer appearance-none truncate rounded-lg border border-white/15 bg-umbrella-dark/95 py-2 pl-3 pr-8 text-[11px] font-semibold text-white shadow-xl backdrop-blur-md focus:border-umbrella-accent focus:outline-none focus:ring-2 focus:ring-umbrella-accent/30"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.55rem center',
                    backgroundSize: '0.8rem',
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
            </div>
          )}

          {!isCompareMode && !isDrawing && !reportMode && (
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                setShowComparePicker(true);
              }}
              aria-label="Comparer deux couches"
              className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-umbrella-dark/90 px-3 py-2 text-xs font-medium text-white shadow-2xl transition hover:bg-umbrella-dark sm:px-4 sm:text-sm lg:rounded-xl"
            >
              <span className="text-lg leading-none">⇔</span>
              <span className="hidden sm:inline">Comparer</span>
            </button>
          )}

          {/* Export dropdown */}
          {!isCompareMode && <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-umbrella-dark/90 px-3 py-2 text-xs font-medium text-white shadow-2xl transition hover:bg-umbrella-dark disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm lg:rounded-xl"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span className="hidden sm:inline">{isExporting ? 'Export…' : 'Exporter'}</span>
              <ChevronDown size={13} className={`hidden transition-transform sm:block ${showExportMenu ? 'rotate-180' : ''}`} />
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
                    if (activeRasterDownloadUrl) {
                      window.open(activeRasterDownloadUrl, '_blank');
                    }
                  }}
                  disabled={!activeRasterDownloadUrl}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 border-t border-white/5 transition ${
                    activeRasterDownloadUrl
                      ? 'text-white/80 hover:bg-white/5 cursor-pointer'
                      : 'text-white/25 cursor-not-allowed'
                  }`}
                  title={!activeRasterDownloadUrl
                    ? 'Aucun raster téléchargeable pour cette couche'
                    : selectedClip
                      ? 'Télécharger le raster .tif du gouvernorat sélectionné'
                      : 'Télécharger le raster .tif de toute la Tunisie'}
                >
                  <FileDown size={15} className={activeRasterDownloadUrl ? 'text-white/50' : 'text-white/20'} />
                  {selectedClip ? 'TIFF (gouvernorat)' : 'TIFF (Tunisie)'}
                  {!activeRasterDownloadUrl && <span className="ml-auto text-[10px] opacity-60">🔒</span>}
                </button>
              </div>
            )}
          </div>}
        </div>

        {isCompareMode && (
          <div className="absolute left-3 right-3 top-20 z-[1000] rounded-xl border border-white/10 bg-umbrella-dark/90 px-3 py-2 text-white shadow-2xl backdrop-blur-md lg:left-1/2 lg:right-auto lg:top-32 lg:w-full lg:max-w-xl lg:-translate-x-1/2 lg:px-4">
            <div className="flex items-center gap-2 text-xs font-medium sm:gap-4 sm:text-sm">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-xs text-white/40">G:</span>
                <span className="truncate">{leftLayer?.name || 'Non sélectionnée'}</span>
              </div>
              <span className="hidden shrink-0 text-white/20 sm:block">|</span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-xs text-white/40">D:</span>
                <span className="truncate">{rightLayer?.name || 'Non sélectionnée'}</span>
              </div>
              <button onClick={exitCompare} className="shrink-0 rounded bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/20">
                Quitter
              </button>
            </div>
          </div>
        )}

        {/* Standalone extent selector for comparison mode */}
        {isCompareMode && (
          <div className="absolute left-3 right-3 top-36 z-[1000] lg:left-72 lg:right-auto lg:top-20">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-umbrella-dark/90 shadow-xl backdrop-blur-md lg:w-56">
              <div className="hidden border-b border-white/10 px-4 py-3 lg:block">
                <div className="flex items-center gap-2">
                  <Globe2 size={13} className="text-umbrella-accent" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Étendue</p>
                </div>
              </div>
              <div className="p-3">
                <select
                  id="compare-governorate"
                  value={compareGovernorate}
                  onChange={event => changeCompareGovernorate(event.target.value)}
                  disabled={compareGovernoratesLoading}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-umbrella-accent/40 disabled:cursor-wait disabled:opacity-50"
                >
                  <option value="" className="bg-umbrella-dark text-white">Tunisie entière</option>
                  {compareGovernorates.map(option => (
                    <option key={option.country} value={option.country} className="bg-umbrella-dark text-white">{option.country}</option>
                  ))}
                </select>
                {compareGovernoratesLoading && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-white/45">
                    <Loader2 size={12} className="animate-spin text-umbrella-accent" /> Chargement…
                  </div>
                )}
                {compareExtentError && <p className="mt-2 text-[10px] leading-relaxed text-red-300">{compareExtentError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Desktop compare legends */}
        {isCompareMode && leftLegend && leftLegend.length > 0 && (
          <div className="absolute bottom-6 left-72 z-[998] hidden min-w-[160px] rounded-lg bg-umbrella-dark/90 p-3 shadow-xl backdrop-blur-md lg:block">
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
          <div className="absolute bottom-6 right-6 z-[998] hidden min-w-[160px] rounded-lg bg-umbrella-dark/90 p-3 shadow-xl backdrop-blur-md lg:block">
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

        {/* Compact comparison legends on mobile */}
        {isCompareMode && ((leftLegend && leftLegend.length > 0) || (rightLegend && rightLegend.length > 0)) && (
          <div className="absolute bottom-3 left-3 right-3 z-[998] grid max-h-28 grid-cols-2 gap-3 overflow-y-auto rounded-lg border border-white/10 bg-umbrella-dark/90 p-3 text-white shadow-xl backdrop-blur-md lg:hidden">
            <div>
              <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.15em] text-white/40">Légende G</p>
              <div className="space-y-1.5">
                {leftLegend?.map((item, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm border border-white/10" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] leading-tight text-white/70">{getLegendLabel(item)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.15em] text-white/40">Légende D</p>
              <div className="space-y-1.5">
                {rightLegend?.map((item, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm border border-white/10" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] leading-tight text-white/70">{getLegendLabel(item)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Compare picker modal */}
        {showComparePicker && (
          <div className="absolute inset-0 z-[2000] flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowComparePicker(false)}>
            <div className="mx-0 max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/10 bg-umbrella-dark p-4 shadow-2xl sm:mx-4 sm:rounded-2xl sm:p-6" onClick={e => e.stopPropagation()}>
              <div className="mb-5">
                <h3 className="text-lg font-serif text-white">Comparer deux couches</h3>
                <p className="mt-1 text-xs text-white/40">Parcourez les groupes pour choisir chaque couche.</p>
              </div>
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <HierarchicalLayerPicker
                  label="Couche gauche"
                  groups={compareGroups}
                  value={leftLayerId}
                  onChange={setLeftLayerId}
                />
                <HierarchicalLayerPicker
                  label="Couche droite"
                  groups={compareGroups}
                  value={rightLayerId}
                  onChange={setRightLayerId}
                />
              </div>
              {leftLayerId && rightLayerId && leftLayerId === rightLayerId && (
                <p className="text-sm text-red-400 mb-4">Veuillez choisir deux couches différentes</p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
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

        {/* Mobile drawer backdrop */}
        {mobileSidebarOpen && !isCompareMode && (
          <button
            type="button"
            aria-label="Fermer les couches cartographiques"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 z-[2000] bg-black/35 lg:hidden"
          />
        )}

        {/* ─── Layers sidebar / mobile drawer ─── */}
        <div className={`absolute left-0 top-16 z-[2100] transition-transform duration-300 ease-in-out lg:z-[999] ${
          isCompareMode
            ? '-translate-x-full pointer-events-none'
            : mobileSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex h-[calc(100dvh-4rem)] w-[min(18rem,calc(100vw-3rem))] flex-col bg-umbrella-dark shadow-2xl lg:w-72 lg:shadow-none">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-5">
              <div>
                <h2 className="font-serif text-lg tracking-tight text-white">Géoportail</h2>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Couches cartographiques</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Incorrect-data reporting */}
            {!isCompareMode && (
              <div className="px-5 py-3 border-b border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Contribution</p>
                {reportMode ? (
                  <div className="flex gap-2 items-center">
                    <p className="text-[11px] text-amber-200/80 flex-1">
                      {reportGeometry ? 'Zone sélectionnée' : 'Dessinez la zone concernée…'}
                    </p>
                    <button onClick={cancelReport} className="px-3 py-1.5 rounded text-[11px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startReportDrawing}
                    disabled={!activeLayerId}
                    title={!activeLayerId ? 'Sélectionnez une couche pour signaler une anomalie' : 'Signaler une donnée incorrecte sur la couche active'}
                    className="group flex w-full items-center gap-3 rounded-lg border border-amber-200/60 bg-amber-400 px-4 py-3 text-left text-xs font-bold text-umbrella-dark shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30 disabled:shadow-none"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-umbrella-dark/10 transition group-hover:bg-umbrella-dark/15 group-disabled:bg-white/5">
                      <Flag size={16} />
                    </span>
                    <span>
                      <span className="block">Signaler une donnée incorrecte</span>
                      <span className="mt-0.5 block text-[9px] font-medium opacity-65">
                        {activeLayerId ? 'Dessiner la zone concernée' : 'Sélectionnez d’abord une couche'}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Draw tool */}
            {activeLayerId && activeLayer?.hasStats && !reportMode && (
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

type DrawMode = 'stats' | 'report' | null;
