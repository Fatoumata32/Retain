import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { adminApi } from '../api';
import { CardGrid, ErrorAlert, PageHeader, StatCard } from '../components/common';
import type { AdminInsights, CategoryUsage } from '../types';
import { errorMessage, formatCurrency, formatDate, formatDateTime } from '../utils/format';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <TableContainer>{children}</TableContainer>
      </CardContent>
    </Card>
  );
}

function UsageTable({ rows, label }: { rows: CategoryUsage[]; label: string }) {
  return (
    <Table size="small" aria-label={label}>
      <TableHead>
        <TableRow>
          <TableCell>Category</TableCell>
          <TableCell align="right">Expenses</TableCell>
          <TableCell align="right">Total</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.categoryId}>
            <TableCell>{r.categoryName}</TableCell>
            <TableCell align="right">{r.count}</TableCell>
            <TableCell align="right">{formatCurrency(r.total)}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} align="center">
              No data yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function AdminInsightsPage() {
  const [data, setData] = useState<AdminInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminApi.insights());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Platform insights" subtitle="Usage across all users" />
      {error && <ErrorAlert message={error} onRetry={load} />}
      {loading && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading insights" />
        </Box>
      ) : (
        data && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <CardGrid min={200}>
              <StatCard label="Registered users" value={data.totalUsers} />
              <StatCard label="Expenses recorded" value={data.totalExpenses} />
              <StatCard label="Total value" value={formatCurrency(data.totalExpenseValue)} />
              <StatCard label="Expenses this month" value={data.expensesThisMonth} />
            </CardGrid>

            <Section title="Total spending per category">
              <UsageTable rows={data.spendingPerCategory} label="Spending per category" />
            </Section>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <Section title="Top 5 most-used categories">
                <UsageTable rows={data.topCategories} label="Most used categories" />
              </Section>
              <Section title="Bottom 5 least-used categories">
                <UsageTable rows={data.bottomCategories} label="Least used categories" />
              </Section>
            </Box>

            <Section title="Recently added expenses">
              <Table size="small" aria-label="Recent expenses">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.title}</TableCell>
                      <TableCell>{e.userName}</TableCell>
                      <TableCell>{e.categoryName}</TableCell>
                      <TableCell>{formatDate(e.date)}</TableCell>
                      <TableCell align="right">{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {data.recentExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No expenses yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Section>

            <Section title="Recently registered users">
              <Table size="small" aria-label="Recent users">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip label={u.role} size="small" color={u.role === 'admin' ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell>{formatDateTime(u.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>
          </Box>
        )
      )}
    </>
  );
}
