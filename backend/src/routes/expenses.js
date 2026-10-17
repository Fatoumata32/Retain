import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, validateExpense, DATE_RE, PAYMENT_METHODS } from '../utils.js';

const router = Router();
router.use(requireAuth);

const SELECT = `
  SELECT e.id, e.title, e.amount, e.date, e.payment_method, e.notes, e.created_at,
         e.category_id, c.name AS category_name
  FROM expenses e JOIN categories c ON c.id = e.category_id`;

const shape = (r) => ({
  id: r.id,
  title: r.title,
  amount: r.amount,
  date: r.date,
  paymentMethod: r.payment_method,
  notes: r.notes,
  categoryId: r.category_id,
  categoryName: r.category_name,
  createdAt: r.created_at,
});

const SORT_COLUMNS = { date: 'e.date', amount: 'e.amount' };

// List with search, filters, sorting and pagination. Always scoped to the signed-in user.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, category, paymentMethod, startDate, endDate, minAmount, maxAmount } = req.query;
    const sortBy = SORT_COLUMNS[req.query.sortBy] ? req.query.sortBy : 'date';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const where = ['e.user_id = $1'];
    const params = [req.user.id];
    const add = (sql, value) => {
      params.push(value);
      where.push(sql.replaceAll('?', `$${params.length}`));
    };

    if (search && String(search).trim()) {
      add('(e.title ILIKE ? OR e.notes ILIKE ?)', `%${String(search).trim()}%`);
    }
    if (category) add('e.category_id = ?', parseInt(category, 10));
    if (paymentMethod) {
      if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Invalid payment method filter');
      add('e.payment_method = ?', paymentMethod);
    }
    if (startDate) {
      if (!DATE_RE.test(startDate)) throw new HttpError(400, 'startDate must be YYYY-MM-DD');
      add('e.date >= ?', startDate);
    }
    if (endDate) {
      if (!DATE_RE.test(endDate)) throw new HttpError(400, 'endDate must be YYYY-MM-DD');
      add('e.date <= ?', endDate);
    }
    if (minAmount !== undefined && minAmount !== '') add('e.amount >= ?', Number(minAmount));
    if (maxAmount !== undefined && maxAmount !== '') add('e.amount <= ?', Number(maxAmount));

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const count = await query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(e.amount), 0) AS sum
       FROM expenses e ${whereSql}`,
      params
    );

    const listParams = [...params, limit, (page - 1) * limit];
    const { rows } = await query(
      `${SELECT} ${whereSql}
       ORDER BY ${SORT_COLUMNS[sortBy]} ${order}, e.id DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    const total = count.rows[0].total;
    res.json({
      data: rows.map(shape),
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      filteredTotalAmount: count.rows[0].sum,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(`${SELECT} WHERE e.id = $1 AND e.user_id = $2`, [
      req.params.id,
      req.user.id,
    ]);
    if (!rows[0]) throw new HttpError(404, 'Expense not found');
    res.json({ data: shape(rows[0]) });
  })
);

async function assertCategory(id) {
  const c = await query('SELECT 1 FROM categories WHERE id = $1', [id]);
  if (!c.rowCount) throw new HttpError(400, 'Selected category does not exist');
}

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const v = validateExpense(req.body);
    await assertCategory(v.categoryId);
    const ins = await query(
      `INSERT INTO expenses (user_id, category_id, title, amount, date, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [req.user.id, v.categoryId, v.title, v.amount, v.date, v.paymentMethod, v.notes]
    );
    const { rows } = await query(`${SELECT} WHERE e.id = $1`, [ins.rows[0].id]);
    res.status(201).json({ data: shape(rows[0]) });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const v = validateExpense(req.body);
    await assertCategory(v.categoryId);
    const upd = await query(
      `UPDATE expenses SET category_id = $1, title = $2, amount = $3, date = $4,
              payment_method = $5, notes = $6
       WHERE id = $7 AND user_id = $8 RETURNING id`,
      [v.categoryId, v.title, v.amount, v.date, v.paymentMethod, v.notes, req.params.id, req.user.id]
    );
    if (!upd.rowCount) throw new HttpError(404, 'Expense not found');
    const { rows } = await query(`${SELECT} WHERE e.id = $1`, [upd.rows[0].id]);
    res.json({ data: shape(rows[0]) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const del = await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (!del.rowCount) throw new HttpError(404, 'Expense not found');
    res.json({ message: 'Expense deleted' });
  })
);

export default router;
