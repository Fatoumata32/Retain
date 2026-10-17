import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import { expensesApi } from '../api';
import ExpenseFilters from '../components/ExpenseFilters';
import ExpenseForm from '../components/ExpenseForm';
import { ConfirmDialog, EmptyState, ErrorAlert, PageHeader } from '../components/common';
import { useAppDispatch, useAppSelector } from '../store';
import { setLimit, setPage } from '../store/filtersSlice';
import type { Expense, Paginated } from '../types';
import { errorMessage, formatCurrency, formatDate } from '../utils/format';
import { useCategories } from '../utils/useCategories';
import { useDebounce } from '../utils/useDebounce';

export default function ExpensesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.filters);
  // Debounce so typing in the search box doesn't fire a request per keystroke.
  const debounced = useDebounce(filters, 300);

  const { categories } = useCategories();
  const [result, setResult] = useState<Paginated<Expense> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    expensesApi
      .list(debounced)
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setToast(editing ? 'Expense updated' : 'Expense added');
    reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await expensesApi.remove(deleting.id);
      setDeleting(null);
      setToast('Expense deleted');
      // If that was the last item on the page, step back one page.
      if (result && result.data.length === 1 && filters.page > 1) dispatch(setPage(filters.page - 1));
      else reload();
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const actions = (e: Expense) => (
    <>
      <Tooltip title="Edit">
        <IconButton aria-label={`Edit ${e.title}`} onClick={() => openEdit(e)} size="small">
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton aria-label={`Delete ${e.title}`} onClick={() => setDeleting(e)} size="small" color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );

  const items = result?.data ?? [];

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={
          result
            ? `${result.total} expense${result.total === 1 ? '' : 's'} · ${formatCurrency(result.filteredTotalAmount)} total`
            : undefined
        }
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add expense
          </Button>
        }
      />

      <ExpenseFilters categories={categories} />

      {error && <ErrorAlert message={error} onRetry={reload} />}

      <Box sx={{ position: 'relative', opacity: loading && result ? 0.6 : 1, transition: 'opacity .2s' }}>
        {loading && !result ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress aria-label="Loading expenses" />
          </Box>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              title="No expenses found"
              message="Try changing your filters, or add a new expense."
              action={
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                  Add expense
                </Button>
              }
            />
          </Card>
        ) : isMobile ? (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {items.map((e) => (
              <Card key={e.id}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography
                      component={RouterLink}
                      to={`/expenses/${e.id}`}
                      sx={{ fontWeight: 600, color: 'inherit', wordBreak: 'break-word' }}
                    >
                      {e.title}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>{formatCurrency(e.amount)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(e.date)} · {e.paymentMethod}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Chip label={e.categoryName} size="small" />
                    <Box>{actions(e)}</Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table aria-label="Expenses">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>
                      <Typography component={RouterLink} to={`/expenses/${e.id}`} sx={{ color: 'inherit' }}>
                        {e.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={e.categoryName} size="small" />
                    </TableCell>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>{e.paymentMethod}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell align="right">{actions(e)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {result && result.total > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            select
            size="small"
            label="Per page"
            value={filters.limit}
            onChange={(e) => dispatch(setLimit(Number(e.target.value)))}
            sx={{ minWidth: 110 }}
          >
            {[5, 10, 25, 50].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
          <Pagination
            count={result.totalPages}
            page={filters.page}
            onChange={(_, p) => dispatch(setPage(p))}
            color="primary"
            siblingCount={isMobile ? 0 : 1}
          />
        </Box>
      )}

      <ExpenseForm
        open={formOpen}
        categories={categories}
        expense={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete expense?"
        message={deleting ? `"${deleting.title}" (${formatCurrency(deleting.amount)}) will be permanently removed.` : ''}
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
      <Snackbar open={toast !== ''} autoHideDuration={3000} onClose={() => setToast('')}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}
