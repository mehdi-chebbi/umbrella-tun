import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { query } from '../db/connection.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// ─── GeoServer Configuration ────────────────────────────────────────────
const GEOSERVER_REST_URL = process.env.GEOSERVER_REST_URL || 'http://geoserver:8080/geoserver/rest';
const GEOSERVER_WMS_URL = process.env.GEOSERVER_WMS_URL || 'http://geoserver:8080/geoserver';
const GEOSERVER_USER = process.env.GEOSERVER_USER || 'admin';
const GEOSERVER_PASSWORD = process.env.GEOSERVER_PASSWORD || 'geoserver';
const CLIP_SERVICE_URL = process.env.CLIP_SERVICE_URL || 'http://clip-service:3005';

const GEOSERVER_AUTH = 'Basic ' + Buffer.from(`${GEOSERVER_USER}:${GEOSERVER_PASSWORD}`).toString('base64');
const GEOSERVER_HEADERS = {
  'Accept': 'application/json',
  'Authorization': GEOSERVER_AUTH
};

// Common bounds for all layers (Tunisia: south-west, north-east corners)
const DEFAULT_BOUNDS: [[number, number], [number, number]] = [[30.23, 7.52], [37.77, 11.60]];

// ─── WMS Proxy Endpoint ─────────────────────────────────────────────────
// Frontend calls: GET /api/clip/wms?workspace=LC&service=WMS&...
// Backend forwards to GeoServer keeping it private
router.get('/wms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspace, ...wmsParams } = req.query;

    if (!workspace) {
      res.status(400).json({ error: 'Le paramètre workspace est requis' });
      return;
    }

    const geoserverUrl = `${GEOSERVER_WMS_URL}/${workspace}/wms`;
    const queryString = new URLSearchParams(
      Object.entries(wmsParams).map(([key, value]) => [key, String(value)])
    ).toString();

    const fullUrl = `${geoserverUrl}?${queryString}`;

    const response = await fetch(fullUrl, {
      headers: { 'Authorization': GEOSERVER_AUTH },
    });

    if (!response.ok) {
      console.error(`GeoServer WMS error: ${response.status} ${response.statusText}`);
      res.status(response.status).json({
        error: 'Échec de la requête GeoServer',
        status: response.status
      });
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('WMS proxy error:', error);
    res.status(500).json({ error: 'Erreur proxy WMS', message: error.message });
  }
});

// ─── Fetch layers from GeoServer REST API ───────────────────────────────
async function fetchLayersFromGeoServer(): Promise<any[]> {
  try {
    const layersListResponse = await fetch(`${GEOSERVER_REST_URL}/layers.json`, {
      headers: GEOSERVER_HEADERS
    });

    if (!layersListResponse.ok) {
      throw new Error(`Échec de récupération de la liste des couches: ${layersListResponse.status}`);
    }

    const layersListData = await layersListResponse.json();
    const layersList = layersListData.layers?.layer || [];

    // Filter out clipped layers (those starting with "clip_")
    const filteredLayersList = layersList.filter((layerItem: any) => {
      const layerName = (layerItem.name || '').includes(':')
        ? (layerItem.name || '').split(':')[1]
        : (layerItem.name || '');
      return !layerName.startsWith('clip_');
    });

    const layerDetailsPromises = filteredLayersList.map(async (layerItem: any) => {
      try {
        const detailResponse = await fetch(layerItem.href, {
          headers: GEOSERVER_HEADERS
        });

        if (!detailResponse.ok) {
          console.error(`Failed to fetch layer details for ${layerItem.name}`);
          return null;
        }

        const detailData = await detailResponse.json();
        const layer = detailData.layer;

        const resourceName = layer.resource?.name || layerItem.name;
        const workspace = resourceName.includes(':')
          ? resourceName.split(':')[0]
          : layerItem.name.split(':')[0] || 'default';

        const styleName = layer.defaultStyle?.name || null;

        return {
          geoserver_name: layerItem.name,
          display_name: layer.name,
          wmsUrl: `/api/clip/wms?workspace=${workspace}`,
          layerName: layerItem.name,
          bounds: DEFAULT_BOUNDS,
          type: layer.type,
          style: styleName,
        };
      } catch (error) {
        console.error(`Error fetching details for layer ${layerItem.name}:`, error);
        return null;
      }
    });

    const layerDetails = await Promise.all(layerDetailsPromises);
    return layerDetails.filter(layer => layer !== null);
  } catch (error) {
    console.error('Error fetching layers from GeoServer:', error);
    throw error;
  }
}

