# Retain: Personal Expense & Budget Manager

Retain lets people record expenses, search and filter them, set a monthly budget and see where their money goes. Admins manage expense categories and see platform-wide insights.

**Live application:** https://retain-one.vercel.app
**API:** https://retain-ws4p.onrender.com/api

## Technologies

| Layer | Stack |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Material-UI, React Router |
| State | **React Context** for authentication and roles, **Redux Toolkit** for expense search, filter, sort and pagination |
| Backend | Node.js, Express, `pg`, JSON Web Tokens, bcrypt |
| Database | PostgreSQL |

## Main features

- **Authentication** (React Context): sign up, sign in, sign out, user roles, protected routes, session restore from a stored token.
- **Expenses**: create, view, edit and delete your own expenses (title, amount, category, date, payment method, optional notes), with server-side pagination.
- **Search, filter and sort** (Redux): text search, category, payment method, date range, amount range, sort by date or amount.
- **Monthly budget**: set or update a budget per month and see spent, remaining and a status of *within*, *approaching* (80% or more) or *over* budget.
- **Dashboard**: total spent, remaining budget, highest expense, spending by category, recent expenses, for any selected month.
- **Admin dashboard** (admin role only, guarded by a Context-based route): create, rename and delete categories, plus platform insights (users, expenses, totals, per-category spending, top 5 and bottom 5 categories, recent expenses and users).
- **Responsive UI**: table on desktop, cards on mobile, navigation drawer on small screens.

### Deleting a category

The database always contains a protected default category, **Uncategorized**. When an admin deletes a category that has expenses, those expenses are moved to Uncategorized in a single transaction. The default category cannot be renamed or deleted.

## Project structure

```
retain/
├── backend/
│   └── src/
│       ├── index.js            # app setup, CORS, error handler
│       ├── db.js               # pool, schema bootstrap, seed (default category, admin)
│       ├── schema.sql
│       ├── middleware/auth.js  # JWT verification, requireAdmin
│       └── routes/             # auth, expenses, budgets, categories, dashboard, admin
└── frontend/
    └── src/
        ├── api/                # fetch client and typed endpoint functions
        ├── context/            # AuthContext
        ├── store/              # Redux store and filters slice
        ├── components/         # layout, route guards, forms, filters, budget card
        ├── pages/              # dashboard, expenses, detail, auth, admin
        └── types/              # shared TypeScript types
```

## Local setup

Requirements: Node.js 18 or newer and a PostgreSQL database.

### 1. Database

```bash
createdb retain
```

Tables are created automatically when the API starts.

### 2. Backend

```bash
cd backend
cp .env.example .env     # then edit DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run dev              # http://localhost:4000
```

On startup the API creates the tables, the **Uncategorized** default category, some starter categories, and the admin account defined by `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Public sign-up always creates a regular user; admin accounts only come from these variables.

### 3. Frontend

```bash
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
```

Sign in with the admin credentials to see the Insights and Categories pages, or sign up for a regular account.

### Environment variables

| Where | Variable | Purpose |
| --- | --- | --- |
| backend | `DATABASE_URL` | PostgreSQL connection string |
| backend | `DATABASE_SSL` | `true` for hosted databases that require SSL |
| backend | `JWT_SECRET` | Secret used to sign tokens (required) |
| backend | `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| backend | `CLIENT_ORIGIN` | Allowed frontend origin(s) for CORS, comma separated |
| backend | `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account seeded on startup |
| frontend | `VITE_API_URL` | API base URL including `/api` |
| frontend | `VITE_CURRENCY` | ISO currency code for display, default `USD` |

## API reference

All routes are under `/api`. Except for sign-up and sign-in, requests need an `Authorization: Bearer <token>` header. Errors return `{ "message": "..." }` with a suitable status (400, 401, 403, 404, 409, 500).

### Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/signup` | `{ name, email, password }` creates a user and returns `{ token, user }` |
| POST | `/auth/signin` | `{ email, password }` returns `{ token, user }` |
| GET | `/auth/me` | Current user |

### Expenses (always scoped to the signed-in user)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/expenses` | List with filters and pagination (see below) |
| GET | `/expenses/:id` | One expense |
| POST | `/expenses` | `{ title, amount, categoryId, date, paymentMethod, notes? }` |
| PUT | `/expenses/:id` | Same body as POST |
| DELETE | `/expenses/:id` | Delete |

Query parameters for `GET /expenses`: `search`, `category` (id), `paymentMethod`, `startDate`, `endDate` (`YYYY-MM-DD`), `minAmount`, `maxAmount`, `sortBy` (`date` or `amount`), `order` (`asc` or `desc`), `page`, `limit` (max 100). The response is `{ data, page, limit, total, totalPages, filteredTotalAmount }`.

Payment methods: `Cash`, `Card`, `Mobile Money`, `Bank Transfer`, `Other`.

### Budgets

| Method | Path | Description |
| --- | --- | --- |
| GET | `/budgets?month=YYYY-MM` | Budget, spent, remaining, percent used and status for the month |
| PUT | `/budgets` | `{ month, amount }` creates or updates the month's budget |
| DELETE | `/budgets?month=YYYY-MM` | Remove the budget |

### Dashboard

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard?month=YYYY-MM` | Budget summary, highest expense, spending by category, 5 recent expenses |

### Categories

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/categories` | any user | All categories with expense counts |
| POST | `/categories` | admin | `{ name }` |
| PUT | `/categories/:id` | admin | `{ name }` |
| DELETE | `/categories/:id` | admin | Moves its expenses to Uncategorized, then deletes |

### Admin

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/insights` | Totals, per-category spending, top 5 and bottom 5 categories, recent expenses and users |

## Security notes

- Passwords are hashed with bcrypt; sessions use signed JWTs.
- Every expense and budget query includes the signed-in user's id, so users cannot read or change each other's data (other users' ids return 404).
- Admin endpoints check the role on the server in addition to the client-side route guard.
- All SQL uses parameterised queries.

## Deployment

Any host works. This setup uses free tiers:

1. **Database and API on Render.** Push the repo to GitHub, then create a Blueprint from `render.yaml`. It provisions Postgres and the API. In the Render dashboard set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `CLIENT_ORIGIN` (your frontend URL). Check `https://<api>/api/health`.
2. **Frontend on Vercel or Netlify.** Set the root directory to `frontend`, build command `npm run build`, output directory `dist`, and the environment variable `VITE_API_URL=https://<api>/api`. `vercel.json` and `public/_redirects` already provide the single-page-app rewrite.
3. Put both URLs at the top of this README.

## Scripts

| Folder | Command | Purpose |
| --- | --- | --- |
| backend | `npm run dev` / `npm start` | Run the API |
| frontend | `npm run dev` | Dev server |
| frontend | `npm run build` | Typecheck and production build |
