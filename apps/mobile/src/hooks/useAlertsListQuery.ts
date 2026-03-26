import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchAlerts, type AlertsListStatus } from '../api/http';
import type { AlertResponse } from '../api/types';
import { useApiConfig } from '../api/ApiContext';

export function useAlertsListQuery(
  status: Exclude<AlertsListStatus, 'all'>,
): UseQueryResult<AlertResponse[], Error> {
  const { token } = useApiConfig();

  return useQuery({
    queryKey: ['alerts', 'list', status, token],
    queryFn: () => fetchAlerts(token, status),
    enabled: !!token,
    staleTime: 20_000,
    retry: 1,
  });
}