// ─── Compute bounding box from a GeoJSON file ───────────────────────────
function computeGeojsonBbox(filePath: string): [number, number, number, number] | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    // Collect all geometries (Feature, FeatureCollection, or bare geometry)
    const geometries: any[] = [];
    if (data.type === 'FeatureCollection') {
      for (const f of data.features || []) {
        if (f.geometry) geometries.push(f.geometry);
      }
    } else if (data.type === 'Feature') {
      if (data.geometry) geometries.push(data.geometry);
    } else if (data.type) {
      geometries.push(data);
    }

    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
    let found = false;

    const walk = (coords: any) => {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [lng, lat] = coords;
        if (lng < west) west = lng;
        if (lat < south) south = lat;
        if (lng > east) east = lng;
        if (lat > north) north = lat;
        found = true;
        return;
      }
      for (const c of coords) walk(c);
    };

    for (const geom of geometries) {
      if (!geom.coordinates) continue;
      walk(geom.coordinates);
    }

    if (!found) return null;
    return [west, south, east, north];
  } catch (e) {
    console.error(`[Bbox] Failed to compute bbox for ${filePath}:`, (e as Error).message);
    return null;
  }
}

// ─── Build nested group structure ───────────────────────────────────────
function buildGroupTree(groups: any[], layers: any[]): any[] {
  const groupMap: { [key: number]: any } = {};
  groups.forEach((g: any) => {
    groupMap[g.id] = {
      id: g.id,
      name: g.name,
      description: g.description,
      legend: g.legend,
      parent_id: g.parent_id,
      children: [],
      layers: layers.filter((l: any) => l.group_id === g.id)
    };
  });

  const rootGroups: any[] = [];
  groups.forEach((g: any) => {
    const group = groupMap[g.id];
    if (g.parent_id && groupMap[g.parent_id]) {
      groupMap[g.parent_id].children.push(group);
    } else {
      rootGroups.push(group);
    }
  });

  const sortChildren = (groupList: any[]) => {
    groupList.forEach(group => {
      if (group.children?.length > 0) {
        group.children.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        sortChildren(group.children);
      }
    });
  };
  sortChildren(rootGroups);
  rootGroups.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

  return rootGroups;
}

// ─── GET /api/clip/layers — Get all active layers grouped (for map) ─────
router.get('/layers', async (req: Request, res: Response): Promise<void> => {
  try {
    const layersResult = await query(`
      SELECT l.id, l.geoserver_name, l.display_name, l.group_id, l.file_path, l.class_labels, l.legend, l.sort_order,
             g.id as group_table_id, g.name as group_name, g.parent_id as group_parent_id, g.legend as group_legend
      FROM layers l
      LEFT JOIN layer_groups g ON l.group_id = g.id
      WHERE l.is_active = true
      ORDER BY l.sort_order ASC, l.created_at ASC
    `);

    const groupsResult = await query(`
      SELECT id, name, description, parent_id, legend, sort_order
      FROM layer_groups
      ORDER BY sort_order ASC, created_at ASC
    `);

    const layers = layersResult.rows.map((layer: any) => {
      const workspace = layer.geoserver_name.includes(':')
        ? layer.geoserver_name.split(':')[0]
        : 'default';

      return {
        id: layer.id,
        name: layer.display_name || layer.geoserver_name,
        geoserver_name: layer.geoserver_name,
        layerName: layer.geoserver_name,
        wmsUrl: `/api/clip/wms?workspace=${workspace}`,
        bounds: DEFAULT_BOUNDS,
        hasStats: !!layer.file_path && !!layer.class_labels,
        hasRasterDownload: !!layer.file_path,
        group_id: layer.group_id,
        group_name: layer.group_name,
        group_legend: layer.group_legend,
        legend: layer.legend,
      };
    });

    const groups = buildGroupTree(groupsResult.rows, layers);
    const ungroupedLayers = layers.filter((l: any) => !l.group_id);

    res.json({ groups, ungroupedLayers });
  } catch (error: any) {
    console.error('Error fetching layers:', error);
    res.status(500).json({ error: 'Échec de récupération des couches', message: error.message });
  }
});

