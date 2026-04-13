import { Hono } from 'hono';
import bcrypt from 'npm:bcryptjs@^2.4.3';
import { sql, type User } from '../db/database.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { uploadBuffer } from '../services/minio.ts';
import { BUCKETS } from '../services/minio.ts';

const users = new Hono();

users.get('/me', authMiddleware, (c) => {
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

users.put('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { name } = await c.req.json();

    if (!name || name.trim().length === 0) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const updated = await sql`
      UPDATE users 
      SET name = ${name.trim()}
      WHERE id = ${user.id}
      RETURNING id, google_id, email, name, avatar_url, role, created_at
    `;

    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: updated[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Update failed' }, 500);
  }
});

users.put('/me/password', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new password required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'New password must be at least 6 characters' }, 400);
    }

    const existingUsers = await sql`
      SELECT id, password_hash FROM users WHERE id = ${user.id}
    `;

    if (existingUsers.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const dbUser = existingUsers[0] as User & { password_hash?: string };

    if (dbUser.password_hash) {
      const isValid = await bcrypt.compare(currentPassword, dbUser.password_hash);
      if (!isValid) {
        return c.json({ error: 'Current password is incorrect' }, 401);
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await sql`
      UPDATE users SET password_hash = ${newPasswordHash} WHERE id = ${user.id}
    `;

    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Password change failed' }, 500);
  }
});

users.post('/me/avatar', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const body = await c.req.parseBody();
    const file = body['avatar'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Avatar file is required' }, 400);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const objectName = `avatars/${user.id}/${Date.now()}.${ext}`;

    await uploadBuffer(BUCKETS.THUMBS, objectName, buffer, file.type);

    const avatarUrl = `/${BUCKETS.THUMBS}/${objectName}`;

    await sql`
      UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${user.id}
    `;

    return c.json({ avatar_url: avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return c.json({ error: 'Avatar upload failed' }, 500);
  }
});

export default users;