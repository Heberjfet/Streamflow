import type { Context, Next } from 'hono';
import { verify } from 'npm:jsonwebtoken@^9.0.2';
import { env } from '../utils/env.ts';
import { sql, type User } from '../db/database.ts';
import { getCache } from '../services/redis.ts';

export interface AuthPayload {
  sub: string;
  email: string;
  role: 'viewer' | 'uploader' | 'admin';
  iat?: number;
  exp?: number;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const cookieToken = c.get('cookie_token');

  const token = authHeader?.replace('Bearer ', '') || cookieToken;

  if (!token) {
    return c.json({ error: 'Unauthorized', message: 'No token provided' }, 401);
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await getCache(`blacklist:${token}`);
    if (isBlacklisted) {
      return c.json({ error: 'Unauthorized', message: 'Token has been revoked' }, 401);
    }

    const decoded = verify(token, env.JWT_SECRET) as AuthPayload;
    
    const users = await sql`
      SELECT id, google_id, email, name, avatar_url, role, created_at 
      FROM users 
      WHERE id = ${decoded.sub}
    `;

    if (users.length === 0) {
      return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
    }

    c.set('user', users[0] as User);
    c.set('auth_payload', decoded);

    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
  }
}

export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const cookieToken = c.get('cookie_token');

  const token = authHeader?.replace('Bearer ', '') || cookieToken;

  if (token) {
    try {
      const decoded = verify(token, env.JWT_SECRET) as AuthPayload;
      
      const users = await sql`
        SELECT id, google_id, email, name, avatar_url, role, created_at 
        FROM users 
        WHERE id = ${decoded.sub}
      `;

      if (users.length > 0) {
        c.set('user', users[0] as User);
        c.set('auth_payload', decoded);
      }
    } catch {
      // Token inválido, pero continuamos sin usuario
    }
  }

  await next();
}

export function requireAdmin(c: Context, next: Next) {
  const user = c.get('user') as User | undefined;
  
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
  }

  return next();
}
