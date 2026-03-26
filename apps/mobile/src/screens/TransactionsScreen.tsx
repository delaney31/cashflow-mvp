import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppText } from '@cashflow/ui';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { TransactionRow } from '../components/transactions/TransactionRow';
import { ControlCard } from '../components/dashboard/ControlCard';
import { ErrorState } from '../components/ErrorState';
import { ScreenShell } from '../components/ScreenShell';
import { useApiConfig } from '../api/ApiContext';
import { useAccountsQuery } from '../hooks/useAccountsQuery';
import { useCategoriesQuery } from '../hooks/useCategoriesQuery';
import type { TransactionFiltersInput } from '../hooks/useTransactionsInfiniteQuery';
import { useTransactionsInfiniteQuery } from '../hooks/useTransactionsInfiniteQuery';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme/theme';
import type { TransactionsStackParamList } from '../navigation/types';
import type { TransactionResponse } from '../api/types';

const defaultFilters = (): TransactionFiltersInput => ({
  status: '',
  search: '',
});

export function TransactionsScreen() {
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const navigation = useNavigation<NativeStackNavigationProp<TransactionsStackParamList, 'TransactionsList'>>();
  const [filters, setFilters] = useState<TransactionFiltersInput>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const accountsQuery = useAccountsQuery();
  const categoriesQuery = useCategoriesQuery();
  const txQuery = useTransactionsInfiniteQuery(filters);

  const flatItems = useMemo(
    () => txQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [txQuery.data?.pages],
  );

  const onRefresh = useCallback(() => {
    void txQuery.refetch();
    void accountsQuery.refetch();
    void categoriesQuery.refetch();
  }, [txQuery, accountsQuery, categoriesQuery]);

  const openDetail = useCallback(
    (transactionId: string) => {
      navigation.navigate('TransactionDetail', { transactionId });
    },
    [navigation],
  );

  if (!token) {
    return (
      <ScreenShell title="Transactions" subtitle="Activity across linked accounts">
        <ControlCard title="Connect API">
          <AppText style={{ color: colors.textSecondary, lineHeight: 20 }}>
            Set EXPO_PUBLIC_API_TOKEN to load transactions.
          </AppText>
        </ControlCard>
      </ScreenShell>
    );
  }

  if (txQuery.isPending && !txQuery.data) {
    return (
      <ScreenShell title="Transactions" subtitle="Loading…">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenShell>
    );
  }

  if (txQuery.isError) {
    const msg = txQuery.error instanceof Error ? txQuery.error.message : 'Failed to load';
    return (
      <ScreenShell title="Transactions" subtitle="Error">
        <ErrorState message={msg} onRetry={() => void txQuery.refetch()} />
      </ScreenShell>
    );
  }

  const listEmpty =
    !txQuery.isFetching && flatItems.length === 0 ? (
      <View style={styles.empty}>
        <AppText style={[typography.subtitle, { color: colors.text }]}>No transactions match</AppText>
        <AppText style={{ color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
          Adjust filters or search, or sync accounts in the API.
        </AppText>
      </View>
    ) : null;

  return (
    <ScreenShell title="Transactions" subtitle="Search, filter, and categorize" scroll={false}>
      <View style={styles.container}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText style={{ color: colors.textSecondary, marginRight: 8 }}>🔍</AppText>
          <TextInput
            placeholder="Search name or merchant"
            placeholderTextColor={colors.textSecondary}
            value={filters.search}
            onChangeText={(search) => setFilters((f) => ({ ...f, search }))}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable onPress={() => setShowFilters((s) => !s)} style={styles.filterToggle}>
          <AppText style={{ color: colors.primary, fontWeight: '600' }}>
            {showFilters ? 'Hide filters' : 'Filters'}
          </AppText>
        </Pressable>

        {showFilters ? (
          <ControlCard title="Filters">
            <AppText style={[styles.filterLabel, { color: colors.textSecondary }]}>Status</AppText>
            <View style={styles.segment}>
              {(['', 'POSTED', 'PENDING'] as const).map((s) => {
                const label = s === '' ? 'All' : s === 'POSTED' ? 'Posted' : 'Pending';
                const active = filters.status === s;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setFilters((f) => ({ ...f, status: s }))}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <AppText style={{ color: active ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText style={[styles.filterLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Account
            </AppText>
            <View style={styles.chips}>
              <Chip
                label="All"
                active={!filters.linkedAccountId}
                onPress={() => setFilters((f) => ({ ...f, linkedAccountId: undefined }))}
                colors={colors}
              />
              {(accountsQuery.data ?? []).map((a) => (
                <Chip
                  key={a.id}
                  label={a.mask ? `${a.name} · ${a.mask}` : a.name}
                  active={filters.linkedAccountId === a.id}
                  onPress={() => setFilters((f) => ({ ...f, linkedAccountId: a.id }))}
                  colors={colors}
                />
              ))}
            </View>

            <AppText style={[styles.filterLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Category (user)
            </AppText>
            <View style={styles.chips}>
              <Chip
                label="All"
                active={!filters.userCategoryId}
                onPress={() => setFilters((f) => ({ ...f, userCategoryId: undefined }))}
                colors={colors}
              />
              {(categoriesQuery.data ?? []).map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  active={filters.userCategoryId === c.id}
                  onPress={() => setFilters((f) => ({ ...f, userCategoryId: c.id }))}
                  colors={colors}
                />
              ))}
            </View>

            <AppText style={[styles.filterLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Date range (YYYY-MM-DD)
            </AppText>
            <View style={styles.dateRow}>
              <TextInput
                placeholder="From"
                placeholderTextColor={colors.textSecondary}
                value={filters.from ?? ''}
                onChangeText={(from) => setFilters((f) => ({ ...f, from: from || undefined }))}
                style={[styles.dateInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
              <TextInput
                placeholder="To"
                placeholderTextColor={colors.textSecondary}
                value={filters.to ?? ''}
                onChangeText={(to) => setFilters((f) => ({ ...f, to: to || undefined }))}
                style={[styles.dateInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
            </View>

            <Pressable
              onPress={() => setFilters(defaultFilters())}
              style={[styles.reset, { borderColor: colors.border }]}
            >
              <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Reset filters</AppText>
            </Pressable>
          </ControlCard>
        ) : null}

        <FlatList<TransactionResponse>
          style={{ flex: 1 }}
          data={flatItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionRow item={item} onPress={() => openDetail(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={txQuery.isRefetching && !txQuery.isPending} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={() => {
            if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) {
              void txQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={
            txQuery.isFetchingNextPage ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
            ) : null
          }
        />
      </View>
    </ScreenShell>
  );
}

function Chip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: { primary: string; text: string; surfaceMuted: string; border: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surfaceMuted,
          borderColor: colors.border,
        },
      ]}
    >
      <AppText
        style={{ color: active ? '#fff' : colors.text, fontSize: 12 }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  filterToggle: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '100%',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  reset: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
});
