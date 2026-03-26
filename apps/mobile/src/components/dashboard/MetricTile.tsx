import { StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, typography } from '../../theme/theme';

type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricTile({ label, value, hint }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.tile, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <AppText style={[styles.label, { color: colors.textSecondary }]} numberOfLines={2}>
        {label}
      </AppText>
      <AppText style={[typography.subtitle, { color: colors.text, marginTop: spacing.xs }]}>{value}</AppText>
      {hint ? (
        <AppText style={[styles.hint, { color: colors.textSecondary }]} numberOfLines={2}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '28%',
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
  },
});
