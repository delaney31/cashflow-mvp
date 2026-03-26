import { useQuery } from '@tanstack/react-query';
import { fetchTransactionById } from '../api/http';
import { useApiConfig } from '../api/ApiContext';

export function useTransactionQuery(transactionId: string | undefined) {
  const { token } = useApiConfig();
  return useQuery({
    queryKey: ['transaction', token, transactionId],
    queryFn: () => fetchTransactionById(token, transactionId!),
    enabled: !!token && !!transactionId,
  });
}
