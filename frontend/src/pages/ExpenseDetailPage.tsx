import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { expensesApi } from '../api';
import ExpenseForm from '../components/ExpenseForm';
import { ConfirmDialog, ErrorAlert, PageHeader } from '../components/common';
import type { Expense } from '../types';
import { errorMessage, formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { useCategories } from '../utils/useCategories';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography component="div" sx={{ wordBreak: 'break-word' }}>
        {children}
      </Typography>
    </Box>
  );
}

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      setError('Expense not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setExpense(await expensesApi.get(numericId));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!expense) return;
    setBusy(true);
    try {
      await expensesApi.remove(expense.id);
      navigate('/expenses', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setConfirmDelete(false);
      setBusy(false);
    }
  };

  return (
    <>
      <Button component={RouterLink} to="/expenses" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
        Back to expenses
      </Button>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading expense" />
        </Box>
      ) : error || !expense ? (
        <ErrorAlert message={error || 'Expense not found'} />
      ) : (
        <>
          <PageHeader
            title={expense.title}
            subtitle={formatDate(expense.date)}
            actions={
              <>
                <Button variant="contained" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button color="error" variant="outlined" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </>
            }
          />
          <Card>
            <CardContent>
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Field label="Amount">
                  <Typography variant="h5" component="span">
                    {formatCurrency(expense.amount)}
                  </Typography>
                </Field>
                <Field label="Category">
                  <Chip label={expense.categoryName} />
                </Field>
                <Field label="Payment method">{expense.paymentMethod}</Field>
                <Field label="Recorded on">{formatDateTime(expense.createdAt)}</Field>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Field label="Notes">{expense.notes || <em>No notes</em>}</Field>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <ExpenseForm
            open={editing}
            categories={categories}
            expense={expense}
            onClose={() => setEditing(false)}
            onSaved={(saved) => {
              setExpense(saved);
              setEditing(false);
            }}
          />
          <ConfirmDialog
            open={confirmDelete}
            title="Delete expense?"
            message="This expense will be permanently removed."
            loading={busy}
            onConfirm={handleDelete}
            onClose={() => setConfirmDelete(false)}
          />
        </>
      )}
    </>
  );
}
