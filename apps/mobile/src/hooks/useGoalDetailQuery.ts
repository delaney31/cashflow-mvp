import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchGoalById } from '../api/http';
import type { GoalResponse } from '../api/types';
import { useApiConfig } from '../api/ApiContext';

export function useGoalDetailQuery(goalId: string | undefined): UseQueryResult<GoalResponse, Error> {
  const { token } = useApiConfig();

  return useQuery({
    queryKey: ['goals', 'detail', goalId, token],
    queryFn: () => fetchGoalById(token, goalId!),
    enabled: !!token && !!goalId,
    staleTime: 10_000,
    retry: 1,
  });
}
