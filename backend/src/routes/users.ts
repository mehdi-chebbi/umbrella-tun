import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { hashPassword } from '../utils/password.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * GET /api/users
 * List all users with optional filtering.
 * Query params: ?role=viewer&search=john
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(role);
    }

    if (search) {
      conditions.push(`(u.username ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.active, u.created_at, u.updated_at
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC`,
      params
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Erreur lors de la liste des utilisateurs :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, username, email, full_name, role, active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/users
 * Create a new user. Admin only.
 */
router.post('/', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, full_name, role } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    const validRoles = ['admin', 'editor', 'viewer'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: `Rôle invalide. Valeurs autorisées : ${validRoles.join(', ')}` });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (username, password, email, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role, active, created_at`,
      [username, hashedPassword, email || null, full_name || null, role || 'viewer']
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      res.status(409).json({ error: 'Ce nom d\'utilisateur existe déjà' });
      return;
    }
    console.error('Erreur lors de la création de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * PUT /api/users/:id
 * Update a user. Admin only.
 */
router.put('/:id', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, full_name, role, active } = req.body;

    // Check user exists
    const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    if (role) {
      const validRoles = ['admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ error: `Rôle invalide. Valeurs autorisées : ${validRoles.join(', ')}` });
        return;
      }
    }

    const result = await query(
      `UPDATE users
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           role = COALESCE($3, role),
           active = COALESCE($4, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, email, full_name, role, active, created_at, updated_at`,
      [
        email !== undefined ? email : null,
        full_name !== undefined ? full_name : null,
        role !== undefined ? role : null,
        active !== undefined ? active : null,
        id,
      ]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * DELETE /api/users/:id
 * Soft delete a user (set active = false). Admin only.
 */
router.delete('/:id', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id, active FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    if (!existing.rows[0].active) {
      res.status(400).json({ error: 'Cet utilisateur est déjà désactivé' });
      return;
    }

    const result = await query(
      `UPDATE users SET active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, active`,
      [id]
    );

    res.json({ message: 'Utilisateur désactivé avec succès', user: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
