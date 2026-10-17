import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, currentMonth, monthRange } from '../utils.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get(
  '/insights',
  asyncHandler(async (_req, res) => {
    const [start, next] = monthRange(currentMonth());

    const [users, expenses, monthly, perCategory, recentExpenses, recentUsers] = await Promise.all([
      query('SELECT COUNT(*)::int AS n FROM users'),
      query('SELECT COUNT(*)::int AS n, COALESCE(SUM(amount), 0) AS total FROM expenses'),
      query('SELECT COUNT(*)::int AS n FROM expenses WHERE date >= $1 AND date < $2', [start, next]),
      query(
        `SELECT c.id, c.name, COUNT(e.id)::int AS count, COALESCE(SUM(e.amount), 0) AS total
         FROM categories c LEFT JOIN expenses e ON e.category_id = c.id
         GROUP BY c.id`
      ),
      query(
        `SELECT e.id, e.title, e.amount, e.date, e.created_at, c.name AS category_name, u.name AS user_name
         FROM expenses e JOIN categories c ON c.id = e.category_id JOIN users u ON u.id = e.user_id
         ORDER BY e.created_at DESC, e.id DESC LIMIT 5`
      ),
      query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT 5'),
    ]);

    const cats = perCategory.rows.map((r) => ({
      categoryId: r.id,
      categoryName: r.name,
      count: r.count,
      total: r.total,
    }));
    const byUsage = [...cats].sort((a, b) => b.count - a.count || a.categoryName.localeCompare(b.categoryName));

    res.json({
      data: {
        totalUsers: users.rows[0].n,
        totalExpenses: expenses.rows[0].n,
        totalExpenseValue: expenses.rows[0].total,
        expensesThisMonth: monthly.rows[0].n,
        spendingPerCategory: [...cats].sort((a, b) => b.total - a.total),
        topCategories: byUsage.slice(0, 5),
        bottomCategories: [...byUsage].reverse().slice(0, 5),
        recentExpenses: recentExpenses.rows.map((r) => ({
          id: r.id,
          title: r.title,
          amount: r.amount,
          date: r.date,
          createdAt: r.created_at,
          categoryName: r.category_name,
          userName: r.user_name,
        })),
        recentUsers: recentUsers.rows.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          createdAt: r.created_at,
        })),
      },
    });
  })
);

export default router;
