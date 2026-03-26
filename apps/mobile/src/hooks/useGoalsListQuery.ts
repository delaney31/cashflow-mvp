import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchGoalsList, type GoalListKind } from '../api/http';
import type { GoalResponse } from '../api/types';
import { useApiConfig } from '../api/ApiContext';

export function useGoalsListQuery(kind: GoalListKind): UseQueryResult<GoalResponse[], Error> {
  const { token } = useApiConfig();

  return useQuery({
    queryKey: ['goals', 'list', kind, token],
    queryFn: () => fetchGoalsList(token, kind),
    enabled: !!token,
    staleTime: 15_000,
    retry: 1,
  });
}
