import path from 'path';
import { query } from '../db/connection.js';

const CLIP_SERVICE_URL = process.env.CLIP_SERVICE_URL || 'http://clip-service:3005';

export interface GovernorateStatistics {
  layer_id: number;
  layer_name: string;
  governorate: string;
  total_area_km2: number;
  pixel_size_m: number | null;
  classes: Array<{ class_id: number; class_name: string; area_km2: number; percentage: number }>;
  computed_at?: string;
}

export async function calculateGovernorateStatistics(layerId: number, countryFile: string): Promise<GovernorateStatistics> {
  const result = await query(`
    SELECT l.id, l.geoserver_name, l.display_name, l.class_labels,
           c.clipped_layer_name, c.country_file, c.created_at AS clip_created_at
    FROM layers l
    JOIN clipped_layers_cache c ON c.layer_id = l.id
    WHERE l.id = $1 AND c.country_file = $2 AND l.is_active = true
  `, [layerId, countryFile]);
  if (!result.rows.length) throw new Error('Découpage introuvable pour cette couche et ce gouvernorat');

  const row = result.rows[0];
  if (!row.class_labels) throw new Error('Classes statistiques non configurées');
  const sourceName = row.geoserver_name.includes(':') ? row.geoserver_name.split(':')[1] : row.geoserver_name;
  const outputName = row.clipped_layer_name.includes(':') ? row.clipped_layer_name.split(':')[1] : row.clipped_layer_name;
  const rasterPath = path.join(process.env.CLIP_OUTPUT_DIR || '/data/clipped-rasters', sourceName, `${outputName}.tif`);
  const geojsonPath = path.join(process.env.GEOJSON_DIR || '/app/geojson', row.country_file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);
  try {
    const response = await fetch(`${CLIP_SERVICE_URL}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raster_path: rasterPath, geojson_path: geojsonPath }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Le service raster a répondu ${response.status}`);
    const stats: any = await response.json();
    const totalPixels = Number(stats.total_pixels) || 0;
    const classes = (stats.classes || []).map((item: any) => ({
      class_id: Number(item.class_id),
      class_name: row.class_labels[item.class_id] || `Inconnu (${item.class_id})`,
      area_km2: Number(item.area_km2),
      percentage: totalPixels > 0 ? Math.round((Number(item.pixels) / totalPixels) * 1000) / 10 : 0,
    }));

    await query(`
      INSERT INTO layer_governorate_stats
        (layer_id, country_file, clipped_layer_name, total_area_km2, pixel_size_m, classes, clip_created_at, computed_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (layer_id, country_file) DO UPDATE SET
        clipped_layer_name = EXCLUDED.clipped_layer_name,
        total_area_km2 = EXCLUDED.total_area_km2,
        pixel_size_m = EXCLUDED.pixel_size_m,
        classes = EXCLUDED.classes,
        clip_created_at = EXCLUDED.clip_created_at,
        computed_at = CURRENT_TIMESTAMP
    `, [layerId, countryFile, row.clipped_layer_name, stats.total_area_km2, stats.pixel_size_m, JSON.stringify(classes), row.clip_created_at]);

    return {
      layer_id: layerId,
      layer_name: row.display_name || row.geoserver_name,
      governorate: countryFile.replace(/\.geojson$/i, ''),
      total_area_km2: Number(stats.total_area_km2),
      pixel_size_m: stats.pixel_size_m == null ? null : Number(stats.pixel_size_m),
      classes,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCachedGovernorateStatistics(layerId: number, governorate: string): Promise<GovernorateStatistics | null> {
  const normalized = governorate.trim().replace(/\.geojson$/i, '');
  const result = await query(`
    SELECT s.layer_id, COALESCE(l.display_name, l.geoserver_name) AS layer_name,
           regexp_replace(s.country_file, '\\.geojson$', '', 'i') AS governorate,
           s.total_area_km2, s.pixel_size_m, s.classes, s.computed_at
    FROM layer_governorate_stats s
    JOIN layers l ON l.id = s.layer_id
    JOIN clipped_layers_cache c
      ON c.layer_id = s.layer_id
     AND c.country_file = s.country_file
     AND c.clipped_layer_name = s.clipped_layer_name
    WHERE s.layer_id = $1
      AND lower(regexp_replace(s.country_file, '\\.geojson$', '', 'i')) = lower($2)
  `, [layerId, normalized]);
  return result.rows[0] || null;
}
