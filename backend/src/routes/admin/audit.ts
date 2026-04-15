import { Hono } from 'hono';
import { sql } from '../../db/database.ts';
import { authMiddleware, requireAdmin } from '../../middleware/auth.ts';

const adminAudit = new Hono();

adminAudit.use('/*', authMiddleware);
adminAudit.use('/*', requireAdmin);

adminAudit.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = (page - 1) * limit;
    const tableName = c.req.query('table');
    const action = c.req.query('action');
    const userId = c.req.query('userId');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    let query = sql`SELECT * FROM audit_log WHERE TRUE`;
    const params: unknown[] = [];

    if (tableName) {
      query = sql`${query} AND table_name = ${tableName}`;
    }
    if (action) {
      query = sql`${query} AND action = ${action}`;
    }
    if (userId) {
      query = sql`${query} AND user_id = ${userId}`;
    }
    if (startDate) {
      query = sql`${query} AND created_at >= ${startDate}`;
    }
    if (endDate) {
      query = sql`${query} AND created_at <= ${endDate}`;
    }

    const logs = await sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [countResult] = await sql`SELECT COUNT(*)::INTEGER as count FROM audit_log`;

    return c.json({
      logs,
      pagination: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return c.json({ error: 'Failed to fetch audit logs' }, 500);
  }
});

adminAudit.get('/tables', async (c) => {
  try {
    const tables = await sql`
      SELECT DISTINCT table_name, COUNT(*)::INTEGER as count
      FROM audit_log
      GROUP BY table_name
      ORDER BY table_name
    `;
    return c.json({ tables });
  } catch (error) {
    console.error('Tables error:', error);
    return c.json({ error: 'Failed to fetch tables' }, 500);
  }
});

adminAudit.get('/summary', async (c) => {
  try {
    const today = await sql`
      SELECT
        COUNT(*)::INTEGER as total,
        COUNT(*) FILTER (WHERE action = 'INSERT')::INTEGER as inserts,
        COUNT(*) FILTER (WHERE action = 'UPDATE')::INTEGER as updates,
        COUNT(*) FILTER (WHERE action = 'DELETE')::INTEGER as deletes
      FROM audit_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;

    const byTable = await sql`
      SELECT
        table_name,
        COUNT(*)::INTEGER as count,
        COUNT(*) FILTER (WHERE action = 'INSERT')::INTEGER as inserts,
        COUNT(*) FILTER (WHERE action = 'UPDATE')::INTEGER as updates,
        COUNT(*) FILTER (WHERE action = 'DELETE')::INTEGER as deletes
      FROM audit_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY table_name
      ORDER BY count DESC
    `;

    const byUser = await sql`
      SELECT
        user_email,
        COUNT(*)::INTEGER as count
      FROM audit_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
        AND user_email IS NOT NULL
      GROUP BY user_email
      ORDER BY count DESC
      LIMIT 10
    `;

    return c.json({
      today: today[0],
      byTable,
      byUser
    });
  } catch (error) {
    console.error('Summary error:', error);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

adminAudit.delete('/cleanup', async (c) => {
  try {
    const daysToKeep = parseInt(c.req.query('days') || '90');

    const [result] = await sql`
      SELECT fn_cleanup_old_audit_logs(${daysToKeep}) as deleted_count
    `;

    return c.json({
      message: 'Cleanup completed',
      deletedCount: result.deleted_count
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return c.json({ error: 'Failed to cleanup logs' }, 500);
  }
});

export default adminAudit;
