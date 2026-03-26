import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { radii, spacing, typography } from '../../theme/theme';

type Props = {
  title?: string;
  children: ReactNode;
  /** Slightly elevated control-panel look */
  variant?: 'default' | 'emphasis';
};

export function ControlCard({ title, children, variant = 'default' }: Props) {
  const { colors } = useAppTheme();
  const bg = variant === 'emphasis' ? colors.surfaceMuted : colors.surface;
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: colors.border }]}>
      {title ? (
        <AppText style={[typography.subtitle, styles.title, { color: colors.text }]}>{title}</AppText>
      ) : null}
      {children}
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
  title: {
    marginBottom: spacing.sm,
  },
});
