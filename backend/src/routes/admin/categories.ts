import { Hono } from 'hono';
import { sql } from '../../db/database.ts';
import { authMiddleware, requireAdmin } from '../../middleware/auth.ts';

const adminCategories = new Hono();

adminCategories.use('/*', authMiddleware);
adminCategories.use('/*', requireAdmin);

adminCategories.get('/', async (c) => {
  try {
    const categories = await sql`
      SELECT c.*,
             (SELECT COUNT(*) FROM videos WHERE category_id = c.id)::INTEGER as videos_count
      FROM categories c
      ORDER BY c.name
    `;
    return c.json({ categories });
  } catch (error) {
    console.error('Categories list error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

adminCategories.post('/', async (c) => {
  try {
    const { name, description } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [existing] = await sql`SELECT id FROM categories WHERE slug = ${slug}`;
    if (existing) {
      return c.json({ error: 'Category with this name already exists' }, 409);
    }

    const [category] = await sql`
      INSERT INTO categories (name, slug, description)
      VALUES (${name}, ${slug}, ${description || null})
      RETURNING *
    `;

    return c.json(category, 201);
  } catch (error) {
    console.error('Category create error:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

adminCategories.put('/:id', async (c) => {
  try {
    const categoryId = c.req.param('id');
    const { name, description, is_active } = await c.req.json();

    const [existing] = await sql`SELECT id FROM categories WHERE id = ${categoryId}`;
    if (!existing) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      updates.push('slug = $' + (values.length + 1));
      values.push(slug);
      updates.push('name = $' + (values.length + 1));
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = $' + (values.length + 1));
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = $' + (values.length + 1));
      values.push(is_active);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(categoryId);

      await sql`UPDATE categories SET ${sql(updates.join(', '))} WHERE id = ${categoryId}`;
    }

    return c.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Category update error:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

adminCategories.delete('/:id', async (c) => {
  try {
    const categoryId = c.req.param('id');

    const [category] = await sql`SELECT id FROM categories WHERE id = ${categoryId}`;
    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const [videoCount] = await sql`SELECT COUNT(*)::INTEGER as count FROM videos WHERE category_id = ${categoryId}`;
    if (videoCount.count > 0) {
      return c.json({ error: 'Cannot delete category with associated videos. Reassign them first.' }, 400);
    }

    await sql`DELETE FROM categories WHERE id = ${categoryId}`;

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Category delete error:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

export default adminCategories;
