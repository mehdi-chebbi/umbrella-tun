import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, Map, Satellite } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Navbar';

/* ─── Layer definitions ─── */

interface LayerDef {
  id: string;
  label: string;
  workspace: string;
  layerName: string;
}

interface LegendItem {
  label: string;
  color: string;
}

interface LayerCategory {
  id: string;
  label: string;
  layers: LayerDef[];
  legend: LegendItem[];
}

const WMS_BASE = 'http://ldn-africa.oss-online.org/api/clip/wms';

const LAYER_CATEGORIES: LayerCategory[] = [
  {
    id: 'lc-oss',
    label: 'Land Cover OSS',
    legend: [
      { label: 'Forêt', color: '#055b02' },
      { label: 'Parcours', color: '#d2c71b' },
      { label: 'Agriculture irriguée', color: '#c4c48a' },
      { label: 'Agriculture pluviale', color: '#ed97dd' },
      { label: 'Oasis', color: '#cb790f' },
      { label: 'Plan d\'eau', color: '#2107dc' },
      { label: 'Urbain', color: '#e60e13' },
      { label: 'Sol nu', color: '#d2d1ce' },
      { label: 'Dunes', color: '#bbd77f' },
    ],
    layers: [
      { id: 'lc-oss-2000', label: 'Land Cover OSS 2000', workspace: 'LC', layerName: 'LC:clip_Tunisia_LandcoverOSS2000_fa1cacb3' },
      { id: 'lc-oss-2015', label: 'Land Cover OSS 2015', workspace: 'LC', layerName: 'LC:clip_Tunisia_LandcoverOSS2015_90ff905f' },
      { id: 'lc-oss-2023', label: 'Land Cover OSS 2023', workspace: 'LC', layerName: 'LC:clip_Tunisia_LandCoverOSS2023V2COG_0176672e' },
    ],
  },
  {
    id: 'lc-esa',
    label: 'Land Cover ESA CCI',
    legend: [
      { label: 'Couvert arboré', color: '#137412' },
      { label: 'Prairie', color: '#cdc603' },
      { label: 'Cultures', color: '#8d6e8e' },
      { label: 'Zone humide', color: '#26a7a3' },
      { label: 'Zone artificielle', color: '#b60713' },
      { label: 'Sol nu', color: '#d6d3ce' },
      { label: 'Plan d\'eau', color: '#122cfd' },
    ],
    layers: [
      { id: 'lc-esa-2000', label: 'Land Cover ESA 2000', workspace: 'LC-ESA', layerName: 'LC-ESA:clip_Tunisia_LandCoverESACCI_2000_COG_4dcef0ad' },
      { id: 'lc-esa-2010', label: 'Land Cover ESA 2010', workspace: 'LC-ESA', layerName: 'LC-ESA:clip_Tunisia_LandCoverESACCI_2010_COG_b03a1c8a' },
      { id: 'lc-esa-2015', label: 'Land Cover ESA 2015', workspace: 'LC-ESA', layerName: 'LC-ESA:clip_Tunisia_LandCoverESACCI_2015_COG_b8e004f3' },
    ],
  },
  {
    id: 'lcc',
    label: 'Land Cover Change',
    legend: [
      { label: 'En déclin', color: '#d90000' },
      { label: 'Stable', color: '#9a9270' },
      { label: 'En augmentation', color: '#2a670f' },
    ],
    layers: [
      { id: 'lcc-baseline', label: 'LC Change — Baseline', workspace: 'LCC', layerName: 'LCC:clip_Tunisia_LC_Change_OSS_Baseline_COG_dd81f258' },
      { id: 'lcc-reporting', label: 'LC Change — Reporting', workspace: 'LCC', layerName: 'LCC:clip_Tunisia_LC_change_OSS_Reporting_COG_239dc6d5' },
    ],
  },
  {
    id: 'lp',
    label: 'Land Productivity',
    legend: [
      { label: 'En déclin', color: '#c0091c' },
      { label: 'Déclin modéré', color: '#d65987' },
      { label: 'Stable mais stressé', color: '#e9a530' },
      { label: 'Stable', color: '#adafaa' },
      { label: 'En augmentation', color: '#12a912' },
    ],
    layers: [
      { id: 'lp-jrc', label: 'JRC', workspace: 'LP', layerName: 'LP:clip_Tunisia_JRC_1_cc30d4eb', legendKey: 'lp-jrc' },
      { id: 'lp-fao', label: 'LPD FAO', workspace: 'LP', layerName: 'LP:clip_Tunisia_LPD_FAO1_464b4789', legendKey: 'lp-jrc' },
      { id: 'lp-baseline', label: 'LP OSS — Baseline', workspace: 'LP', layerName: 'LP:clip_Tunisia_LP_OSS_Baseline_COG_6470fb90', legendKey: 'lp-oss' },
      { id: 'lp-reporting', label: 'LP OSS — Reporting', workspace: 'LP', layerName: 'LP:clip_Tunisia_LP_OSS_reporting_COG_fcd22417', legendKey: 'lp-oss' },
      { id: 'lp-trends', label: 'Trends', workspace: 'LP', layerName: 'LP:clip_Tunisia_Trends_5df26ecd', legendKey: 'lp-jrc' },
    ],
  },
  {
    id: 'soc',
    label: 'Soil Organic Carbon',
    legend: [
      { label: 'Dégradé', color: '#b60000' },
      { label: 'Stable', color: '#d2cfb2' },
      { label: 'Amélioré', color: '#147d02' },
    ],
    layers: [
      { id: 'soc-baseline', label: 'SOC — Baseline', workspace: 'SoilOrganicCarbon', layerName: 'SoilOrganicCarbon:clip_Tunisia_SOC_baseline_COG_642d3fab' },
      { id: 'soc-reporting', label: 'SOC — Reporting', workspace: 'SoilOrganicCarbon', layerName: 'SoilOrganicCarbon:clip_Tunisia_SOC_reporting_COG_f2a23a3d' },
    ],
  },
  {
    id: 'sdg',
    label: 'SDG 15.3.1',
    legend: [
      { label: 'Dégradé', color: '#b60000' },
      { label: 'Stable', color: '#d2cfb2' },
      { label: 'Amélioré', color: '#147d02' },
    ],
    layers: [
      { id: 'sdg-baseline', label: 'SDG 15.3.1 — Baseline', workspace: 'SDG', layerName: 'SDG:clip_Tunisia_sdg_15_3_1_baseline_COG_a21cb4a3' },
      { id: 'sdg-reporting', label: 'SDG 15.3.1 — Reporting', workspace: 'SDG', layerName: 'SDG:clip_Tunisia_sdg_15_3_1_reporting_COG_cfe1092e' },
    ],
  },
  {
    id: 'so3',
    label: 'Precipitation Index (SPI)',
    legend: [
      { label: 'Pas de sécheresse', color: '#1a9850' },
      { label: 'Sécheresse légère', color: '#ffffb2' },
      { label: 'Sécheresse modérée', color: '#fecc5c' },
      { label: 'Sécheresse sévère', color: '#fd8d3c' },
      { label: 'Sécheresse extrême', color: '#bd0026' },
    ],
    layers: [
      { id: 'so3-00-03', label: 'SPI min 2000–2003', workspace: 'SO3', layerName: 'SO3:clip_Tunisia_band_01_SPI_min_2000-2003_COG_45d8989a' },
      { id: 'so3-04-07', label: 'SPI min 2004–2007', workspace: 'SO3', layerName: 'SO3:clip_Tunisia_band_03_SPI_min_2004-2007_COG_e53df56c' },
      { id: 'so3-08-11', label: 'SPI min 2008–2011', workspace: 'SO3', layerName: 'SO3:clip_Tunisia_band_05_SPI_min_2008-2011_COG_ccf1261e' },
      { id: 'so3-12-15', label: 'SPI min 2012–2015', workspace: 'SO3', layerName: 'SO3:clip_Tunisia_band_07_SPI_min_2012-2015_COG_6e83982e' },
      { id: 'so3-16-19', label: 'SPI min 2016–2019', workspace: 'SO3', layerName: 'SO3:clip_Tunisia_band_09_SPI_min_2016-2019_COG_4b0b500e' },
      { id: 'so3-20-23', label: 'SPI min 2020–2023', workspace: 'SO3', layerName: 'SO3:clip_Tunisia_band_11_SPI_min_2020-2023_COG_c5100602' },
    ],
  },
];

