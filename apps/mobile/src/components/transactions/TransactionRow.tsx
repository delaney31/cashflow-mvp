import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { TransactionResponse } from '../../api/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { formatUsdFromString } from '../../utils/money';
import { radii, spacing } from '../../theme/theme';

type Props = {
  item: TransactionResponse;
  onPress: () => void;
};

export function TransactionRow({ item, onPress }: Props) {
  const { colors } = useAppTheme();
  const category = item.userCategoryName ?? item.aiCategoryName ?? 'Uncategorized';
  const merchant = item.merchantName ?? item.name;
  const statusLabel = item.status === 'POSTED' ? 'Posted' : 'Pending';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.topLine}>
          <AppText style={[styles.merchant, { color: colors.text }]} numberOfLines={1}>
            {merchant}
          </AppText>
          <View style={[styles.badge, { backgroundColor: item.status === 'POSTED' ? colors.surfaceMuted : '#FFF3E0' }]}>
            <AppText style={[styles.badgeText, { color: colors.text }]}>{statusLabel}</AppText>
          </View>
        </View>
        <AppText style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.date} · {category}
        </AppText>
      </View>
      <AppText style={[styles.amount, { color: colors.text }]}>
        {formatUsdFromString(item.amount, item.currency)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  left: {
    flex: 1,
    marginRight: spacing.sm,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
