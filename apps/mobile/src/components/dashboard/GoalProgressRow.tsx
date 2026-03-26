import { StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { GoalResponse } from '../../api/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { goalProgress } from '../../utils/dashboard';
import { formatUsdFromString } from '../../utils/money';
import { spacing } from '../../theme/theme';

type Props = {
  goal: GoalResponse;
};

export function GoalProgressRow({ goal }: Props) {
  const { colors } = useAppTheme();
  const pct = goalProgress(goal);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {goal.title}
        </AppText>
        <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>
          {formatUsdFromString(goal.currentAmount)} / {formatUsdFromString(goal.targetAmount)}
        </AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
