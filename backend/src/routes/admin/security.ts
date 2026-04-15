import { Hono } from 'hono';
import { sql } from '../../db/database.ts';
import { authMiddleware, requireAdmin } from '../../middleware/auth.ts';

const adminSecurity = new Hono();

adminSecurity.use('/*', authMiddleware);
adminSecurity.use('/*', requireAdmin);

adminSecurity.get('/login-attempts', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = (page - 1) * limit;
    const success = c.req.query('success');
    const ipAddress = c.req.query('ip');

    let query = sql`SELECT * FROM login_attempts WHERE TRUE`;
    const params: unknown[] = [];

    if (success !== undefined) {
      query = sql`${query} AND success = ${success === 'true'}`;
    }
    if (ipAddress) {
      query = sql`${query} AND ip_address = ${ipAddress}`;
    }

    const attempts = await sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [countResult] = await sql`SELECT COUNT(*)::INTEGER as count FROM login_attempts`;

    return c.json({
      attempts,
      pagination: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Login attempts error:', error);
    return c.json({ error: 'Failed to fetch login attempts' }, 500);
  }
});

adminSecurity.get('/blocked-ips', async (c) => {
  try {
    const blockedIps = await sql`
      SELECT
        ip_address,
        COUNT(*)::INTEGER as attempts,
        MAX(created_at) as last_attempt
      FROM login_attempts
      WHERE success = FALSE
        AND created_at > NOW() - INTERVAL '15 minutes'
      GROUP BY ip_address
      HAVING COUNT(*) >= 5
      ORDER BY attempts DESC
    `;

    return c.json({ blockedIps });
  } catch (error) {
    console.error('Blocked IPs error:', error);
    return c.json({ error: 'Failed to fetch blocked IPs' }, 500);
  }
});

adminSecurity.get('/sessions', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = (page - 1) * limit;

    const sessions = await sql`
      SELECT s.*, u.email, u.name as user_name
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.revoked_at IS NULL AND s.expires_at > NOW()
      ORDER BY s.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [countResult] = await sql`
      SELECT COUNT(*)::INTEGER as count
      FROM user_sessions
      WHERE revoked_at IS NULL AND expires_at > NOW()
    `;

    return c.json({
      sessions,
      pagination: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Sessions error:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

adminSecurity.delete('/sessions/:id', async (c) => {
  try {
    const sessionId = c.req.param('id');

    await sql`UPDATE user_sessions SET revoked_at = NOW() WHERE id = ${sessionId}`;

    return c.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    return c.json({ error: 'Failed to revoke session' }, 500);
  }
});

adminSecurity.delete('/sessions/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    await sql`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ${userId}`;

    return c.json({ message: 'All user sessions revoked successfully' });
  } catch (error) {
    console.error('Revoke user sessions error:', error);
    return c.json({ error: 'Failed to revoke user sessions' }, 500);
  }
});

export default adminSecurity;
