import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import { useAppTheme } from '../theme/ThemeContext';
import { radii, spacing, typography } from '../theme/theme';

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
      <AppText style={[typography.subtitle, { color: colors.danger }]}>Something went wrong</AppText>
      <AppText style={[styles.body, { color: colors.textSecondary }]}>{message}</AppText>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <AppText style={styles.buttonLabel}>Retry</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
