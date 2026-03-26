import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import { useAppTheme } from '../theme/ThemeContext';
import { radii, spacing, typography } from '../theme/theme';

type Props = {
  title: string;
  children: ReactNode;
};

export function PlaceholderCard({ title, children }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText style={[typography.subtitle, { color: colors.text }]}>{title}</AppText>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  body: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
});
