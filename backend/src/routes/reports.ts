import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

const submissionLog = new Map<string, number[]>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;

function countCoordinates(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') return 1;
  return value.reduce((total, item) => total + countCoordinates(item), 0);
}

function isValidGeometry(geometry: any): boolean {
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) return false;
  const count = countCoordinates(geometry.coordinates);
  if (count < 4 || count > 5000) return false;

  let valid = true;
  const validate = (value: unknown): void => {
    if (!Array.isArray(value)) {
      valid = false;
      return;
    }
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const [lng, lat] = value;
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) valid = false;
      return;
    }
    value.forEach(validate);
  };
  validate(geometry.coordinates);
  return valid;
}

function isRateLimited(req: Request): boolean {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (submissionLog.get(key) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    submissionLog.set(key, recent);
    return true;
  }
  recent.push(now);
  submissionLog.set(key, recent);
  return false;
}

// Public: submit an anonymous report.
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (isRateLimited(req)) {
      res.status(429).json({ error: 'Trop de signalements. Veuillez réessayer plus tard.' });
      return;
    }

    const layerId = Number.parseInt(String(req.body.layer_id), 10);
    const selectedClip = typeof req.body.selected_clip === 'string' ? req.body.selected_clip.trim() : null;
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    const geometry = req.body.geometry;

    if (!Number.isInteger(layerId)) {
      res.status(400).json({ error: 'Couche invalide' });
      return;
    }
    if (comment.length < 5 || comment.length > 2000) {
      res.status(400).json({ error: 'Le commentaire doit contenir entre 5 et 2000 caractères' });
      return;
    }
    if (!isValidGeometry(geometry)) {
      res.status(400).json({ error: 'Zone signalée invalide ou trop complexe' });
      return;
    }

    const layerResult = await query(
      'SELECT id, geoserver_name, display_name FROM layers WHERE id = $1 AND is_active = true',
      [layerId]
    );
    if (layerResult.rows.length === 0) {
      res.status(404).json({ error: 'Couche introuvable' });
      return;
    }
    const layer = layerResult.rows[0];

    if (selectedClip) {
      const clipResult = await query(
        'SELECT 1 FROM clipped_layers_cache WHERE layer_id = $1 AND clipped_layer_name = $2',
        [layerId, selectedClip]
      );
      if (clipResult.rows.length === 0) {
        res.status(400).json({ error: 'Découpage sélectionné invalide' });
        return;
      }
    }

    const result = await query(
      `INSERT INTO data_reports
        (layer_id, layer_name, layer_display_name, selected_clip, geometry, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, status, created_at`,
      [
        layer.id,
        layer.geoserver_name,
        layer.display_name || layer.geoserver_name,
        selectedClip || null,
        JSON.stringify(geometry),
        comment,
      ]
    );

    res.status(201).json({ report: result.rows[0], message: 'Signalement envoyé avec succès' });
  } catch (error) {
    console.error('Create data report error:', error);
    res.status(500).json({ error: 'Échec de l’envoi du signalement' });
  }
});

router.use(authMiddleware, adminOnly);

// Admin: list reports, optionally filtered by status.
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    if (status && !['pending', 'fixed'].includes(status)) {
      res.status(400).json({ error: 'Statut invalide' });
      return;
    }
    const result = status
      ? await query('SELECT * FROM data_reports WHERE status = $1 ORDER BY created_at DESC', [status])
      : await query('SELECT * FROM data_reports ORDER BY created_at DESC');
    res.json({ reports: result.rows });
  } catch (error) {
    console.error('List data reports error:', error);
    res.status(500).json({ error: 'Échec du chargement des signalements' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Identifiant invalide' });
      return;
    }
    const result = await query('SELECT * FROM data_reports WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Signalement introuvable' });
      return;
    }
    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Get data report error:', error);
    res.status(500).json({ error: 'Échec du chargement du signalement' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Identifiant invalide' });
      return;
    }
    const { status } = req.body;
    if (!['pending', 'fixed'].includes(status)) {
      res.status(400).json({ error: 'Statut invalide' });
      return;
    }
    const result = await query(
      `UPDATE data_reports SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Signalement introuvable' });
      return;
    }
    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Update data report error:', error);
    res.status(500).json({ error: 'Échec de la mise à jour du signalement' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Identifiant invalide' });
      return;
    }
    const result = await query('DELETE FROM data_reports WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Signalement introuvable' });
      return;
    }
    res.json({ message: 'Signalement supprimé' });
  } catch (error) {
    console.error('Delete data report error:', error);
    res.status(500).json({ error: 'Échec de la suppression du signalement' });
  }
});

export default router;
