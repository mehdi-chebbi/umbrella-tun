import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// All layer routes require authentication
router.use(authMiddleware);

// GET /api/layers — Get all layers with group info
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT l.*, g.name as group_name, g.legend as group_legend
      FROM layers l
      LEFT JOIN layer_groups g ON l.group_id = g.id
      ORDER BY g.sort_order ASC, l.sort_order ASC, l.created_at ASC
    `);

    res.json({ layers: result.rows });
  } catch (error: any) {
    console.error('Get layers error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/layers/id/:id — Get single layer by ID
router.get('/id/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM layers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    res.json({ layer: result.rows[0] });
  } catch (error: any) {
    console.error('Get layer error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/layers/name/:name — Get layer by geoserver_name
router.get('/name/:name', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;

    const result = await query('SELECT * FROM layers WHERE geoserver_name = $1', [name]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    res.json({ layer: result.rows[0] });
  } catch (error: any) {
    console.error('Get layer error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/layers — Create layer (admin only)
router.post('/', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { geoserver_name, display_name, group_id, file_path, class_labels, legend, is_active, sort_order } = req.body;

    if (!geoserver_name) {
      res.status(400).json({ error: 'geoserver_name est requis' });
      return;
    }

    // Check if already exists
    const existing = await query('SELECT id FROM layers WHERE geoserver_name = $1', [geoserver_name]);

    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Cette couche existe déjà' });
      return;
    }

    // Validate group_id if provided
    if (group_id) {
      const groupExists = await query('SELECT id FROM layer_groups WHERE id = $1', [group_id]);
      if (groupExists.rows.length === 0) {
        res.status(400).json({ error: 'Groupe non trouvé' });
        return;
      }
    }

    const result = await query(
      `INSERT INTO layers (geoserver_name, display_name, group_id, file_path, class_labels, legend, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        geoserver_name,
        display_name || geoserver_name,
        group_id || null,
        file_path || null,
        class_labels ? JSON.stringify(class_labels) : null,
        legend ? JSON.stringify(legend) : null,
        is_active !== undefined ? is_active : true,
        sort_order || 0
      ]
    );

    res.status(201).json({
      message: 'Couche créée avec succès',
      layer: result.rows[0]
    });
  } catch (error: any) {
    console.error('Create layer error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/layers/:id — Update layer (admin only)
router.put('/:id', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { geoserver_name, display_name, group_id, file_path, class_labels, legend, is_active, sort_order } = req.body;

    const layerId = parseInt(id);
    if (isNaN(layerId)) {
      res.status(400).json({ error: 'ID de couche invalide' });
      return;
    }

    // Check if exists
    const existing = await query('SELECT * FROM layers WHERE id = $1', [layerId]);

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    // Check name conflict
    if (geoserver_name) {
      const nameConflict = await query(
        'SELECT id FROM layers WHERE geoserver_name = $1 AND id != $2',
        [geoserver_name, layerId]
      );

      if (nameConflict.rows.length > 0) {
        res.status(409).json({ error: 'Ce nom de couche est déjà utilisé' });
        return;
      }
    }

    // Validate group_id if provided
    if (group_id !== undefined && group_id !== null) {
      const groupExists = await query('SELECT id FROM layer_groups WHERE id = $1', [group_id]);
      if (groupExists.rows.length === 0) {
        res.status(400).json({ error: 'Groupe non trouvé' });
        return;
      }
    }

    const result = await query(
      `UPDATE layers
       SET geoserver_name = COALESCE($1, geoserver_name),
           display_name = COALESCE($2, display_name),
           group_id = CASE WHEN $3::integer IS NULL THEN NULL ELSE COALESCE($3, group_id) END,
           file_path = COALESCE($4, file_path),
           class_labels = COALESCE($5, class_labels),
           legend = COALESCE($6, legend),
           is_active = COALESCE($7, is_active),
           sort_order = COALESCE($8, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        geoserver_name,
        display_name,
        group_id === null ? null : (group_id || undefined),
        file_path,
        class_labels ? JSON.stringify(class_labels) : undefined,
        legend ? JSON.stringify(legend) : undefined,
        is_active,
        sort_order,
        layerId
      ]
    );

    res.json({
      message: 'Couche mise à jour avec succès',
      layer: result.rows[0]
    });
  } catch (error: any) {
    console.error('Update layer error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /api/layers/:id — Delete layer (admin only)
router.delete('/:id', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const layerId = parseInt(id);
    if (isNaN(layerId)) {
      res.status(400).json({ error: 'ID de couche invalide' });
      return;
    }

    const existing = await query('SELECT id FROM layers WHERE id = $1', [layerId]);

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Couche non trouvée' });
      return;
    }

    await query('DELETE FROM layers WHERE id = $1', [layerId]);

    res.json({ message: 'Couche supprimée avec succès' });
  } catch (error: any) {
    console.error('Delete layer error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
