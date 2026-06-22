import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
  userId: number;
  role: string;
}

/**
 * Generate a JWT token for the given user.
 */
export function generateToken(userId: number, role: string): string {
  const payload: TokenPayload = { userId, role };
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as unknown as number };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token. Throws if invalid or expired.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  return decoded;
}
