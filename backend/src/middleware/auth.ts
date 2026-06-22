import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { query } from '../db/connection.js';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
        active: boolean;
      };
    }
  }
}

/**
 * Authentication middleware — verifies JWT Bearer token.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token d\'authentification manquant' });
      return;
    }

    const token = authHeader.split(' ')[1];

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      res.status(401).json({ error: 'Token invalide ou expiré' });
      return;
    }

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, username, role, active FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Utilisateur introuvable' });
      return;
    }

    const user = result.rows[0];

    if (!user.active) {
      res.status(403).json({ error: 'Compte désactivé. Contactez un administrateur.' });
      return;
    }

    req.user = {
      userId: user.id,
      role: user.role,
      active: user.active,
    };

    next();
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

/**
 * Admin-only middleware — must be used after authMiddleware.
 */
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
    return;
  }
  next();
}
