import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useInvalidateAlertsAndDashboard() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  }, [queryClient]);
}
