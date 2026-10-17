export type Role = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export const PAYMENT_METHODS = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Category {
  id: number;
  name: string;
  isDefault: boolean;
  expenseCount: number;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes: string | null;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  categoryId: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filteredTotalAmount: number;
}

export type BudgetStatus = 'within' | 'approaching' | 'over' | 'no-budget';

export interface BudgetSummary {
  month: string; // YYYY-MM
  budget: number | null;
  spent: number;
  remaining: number | null;
  percentUsed: number | null;
  status: BudgetStatus;
}

export interface CategorySpend {
  categoryId: number;
  categoryName: string;
  total: number;
  count: number;
}

export interface DashboardData extends BudgetSummary {
  highestExpense: {
    id: number;
    title: string;
    amount: number;
    date: string;
    categoryName: string;
  } | null;
  spendingByCategory: CategorySpend[];
  recentExpenses: Array<{
    id: number;
    title: string;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    categoryName: string;
  }>;
}

export interface CategoryUsage {
  categoryId: number;
  categoryName: string;
  count: number;
  total: number;
}

export interface AdminInsights {
  totalUsers: number;
  totalExpenses: number;
  totalExpenseValue: number;
  expensesThisMonth: number;
  spendingPerCategory: CategoryUsage[];
  topCategories: CategoryUsage[];
  bottomCategories: CategoryUsage[];
  recentExpenses: Array<{
    id: number;
    title: string;
    amount: number;
    date: string;
    createdAt: string;
    categoryName: string;
    userName: string;
  }>;
  recentUsers: User[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type SortBy = 'date' | 'amount';
export type SortOrder = 'asc' | 'desc';

export interface ExpenseFilters {
  search: string;
  category: number | null;
  paymentMethod: PaymentMethod | '';
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortBy;
  order: SortOrder;
  page: number;
  limit: number;
}