/* Land Productivity has two different legend sets depending on sub-layer */
const LP_LEGENDS: Record<string, LegendItem[]> = {
  'lp-jrc': [
    { label: 'En déclin', color: '#c0091c' },
    { label: 'Déclin modéré', color: '#d65987' },
    { label: 'Stable mais stressé', color: '#e9a530' },
    { label: 'Stable', color: '#adafaa' },
    { label: 'En augmentation', color: '#12a912' },
  ],
  'lp-oss': [
    { label: 'En déclin', color: '#d90000' },
    { label: 'Stable', color: '#9a9270' },
    { label: 'En augmentation', color: '#2a670f' },
  ],
};

type BaseMap = 'satellite' | 'osm';

const BASE_MAPS: Record<BaseMap, { url: string; opts: L.TileLayerOptions }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { maxZoom: 19, attribution: '&copy; Esri' },
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 19, attribution: '&copy; OpenStreetMap' },
  },
};

/* ─── Helper: get legend for a specific layer ─── */
function getLegendForLayer(cat: LayerCategory, layerId: string): LegendItem[] {
  if (cat.id === 'lp') {
    const layer = cat.layers.find((l) => l.id === layerId);
    const key = (layer as any)?.legendKey ?? 'lp-jrc';
    return LP_LEGENDS[key] ?? cat.legend;
  }
  return cat.legend;
}

