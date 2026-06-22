import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
      return;
    }

    const result = await query(
      'SELECT id, username, password, email, full_name, role, active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
      return;
    }

    const user = result.rows[0];

    if (!user.active) {
      res.status(403).json({ error: 'Compte désactivé. Contactez un administrateur.' });
      return;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info.
 */
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, username, email, full_name, role, active, created_at, updated_at FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/auth/change-password
 * Change current user's password.
 */
router.post('/change-password', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    // Get current password hash
    const result = await query('SELECT password FROM users WHERE id = $1', [req.user!.userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    const isValid = await comparePassword(currentPassword, result.rows[0].password);
    if (!isValid) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      return;
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, req.user!.userId]
    );

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