// ─── GET /api/clip/layer/:id/download — Download full source raster ─────
router.get('/layer/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const layerId = Number.parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);
    if (!Number.isInteger(layerId)) {
      res.status(400).json({ error: 'ID de couche invalide' });
      return;
    }

    const result = await query(
      'SELECT geoserver_name, file_path FROM layers WHERE id = $1 AND is_active = true',
      [layerId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    const layer = result.rows[0];
    const safeName = String(layer.geoserver_name)
      .replace(/^[^:]+:/, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-');

    // Prefer the source file when this backend has the raster volume mounted.
    if (layer.file_path && fs.existsSync(layer.file_path)) {
      const extension = path.extname(layer.file_path) || '.tif';
      res.download(layer.file_path, `${safeName}-tunisie${extension}`);
      return;
    }

    // The clip-service has the same source-raster volume used to create the
    // governorate clips, so ask it to serve the original Tunisia raster.
    if (!layer.file_path) {
      res.status(404).json({ error: 'Raster source indisponible' });
      return;
    }
    const filename = `${safeName}-tunisie${path.extname(layer.file_path) || '.tif'}`;
    const rasterResponse = await fetch(`${CLIP_SERVICE_URL}/raster/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raster_path: layer.file_path, filename }),
    });

    if (!rasterResponse.ok || !rasterResponse.body) {
      const details = await rasterResponse.text();
      console.error('Clip-service raster download error:', rasterResponse.status, details);
      res.status(rasterResponse.status === 404 ? 404 : 502).json({ error: 'Raster source indisponible' });
      return;
    }

    res.setHeader('Content-Type', rasterResponse.headers.get('content-type') || 'image/tiff');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const contentLength = rasterResponse.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    Readable.fromWeb(rasterResponse.body as any).pipe(res);
  } catch (error: any) {
    console.error('Full raster download error:', error);
    res.status(500).json({ error: 'Échec du téléchargement du raster' });
  }
});

// ─── POST /api/clip/layers/sync — Sync layers from GeoServer ────────────
router.post('/layers/sync', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const geoserverLayers = await fetchLayersFromGeoServer();

    const existingResult = await query('SELECT geoserver_name FROM layers');
    const existingNames = new Set(existingResult.rows.map((r: any) => r.geoserver_name));

    let added = 0;
    let updated = 0;

    for (const gsLayer of geoserverLayers) {
      if (existingNames.has(gsLayer.geoserver_name)) {
        await query(`
          UPDATE layers
          SET display_name = COALESCE(NULLIF(display_name, ''), $1),
              style_name = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE geoserver_name = $3
        `, [gsLayer.display_name, gsLayer.style, gsLayer.geoserver_name]);
        updated++;
      } else {
        await query(`
          INSERT INTO layers (geoserver_name, display_name, style_name)
          VALUES ($1, $2, $3)
        `, [gsLayer.geoserver_name, gsLayer.display_name, gsLayer.style]);
        added++;
      }
    }

    const allLayers = await query(`
      SELECT l.id, l.geoserver_name, l.display_name, l.group_id, l.file_path, l.class_labels, l.is_active, l.sort_order,
             g.name as group_name
      FROM layers l
      LEFT JOIN layer_groups g ON l.group_id = g.id
      ORDER BY g.sort_order ASC, l.sort_order ASC, l.created_at ASC
    `);

    res.json({
      message: 'Couches synchronisées avec succès',
      added,
      updated,
      total: allLayers.rows.length,
      layers: allLayers.rows
    });
  } catch (error: any) {
    console.error('Error syncing layers:', error);
    res.status(500).json({ error: 'Échec de la synchronisation des couches', message: error.message });
  }
});

// ─── POST /api/clip/stats — Get stats for a polygon area ───────────────
router.post('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { layer_name, polygon, clippedLayerName } = req.body;

    if (!layer_name || (!polygon && !clippedLayerName)) {
      res.status(400).json({ error: 'layer_name et une zone de calcul sont requis' });
      return;
    }

    // Resolve the source layer (always needed for class_labels)
    const result = await query(
      'SELECT * FROM layers WHERE geoserver_name = $1',
      [layer_name]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    const layer = result.rows[0];
    const classLabels = layer.class_labels;

    if (!classLabels) {
      res.status(400).json({ error: 'Couche non configurée pour les statistiques (class_labels manquant)' });
      return;
    }

    // Determine which raster path to send to clip-service
    let rasterPath: string;
    let geojsonPath: string | undefined;
    let statsLayerLabel = layer_name;

    if (clippedLayerName) {
      // Clipped view: look up the cache entry to find the layer_id,
      // then reconstruct the tiff path on the clip-service container.
      const clipResult = await query(
        'SELECT layer_id, country_file FROM clipped_layers_cache WHERE clipped_layer_name = $1',
        [clippedLayerName]
      );

      if (clipResult.rows.length === 0) {
        res.status(404).json({ error: 'Couche découpée non trouvée dans le cache' });
        return;
      }

      // Verify the cache entry belongs to this source layer
      const clipLayerId = clipResult.rows[0].layer_id;
      if (clipLayerId !== layer.id) {
        res.status(400).json({ error: 'La couche découpée ne correspond pas à la couche source' });
        return;
      }

      // Reconstruct path: /data/clipped-rasters/{source_layerName}/{output_layer_id}.tif
      // where source_layerName is the part after ':' in geoserver_name
      // and output_layer_id is the part after ':' in clippedLayerName
      const colonIdx = clippedLayerName.indexOf(':');
      const outputLayerId = colonIdx !== -1 ? clippedLayerName.substring(colonIdx + 1) : clippedLayerName;

      const srcColonIdx = layer.geoserver_name.indexOf(':');
      const sourceLayerName = srcColonIdx !== -1 ? layer.geoserver_name.substring(srcColonIdx + 1) : layer.geoserver_name;

      const OUTPUT_DIR = process.env.CLIP_OUTPUT_DIR || '/data/clipped-rasters';
      rasterPath = `${OUTPUT_DIR}/${sourceLayerName}/${outputLayerId}.tif`;
      statsLayerLabel = clippedLayerName;

      // When no custom polygon is supplied, calculate over the complete
      // governorate boundary already associated with this cached clip.
      if (!polygon) {
        geojsonPath = path.join(
          process.env.GEOJSON_DIR || '/app/geojson',
          clipResult.rows[0].country_file
        );
      }

      console.log(`[Stats] Clipped mode: ${clippedLayerName} → raster_path: ${rasterPath}`);
    } else {
      // Source view: use the source layer's file_path
      const filePath = layer.file_path;
      if (!filePath) {
        res.status(400).json({ error: 'Couche non configurée pour les statistiques (file_path manquant)' });
        return;
      }
      rasterPath = filePath;
    }

    console.log(`[Stats] Calling clip-service for layer: ${statsLayerLabel}`);

    const STATS_TIMEOUT = 10 * 60 * 1000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STATS_TIMEOUT);

    try {
      const response = await fetch(`${CLIP_SERVICE_URL}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raster_path: rasterPath,
          ...(polygon ? { polygon } : { geojson_path: geojsonPath }),
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Stats] Clip-service error: ${response.status} - ${errorBody}`);
        res.status(response.status).json({ error: 'Échec du traitement raster', details: errorBody });
        return;
      }

      const stats = await response.json();

      const totalPixels = stats.total_pixels;
      const classesWithPercentage = stats.classes.map((cls: any) => ({
        class_id: cls.class_id,
        class_name: classLabels[cls.class_id] || `Inconnu (${cls.class_id})`,
        area_km2: cls.area_km2,
        percentage: totalPixels > 0 ? Math.round((cls.pixels / totalPixels) * 100 * 10) / 10 : 0
      }));

      console.log(`[Stats] Success: ${classesWithPercentage.length} classes, ${stats.total_area_km2} km2 total`);

      res.json({
        layer_name,
        total_area_km2: stats.total_area_km2,
        pixel_size_m: stats.pixel_size_m,
        classes: classesWithPercentage
      });
    } catch (fetchError: any) {
      clearTimeout(timeout);

      if (fetchError.name === 'AbortError') {
        res.status(504).json({ error: 'Le calcul des statistiques a expiré', details: 'Essayez une zone plus petite' });
        return;
      }

      console.error('[Stats] Failed to reach clip-service:', fetchError.message);
      res.status(502).json({ error: 'Impossible de joindre le service de traitement raster', details: fetchError.message });
    }
  } catch (error: any) {
    console.error('[Stats] Error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ─── POST /api/clip/country — Clip layer to country boundary ────────────
router.post('/country', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const requestStartTime = Date.now();
  console.log('[Backend Clip] Request received:', { body: req.body, userId: req.user?.userId });

  try {
    const { countryFile, layerId } = req.body;

    if (!countryFile || !layerId) {
      res.status(400).json({ error: 'countryFile et layerId sont requis' });
      return;
    }

    // Get layer info from DB
    const layerResult = await query(
      'SELECT id, file_path, geoserver_name, style_name FROM layers WHERE id = $1',
      [layerId]
    );

    if (!layerResult.rows[0]) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    const { id: layerDbId, file_path, geoserver_name, style_name } = layerResult.rows[0];

    if (!file_path) {
      res.status(400).json({ error: 'Cette couche ne peut pas être découpée (file_path manquant)' });
      return;
    }

    if (!style_name) {
      res.status(400).json({ error: 'Veuillez synchroniser la couche pour récupérer les informations de style' });
      return;
    }

    const [workspace, layerName] = geoserver_name.split(':');
    if (!workspace || !layerName) {
      res.status(400).json({ error: 'Format geoserver_name invalide (attendu: workspace:layerName)' });
      return;
    }

    // Check cache
    const cacheResult = await query(
      'SELECT clipped_layer_name FROM clipped_layers_cache WHERE country_file = $1 AND layer_id = $2',
      [countryFile, layerDbId]
    );

    if (cacheResult.rows.length > 0) {
      const cachedName = cacheResult.rows[0].clipped_layer_name;
      const outputFileId = cachedName.includes(':') ? cachedName.split(':')[1] : cachedName;
      res.json({
        clippedLayerName: cachedName,
        originalLayer: geoserver_name,
        status: 'success',
        cached: true,
        downloadUrl: `/files/${layerName}/${outputFileId}.tif`,
      });
      return;
    }

    // Cache miss — only admins can trigger new clips
    if (req.user?.role !== 'admin') {
      res.status(404).json({
        error: 'Couche non découpée',
        message: 'Cette couche n\'a pas encore été découpée pour le pays sélectionné. Veuillez contacter un administrateur.'
      });
      return;
    }

    // Admin & cache miss — call clip-service
    const geojsonPath = path.join(process.env.GEOJSON_DIR || './geojson', countryFile);
    const countryName = countryFile.replace('.geojson', '');

    console.log('[Backend Clip] Calling clip service:', { country: countryName, layer: layerName, workspace });

    const clipController = new AbortController();
    const clipTimeoutId = setTimeout(() => clipController.abort(), 1_800_000); // 30 min

    const clipResponse = await fetch(`${CLIP_SERVICE_URL}/clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        geojson_path: geojsonPath,
        raster_path: file_path,
        workspace,
        layer_name: layerName,
        style_name,
        country_name: countryName,
        layer_db_id: layerDbId,
        country_file: countryFile,
      }),
      signal: clipController.signal,
    }).finally(() => clearTimeout(clipTimeoutId));

    if (!clipResponse.ok) {
      const errorData = await clipResponse.json().catch(() => ({ detail: 'Erreur inconnue' }));
      console.error('[Backend Clip] Clipping service error:', errorData);
      res.status(500).json({ error: 'Échec du découpage', details: errorData.detail || errorData.message || 'Erreur inconnue' });
      return;
    }

    const clipData = await clipResponse.json();

    if (clipData.status !== 'success') {
      res.status(500).json({ error: 'Échec du découpage', details: clipData.message || 'Erreur inconnue' });
      return;
    }

    const outputFileId = clipData.layer_name.includes(':') ? clipData.layer_name.split(':')[1] : clipData.layer_name;
    res.json({
      clippedLayerName: clipData.layer_name,
      originalLayer: geoserver_name,
      status: 'success',
      cached: false,
      file_size_bytes: clipData.file_size_bytes || null,
      downloadUrl: `/files/${layerName}/${outputFileId}.tif`,
    });

  } catch (error: any) {
    console.error('[Backend Clip] Error:', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur', message: error.message });
  }
});

