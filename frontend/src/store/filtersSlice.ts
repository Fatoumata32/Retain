import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ExpenseFilters, SortBy, SortOrder } from '../types';

export const initialFilters: ExpenseFilters = {
  search: '',
  category: null,
  paymentMethod: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  order: 'desc',
  page: 1,
  limit: 10,
};

type FilterField = Exclude<keyof ExpenseFilters, 'page' | 'limit' | 'sortBy' | 'order'>;

/**
 * All expense searching, filtering, sorting and pagination state lives here.
 * Changing any filter sends the user back to page 1.
 */
const filtersSlice = createSlice({
  name: 'filters',
  initialState: initialFilters,
  reducers: {
    setFilter<K extends FilterField>(
      state: ExpenseFilters,
      action: PayloadAction<{ field: K; value: ExpenseFilters[K] }>
    ) {
      state[action.payload.field] = action.payload.value;
      state.page = 1;
    },
    setSort(state, action: PayloadAction<{ sortBy: SortBy; order: SortOrder }>) {
      state.sortBy = action.payload.sortBy;
      state.order = action.payload.order;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload;
      state.page = 1;
    },
    resetFilters(state) {
      return { ...initialFilters, limit: state.limit };
    },
  },
});

export const { setFilter, setSort, setPage, setLimit, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
