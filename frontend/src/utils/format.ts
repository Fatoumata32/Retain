import type { BudgetStatus } from '../types';

const currency = import.meta.env.VITE_CURRENCY ?? 'USD';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

/** Parses a YYYY-MM-DD string as a local date (avoids UTC off-by-one). */
export function formatDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const currentMonth = (): string => todayISO().slice(0, 7);

export const formatMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

export const STATUS_META: Record<
  BudgetStatus,
  { label: string; color: 'success' | 'warning' | 'error' | 'default' }
> = {
  within: { label: 'Within budget', color: 'success' },
  approaching: { label: 'Approaching limit', color: 'warning' },
  over: { label: 'Over budget', color: 'error' },
  'no-budget': { label: 'No budget set', color: 'default' },
};

export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Something went wrong';
