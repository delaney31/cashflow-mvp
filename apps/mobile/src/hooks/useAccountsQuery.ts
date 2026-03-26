import { useQuery } from '@tanstack/react-query';
import { fetchAccounts } from '../api/http';
import { useApiConfig } from '../api/ApiContext';

export function useAccountsQuery() {
  const { token } = useApiConfig();
  return useQuery({
    queryKey: ['accounts', token],
    queryFn: () => fetchAccounts(token),
    enabled: !!token,
    staleTime: 60_000,
  });
}
