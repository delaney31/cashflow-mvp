import { StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { RecurringUpcomingResponse } from '../../api/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { formatUsdFromString } from '../../utils/money';
import { spacing } from '../../theme/theme';

type Props = { item: RecurringUpcomingResponse };

export function RecurringRow({ item }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1, paddingRight: spacing.sm }}>
        <AppText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.label}
        </AppText>
        <AppText style={[styles.sub, { color: colors.textSecondary }]}>
          {item.nextExpectedDate ? `Next ${item.nextExpectedDate}` : 'Date TBD'} · {item.frequency}
        </AppText>
      </View>
      <AppText style={[styles.amt, { color: colors.text }]}>
        {formatUsdFromString(item.averageAmount, item.currency)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
  },
  amt: {
    fontSize: 15,
    fontWeight: '600',
  },
});
