import { Hono } from 'hono';
import { sign } from 'npm:jsonwebtoken@^9.0.2';
import { OAuth2Client } from 'npm:google-auth-library@^10.1.0';
import { env } from '../utils/env.ts';
import { sql, type User } from '../db/database.ts';
import { authMiddleware, type AuthPayload } from '../middleware/auth.ts';
import { setCache } from '../services/redis.ts';

const auth = new Hono();

const oauth2Client = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.FRONTEND_URL}/api/auth/callback`
);

function generateJWT(user: User): string {
  const payload: AuthPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

auth.get('/google', (c) => {
  const redirectUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });

  return c.redirect(redirectUrl);
});

auth.get('/callback', async (c) => {
  const code = c.req.query('code');

  if (!code) {
    return c.json({ error: 'No code provided' }, 400);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return c.json({ error: 'Invalid token payload' }, 400);
    }

    const googleId = payload.sub;
    const email = payload.email!;
    const name = payload.name;
    const avatarUrl = payload.picture;

    let users = await sql`
      SELECT id, google_id, email, name, avatar_url, role, created_at 
      FROM users 
      WHERE google_id = ${googleId}
    `;

    let user: User;

    if (users.length === 0) {
      const newUsers = await sql`
        INSERT INTO users (google_id, email, name, avatar_url, role)
        VALUES (${googleId}, ${email}, ${name}, ${avatarUrl}, 'viewer')
        RETURNING id, google_id, email, name, avatar_url, role, created_at
      `;
      user = newUsers[0] as User;
    } else {
      user = users[0] as User;
    }

    const jwt = generateJWT(user);

    return c.json({ token: jwt, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

auth.post('/logout', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Blacklist the token until it expires (max 7 days = 604800 seconds)
      const ttl = 604800;
      await setCache(`blacklist:${token}`, user.id, ttl);
    }
    
    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

auth.get('/me', authMiddleware, (c) => {
  const user = c.get('user') as User;
  
  return c.json({
    id: user.id,
    google_id: user.google_id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    role: user.role,
    created_at: user.created_at,
  });
});

export default auth;
