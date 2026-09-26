import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { calculateGovernorateStatistics, getCachedGovernorateStatistics } from '../services/governorateStatistics.js';

const router = Router();
const runningLayers = new Set<number>();

router.get('/layers', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const result = await query(`
    SELECT l.id, l.display_name, l.geoserver_name, g.name AS group_name,
           COUNT(DISTINCT c.country_file)::int AS clipped_count,
           COUNT(DISTINCT s.country_file)::int AS computed_count,
           MAX(s.computed_at) AS last_computed_at
    FROM layers l
    LEFT JOIN layer_groups g ON g.id = l.group_id
    LEFT JOIN clipped_layers_cache c ON c.layer_id = l.id
    LEFT JOIN layer_governorate_stats s ON s.layer_id = l.id
    WHERE l.is_active = true AND l.file_path IS NOT NULL AND l.class_labels IS NOT NULL
    GROUP BY l.id, g.name
    ORDER BY g.name NULLS LAST, l.sort_order, l.id
  `);
    res.json({ layers: result.rows.map(row => ({ ...row, is_running: runningLayers.has(row.id) })) });
  } catch (error) {
    console.error('[Statistics] Failed to list layers:', error);
    res.status(500).json({ error: 'Impossible de charger les statistiques' });
  }
});

router.get('/layer/:layerId/governorate/:governorate', async (req: Request, res: Response): Promise<void> => {
  try {
    const layerId = Number(req.params.layerId);
    if (!Number.isInteger(layerId)) { res.status(400).json({ error: 'Couche invalide' }); return; }
    const governorateParam = req.params.governorate;
    const governorate = Array.isArray(governorateParam) ? governorateParam[0] : governorateParam;
    if (!governorate) { res.status(400).json({ error: 'Gouvernorat invalide' }); return; }
    const stats = await getCachedGovernorateStatistics(layerId, governorate);
    if (!stats) { res.status(404).json({ error: 'Statistiques pré-calculées indisponibles' }); return; }
    res.json(stats);
  } catch (error) {
    console.error('[Statistics] Failed to read governorate statistics:', error);
    res.status(500).json({ error: 'Impossible de charger les statistiques' });
  }
});

router.post('/admin/layers/:layerId/compute', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const layerId = Number(req.params.layerId);
    if (!Number.isInteger(layerId)) { res.status(400).json({ error: 'Couche invalide' }); return; }
    if (runningLayers.has(layerId)) { res.status(409).json({ error: 'Calcul déjà en cours' }); return; }
    const clips = await query('SELECT country_file FROM clipped_layers_cache WHERE layer_id = $1 ORDER BY country_file', [layerId]);
    if (!clips.rows.length) { res.status(400).json({ error: 'Aucun découpage disponible pour cette couche' }); return; }

    runningLayers.add(layerId);
    res.status(202).json({ message: 'Pré-calcul démarré', total: clips.rows.length });
    void (async () => {
      try {
        for (let index = 0; index < clips.rows.length; index += 2) {
          const outcomes = await Promise.allSettled(clips.rows.slice(index, index + 2).map(row => calculateGovernorateStatistics(layerId, row.country_file)));
          outcomes.forEach(outcome => {
            if (outcome.status === 'rejected') console.error(`[Statistics] Layer ${layerId}:`, outcome.reason);
          });
        }
      } finally {
        runningLayers.delete(layerId);
      }
    })();
  } catch (error) {
    console.error('[Statistics] Failed to start calculation:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Impossible de démarrer le calcul' });
    else {
      const layerId = Number(req.params.layerId);
      runningLayers.delete(layerId);
    }
  }
});

router.delete('/admin/layers/:layerId', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const layerId = Number(req.params.layerId);
    if (!Number.isInteger(layerId)) { res.status(400).json({ error: 'Couche invalide' }); return; }
    const result = await query('DELETE FROM layer_governorate_stats WHERE layer_id = $1', [layerId]);
    res.json({ deleted: result.rowCount || 0 });
  } catch (error) {
    console.error('[Statistics] Failed to clear statistics:', error);
    res.status(500).json({ error: 'Impossible de supprimer les statistiques' });
  }
});

export default router;
