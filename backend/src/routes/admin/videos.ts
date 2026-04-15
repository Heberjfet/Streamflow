import { Hono } from 'hono';
import { sql } from '../../db/database.ts';
import { authMiddleware, requireAdmin } from '../../middleware/auth.ts';

const adminVideos = new Hono();

adminVideos.use('/*', authMiddleware);
adminVideos.use('/*', requireAdmin);

adminVideos.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const status = c.req.query('status');
    const categoryId = c.req.query('categoryId');
    const search = c.req.query('search');

    let query = sql`
      SELECT v.*, c.name as category_name, u.name as uploader_name, u.email as uploader_email
      FROM videos v
      LEFT JOIN categories c ON c.id = v.category_id
      LEFT JOIN users u ON u.id = v.uploader_id
      WHERE TRUE
    `;

    if (status) {
      query = sql`${query} AND v.status = ${status}`;
    }
    if (categoryId) {
      query = sql`${query} AND v.category_id = ${categoryId}`;
    }
    if (search) {
      query = sql`${query} AND (v.title ILIKE ${'%' + search + '%'} OR v.description ILIKE ${'%' + search + '%'})`;
    }

    const videos = await sql`${query} ORDER BY v.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [countResult] = await sql`SELECT COUNT(*)::INTEGER as count FROM videos`;

    return c.json({
      videos,
      pagination: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Videos list error:', error);
    return c.json({ error: 'Failed to fetch videos' }, 500);
  }
});

adminVideos.get('/:id', async (c) => {
  try {
    const videoId = c.req.param('id');

    const [video] = await sql`
      SELECT v.*, c.name as category_name, u.name as uploader_name, u.email as uploader_email
      FROM videos v
      LEFT JOIN categories c ON c.id = v.category_id
      LEFT JOIN users u ON u.id = v.uploader_id
      WHERE v.id = ${videoId}
    `;

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    const auditHistory = await sql`
      SELECT action, old_data, new_data, user_email, created_at
      FROM audit_log
      WHERE table_name = 'videos' AND record_id = ${videoId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return c.json({
      ...video,
      auditHistory
    });
  } catch (error) {
    console.error('Video detail error:', error);
    return c.json({ error: 'Failed to fetch video' }, 500);
  }
});

adminVideos.put('/:id', async (c) => {
  try {
    const videoId = c.req.param('id');
    const { title, description, category_id, status, is_published } = await c.req.json();

    const [existingVideo] = await sql`SELECT id FROM videos WHERE id = ${videoId}`;
    if (!existingVideo) {
      return c.json({ error: 'Video not found' }, 404);
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (title !== undefined) {
      updates.push('title = $' + (values.length + 1));
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = $' + (values.length + 1));
      values.push(description);
    }
    if (category_id !== undefined) {
      updates.push('category_id = $' + (values.length + 1));
      values.push(category_id);
    }
    if (status !== undefined) {
      updates.push('status = $' + (values.length + 1));
      values.push(status);
    }
    if (is_published !== undefined) {
      updates.push('is_published = $' + (values.length + 1));
      values.push(is_published);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(videoId);

      await sql`UPDATE videos SET ${sql(updates.join(', '))} WHERE id = ${videoId}`;
    }

    return c.json({ message: 'Video updated successfully' });
  } catch (error) {
    console.error('Video update error:', error);
    return c.json({ error: 'Failed to update video' }, 500);
  }
});

adminVideos.delete('/:id', async (c) => {
  try {
    const videoId = c.req.param('id');

    const [video] = await sql`SELECT id, is_published FROM videos WHERE id = ${videoId}`;
    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    if (video.is_published) {
      await sql`UPDATE videos SET status = 'deleted', is_published = FALSE, updated_at = NOW() WHERE id = ${videoId}`;
    } else {
      await sql`DELETE FROM videos WHERE id = ${videoId}`;
    }

    return c.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Video delete error:', error);
    return c.json({ error: 'Failed to delete video' }, 500);
  }
});

adminVideos.post('/:id/force-process', async (c) => {
  try {
    const videoId = c.req.param('id');

    const [video] = await sql`SELECT id, hls_path FROM videos WHERE id = ${videoId}`;
    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    await sql`UPDATE videos SET status = 'processing', is_processed = FALSE, updated_at = NOW() WHERE id = ${videoId}`;

    return c.json({ message: 'Video queued for reprocessing' });
  } catch (error) {
    console.error('Force process error:', error);
    return c.json({ error: 'Failed to queue video for processing' }, 500);
  }
});

export default adminVideos;
