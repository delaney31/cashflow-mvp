import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { resolveAlert } from '../api/http';
import { useApiConfig } from '../api/ApiContext';
import { ControlCard } from '../components/dashboard/ControlCard';
import { useAccountsQuery } from '../hooks/useAccountsQuery';
import { useGoalDetailQuery } from '../hooks/useGoalDetailQuery';
import { useInvalidateAlertsAndDashboard } from '../hooks/useInvalidateAlertsAndDashboard';
import type { AlertsStackParamList, RootTabParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeContext';
import { radii, spacing, typography } from '../theme/theme';
import { buildAlertContextLines, formatAlertTypeLabel } from '../utils/alertContext';
import { alertSeverityColor } from '../utils/alertSeverity';
import { formatIsoDateTime } from '../utils/time';

type StackNav = NativeStackNavigationProp<AlertsStackParamList, 'AlertDetail'>;

export function AlertDetailScreen() {
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const route = useRoute<RouteProp<AlertsStackParamList, 'AlertDetail'>>();
  const stackNavigation = useNavigation<StackNav>();
  const tabNavigation = useNavigation<NavigationProp<RootTabParamList>>();
  const alert = route.params.alert;
  const invalidate = useInvalidateAlertsAndDashboard();

  const accountsQuery = useAccountsQuery();
  const goalId =
    typeof alert.metadata?.goalId === 'string' ? alert.metadata.goalId : undefined;
  const goalQuery = useGoalDetailQuery(goalId);

  const resolveMut = useMutation({
    mutationFn: () => resolveAlert(token, alert.id),
    onSuccess: async () => {
      await invalidate();
      stackNavigation.goBack();
    },
  });

  const lines = buildAlertContextLines(alert);
  const sevColor = alertSeverityColor(alert.severity, colors);
  const isOpen = !alert.resolvedAt;

  const accountLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accountsQuery.data ?? []) {
      m.set(a.id, `${a.name}${a.mask ? ` · ${a.mask}` : ''}`);
    }
    return m;
  }, [accountsQuery.data]);

  const openTransaction = useCallback(
    (id: string) => {
      tabNavigation.navigate('Transactions', {
        screen: 'TransactionDetail',
        params: { transactionId: id },
      });
    },
    [tabNavigation],
  );

  const openGoal = useCallback(
    (id: string) => {
      tabNavigation.navigate('Goals', {
        screen: 'GoalForm',
        params: { goalId: id },
      });
    },
    [tabNavigation],
  );

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={[styles.sevPill, { borderColor: sevColor }]}>
          <AppText style={{ color: sevColor, fontSize: 12, fontWeight: '700' }}>{alert.severity}</AppText>
        </View>
        <AppText style={[typography.title, { color: colors.text, marginTop: spacing.sm }]}>{alert.title}</AppText>
        <AppText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
          {formatAlertTypeLabel(alert.alertType)}
        </AppText>
      </View>

      {alert.body ? (
        <ControlCard title="Details">
          <AppText style={{ color: colors.text, lineHeight: 22 }}>{alert.body}</AppText>
        </ControlCard>
      ) : null}

      <ControlCard title="Source">
        {lines.length === 0 ? (
          <AppText style={{ color: colors.textSecondary }}>No linked objects in metadata.</AppText>
        ) : (
          lines.map((line) => {
            const primary =
              line.kind === 'account' && line.linkedAccountId
                ? accountLabelById.get(line.linkedAccountId) ?? line.primary
                : line.kind === 'goal' && goalQuery.data?.title
                  ? goalQuery.data.title
                  : line.primary;
            return (
              <View key={line.key} style={styles.ctxRow}>
                <AppText style={{ color: colors.textSecondary, fontSize: 13, width: 112 }}>{line.label}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText style={{ color: colors.text, fontSize: 15 }}>{primary}</AppText>
                  {line.secondary ? (
                    <AppText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                      {line.secondary}
                    </AppText>
                  ) : null}
                  {line.kind === 'goal' && line.goalId ? (
                    <Pressable onPress={() => openGoal(line.goalId!)} style={styles.link}>
                      <AppText style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                        Open goal
                      </AppText>
                    </Pressable>
                  ) : null}
                  {line.kind === 'transaction' && line.transactionId ? (
                    <Pressable onPress={() => openTransaction(line.transactionId!)} style={styles.link}>
                      <AppText style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                        View transaction
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ControlCard>

      <ControlCard title="Timeline">
        <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Created</AppText>
        <AppText style={{ color: colors.text, marginBottom: spacing.sm }}>{formatIsoDateTime(alert.createdAt)}</AppText>
        <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Updated</AppText>
        <AppText style={{ color: colors.text, marginBottom: spacing.sm }}>{formatIsoDateTime(alert.updatedAt)}</AppText>
        {alert.resolvedAt ? (
          <>
            <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Resolved</AppText>
            <AppText style={{ color: colors.text }}>{formatIsoDateTime(alert.resolvedAt)}</AppText>
          </>
        ) : (
          <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Status · Open</AppText>
        )}
      </ControlCard>

      {isOpen ? (
        <Pressable
          onPress={() => resolveMut.mutate()}
          disabled={resolveMut.isPending}
          style={[
            styles.resolvePrimary,
            { backgroundColor: colors.primary, opacity: resolveMut.isPending ? 0.6 : 1 },
          ]}
        >
          <AppText style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            {resolveMut.isPending ? 'Marking resolved…' : 'Mark resolved'}
          </AppText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  sevPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  ctxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  link: {
    marginTop: 6,
  },
  resolvePrimary: {
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
