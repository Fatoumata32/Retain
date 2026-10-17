import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { dashboardApi } from '../api';
import BudgetCard from '../components/BudgetCard';
import ExpenseForm from '../components/ExpenseForm';
import { CardGrid, EmptyState, ErrorAlert, PageHeader, StatCard } from '../components/common';
import { useAuth } from '../context/AuthContext';
import type { BudgetSummary, DashboardData } from '../types';
import { currentMonth, errorMessage, formatCurrency, formatDate, formatMonth } from '../utils/format';
import { useCategories } from '../utils/useCategories';

export default function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const { categories } = useCategories();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await dashboardApi.get(month));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleBudgetUpdated = (summary: BudgetSummary) => {
    setData((prev) => (prev ? { ...prev, ...summary } : prev));
  };

  const maxCategory = data ? Math.max(...data.spendingByCategory.map((c) => c.total), 1) : 1;
  const overBudget = data !== null && data.remaining !== null && data.remaining < 0;

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name.split(' ')[0] ?? ''}`}
        subtitle={`Your spending for ${formatMonth(month)}`}
        actions={
          <>
            <TextField
              label="Month"
              type="month"
              size="small"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
              Add expense
            </Button>
          </>
        }
      />

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading dashboard" />
        </Box>
      ) : (
        data && (
          <Box sx={{ display: 'grid', gap: 2, opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}>
            <CardGrid>
              <StatCard label="Total spent" value={formatCurrency(data.spent)} />
              <StatCard
                label="Remaining budget"
                value={data.remaining === null ? '—' : formatCurrency(data.remaining)}
                hint={data.remaining === null ? 'No budget set' : overBudget ? 'You are over budget' : undefined}
                color={overBudget ? 'error.main' : undefined}
              />
              <StatCard
                label="Highest expense"
                value={data.highestExpense ? formatCurrency(data.highestExpense.amount) : '—'}
                hint={
                  data.highestExpense
                    ? `${data.highestExpense.title} · ${data.highestExpense.categoryName}`
                    : 'No expenses this month'
                }
              />
            </CardGrid>

            <BudgetCard summary={data} onUpdated={handleBudgetUpdated} />

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Spending by category
                  </Typography>
                  {data.spendingByCategory.length === 0 ? (
                    <EmptyState title="Nothing spent yet" message="Add an expense to see the breakdown." />
                  ) : (
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      {data.spendingByCategory.map((c) => (
                        <Box key={c.categoryId}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="body2">{c.categoryName}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(c.total)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(c.total / maxCategory) * 100}
                            sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                            aria-label={`${c.categoryName} spending`}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Recent expenses</Typography>
                    <Button component={RouterLink} to="/expenses" size="small">
                      View all
                    </Button>
                  </Box>
                  {data.recentExpenses.length === 0 ? (
                    <EmptyState title="No expenses this month" />
                  ) : (
                    <List disablePadding>
                      {data.recentExpenses.map((e) => (
                        <ListItem
                          key={e.id}
                          disableGutters
                          divider
                          secondaryAction={<Typography sx={{ fontWeight: 600 }}>{formatCurrency(e.amount)}</Typography>}
                        >
                          <ListItemText
                            primary={
                              <Typography component={RouterLink} to={`/expenses/${e.id}`} sx={{ color: 'inherit' }}>
                                {e.title}
                              </Typography>
                            }
                            secondary={
                              <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                {formatDate(e.date)}
                                <Chip label={e.categoryName} size="small" />
                              </Box>
                            }
                            slotProps={{ secondary: { component: 'div' } }}
                            sx={{ pr: 9 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        )
      )}

      <ExpenseForm
        open={formOpen}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          void load();
        }}
      />
    </>
  );
}
