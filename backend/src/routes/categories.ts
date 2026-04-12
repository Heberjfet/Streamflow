import { Hono } from 'hono';
import { sql } from '../db/database.ts';
import { authMiddleware, optionalAuth, requireAdmin } from '../middleware/auth.ts';

const categories = new Hono();

categories.get('/', optionalAuth, async (c) => {
  try {
    const allCategories = await sql`
      SELECT id, name, slug, description, created_at
      FROM categories
      ORDER BY name ASC
    `;

    return c.json(allCategories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

categories.get('/:id', optionalAuth, async (c) => {
  try {
    const id = c.req.param('id');

    const categoriesResult = await sql`
      SELECT id, name, slug, description, created_at
      FROM categories
      WHERE id = ${id}
    `;

    if (categoriesResult.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    return c.json(categoriesResult[0]);
  } catch (error) {
    console.error('Category fetch error:', error);
    return c.json({ error: 'Failed to fetch category' }, 500);
  }
});

// Create a new category (admin only)
categories.post('/', authMiddleware, requireAdmin, async (c) => {
  try {
    const { name, slug, description } = await c.req.json();

    if (!name || !slug) {
      return c.json({ error: 'Name and slug are required' }, 400);
    }

    // Check if slug already exists
    const existing = await sql`SELECT id FROM categories WHERE slug = ${slug}`;
    if (existing.length > 0) {
      return c.json({ error: 'Slug already exists' }, 409);
    }

    const newCategories = await sql`
      INSERT INTO categories (name, slug, description)
      VALUES (${name}, ${slug}, ${description || null})
      RETURNING id, name, slug, description, created_at
    `;

    return c.json(newCategories[0], 201);
  } catch (error) {
    console.error('Category create error:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

// Update a category (admin only)
categories.put('/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const { name, slug, description } = await c.req.json();

    if (!name && !slug && description === undefined) {
      return c.json({ error: 'At least one field is required' }, 400);
    }

    // Check if category exists
    const existing = await sql`SELECT id FROM categories WHERE id = ${id}`;
    if (existing.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Check if new slug conflicts with another category
    if (slug) {
      const slugConflict = await sql`SELECT id FROM categories WHERE slug = ${slug} AND id != ${id}`;
      if (slugConflict.length > 0) {
        return c.json({ error: 'Slug already exists' }, 409);
      }
    }

    // Build dynamic update
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;

    const updated = await sql`
      UPDATE categories 
      SET name = COALESCE(${updates.name}, name),
          slug = COALESCE(${updates.slug}, slug),
          description = COALESCE(${updates.description}, description)
      WHERE id = ${id}
      RETURNING id, name, slug, description, created_at
    `;

    return c.json(updated[0]);
  } catch (error) {
    console.error('Category update error:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

// Delete a category (admin only)
categories.delete('/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    const existing = await sql`SELECT id FROM categories WHERE id = ${id}`;
    if (existing.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    await sql`DELETE FROM categories WHERE id = ${id}`;

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Category delete error:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

export default categories;
