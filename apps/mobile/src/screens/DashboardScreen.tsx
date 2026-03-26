import { useCallback, useMemo } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import { AlertListRow } from '../components/dashboard/AlertListRow';
import { ControlCard } from '../components/dashboard/ControlCard';
import { GoalProgressRow } from '../components/dashboard/GoalProgressRow';
import { MetricTile } from '../components/dashboard/MetricTile';
import { RecurringRow } from '../components/dashboard/RecurringRow';
import { ErrorState } from '../components/ErrorState';
import { ScreenShell } from '../components/ScreenShell';
import { useApiConfig } from '../api/ApiContext';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme/theme';
import { bufferFromGoals, majorGoals } from '../utils/dashboard';
import { formatUsd, formatUsdFromString, sumBalanceStrings } from '../utils/money';

function periodLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

export function DashboardScreen() {
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboardQuery();

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefetching && !isPending}
        onRefresh={onRefresh}
        tintColor={colors.primary}
      />
    ),
    [colors.primary, isRefetching, isPending, onRefresh],
  );

  if (!token) {
    return (
      <ScreenShell title="Dashboard" subtitle="Financial control center — sign in to load data">
        <ControlCard title="Connect API">
          <AppText style={[styles.muted, { color: colors.textSecondary, lineHeight: 20 }]}>
            Set EXPO_PUBLIC_API_URL (default http://localhost:3000/v1) and EXPO_PUBLIC_API_TOKEN from POST
            /auth/login for development. Production builds should use a login screen and secure token storage.
          </AppText>
        </ControlCard>
      </ScreenShell>
    );
  }

  if (isPending) {
    return (
      <ScreenShell title="Dashboard" subtitle="Loading snapshot…">
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.textSecondary }]}>Syncing data…</AppText>
        </View>
      </ScreenShell>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return (
      <ScreenShell title="Dashboard" subtitle="Could not load">
        <ErrorState message={message} onRetry={() => void refetch()} />
      </ScreenShell>
    );
  }

  if (!data) {
    return (
      <ScreenShell title="Dashboard">
        <AppText style={{ color: colors.textSecondary }}>No data.</AppText>
      </ScreenShell>
    );
  }

  const { balances, budget, alerts, goals, recurring } = data;
  const currency = budget.period.currency;
  const totalCash = sumBalanceStrings(balances.map((b) => b.balance));
  const totals = budget.totals;
  const cap = totals.totalBudgetCap ?? budget.budget.totalBudgetCap;
  const buffer = bufferFromGoals(goals);
  const topAlerts = alerts.slice(0, 3);
  const goalsMajor = majorGoals(goals, 3);
  const recurringShow = recurring.slice(0, 5);

  const isSparse =
    balances.length === 0 &&
    Number(totals.monthToDateSpend) === 0 &&
    goals.length === 0 &&
    alerts.length === 0;

  return (
    <ScreenShell
      title="Dashboard"
      subtitle={`Financial control center · ${periodLabel(budget.period.year, budget.period.month)}`}
      refreshControl={refreshControl}
    >
      <View style={[styles.statusStrip, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <AppText style={[styles.statusStripText, { color: colors.textSecondary }]}>
          {balances.length} linked account{balances.length === 1 ? '' : 's'} · {currency}
        </AppText>
        {isRefetching ? (
          <AppText style={[styles.statusStripText, { color: colors.primary }]}>Refreshing…</AppText>
        ) : null}
      </View>

      <ControlCard variant="emphasis">
        <AppText style={[styles.heroLabel, { color: colors.textSecondary }]}>Current cash balance</AppText>
        <AppText style={[styles.heroValue, { color: colors.text }]}>{formatUsd(totalCash, currency)}</AppText>
        <AppText style={[styles.heroHint, { color: colors.textSecondary }]}>
          Sum of latest snapshots on linked accounts
        </AppText>
      </ControlCard>

      <ControlCard title="Spending & limits">
        <View style={styles.row3}>
          <MetricTile
            label="Month-to-date spending"
            value={formatUsdFromString(totals.monthToDateSpend, currency)}
          />
          <MetricTile
            label="Forecast month-end"
            value={formatUsdFromString(totals.forecastedMonthEndSpend, currency)}
          />
          <MetricTile label="Monthly cap" value={cap ? formatUsdFromString(cap, currency) : '—'} />
        </View>
        <View style={styles.row2}>
          <View style={styles.halfMetric}>
            <MetricTile
              label="Remaining safe to spend"
              value={formatUsdFromString(totals.safeToSpendVsForecast, currency)}
              hint={
                totals.isOverCapForecast
                  ? 'Over cap (forecast)'
                  : totals.isOverCapActual
                    ? 'Over cap (actual)'
                    : 'Vs forecast to month-end'
              }
            />
          </View>
          <View style={styles.halfMetric}>
            <MetricTile
              label="Current buffer"
              value={
                buffer.hasTargets ? formatUsd(buffer.current, currency) : '—'
              }
              hint={
                buffer.hasTargets
                  ? `Target ${formatUsd(buffer.target, currency)} · buffer goals`
                  : 'Add a cash buffer or min checking goal'
              }
            />
          </View>
        </View>
      </ControlCard>

      <ControlCard title="Pace">
        <AppText style={{ color: colors.text, fontSize: 14 }}>
          Status: <AppText style={{ fontWeight: '700' }}>{budget.pace.paceStatus.replace(/_/g, ' ')}</AppText>
        </AppText>
        <AppText style={[styles.muted, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Month progress {Math.round(budget.pace.monthProgressFraction * 100)}% · view: {budget.transactionView}
        </AppText>
      </ControlCard>

      {isSparse ? (
        <ControlCard title="Getting started">
          <AppText style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
            Link accounts and sync transactions to populate this dashboard. Placeholder months still show engine
            defaults.
          </AppText>
        </ControlCard>
      ) : null}

      <ControlCard title="Active alerts">
        {topAlerts.length === 0 ? (
          <AppText style={{ color: colors.textSecondary, fontSize: 14 }}>No active alerts.</AppText>
        ) : (
          topAlerts.map((a) => <AlertListRow key={a.id} alert={a} />)
        )}
      </ControlCard>

      <ControlCard title="Next recurring bills">
        {recurringShow.length === 0 ? (
          <AppText style={{ color: colors.textSecondary, fontSize: 14 }}>No recurring patterns yet.</AppText>
        ) : (
          recurringShow.map((r) => <RecurringRow key={r.id} item={r} />)
        )}
      </ControlCard>

      <ControlCard title="Major goals">
        {goalsMajor.length === 0 ? (
          <AppText style={{ color: colors.textSecondary, fontSize: 14 }}>No active goals.</AppText>
        ) : (
          goalsMajor.map((g) => <GoalProgressRow key={g.id} goal={g} />)
        )}
      </ControlCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: typography.caption.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  heroHint: {
    fontSize: 12,
    marginTop: spacing.sm,
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusStripText: {
    fontSize: 12,
  },
  row3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  row2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  halfMetric: {
    flex: 1,
    minWidth: '45%',
  },
  muted: {
    fontSize: 13,
  },
});
