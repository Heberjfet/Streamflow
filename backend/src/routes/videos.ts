import { Hono } from 'hono';
import { sql } from '../db/database.ts';
import { authMiddleware, optionalAuth } from '../middleware/auth.ts';

const videos = new Hono();

// Get all videos (admin only - includes unpublished)
videos.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can see all videos
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('page_size') || '20');
    const offset = (page - 1) * pageSize;

    const videosResult = await sql`
      SELECT v.id, v.title, v.description, v.category_id, v.hls_path, 
             v.poster_path, v.duration, v.file_size, v.is_processed, 
             v.is_published, v.created_at, v.updated_at,
             c.id as cat_id, c.name as cat_name, c.slug as cat_slug
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      ORDER BY v.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const countResult = await sql`SELECT COUNT(*) as total FROM videos`;
    const total = Number(countResult[0].total);

    const processedVideos = videosResult.map((v: Record<string, unknown>) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      category_id: v.category_id,
      hls_path: v.hls_path,
      poster_path: v.poster_path,
      duration: v.duration,
      file_size: v.file_size,
      is_processed: v.is_processed,
      is_published: v.is_published,
      created_at: v.created_at,
      updated_at: v.updated_at,
      category: v.cat_id ? {
        id: v.cat_id,
        name: v.cat_name,
        slug: v.cat_slug,
      } : null,
    }));

    return c.json({
      videos: processedVideos,
      total,
      page,
      page_size: pageSize,
    });
  } catch (error) {
    console.error('Videos list error:', error);
    return c.json({ error: 'Failed to fetch videos' }, 500);
  }
});

// Update a video (admin only)
videos.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const { title, description, category_id, is_published } = await c.req.json();

    // Check if video exists
    const existing = await sql`SELECT id FROM videos WHERE id = ${id}`;
    if (existing.length === 0) {
      return c.json({ error: 'Video not found' }, 404);
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category_id !== undefined) updates.category_id = category_id;
    if (is_published !== undefined) updates.is_published = is_published;

    const updated = await sql`
      UPDATE videos 
      SET title = COALESCE(${updates.title}, title),
          description = COALESCE(${updates.description}, description),
          category_id = COALESCE(${updates.category_id}, category_id),
          is_published = COALESCE(${updates.is_published}, is_published),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, description, category_id, hls_path, poster_path, 
                duration, file_size, is_processed, is_published, created_at, updated_at
    `;

    return c.json(updated[0]);
  } catch (error) {
    console.error('Video update error:', error);
    return c.json({ error: 'Failed to update video' }, 500);
  }
});

// Delete a video (admin only)
videos.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');

    const existing = await sql`SELECT id FROM videos WHERE id = ${id}`;
    if (existing.length === 0) {
      return c.json({ error: 'Video not found' }, 404);
    }

    await sql`DELETE FROM videos WHERE id = ${id}`;

    return c.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Video delete error:', error);
    return c.json({ error: 'Failed to delete video' }, 500);
  }
});

// Record video view (any authenticated user)
videos.post('/:id/view', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const videoId = c.req.param('id');

    // Check if video exists
    const video = await sql`SELECT id FROM videos WHERE id = ${videoId}`;
    if (video.length === 0) {
      return c.json({ error: 'Video not found' }, 404);
    }

    // Create watch history entry
    await sql`
      INSERT INTO watch_history (user_id, video_id)
      VALUES (${user.id}, ${videoId})
      ON CONFLICT (user_id, video_id) DO UPDATE SET 
        viewed_at = NOW()
    `;

    // Increment view count (optional - could be separate)
    // For now we just record the history

    return c.json({ message: 'View recorded' });
  } catch (error) {
    console.error('View record error:', error);
    return c.json({ error: 'Failed to record view' }, 500);
  }
});

// Add video to favorites
videos.post('/:id/favorite', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const videoId = c.req.param('id');

    // Check if video exists
    const video = await sql`SELECT id FROM videos WHERE id = ${videoId}`;
    if (video.length === 0) {
      return c.json({ error: 'Video not found' }, 404);
    }

    // Add to favorites (insert or update)
    await sql`
      INSERT INTO favorites (user_id, video_id)
      VALUES (${user.id}, ${videoId})
      ON CONFLICT (user_id, video_id) DO NOTHING
    `;

    return c.json({ message: 'Added to favorites' });
  } catch (error) {
    console.error('Favorite error:', error);
    return c.json({ error: 'Failed to add favorite' }, 500);
  }
});

// Remove from favorites
videos.delete('/:id/favorite', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const videoId = c.req.param('id');

    await sql`DELETE FROM favorites WHERE user_id = ${user.id} AND video_id = ${videoId}`;

    return c.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Unfavorite error:', error);
    return c.json({ error: 'Failed to remove favorite' }, 500);
  }
});

// Get user's watch history
videos.get('/history', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('page_size') || '20');
    const offset = (page - 1) * pageSize;

    const history = await sql`
      SELECT v.id, v.title, v.description, v.category_id, v.hls_path, 
             v.poster_path, v.duration, v.file_size, v.is_processed, 
             v.is_published, v.created_at, v.updated_at,
             wh.viewed_at
      FROM watch_history wh
      JOIN videos v ON wh.video_id = v.id
      WHERE wh.user_id = ${user.id}
      ORDER BY wh.viewed_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM watch_history WHERE user_id = ${user.id}
    `;
    const total = Number(countResult[0].total);

    return c.json({
      videos: history.map((v: Record<string, unknown>) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        category_id: v.category_id,
        hls_path: v.hls_path,
        poster_path: v.poster_path,
        duration: v.duration,
        is_processed: v.is_processed,
        is_published: v.is_published,
        created_at: v.created_at,
        updated_at: v.updated_at,
        viewed_at: v.viewed_at,
      })),
      total,
      page,
      page_size: pageSize,
    });
  } catch (error) {
    console.error('Watch history error:', error);
    return c.json({ error: 'Failed to fetch watch history' }, 500);
  }
});

// Get user's favorites
videos.get('/favorites', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('page_size') || '20');
    const offset = (page - 1) * pageSize;

    const favorites = await sql`
      SELECT v.id, v.title, v.description, v.category_id, v.hls_path, 
             v.poster_path, v.duration, v.file_size, v.is_processed, 
             v.is_published, v.created_at, v.updated_at,
             f.added_at
      FROM favorites f
      JOIN videos v ON f.video_id = v.id
      WHERE f.user_id = ${user.id}
      ORDER BY f.added_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM favorites WHERE user_id = ${user.id}
    `;
    const total = Number(countResult[0].total);

    return c.json({
      videos: favorites.map((v: Record<string, unknown>) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        category_id: v.category_id,
        hls_path: v.hls_path,
        poster_path: v.poster_path,
        duration: v.duration,
        is_processed: v.is_processed,
        is_published: v.is_published,
        created_at: v.created_at,
        updated_at: v.updated_at,
        added_at: v.added_at,
      })),
      total,
      page,
      page_size: pageSize,
    });
  } catch (error) {
    console.error('Favorites error:', error);
    return c.json({ error: 'Failed to fetch favorites' }, 500);
  }
});

export default videos;