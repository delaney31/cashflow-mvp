import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../api/http';
import { useApiConfig } from '../api/ApiContext';

export function useCategoriesQuery() {
  const { token } = useApiConfig();
  return useQuery({
    queryKey: ['categories', token],
    queryFn: () => fetchCategories(token),
    enabled: !!token,
    staleTime: 120_000,
  });
}
