import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '@cashflow/ui';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { ControlCard } from '../components/dashboard/ControlCard';
import { ErrorState } from '../components/ErrorState';
import { patchTransactionCategory } from '../api/http';
import { useApiConfig } from '../api/ApiContext';
import { useCategoriesQuery } from '../hooks/useCategoriesQuery';
import { useTransactionQuery } from '../hooks/useTransactionQuery';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme/theme';
import type { TransactionsStackParamList } from '../navigation/types';
import { formatUsdFromString } from '../utils/money';

export function TransactionDetailScreen() {
  const route = useRoute<RouteProp<TransactionsStackParamList, 'TransactionDetail'>>();
  const { transactionId } = route.params;
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const q = useTransactionQuery(transactionId);
  const categoriesQuery = useCategoriesQuery();

  const mutation = useMutation({
    mutationFn: (userCategoryId: string) =>
      patchTransactionCategory(token, transactionId, { userCategoryId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['transaction', token, transactionId] });
    },
  });

  const pickCategory = useCallback(
    (id: string) => {
      mutation.mutate(id);
      setPickerOpen(false);
    },
    [mutation],
  );

  const clearCategory = useCallback(() => {
    mutation.mutate('');
    setPickerOpen(false);
  }, [mutation]);

  if (!token) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText style={{ color: colors.textSecondary }}>Not authenticated</AppText>
      </View>
    );
  }

  if (q.isPending) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (q.isError) {
    const msg = q.error instanceof Error ? q.error.message : 'Error';
    return (
      <View style={[styles.pad, { backgroundColor: colors.background }]}>
        <ErrorState message={msg} onRetry={() => void q.refetch()} />
      </View>
    );
  }

  const t = q.data;
  if (!t) {
    return (
      <View style={[styles.pad, { backgroundColor: colors.background }]}>
        <AppText style={{ color: colors.textSecondary }}>Not found</AppText>
      </View>
    );
  }

  const displayCategory = t.userCategoryName ?? t.aiCategoryName ?? 'Uncategorized';
  const source = t.userCategoryName ? 'Your category' : t.aiCategoryName ? 'Suggested' : '—';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
      <ControlCard variant="emphasis">
        <AppText style={[styles.amount, { color: colors.text }]}>
          {formatUsdFromString(t.amount, t.currency)}
        </AppText>
        <AppText style={{ color: colors.textSecondary, marginTop: 4 }}>{t.name}</AppText>
        {t.merchantName ? (
          <AppText style={{ color: colors.text, marginTop: 4, fontWeight: '600' }}>{t.merchantName}</AppText>
        ) : null}
      </ControlCard>

      <ControlCard title="Status">
        <Row label="Posting" value={t.status === 'POSTED' ? 'Posted' : 'Pending'} colors={colors} />
        <Row label="Date" value={t.date} colors={colors} />
        <Row label="Posted at" value={t.postedAt ?? '—'} colors={colors} />
      </ControlCard>

      <ControlCard title="Category">
        <AppText style={[typography.body, { color: colors.text }]}>{displayCategory}</AppText>
        <AppText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{source}</AppText>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.btn, { backgroundColor: colors.primary, marginTop: spacing.md }]}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <AppText style={styles.btnLabel}>Change category</AppText>
          )}
        </Pressable>
      </ControlCard>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <AppText style={[typography.subtitle, { color: colors.text, marginBottom: spacing.sm }]}>
              Choose category
            </AppText>
            <Pressable onPress={clearCategory} style={[styles.modalRow, { borderColor: colors.border }]}>
              <AppText style={{ color: colors.danger, fontWeight: '600' }}>Clear override</AppText>
            </Pressable>
            <FlatList
              data={categoriesQuery.data ?? []}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pickCategory(item.id)}
                  style={[styles.modalRow, { borderColor: colors.border }]}
                >
                  <AppText style={{ color: colors.text }}>{item.name}</AppText>
                </Pressable>
              )}
            />
            <Pressable onPress={() => setPickerOpen(false)} style={{ marginTop: spacing.md }}>
              <AppText style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; textSecondary: string };
}) {
  return (
    <View style={styles.rowBetween}>
      <AppText style={{ color: colors.textSecondary }}>{label}</AppText>
      <AppText style={{ color: colors.text, fontWeight: '500' }}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pad: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    padding: spacing.md,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
