import { Box, Button, Card, CardContent, InputAdornment, MenuItem, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAppDispatch, useAppSelector } from '../store';
import { resetFilters, setFilter, setSort } from '../store/filtersSlice';
import { PAYMENT_METHODS, type Category, type PaymentMethod, type SortBy, type SortOrder } from '../types';

/** Reads and writes all search / filter / sort state through Redux. */
export default function ExpenseFilters({ categories }: { categories: Category[] }) {
  const dispatch = useAppDispatch();
  const f = useAppSelector((s) => s.filters);

  const sortValue = `${f.sortBy}:${f.order}`;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          component="form"
          role="search"
          aria-label="Filter expenses"
          onSubmit={(e) => e.preventDefault()}
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          }}
        >
          <TextField
            label="Search"
            placeholder="Title or notes"
            value={f.search}
            onChange={(e) => dispatch(setFilter({ field: 'search', value: e.target.value }))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ gridColumn: { lg: 'span 2' } }}
          />
          <TextField
            select
            label="Category"
            value={f.category === null ? '' : String(f.category)}
            onChange={(e) =>
              dispatch(setFilter({ field: 'category', value: e.target.value === '' ? null : Number(e.target.value) }))
            }
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Payment method"
            value={f.paymentMethod}
            onChange={(e) =>
              dispatch(setFilter({ field: 'paymentMethod', value: e.target.value as PaymentMethod | '' }))
            }
          >
            <MenuItem value="">All methods</MenuItem>
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="From date"
            type="date"
            value={f.startDate}
            onChange={(e) => dispatch(setFilter({ field: 'startDate', value: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To date"
            type="date"
            value={f.endDate}
            onChange={(e) => dispatch(setFilter({ field: 'endDate', value: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Min amount"
            type="number"
            value={f.minAmount}
            onChange={(e) => dispatch(setFilter({ field: 'minAmount', value: e.target.value }))}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
          />
          <TextField
            label="Max amount"
            type="number"
            value={f.maxAmount}
            onChange={(e) => dispatch(setFilter({ field: 'maxAmount', value: e.target.value }))}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
          />
          <TextField
            select
            label="Sort by"
            value={sortValue}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split(':') as [SortBy, SortOrder];
              dispatch(setSort({ sortBy, order }));
            }}
            sx={{ gridColumn: { lg: 'span 2' } }}
          >
            <MenuItem value="date:desc">Date: newest first</MenuItem>
            <MenuItem value="date:asc">Date: oldest first</MenuItem>
            <MenuItem value="amount:desc">Amount: highest first</MenuItem>
            <MenuItem value="amount:asc">Amount: lowest first</MenuItem>
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gridColumn: { lg: 'span 2' }, justifyContent: 'flex-end' }}>
            <Button onClick={() => dispatch(resetFilters())}>Clear all filters</Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
