import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.created_at,
});

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name) throw new HttpError(400, 'Name is required');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'A valid email is required');
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

    const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) throw new HttpError(409, 'An account with this email already exists');

    const hash = await bcrypt.hash(password, 10);
    // Public sign-up always creates a regular user; admins are seeded server-side.
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'user') RETURNING *`,
      [name, email, hash]
    );
    res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
  })
);

router.post(
  '/signin',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) throw new HttpError(401, 'User no longer exists');
    res.json({ user: publicUser(rows[0]) });
  })
);

export default router;
