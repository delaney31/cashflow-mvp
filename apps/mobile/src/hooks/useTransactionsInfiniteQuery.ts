import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { TransactionListFilters } from '../api/http';
import { fetchTransactionsPage } from '../api/http';
import { useApiConfig } from '../api/ApiContext';
import { useDebouncedValue } from './useDebouncedValue';

const PAGE_SIZE = 25;

export type TransactionFiltersInput = {
  linkedAccountId?: string;
  from?: string;
  to?: string;
  userCategoryId?: string;
  /** Empty string = all */
  status: '' | 'POSTED' | 'PENDING';
  search: string;
};

function buildListFilters(
  input: TransactionFiltersInput,
  debouncedSearch: string,
): Omit<TransactionListFilters, 'page'> {
  return {
    limit: PAGE_SIZE,
    linkedAccountId: input.linkedAccountId || undefined,
    from: input.from || undefined,
    to: input.to || undefined,
    userCategoryId: input.userCategoryId || undefined,
    status: input.status === '' ? undefined : input.status,
    search: debouncedSearch.trim() || undefined,
  };
}

export function useTransactionsInfiniteQuery(filters: TransactionFiltersInput) {
  const { token } = useApiConfig();
  const debouncedSearch = useDebouncedValue(filters.search, 400);

  const listFilters = useMemo(
    () => buildListFilters(filters, debouncedSearch),
    [
      filters.linkedAccountId,
      filters.from,
      filters.to,
      filters.userCategoryId,
      filters.status,
      debouncedSearch,
    ],
  );

  return useInfiniteQuery({
    queryKey: ['transactions', token, listFilters],
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage({
        token,
        filters: { ...listFilters, page: pageParam as number },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    enabled: !!token,
    staleTime: 15_000,
  });
}
