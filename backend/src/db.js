import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool, types } = pg;

// Return DATE columns as plain 'YYYY-MM-DD' strings and NUMERIC as numbers.
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => parseFloat(v));
types.setTypeParser(20, (v) => parseInt(v, 10));

export const DEFAULT_CATEGORY_NAME = 'Uncategorized';
export const STARTER_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Entertainment',
  'Shopping',
  'Education',
];

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const query = (text, params) => pool.query(text, params);

export async function initDb() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const schema = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8');
  await pool.query(schema);

  // Default category used when a category with expenses is deleted.
  await pool.query(
    `INSERT INTO categories (name, is_default) VALUES ($1, TRUE)
     ON CONFLICT (name) DO UPDATE SET is_default = TRUE`,
    [DEFAULT_CATEGORY_NAME]
  );

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM categories');
  if (rows[0].n <= 1) {
    for (const name of STARTER_CATEGORIES) {
      await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
    }
  }

  // Seed / refresh the admin account from environment variables.
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash`,
      [ADMIN_NAME || 'Retain Admin', ADMIN_EMAIL.toLowerCase(), hash]
    );
  }
}
