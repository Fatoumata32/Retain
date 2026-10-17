import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { expensesApi } from '../api';
import { PAYMENT_METHODS, type Category, type Expense, type PaymentMethod } from '../types';
import { errorMessage, todayISO } from '../utils/format';

interface Props {
  open: boolean;
  categories: Category[];
  /** When provided the form edits this expense, otherwise it creates a new one. */
  expense?: Expense | null;
  onClose: () => void;
  onSaved: (expense: Expense) => void;
}

interface FormState {
  title: string;
  amount: string;
  categoryId: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm = (categories: Category[]): FormState => ({
  title: '',
  amount: '',
  categoryId: String(categories.find((c) => c.isDefault)?.id ?? categories[0]?.id ?? ''),
  date: todayISO(),
  paymentMethod: 'Cash',
  notes: '',
});

const fromExpense = (e: Expense): FormState => ({
  title: e.title,
  amount: String(e.amount),
  categoryId: String(e.categoryId),
  date: e.date,
  paymentMethod: e.paymentMethod,
  notes: e.notes ?? '',
});

function validate(f: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!f.title.trim()) errors.title = 'Title is required';
  else if (f.title.length > 150) errors.title = 'Keep the title under 150 characters';
  const amount = Number(f.amount);
  if (!f.amount || !Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than 0';
  if (!f.categoryId) errors.categoryId = 'Choose a category';
  if (!f.date) errors.date = 'Date is required';
  return errors;
}

export default function ExpenseForm({ open, categories, expense, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(categories));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the dialog opens or the target expense changes.
  useEffect(() => {
    if (!open) return;
    setForm(expense ? fromExpense(expense) : emptyForm(categories));
    setErrors({});
    setSubmitError('');
  }, [open, expense, categories]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setSubmitError('');
    const input = {
      title: form.title.trim(),
      amount: Number(form.amount),
      categoryId: Number(form.categoryId),
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    };
    try {
      const saved = expense ? await expensesApi.update(expense.id, input) : await expensesApi.create(input);
      onSaved(saved);
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>{expense ? 'Edit expense' : 'Add expense'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            {submitError && (
              <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>
                {submitError}
              </Alert>
            )}
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              required
              autoFocus
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
              slotProps={{ htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' } }}
              required
            />
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              error={!!errors.date}
              helperText={errors.date}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <TextField
              select
              label="Category"
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              error={!!errors.categoryId}
              helperText={errors.categoryId}
              required
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Payment method"
              value={form.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              multiline
              minRows={2}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
