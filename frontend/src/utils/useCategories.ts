import { useCallback, useEffect, useState } from 'react';
import { categoriesApi } from '../api';
import type { Category } from '../types';
import { errorMessage } from './format';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await categoriesApi.list());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, loading, error, reload };
}