// ─── BATCH CLIPPING ─────────────────────────────────────────────────────

const runningBatchLayers = new Set<number>();

function getGeojsonFiles(): string[] {
  const geojsonDir = path.join(process.env.GEOJSON_DIR || './geojson');
  if (!fs.existsSync(geojsonDir)) return [];
  return fs.readdirSync(geojsonDir)
    .filter((file: string) => file.endsWith('.geojson'))
    .sort();
}

// GET /api/clip/boundary/:filename — public governorate boundary GeoJSON
router.get('/boundary/:filename', (req: Request, res: Response): void => {
  try {
    const filename = String(req.params.filename);
    const geojsonDir = path.resolve(process.env.GEOJSON_DIR || './geojson');

    // Only serve a GeoJSON file directly inside the configured boundary folder.
    if (path.basename(filename) !== filename || !filename.endsWith('.geojson')) {
      res.status(400).json({ error: 'Nom de limite invalide' });
      return;
    }

    const boundaryPath = path.resolve(geojsonDir, filename);
    if (!boundaryPath.startsWith(`${geojsonDir}${path.sep}`) || !fs.existsSync(boundaryPath)) {
      res.status(404).json({ error: 'Limite du gouvernorat introuvable' });
      return;
    }

    const boundary = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(boundary);
  } catch (error: any) {
    console.error('[Boundary] Error:', error.message);
    res.status(500).json({ error: 'Échec de récupération de la limite' });
  }
});

