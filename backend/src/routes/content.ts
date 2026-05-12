import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/content/:pageKey
 * Public endpoint — returns content for a specific page.
 */
router.get('/:pageKey', async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageKey } = req.params;

    const result = await query(
      'SELECT id, page_key, title, body, updated_at FROM content WHERE page_key = $1',
      [pageKey]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Contenu introuvable pour cette page' });
      return;
    }

    res.json({ content: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/content
 * Protected endpoint — returns all content entries.
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, page_key, title, body, updated_at FROM content ORDER BY page_key ASC'
    );

    res.json({ content: result.rows });
  } catch (error) {
    console.error('Erreur lors de la liste des contenus :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * PUT /api/content/:pageKey
 * Protected (admin only) — update content for a specific page.
 */
router.put('/:pageKey', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageKey } = req.params;
    const { title, body } = req.body;

    if (!title && !body) {
      res.status(400).json({ error: 'Titre ou contenu requis' });
      return;
    }

    const existing = await query('SELECT id FROM content WHERE page_key = $1', [pageKey]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Contenu introuvable pour cette page' });
      return;
    }

    const result = await query(
      `UPDATE content
       SET title = COALESCE($1, title),
           body = COALESCE($2, body),
           updated_at = CURRENT_TIMESTAMP
       WHERE page_key = $3
       RETURNING id, page_key, title, body, updated_at`,
      [
        title !== undefined ? title : null,
        body !== undefined ? body : null,
        pageKey,
      ]
    );

    res.json({ content: result.rows[0], message: 'Contenu mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/content
 * Protected (admin only) — create a new content entry.
 */
router.post('/', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page_key, title, body } = req.body;

    if (!page_key) {
      res.status(400).json({ error: 'Clé de page (page_key) requise' });
      return;
    }

    const result = await query(
      `INSERT INTO content (page_key, title, body)
       VALUES ($1, $2, $3)
       RETURNING id, page_key, title, body, updated_at`,
      [page_key, title || null, body || null]
    );

    res.status(201).json({ content: result.rows[0] });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      res.status(409).json({ error: 'Cette clé de page existe déjà' });
      return;
    }
    console.error('Erreur lors de la création du contenu :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
