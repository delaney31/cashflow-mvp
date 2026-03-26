import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@cashflow/ui';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<ComponentProps<typeof RefreshControl>>;
};

export function ScreenShell({ title, subtitle, children, scroll = true, refreshControl }: Props) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText style={[typography.title, { color: colors.text }]}>{title}</AppText>
        {subtitle ? (
          <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</AppText>
        ) : null}
      </View>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
