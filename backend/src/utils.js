export const PAYMENT_METHODS = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Other'];

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/** Returns [firstDay, firstDayOfNextMonth] as YYYY-MM-DD strings. */
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return [start, next];
}

export function budgetStatus(spent, budget) {
  if (!budget || budget <= 0) return 'no-budget';
  const ratio = spent / budget;
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'approaching';
  return 'within';
}

/** Wraps async route handlers so rejections reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function validateExpense(body) {
  const errors = [];
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const amount = Number(body.amount);
  const categoryId = Number(body.categoryId);
  const paymentMethod = body.paymentMethod;
  const date = body.date;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

  if (!title) errors.push('Title is required');
  if (title.length > 150) errors.push('Title must be at most 150 characters');
  if (!Number.isFinite(amount) || amount <= 0) errors.push('Amount must be a positive number');
  if (!Number.isInteger(categoryId) || categoryId <= 0) errors.push('A valid category is required');
  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.push('Invalid payment method');
  if (typeof date !== 'string' || !DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    errors.push('Date must be in YYYY-MM-DD format');
  }
  if (errors.length) throw new HttpError(400, errors.join('. '));

  return { title, amount, categoryId, paymentMethod, date, notes: notes || null };
}
