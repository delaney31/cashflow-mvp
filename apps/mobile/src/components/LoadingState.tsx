import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/theme';

type Props = {
  message?: string;
};

export function LoadingState({ message = 'Loading…' }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceMuted }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText style={[styles.text, { color: colors.textSecondary }]}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    fontSize: 14,
  },
});
