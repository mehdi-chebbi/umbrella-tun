import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// All group routes require authentication
router.use(authMiddleware);

// GET /api/groups — Get all groups with layer/child counts
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT g.*, p.name as parent_name,
             (SELECT COUNT(*) FROM layers l WHERE l.group_id = g.id) as layer_count,
             (SELECT COUNT(*) FROM layer_groups cg WHERE cg.parent_id = g.id) as child_count
      FROM layer_groups g
      LEFT JOIN layer_groups p ON g.parent_id = p.id
      ORDER BY g.sort_order ASC, g.created_at ASC
    `);

    res.json({ groups: result.rows });
  } catch (error: any) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/groups/tree — Get groups in tree structure
router.get('/tree', async (req: Request, res: Response): Promise<void> => {
  try {
    const groupsResult = await query(`
      SELECT g.*, p.name as parent_name
      FROM layer_groups g
      LEFT JOIN layer_groups p ON g.parent_id = p.id
      ORDER BY g.sort_order ASC, g.created_at ASC
    `);

    const layersCountResult = await query(`
      SELECT group_id, COUNT(*) as count
      FROM layers
      WHERE group_id IS NOT NULL
      GROUP BY group_id
    `);

    const layerCounts: { [key: number]: number } = {};
    layersCountResult.rows.forEach((row: any) => {
      layerCounts[row.group_id] = parseInt(row.count);
    });

    const groups = groupsResult.rows;
    const rootGroups: any[] = [];

    const groupMap: { [key: number]: any } = {};
    groups.forEach((g: any) => {
      groupMap[g.id] = {
        ...g,
        children: [],
        layer_count: layerCounts[g.id] || 0
      };
    });

    groups.forEach((g: any) => {
      const group = groupMap[g.id];
      if (g.parent_id && groupMap[g.parent_id]) {
        groupMap[g.parent_id].children.push(group);
      } else {
        rootGroups.push(group);
      }
    });

    const sortChildren = (groupList: any[]) => {
      groupList.forEach((group: any) => {
        if (group.children?.length > 0) {
          group.children.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          sortChildren(group.children);
        }
      });
    };
    sortChildren(rootGroups);
    rootGroups.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    res.json({ groups: rootGroups });
  } catch (error: any) {
    console.error('Get groups tree error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/groups/:id — Get single group by ID with layers and children
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT g.*, p.name as parent_name FROM layer_groups g LEFT JOIN layer_groups p ON g.parent_id = p.id WHERE g.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    const layersResult = await query(
      'SELECT id, geoserver_name, display_name, is_active, sort_order FROM layers WHERE group_id = $1 ORDER BY sort_order ASC',
      [id]
    );

    const childGroupsResult = await query(
      'SELECT id, name, description, sort_order FROM layer_groups WHERE parent_id = $1 ORDER BY sort_order ASC',
      [id]
    );

    res.json({
      group: {
        ...result.rows[0],
        layers: layersResult.rows,
        children: childGroupsResult.rows
      }
    });
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/groups — Create group (admin only)
router.post('/', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parent_id, description, legend, sort_order } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Le nom du groupe est requis' });
      return;
    }

    if (parent_id) {
      const parentExists = await query('SELECT id FROM layer_groups WHERE id = $1', [parent_id]);
      if (parentExists.rows.length === 0) {
        res.status(400).json({ error: 'Groupe parent non trouvé' });
        return;
      }
    }

    const result = await query(
      `INSERT INTO layer_groups (name, parent_id, description, legend, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, parent_id || null, description || null, legend ? JSON.stringify(legend) : null, sort_order || 0]
    );

    res.status(201).json({
      message: 'Groupe créé avec succès',
      group: result.rows[0]
    });
  } catch (error: any) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/groups/:id — Update group (admin only)
router.put('/:id', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, parent_id, description, legend, sort_order } = req.body;

    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'ID de groupe invalide' });
      return;
    }

    const existing = await query('SELECT * FROM layer_groups WHERE id = $1', [groupId]);

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    // Prevent cycles
    if (parent_id) {
      if (parent_id === groupId) {
        res.status(400).json({ error: 'Un groupe ne peut pas être son propre parent' });
        return;
      }

      const parentCheck = await query('SELECT id, parent_id FROM layer_groups WHERE id = $1', [parent_id]);
      if (parentCheck.rows.length === 0) {
        res.status(400).json({ error: 'Groupe parent non trouvé' });
        return;
      }

      let currentParent: number | null = parentCheck.rows[0].parent_id;
      while (currentParent) {
        if (currentParent === groupId) {
          res.status(400).json({ error: 'Cela créerait une référence circulaire' });
          return;
        }
        const parentResult = await query('SELECT parent_id FROM layer_groups WHERE id = $1', [currentParent]);
        currentParent = parentResult.rows[0]?.parent_id || null;
      }
    }

    const result = await query(
      `UPDATE layer_groups
       SET name = COALESCE($1, name),
           parent_id = CASE WHEN $2::integer IS NULL THEN NULL ELSE COALESCE($2, parent_id) END,
           description = COALESCE($3, description),
           legend = COALESCE($4, legend),
           sort_order = COALESCE($5, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, parent_id === null ? null : (parent_id || undefined), description, legend ? JSON.stringify(legend) : undefined, sort_order, groupId]
    );

    res.json({
      message: 'Groupe mis à jour avec succès',
      group: result.rows[0]
    });
  } catch (error: any) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /api/groups/:id — Delete group (admin only)
router.delete('/:id', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'ID de groupe invalide' });
      return;
    }

    const existing = await query('SELECT id FROM layer_groups WHERE id = $1', [groupId]);

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    // CASCADE will delete child groups; layers will have group_id set to NULL
    await query('DELETE FROM layer_groups WHERE id = $1', [groupId]);

    res.json({ message: 'Groupe supprimé avec succès' });
  } catch (error: any) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
