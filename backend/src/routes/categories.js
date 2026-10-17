import { Router } from 'express';
import { pool, query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth);

const shape = (c) => ({ id: c.id, name: c.name, isDefault: c.is_default, expenseCount: c.expense_count });

const LIST_SQL = `
  SELECT c.id, c.name, c.is_default, COUNT(e.id)::int AS expense_count
  FROM categories c LEFT JOIN expenses e ON e.category_id = c.id
  GROUP BY c.id ORDER BY c.is_default, c.name`;

// Any signed-in user can read categories (needed for the expense form and filters).
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(LIST_SQL);
    res.json({ data: rows.map(shape) });
  })
);

function cleanName(raw) {
  const name = String(raw || '').trim();
  if (!name) throw new HttpError(400, 'Category name is required');
  if (name.length > 60) throw new HttpError(400, 'Category name must be at most 60 characters');
  return name;
}

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = cleanName(req.body.name);
    try {
      const { rows } = await query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
      res.status(201).json({ data: shape({ ...rows[0], expense_count: 0 }) });
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'A category with this name already exists');
      throw err;
    }
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = cleanName(req.body.name);
    const existing = await query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) throw new HttpError(404, 'Category not found');
    if (existing.rows[0].is_default) throw new HttpError(400, 'The default category cannot be renamed');
    try {
      const { rows } = await query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING *', [
        name,
        req.params.id,
      ]);
      res.json({ data: shape({ ...rows[0], expense_count: 0 }) });
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'A category with this name already exists');
      throw err;
    }
  })
);

// Deleting a category moves its expenses to the default "Uncategorized" category.
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const cat = await client.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
      if (!cat.rowCount) throw new HttpError(404, 'Category not found');
      if (cat.rows[0].is_default) throw new HttpError(400, 'The default category cannot be deleted');

      const def = await client.query('SELECT id FROM categories WHERE is_default = TRUE LIMIT 1');
      const moved = await client.query('UPDATE expenses SET category_id = $1 WHERE category_id = $2', [
        def.rows[0].id,
        req.params.id,
      ]);
      await client.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      await client.query('COMMIT');
      res.json({ message: 'Category deleted', reassignedExpenses: moved.rowCount });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

export default router;
