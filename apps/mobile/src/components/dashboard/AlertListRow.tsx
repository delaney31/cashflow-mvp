import { StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { AlertResponse } from '../../api/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/theme';

function severityAccent(sev: AlertResponse['severity']): string {
  switch (sev) {
    case 'CRITICAL':
    case 'HIGH':
      return '#C0392B';
    case 'WARNING':
    case 'MEDIUM':
      return '#C87F0A';
    default:
      return '#1B6B93';
  }
}

type Props = { alert: AlertResponse };

export function AlertListRow({ alert }: Props) {
  const { colors } = useAppTheme();
  const accent = severityAccent(alert.severity);
  return (
    <View style={[styles.row, { borderLeftColor: accent }]}>
      <View style={styles.dot} />
      <View style={{ flex: 1 }}>
        <AppText style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {alert.title}
        </AppText>
        <AppText style={[styles.meta, { color: colors.textSecondary }]}>{alert.severity}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  meta: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