// GET /api/clip/batch-status
router.get('/batch-status', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const layersResult = await query(`
      SELECT id, geoserver_name, display_name, file_path, style_name
      FROM layers
      WHERE file_path IS NOT NULL
        AND file_path != ''
        AND NOT geoserver_name LIKE '%:clip_%'
      ORDER BY display_name ASC NULLS LAST, geoserver_name ASC
    `);

    const totalCountries = getGeojsonFiles().length;

    const layersWithProgress = await Promise.all(
      layersResult.rows.map(async (layer: any) => {
        const cacheStats = await query(
          'SELECT COUNT(*) as count, COALESCE(SUM(file_size_bytes), 0) as total_size FROM clipped_layers_cache WHERE layer_id = $1',
          [layer.id]
        );
        const clippedCount = parseInt(cacheStats.rows[0]?.count || '0');
        const totalSizeBytes = parseInt(cacheStats.rows[0]?.total_size || '0');
        return {
          id: layer.id,
          geoserver_name: layer.geoserver_name,
          display_name: layer.display_name || layer.geoserver_name,
          file_path: layer.file_path,
          style_name: layer.style_name,
          clippedCountries: clippedCount,
          totalCountries,
          totalSizeBytes,
          fullyClipped: clippedCount >= totalCountries,
          isRunning: runningBatchLayers.has(layer.id),
          canClip: !!layer.style_name,
        };
      })
    );

    res.json({ layers: layersWithProgress, totalCountries });
  } catch (error: any) {
    console.error('[Batch Status] Error:', error);
    res.status(500).json({ error: 'Échec de récupération du statut', message: error.message });
  }
});

