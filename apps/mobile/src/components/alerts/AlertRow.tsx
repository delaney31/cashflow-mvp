import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { AlertResponse } from '../../api/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { radii, spacing, typography } from '../../theme/theme';
import { buildAlertContextLines, formatAlertTypeLabel } from '../../utils/alertContext';
import { alertSeverityColor } from '../../utils/alertSeverity';
import { formatRelativeShort } from '../../utils/time';

type Props = {
  alert: AlertResponse;
  showResolve?: boolean;
  onPress: () => void;
  onResolve?: () => void;
  resolveBusy?: boolean;
};

export function AlertRow({ alert, showResolve, onPress, onResolve, resolveBusy }: Props) {
  const { colors } = useAppTheme();
  const sevColor = alertSeverityColor(alert.severity, colors);
  const ctx = buildAlertContextLines(alert);
  const subtitle = ctx[0]?.primary ?? formatAlertTypeLabel(alert.alertType);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.strip, { backgroundColor: sevColor }]} />
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.mainPress, { opacity: pressed ? 0.92 : 1 }]}
      >
        <View style={styles.main}>
          <View style={styles.titleRow}>
            <AppText style={[typography.subtitle, { color: colors.text, flex: 1 }]} numberOfLines={2}>
              {alert.title}
            </AppText>
            <AppText style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 8 }}>
              {formatRelativeShort(alert.updatedAt)}
            </AppText>
          </View>
          <AppText style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={1}>
            {subtitle}
          </AppText>
          <View style={styles.meta}>
            <View style={[styles.sevBadge, { borderColor: sevColor }]}>
              <AppText style={{ color: sevColor, fontSize: 11, fontWeight: '600' }}>{alert.severity}</AppText>
            </View>
            <AppText style={{ color: colors.textSecondary, fontSize: 12 }}>
              {formatAlertTypeLabel(alert.alertType)}
            </AppText>
          </View>
        </View>
      </Pressable>
      {showResolve && onResolve ? (
        <Pressable
          onPress={onResolve}
          disabled={resolveBusy}
          style={[styles.resolveBtn, { opacity: resolveBusy ? 0.5 : 1 }]}
          hitSlop={8}
        >
          <AppText style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
            {resolveBusy ? '…' : 'Resolve'}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  strip: {
    width: 4,
  },
  mainPress: {
    flex: 1,
  },
  main: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  sevBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  resolveBtn: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
