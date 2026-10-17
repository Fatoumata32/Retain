import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, MONTH_RE, currentMonth, monthRange } from '../utils.js';
import { getBudgetSummary } from './budgets.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || currentMonth();
    if (!MONTH_RE.test(month)) throw new HttpError(400, 'month must be YYYY-MM');
    const [start, next] = monthRange(month);
    const uid = req.user.id;

    const [summary, highest, byCategory, recent] = await Promise.all([
      getBudgetSummary(uid, month),
      query(
        `SELECT e.id, e.title, e.amount, e.date, c.name AS category_name
         FROM expenses e JOIN categories c ON c.id = e.category_id
         WHERE e.user_id = $1 AND e.date >= $2 AND e.date < $3
         ORDER BY e.amount DESC, e.id DESC LIMIT 1`,
        [uid, start, next]
      ),
      query(
        `SELECT c.id AS category_id, c.name AS category_name, SUM(e.amount) AS total, COUNT(*)::int AS count
         FROM expenses e JOIN categories c ON c.id = e.category_id
         WHERE e.user_id = $1 AND e.date >= $2 AND e.date < $3
         GROUP BY c.id ORDER BY total DESC`,
        [uid, start, next]
      ),
      query(
        `SELECT e.id, e.title, e.amount, e.date, e.payment_method, c.name AS category_name
         FROM expenses e JOIN categories c ON c.id = e.category_id
         WHERE e.user_id = $1 AND e.date >= $2 AND e.date < $3
         ORDER BY e.date DESC, e.id DESC LIMIT 5`,
        [uid, start, next]
      ),
    ]);

    const h = highest.rows[0];
    res.json({
      data: {
        ...summary,
        highestExpense: h
          ? { id: h.id, title: h.title, amount: h.amount, date: h.date, categoryName: h.category_name }
          : null,
        spendingByCategory: byCategory.rows.map((r) => ({
          categoryId: r.category_id,
          categoryName: r.category_name,
          total: r.total,
          count: r.count,
        })),
        recentExpenses: recent.rows.map((r) => ({
          id: r.id,
          title: r.title,
          amount: r.amount,
          date: r.date,
          paymentMethod: r.payment_method,
          categoryName: r.category_name,
        })),
      },
    });
  })
);

export default router;
