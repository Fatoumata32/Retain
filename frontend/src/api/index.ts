import { request } from './client';
import type {
  AdminInsights,
  AuthResponse,
  BudgetSummary,
  Category,
  DashboardData,
  Expense,
  ExpenseFilters,
  ExpenseInput,
  Paginated,
  User,
} from '../types';

export const authApi = {
  signUp: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: { name, email, password } }),
  signIn: (email: string, password: string) =>
    request<AuthResponse>('/auth/signin', { method: 'POST', body: { email, password } }),
  me: () => request<{ user: User }>('/auth/me'),
};

export const expensesApi = {
  list: (f: ExpenseFilters) =>
    request<Paginated<Expense>>('/expenses', {
      params: {
        search: f.search.trim(),
        category: f.category,
        paymentMethod: f.paymentMethod,
        startDate: f.startDate,
        endDate: f.endDate,
        minAmount: f.minAmount,
        maxAmount: f.maxAmount,
        sortBy: f.sortBy,
        order: f.order,
        page: f.page,
        limit: f.limit,
      },
    }),
  get: (id: number) => request<{ data: Expense }>(`/expenses/${id}`).then((r) => r.data),
  create: (input: ExpenseInput) =>
    request<{ data: Expense }>('/expenses', { method: 'POST', body: input }).then((r) => r.data),
  update: (id: number, input: ExpenseInput) =>
    request<{ data: Expense }>(`/expenses/${id}`, { method: 'PUT', body: input }).then((r) => r.data),
  remove: (id: number) => request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  list: () => request<{ data: Category[] }>('/categories').then((r) => r.data),
  create: (name: string) =>
    request<{ data: Category }>('/categories', { method: 'POST', body: { name } }).then((r) => r.data),
  update: (id: number, name: string) =>
    request<{ data: Category }>(`/categories/${id}`, { method: 'PUT', body: { name } }).then((r) => r.data),
  remove: (id: number) =>
    request<{ message: string; reassignedExpenses: number }>(`/categories/${id}`, { method: 'DELETE' }),
};

export const budgetApi = {
  get: (month: string) =>
    request<{ data: BudgetSummary }>('/budgets', { params: { month } }).then((r) => r.data),
  set: (month: string, amount: number) =>
    request<{ data: BudgetSummary }>('/budgets', { method: 'PUT', body: { month, amount } }).then(
      (r) => r.data
    ),
};

export const dashboardApi = {
  get: (month: string) =>
    request<{ data: DashboardData }>('/dashboard', { params: { month } }).then((r) => r.data),
};

export const adminApi = {
  insights: () => request<{ data: AdminInsights }>('/admin/insights').then((r) => r.data),
};