// GET /api/clip/layer/:id/clips — public endpoint, returns clips with bbox + downloadUrl
router.get('/layer/:id/clips', async (req: Request, res: Response): Promise<void> => {
  try {
    const layerId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(layerId)) {
      res.status(400).json({ error: 'ID de couche invalide' });
      return;
    }

    // Join with layers table to get the source geoserver_name so we can build
    // the downloadUrl. Files live at /data/clipped-rasters/{source_layerName}/{outputFileId}.tif
    // where source_layerName is the part after ':' in geoserver_name.
    const result = await query(
      `SELECT c.country_file, c.clipped_layer_name, l.geoserver_name
       FROM clipped_layers_cache c
       JOIN layers l ON l.id = c.layer_id
       WHERE c.layer_id = $1
       ORDER BY c.country_file ASC`,
      [layerId]
    );

    const geojsonDir = process.env.GEOJSON_DIR || './geojson';

    const clips = result.rows.map((r: any) => {
      const country = r.country_file.replace('.geojson', '');
      const geojsonPath = path.join(geojsonDir, r.country_file);
      const bbox = computeGeojsonBbox(geojsonPath);
      // Build downloadUrl for the clipped .tif file.
      // Path pattern: /files/{source_layerName}/{outputFileId}.tif
      const sourceLayerName = r.geoserver_name.includes(':')
        ? r.geoserver_name.split(':')[1]
        : r.geoserver_name;
      const outputFileId = r.clipped_layer_name.includes(':')
        ? r.clipped_layer_name.split(':')[1]
        : r.clipped_layer_name;
      const downloadUrl = `/files/${sourceLayerName}/${outputFileId}.tif`;
      return {
        country,
        clippedLayerName: r.clipped_layer_name,
        bbox, // [west, south, east, north] or null
        downloadUrl,
        boundaryUrl: `/clip/boundary/${encodeURIComponent(r.country_file)}`,
      };
    });

    res.json({ layerId, clips });
  } catch (error: any) {
    console.error('[Clips List] Error:', error);
    res.status(500).json({ error: 'Échec de récupération des découpages', message: error.message });
  }
});

// GET /api/clip/layer/:layerId/clipped-countries
router.get('/layer/:layerId/clipped-countries', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { layerId } = req.params;

    const allCountries = getGeojsonFiles().map(f => f.replace('.geojson', ''));

    const clippedResult = await query(
      'SELECT country_file FROM clipped_layers_cache WHERE layer_id = $1',
      [layerId]
    );
    const clippedFiles = new Set(clippedResult.rows.map((r: any) => r.country_file.replace('.geojson', '')));

    const clippedCountries = allCountries.filter(c => clippedFiles.has(c));
    const remainingCountries = allCountries.filter(c => !clippedFiles.has(c));

    res.json({ total: allCountries.length, clipped: clippedCountries, remaining: remainingCountries });
  } catch (error: any) {
    console.error('[Clipped Countries] Error:', error);
    res.status(500).json({ error: 'Échec de récupération', message: error.message });
  }
});

