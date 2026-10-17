import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, MONTH_RE, currentMonth, monthRange, budgetStatus } from '../utils.js';

const router = Router();
router.use(requireAuth);

export async function getBudgetSummary(userId, month) {
  const [start, next] = monthRange(month);
  const [b, s] = await Promise.all([
    query('SELECT amount FROM budgets WHERE user_id = $1 AND month = $2', [userId, month]),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS spent FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, start, next]
    ),
  ]);
  const budget = b.rows[0]?.amount ?? null;
  const spent = s.rows[0].spent;
  return {
    month,
    budget,
    spent,
    remaining: budget === null ? null : Number((budget - spent).toFixed(2)),
    percentUsed: budget ? Number(((spent / budget) * 100).toFixed(1)) : null,
    status: budgetStatus(spent, budget),
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || currentMonth();
    if (!MONTH_RE.test(month)) throw new HttpError(400, 'month must be YYYY-MM');
    res.json({ data: await getBudgetSummary(req.user.id, month) });
  })
);

// Create or update the budget for a month.
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.body.month || currentMonth();
    const amount = Number(req.body.amount);
    if (!MONTH_RE.test(month)) throw new HttpError(400, 'month must be YYYY-MM');
    if (!Number.isFinite(amount) || amount < 0) throw new HttpError(400, 'Budget must be zero or more');
    await query(
      `INSERT INTO budgets (user_id, month, amount) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, month) DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()`,
      [req.user.id, month, amount]
    );
    res.json({ data: await getBudgetSummary(req.user.id, month) });
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || currentMonth();
    if (!MONTH_RE.test(month)) throw new HttpError(400, 'month must be YYYY-MM');
    await query('DELETE FROM budgets WHERE user_id = $1 AND month = $2', [req.user.id, month]);
    res.json({ data: await getBudgetSummary(req.user.id, month) });
  })
);

export default router;
