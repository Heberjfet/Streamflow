import { Hono } from 'hono';
import { sql, type User } from '../../db/database.ts';
import { authMiddleware, requireAdmin } from '../../middleware/auth.ts';

const admin = new Hono();

admin.use('/*', authMiddleware);
admin.use('/*', requireAdmin);

admin.get('/stats', async (c) => {
  try {
    const [
      videosStats,
      usersStats,
      categoriesCount,
      recentActivity
    ] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::INTEGER as total,
          COUNT(*) FILTER (WHERE is_published = TRUE)::INTEGER as published,
          COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as processing,
          COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed,
          COALESCE(SUM(view_count), 0)::BIGINT as total_views
        FROM videos
      `,
      sql`
        SELECT
          COUNT(*)::INTEGER as total,
          COUNT(*) FILTER (WHERE is_active = TRUE)::INTEGER as active,
          COUNT(*) FILTER (WHERE role = 'admin')::INTEGER as admins,
          COUNT(*) FILTER (WHERE role = 'uploader')::INTEGER as uploaders,
          COUNT(*) FILTER (WHERE role = 'viewer')::INTEGER as viewers,
          COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days')::INTEGER as active_last_7_days
        FROM users
      `,
      sql`SELECT COUNT(*)::INTEGER as count FROM categories WHERE is_active = TRUE`,
      sql`
        SELECT COUNT(*)::INTEGER as count
        FROM audit_log
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `
    ]);

    return c.json({
      videos: {
        total: videosStats[0].total,
        published: videosStats[0].published,
        processing: videosStats[0].processing,
        failed: videosStats[0].failed,
        totalViews: Number(videosStats[0].total_views)
      },
      users: {
        total: usersStats[0].total,
        active: usersStats[0].active,
        admins: usersStats[0].admins,
        uploaders: usersStats[0].uploaders,
        viewers: usersStats[0].viewers,
        activeLast7Days: usersStats[0].active_last_7_days
      },
      categories: categoriesCount[0].count,
      recentActivity: recentActivity[0].count
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

admin.get('/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const role = c.req.query('role');
    const search = c.req.query('search');

    let query = sql`
      SELECT id, google_id, email, name, avatar_url, role, is_active, last_login, created_at,
             (SELECT COUNT(*) FROM videos WHERE uploader_id = users.id)::INTEGER as videos_count
      FROM users
      WHERE TRUE
    `;

    if (role) {
      query = sql`${query} AND role = ${role}`;
    }

    if (search) {
      query = sql`${query} AND (email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'})`;
    }

    const users = await sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [totalResult] = await sql`SELECT COUNT(*)::INTEGER as count FROM users`;

    return c.json({
      users,
      pagination: {
        page,
        limit,
        total: totalResult.count,
        totalPages: Math.ceil(totalResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Users list error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

admin.get('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    const [user] = await sql`
      SELECT id, google_id, email, name, avatar_url, role, is_active, last_login, created_at, updated_at
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const userRoles = await sql`
      SELECT r.name, r.description, ur.assigned_at
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}
    `;

    const userVideos = await sql`
      SELECT id, title, status, is_published, view_count, created_at
      FROM videos
      WHERE uploader_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const userActivity = await sql`
      SELECT table_name, action, created_at
      FROM audit_log
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return c.json({
      ...user,
      roles: userRoles,
      recentVideos: userVideos,
      recentActivity: userActivity
    });
  } catch (error) {
    console.error('User detail error:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

admin.put('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const { role, is_active } = await c.req.json();

    const [existingUser] = await sql`SELECT id FROM users WHERE id = ${userId}`;
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (role) {
      const adminUser = c.get('user') as User;

      if (role === 'admin') {
        const [adminCount] = await sql`SELECT COUNT(*)::INTEGER as count FROM users WHERE role = 'admin' AND is_active = TRUE AND id != ${userId}`;
        if (adminCount.count === 0) {
          return c.json({ error: 'Cannot remove the last admin' }, 400);
        }
      }

      await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}`;
    }

    if (typeof is_active === 'boolean') {
      if (is_active === false) {
        const [adminCount] = await sql`SELECT COUNT(*)::INTEGER as count FROM users WHERE role = 'admin' AND is_active = TRUE AND id != ${userId}`;
        if (adminCount.count === 0) {
          return c.json({ error: 'Cannot deactivate the last admin' }, 400);
        }
      }
      await sql`UPDATE users SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${userId}`;
    }

    return c.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('User update error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

admin.delete('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const currentUser = c.get('user') as User;

    if (userId === currentUser.id) {
      return c.json({ error: 'Cannot delete yourself' }, 400);
    }

    const [user] = await sql`SELECT role FROM users WHERE id = ${userId}`;
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (user.role === 'admin') {
      const [adminCount] = await sql`SELECT COUNT(*)::INTEGER as count FROM users WHERE role = 'admin' AND is_active = TRUE`;
      if (adminCount.count <= 1) {
        return c.json({ error: 'Cannot delete the last admin' }, 400);
      }
    }

    await sql`DELETE FROM user_roles WHERE user_id = ${userId}`;
    await sql`DELETE FROM user_sessions WHERE user_id = ${userId}`;
    await sql`DELETE FROM users WHERE id = ${userId}`;

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User delete error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

export default admin;