/* ─── Component ─── */

export default function Geoportail() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const activeWmsRef = useRef<L.TileLayer.WMS | null>(null);
  const activeLayerIdRef = useRef<string | null>(null);

  const [baseMap, setBaseMap] = useState<BaseMap>('satellite');
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [layerOpacity, setLayerOpacity] = useState(1);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  /* Find the active layer's category and legend */
  const activeCat = LAYER_CATEGORIES.find((c) => c.layers.some((l) => l.id === activeLayerId));
  const activeLegend = activeLayerId && activeCat ? getLegendForLayer(activeCat, activeLayerId) : null;

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

  /* Select a single layer — removes previous one first */
  const selectLayer = useCallback((layer: LayerDef) => {
    if (activeLayerIdRef.current === layer.id) {
      if (activeWmsRef.current && mapRef.current) {
        mapRef.current.removeLayer(activeWmsRef.current);
      }
      activeWmsRef.current = null;
      activeLayerIdRef.current = null;
      setActiveLayerId(null);
      return;
    }

    if (activeWmsRef.current && mapRef.current) {
      mapRef.current.removeLayer(activeWmsRef.current);
    }

    const wms = L.tileLayer.wms(`${WMS_BASE}?workspace=${layer.workspace}`, {
      layers: layer.layerName,
      format: 'image/png',
      transparent: true,
      crossOrigin: 'anonymous',
      opacity: layerOpacity,
    });
    if (mapRef.current) wms.addTo(mapRef.current);
    activeWmsRef.current = wms;
    activeLayerIdRef.current = layer.id;
    setActiveLayerId(layer.id);
  }, [layerOpacity]);

  /* Change opacity */
  const changeOpacity = useCallback((value: number) => {
    setLayerOpacity(value);
    if (activeWmsRef.current) activeWmsRef.current.setOpacity(value);
  }, []);

  /* Toggle category — accordion style */
  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => {
      if (prev[catId]) return { ...prev, [catId]: false };
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(prev)) next[key] = false;
      next[catId] = true;
      return next;
    });
  };

  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />

      <div className="relative w-full h-screen overflow-hidden pt-16">
        {/* Map */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Legend overlay — bottom right of map */}
        {activeLegend && (
          <div className="absolute bottom-6 right-6 z-[998] bg-umbrella-dark/90 backdrop-blur-md rounded-lg shadow-xl p-3 min-w-[160px]">
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">
              Légende
            </p>
            <div className="space-y-1">
              {activeLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0 border border-white/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-white/70 leading-none">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="absolute top-16 left-0 z-[999]">
          <div className="h-[calc(100vh-4rem)] w-72 bg-umbrella-dark flex flex-col">
            {/* Header */}
            <div className="px-5 py-5 border-b border-white/10">
              <h2 className="font-serif text-lg text-white tracking-tight">Geoportal</h2>
              <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-[0.2em] font-semibold">
                Map Layers
              </p>
            </div>

            {/* Base map selector */}
            <div className="px-5 py-4 border-b border-white/10">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">
                Base Map
              </p>
              <div className="flex gap-2">
                {([
                  { key: 'satellite' as BaseMap, label: 'Satellite', icon: <Satellite size={13} /> },
                  { key: 'osm' as BaseMap, label: 'OSM', icon: <Map size={13} /> },
                ]).map((bm) => (
                  <button
                    key={bm.key}
                    onClick={() => setBaseMap(bm.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all ${
                      baseMap === bm.key
                        ? 'bg-umbrella-accent text-white shadow-md'
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >
                    {bm.icon}
                    {bm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer categories */}
            <div className="flex-1 overflow-y-auto px-4 py-3 geo-sidebar-scroll">
              {LAYER_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-1">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-2 w-full py-2.5 px-2 rounded hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.12em]">
                      {cat.label}
                    </span>
                    {openCategories[cat.id] ? (
                      <ChevronDown size={13} className="text-white/30 ml-auto" />
                    ) : (
                      <ChevronRight size={13} className="text-white/30 ml-auto" />
                    )}
                  </button>

                  {/* Expanded layers */}
                  {openCategories[cat.id] && (
                    <div className="pl-3 pb-2 space-y-1">
                      {cat.layers.map((layer) => (
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
                            <span
                              className={`text-[11px] font-medium transition-colors ${
                                activeLayerId === layer.id
                                  ? 'text-umbrella-accent-light'
                                  : 'text-white/50'
                              }`}
                            >
                              {layer.label}
                            </span>
                            <span
                              className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                                activeLayerId === layer.id
                                  ? 'border-umbrella-accent'
                                  : 'border-white/20'
                              }`}
                            >
                              {activeLayerId === layer.id && (
                                <span className="w-1.5 h-1.5 rounded-full bg-umbrella-accent" />
                              )}
                            </span>
                          </div>
                        </div>
                      ))}


                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Opacity slider */}
            {activeLayerId && (
              <div className="px-5 py-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-white/40 font-semibold uppercase tracking-widest">
                    Opacity
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={layerOpacity}
                    onChange={(e) => changeOpacity(parseFloat(e.target.value))}
                    className="flex-1 h-1 appearance-none bg-white/10 rounded-full cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-umbrella-accent [&::-webkit-slider-thumb]:shadow-sm
                      [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-umbrella-accent [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-[10px] text-white/50 font-mono w-8 text-right">
                    {Math.round(layerOpacity * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Footer info */}
            <div className="px-5 py-3 border-t border-white/10">
              <p className="text-[9px] text-white/25 leading-relaxed">
                Data © OSS — Observatoire du Sahara et du Sahel<br />
                LDN Tunisia Project — GEF/UNEP Funding
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
