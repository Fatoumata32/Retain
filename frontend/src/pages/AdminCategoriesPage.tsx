import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import { categoriesApi } from '../api';
import { ConfirmDialog, ErrorAlert, PageHeader } from '../components/common';
import type { Category } from '../types';
import { errorMessage } from '../utils/format';
import { useCategories } from '../utils/useCategories';

export default function AdminCategoriesPage() {
  const { categories, loading, error, reload } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (dialogOpen) {
      setName(editing?.name ?? '');
      setFormError('');
    }
  }, [dialogOpen, editing]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setFormError('Category name is required');
    setSaving(true);
    setFormError('');
    try {
      if (editing) await categoriesApi.update(editing.id, name.trim());
      else await categoriesApi.create(name.trim());
      setDialogOpen(false);
      setToast(editing ? 'Category updated' : 'Category created');
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      const res = await categoriesApi.remove(deleting.id);
      setToast(
        res.reassignedExpenses > 0
          ? `Category deleted. ${res.reassignedExpenses} expense(s) moved to Uncategorized`
          : 'Category deleted'
      );
      setDeleting(null);
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Manage the expense categories available to every user"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add category
          </Button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={reload} />}
      {actionError && <ErrorAlert message={actionError} />}

      {loading && categories.length === 0 ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading categories" />
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table aria-label="Categories">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Expenses</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      {c.name} {c.isDefault && <Chip label="Default" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell align="right">{c.expenseCount}</TableCell>
                    <TableCell align="right">
                      {c.isDefault ? (
                        <Tooltip title="The default category can't be edited or deleted">
                          <span>
                            <IconButton size="small" disabled aria-label="Default category is locked">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title="Rename">
                            <IconButton size="small" aria-label={`Rename ${c.name}`} onClick={() => openEdit(c)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Delete ${c.name}`}
                              onClick={() => setDeleting(c)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle>{editing ? 'Rename category' : 'New category'}</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete "${deleting?.name ?? ''}"?`}
        message={
          deleting && deleting.expenseCount > 0
            ? `${deleting.expenseCount} expense(s) use this category. They will be moved to "Uncategorized".`
            : 'No expenses use this category.'
        }
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
      <Snackbar open={toast !== ''} autoHideDuration={4000} onClose={() => setToast('')}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}