// Helper: Submit a single async clip job
async function submitAsyncClipJob(
  countryFile: string,
  layerDbId: number,
  file_path: string,
  geoserver_name: string,
  style_name: string,
  workspace: string,
  layerName: string,
): Promise<{ success: boolean; countryFile: string; error?: string }> {
  const geojsonPath = path.join(process.env.GEOJSON_DIR || './geojson', countryFile);
  const countryName = countryFile.replace('.geojson', '');

  try {
    const submitController = new AbortController();
    const submitTimeoutId = setTimeout(() => submitController.abort(), 5_000);

    const clipResponse = await fetch(`${CLIP_SERVICE_URL}/clip/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        geojson_path: geojsonPath,
        raster_path: file_path,
        workspace,
        layer_name: layerName,
        style_name,
        country_name: countryName,
        layer_db_id: layerDbId,
        country_file: countryFile,
      }),
      signal: submitController.signal,
    }).finally(() => clearTimeout(submitTimeoutId));

    if (!clipResponse.ok) {
      const errorData = await clipResponse.json().catch(() => ({ detail: 'Erreur inconnue' }));
      console.error(`[Batch Clip] Failed to submit ${countryName}:`, errorData.detail || 'Unknown error');
      return { success: false, countryFile, error: errorData.detail || 'Erreur inconnue' };
    }

    const clipData = await clipResponse.json();
    console.log(`[Batch Clip] Job accepted: ${countryName} (job_id: ${clipData.job_id})`);
    return { success: true, countryFile };
  } catch (error: any) {
    console.error(`[Batch Clip] Error submitting ${countryName}:`, error.message);
    return { success: false, countryFile, error: error.message };
  }
}

// POST /api/clip/batch
router.post('/batch', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { layerId } = req.body;

    if (!layerId) {
      res.status(400).json({ error: 'layerId est requis' });
      return;
    }

    if (runningBatchLayers.has(layerId)) {
      res.status(409).json({ error: 'Découpage en cours', message: 'Cette couche est en cours de découpage. Veuillez attendre.' });
      return;
    }

    const layerResult = await query(
      'SELECT id, file_path, geoserver_name, style_name FROM layers WHERE id = $1',
      [layerId]
    );

    if (!layerResult.rows[0]) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    const layer = layerResult.rows[0];

    if (!layer.file_path) {
      res.status(400).json({ error: 'Cette couche n\'a pas de file_path' });
      return;
    }

    if (!layer.style_name) {
      res.status(400).json({ error: 'Veuillez synchroniser la couche avant le découpage.' });
      return;
    }

    const [workspace, layerName] = layer.geoserver_name.split(':');
    if (!workspace || !layerName) {
      res.status(400).json({ error: 'Format geoserver_name invalide' });
      return;
    }

    runningBatchLayers.add(layerId);

    const geojsonFiles = getGeojsonFiles();

    console.log(`[Batch Clip] Starting batch for layer ${layer.geoserver_name} (${geojsonFiles.length} countries)`);

    // Respond immediately
    res.json({
      status: 'started',
      message: `Découpage par lot démarré pour ${layer.display_name || layer.geoserver_name}`,
      totalCountries: geojsonFiles.length,
    });

    // Run the batch asynchronously
    (async () => {
      try {
        const cachedResult = await query(
          'SELECT country_file FROM clipped_layers_cache WHERE layer_id = $1',
          [layer.id]
        );
        const cachedFiles = new Set(cachedResult.rows.map((r: any) => r.country_file));
        const countriesToClip = geojsonFiles.filter((f: string) => !cachedFiles.has(f));
        const skipCount = geojsonFiles.length - countriesToClip.length;

        console.log(`[Batch Clip] ${geojsonFiles.length} total, ${skipCount} cached, ${countriesToClip.length} to clip`);

        if (countriesToClip.length === 0) {
          runningBatchLayers.delete(layerId);
          return;
        }

        let submittedCount = 0;
        let submitFailCount = 0;

        for (const countryFile of countriesToClip) {
          const result = await submitAsyncClipJob(
            countryFile, layer.id, layer.file_path,
            layer.geoserver_name, layer.style_name, workspace, layerName
          );
          if (result.success) {
            submittedCount++;
          } else {
            submitFailCount++;
          }
          if (submittedCount % 10 === 0) {
            await new Promise(r => setTimeout(r, 100));
          }
        }

        console.log(`[Batch Clip] Submitted ${submittedCount}/${countriesToClip.length} jobs to clip-service`);

        // Poll until done or timeout
        const BATCH_TIMEOUT = 30 * 60 * 1000;
        const POLL_INTERVAL = 10_000;
        const pollStart = Date.now();
        let lastLoggedCount = cachedResult.rows.length;

        while (Date.now() - pollStart < BATCH_TIMEOUT) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL));

          const countResult = await query(
            'SELECT COUNT(*) as count FROM clipped_layers_cache WHERE layer_id = $1',
            [layer.id]
          );
          const clippedCount = parseInt(countResult.rows[0]?.count || '0');

          if (clippedCount !== lastLoggedCount) {
            console.log(`[Batch Clip] Progress: ${clippedCount}/${geojsonFiles.length} clipped`);
            lastLoggedCount = clippedCount;
          }

          if (clippedCount >= geojsonFiles.length) {
            console.log(`[Batch Clip] Completed for ${layer.geoserver_name}`);
            runningBatchLayers.delete(layerId);
            return;
          }
        }

        console.warn(`[Batch Clip] Timeout for ${layer.geoserver_name}`);
        runningBatchLayers.delete(layerId);

      } catch (error: any) {
        console.error(`[Batch Clip] Background error for ${layer.geoserver_name}:`, error.message);
        runningBatchLayers.delete(layerId);
      }
    })();

  } catch (error: any) {
    runningBatchLayers.delete(parseInt(req.body.layerId));
    console.error('[Batch Clip] Error starting batch:', error);
    res.status(500).json({ error: 'Échec du démarrage du découpage par lot', message: error.message });
  }
});

// ─── DELETE CLIPPED LAYERS ──────────────────────────────────────────────

async function unpublishFromGeoServer(clippedLayerName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const colonIdx = clippedLayerName.indexOf(':');
    if (colonIdx === -1) {
      return { success: false, error: `Format de nom invalide: ${clippedLayerName}` };
    }

    const workspace = clippedLayerName.substring(0, colonIdx);
    const layerId = clippedLayerName.substring(colonIdx + 1);

    // Delete the layer resource
    const layerUrl = `${GEOSERVER_REST_URL}/layers/${encodeURIComponent(clippedLayerName)}.json`;
    await fetch(layerUrl, { method: 'DELETE', headers: GEOSERVER_HEADERS });

    // Delete the coverage store
    const storeUrl = `${GEOSERVER_REST_URL}/workspaces/${workspace}/coveragestores/${encodeURIComponent(layerId)}?recurse=true`;
    const storeRes = await fetch(storeUrl, { method: 'DELETE', headers: GEOSERVER_HEADERS });

    if (storeRes.status !== 200 && storeRes.status !== 202 && storeRes.status !== 404) {
      const errorText = await storeRes.text().catch(() => 'Unknown error');
      return { success: false, error: `GeoServer delete failed (${storeRes.status}): ${errorText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[Delete Clip] Error unpublishing ${clippedLayerName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// DELETE /api/clip/clipped-layer
router.delete('/clipped-layer', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { layerId, countryFile } = req.body;

    if (!layerId || !countryFile) {
      res.status(400).json({ error: 'layerId et countryFile sont requis' });
      return;
    }

    if (runningBatchLayers.has(parseInt(layerId))) {
      res.status(409).json({ error: 'Découpage en cours', message: 'Impossible de supprimer pendant le découpage.' });
      return;
    }

    const cacheResult = await query(
      'SELECT clipped_layer_name FROM clipped_layers_cache WHERE country_file = $1 AND layer_id = $2',
      [countryFile, layerId]
    );

    if (cacheResult.rows.length === 0) {
      res.status(404).json({ error: 'Couche découpée non trouvée dans le cache' });
      return;
    }

    const { clipped_layer_name } = cacheResult.rows[0];
    const countryName = countryFile.replace('.geojson', '');

    console.log(`[Delete Clip] Deleting ${countryName} (layer ${clipped_layer_name})...`);

    const geoResult = await unpublishFromGeoServer(clipped_layer_name);

    // Always delete from DB cache
    await query(
      'DELETE FROM clipped_layers_cache WHERE country_file = $1 AND layer_id = $2',
      [countryFile, layerId]
    );

    // Try to delete physical file (non-critical)
    try {
      const fileDeleteUrl = `${CLIP_SERVICE_URL}/clip/file`;
      const fileResponse = await fetch(fileDeleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipped_layer_name })
      });
      if (fileResponse.ok) {
        console.log(`[Delete Clip] Physical file deleted for ${countryName}`);
      }
    } catch (fileError: any) {
      console.warn(`[Delete Clip] File deletion error (non-critical): ${fileError.message}`);
    }

    if (!geoResult.success) {
      res.json({
        status: 'partial',
        message: `Enregistrement supprimé pour ${countryName}, mais nettoyage GeoServer problématique: ${geoResult.error}`,
        countryName,
        geoserverError: geoResult.error,
      });
      return;
    }

    res.json({
      status: 'success',
      message: `Couche découpée supprimée avec succès pour ${countryName}`,
      countryName,
    });
  } catch (error: any) {
    console.error('[Delete Clip] Error:', error);
    res.status(500).json({ error: 'Échec de la suppression', message: error.message });
  }
});

