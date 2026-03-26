import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useInvalidateGoalsAndDashboard() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  }, [queryClient]);
}
