import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchDashboardSnapshot } from '../api/http';
import type { DashboardSnapshot } from '../api/types';
import { useApiConfig } from '../api/ApiContext';

/**
 * Typed dashboard aggregate: balances, budget dashboard, active alerts, goals, upcoming recurring.
 */
export function useDashboardQuery(): UseQueryResult<DashboardSnapshot, Error> {
  const { token } = useApiConfig();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  return useQuery({
    queryKey: ['dashboard', token, year, month],
    queryFn: () => fetchDashboardSnapshot({ token, year, month }),
    enabled: !!token,
    staleTime: 30_000,
    retry: 1,
  });
}
