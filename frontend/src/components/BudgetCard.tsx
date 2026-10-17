import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { budgetApi } from '../api';
import type { BudgetSummary } from '../types';
import { STATUS_META, errorMessage, formatCurrency, formatMonth } from '../utils/format';

const PROGRESS_COLOR = { within: 'success', approaching: 'warning', over: 'error', 'no-budget': 'inherit' } as const;

interface Props {
  summary: BudgetSummary;
  onUpdated: (summary: BudgetSummary) => void;
}

export default function BudgetCard({ summary, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(summary.budget !== null ? String(summary.budget) : '');
      setError('');
    }
  }, [open, summary.budget]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(value);
    if (value === '' || !Number.isFinite(amount) || amount < 0) {
      setError('Enter a budget of 0 or more');
      return;
    }
    setSaving(true);
    try {
      onUpdated(await budgetApi.set(summary.month, amount));
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const meta = STATUS_META[summary.status];
  const percent = Math.min(summary.percentUsed ?? 0, 100);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6">Budget for {formatMonth(summary.month)}</Typography>
            <Chip label={meta.label} color={meta.color} size="small" sx={{ mt: 0.5 }} />
          </Box>
          <Button variant="outlined" onClick={() => setOpen(true)}>
            {summary.budget === null ? 'Set budget' : 'Update budget'}
          </Button>
        </Box>

        {summary.budget === null ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Set a monthly budget to see how much you have left to spend.
          </Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={percent}
              color={PROGRESS_COLOR[summary.status]}
              sx={{ height: 10, borderRadius: 5 }}
              aria-label={`${summary.percentUsed}% of budget used`}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2">
                {formatCurrency(summary.spent)} of {formatCurrency(summary.budget)} ({summary.percentUsed}%)
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600 }}
                color={summary.remaining !== null && summary.remaining < 0 ? 'error' : 'text.primary'}
              >
                {summary.remaining !== null && summary.remaining < 0
                  ? `${formatCurrency(Math.abs(summary.remaining))} over`
                  : `${formatCurrency(summary.remaining ?? 0)} left`}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>

      <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle>Budget for {formatMonth(summary.month)}</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Monthly budget"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' } }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save budget'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Card>
  );
}