// DELETE /api/clip/batch-delete
router.delete('/batch-delete', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { layerId } = req.body;

    if (!layerId) {
      res.status(400).json({ error: 'layerId est requis' });
      return;
    }

    if (runningBatchLayers.has(parseInt(layerId))) {
      res.status(409).json({ error: 'Découpage en cours', message: 'Impossible de supprimer pendant le découpage.' });
      return;
    }

    const cacheResult = await query(
      'SELECT id, country_file, clipped_layer_name FROM clipped_layers_cache WHERE layer_id = $1',
      [layerId]
    );

    if (cacheResult.rows.length === 0) {
      res.status(404).json({ error: 'Aucune couche découpée trouvée' });
      return;
    }

    const entries = cacheResult.rows;
    console.log(`[Batch Delete] Deleting ${entries.length} clipped layers for layer ${layerId}...`);

    let deletedCount = 0;
    let failedCount = 0;
    const failures: { country: string; error: string }[] = [];

    for (const entry of entries) {
      const countryName = (entry as any).country_file.replace('.geojson', '');
      const geoResult = await unpublishFromGeoServer((entry as any).clipped_layer_name);

      if (!geoResult.success) {
        failedCount++;
        failures.push({ country: countryName, error: geoResult.error || 'Inconnu' });
      } else {
        deletedCount++;
      }
    }

    // Always clean DB
    await query('DELETE FROM clipped_layers_cache WHERE layer_id = $1', [layerId]);

    // Try to delete physical files (non-critical)
    try {
      const clippedLayerNames = entries.map((e: any) => e.clipped_layer_name);
      const fileDeleteUrl = `${CLIP_SERVICE_URL}/clip/files`;
      const fileResponse = await fetch(fileDeleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipped_layer_names: clippedLayerNames })
      });
      if (fileResponse.ok) {
        console.log(`[Batch Delete] Physical files deletion requested`);
      }
    } catch (fileError: any) {
      console.warn(`[Batch Delete] File deletion error (non-critical): ${fileError.message}`);
    }

    res.json({
      status: failedCount === 0 ? 'success' : 'partial',
      message: failedCount === 0
        ? `Toutes les ${deletedCount} couches découpées supprimées`
        : `${deletedCount} supprimées, ${failedCount} avec des problèmes GeoServer (enregistrements DB supprimés)`,
      total: entries.length,
      deleted: deletedCount,
      failed: failedCount,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error: any) {
    console.error('[Batch Delete] Error:', error);
    res.status(500).json({ error: 'Échec de la suppression', message: error.message });
  }
});

export default router;
