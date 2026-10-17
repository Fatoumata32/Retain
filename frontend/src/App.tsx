import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Layout from './components/Layout';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import { SignInPage, SignUpPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin screens are only needed by admins, so they are loaded on demand.
const AdminInsightsPage = lazy(() => import('./pages/AdminInsightsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));

const fallback = (
  <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
    <CircularProgress aria-label="Loading" />
  </Box>
);

export default function App() {
  return (
    <Suspense fallback={fallback}>
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      {/* Everything below requires a signed-in user (checked via AuthContext). */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="expenses/:id" element={<ExpenseDetailPage />} />

          {/* Admin-only area (role checked via AuthContext). */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminInsightsPage />} />
            <Route path="admin/categories" element={<AdminCategoriesPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  );
}
