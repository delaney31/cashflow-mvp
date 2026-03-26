import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '@cashflow/ui';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { postEvaluateAlerts, resolveAlert } from '../api/http';
import { useApiConfig } from '../api/ApiContext';
import type { AlertResponse } from '../api/types';
import { AlertRow } from '../components/alerts/AlertRow';
import { ErrorState } from '../components/ErrorState';
import { ScreenShell } from '../components/ScreenShell';
import { useAlertsListQuery } from '../hooks/useAlertsListQuery';
import { useInvalidateAlertsAndDashboard } from '../hooks/useInvalidateAlertsAndDashboard';
import type { AlertsStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/theme';

type ListFilter = 'active' | 'resolved';

type Nav = NativeStackNavigationProp<AlertsStackParamList, 'AlertsList'>;

export function AlertsScreen() {
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<ListFilter>('active');
  const listQuery = useAlertsListQuery(filter);
  const invalidate = useInvalidateAlertsAndDashboard();

  const resolveMut = useMutation({
    mutationFn: (id: string) => resolveAlert(token, id),
    onSuccess: () => void invalidate(),
  });

  const evaluateMut = useMutation({
    mutationFn: () => postEvaluateAlerts(token),
    onSuccess: () => void invalidate(),
  });

  const onRefresh = useCallback(() => {
    void listQuery.refetch();
  }, [listQuery]);

  const openDetail = useCallback(
    (alert: AlertResponse) => {
      navigation.navigate('AlertDetail', { alert });
    },
    [navigation],
  );

  if (!token) {
    return (
      <ScreenShell title="Alerts" subtitle="Budget, balance, and activity signals">
        <AppText style={{ color: colors.textSecondary }}>
          Set EXPO_PUBLIC_API_TOKEN to load alerts.
        </AppText>
      </ScreenShell>
    );
  }

  const list = listQuery.data ?? [];
  const loading = listQuery.isPending && !listQuery.data;
  const err = listQuery.error;

  return (
    <ScreenShell title="Alerts" subtitle="Budget, balance, and activity signals" scroll={false}>
      <View style={styles.shell}>
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentScroll}>
            <Pressable
              onPress={() => setFilter('active')}
              style={[
                styles.segment,
                {
                  borderColor: filter === 'active' ? colors.primary : colors.border,
                  backgroundColor: filter === 'active' ? colors.surfaceMuted : colors.surface,
                },
              ]}
            >
              <AppText
                style={{
                  color: filter === 'active' ? colors.primary : colors.text,
                  fontWeight: filter === 'active' ? '700' : '500',
                  fontSize: 14,
                }}
              >
                Active
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setFilter('resolved')}
              style={[
                styles.segment,
                {
                  borderColor: filter === 'resolved' ? colors.primary : colors.border,
                  backgroundColor: filter === 'resolved' ? colors.surfaceMuted : colors.surface,
                },
              ]}
            >
              <AppText
                style={{
                  color: filter === 'resolved' ? colors.primary : colors.text,
                  fontWeight: filter === 'resolved' ? '700' : '500',
                  fontSize: 14,
                }}
              >
                Resolved
              </AppText>
            </Pressable>
          </ScrollView>
          <Pressable
            onPress={() => evaluateMut.mutate()}
            disabled={evaluateMut.isPending}
            accessibilityLabel="Refresh alerts from engine"
            style={[styles.syncBtn, { opacity: evaluateMut.isPending ? 0.5 : 1 }]}
          >
            <Ionicons name="refresh-outline" size={26} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {!loading && err ? (
          <ErrorState message={err.message} onRetry={() => void listQuery.refetch()} />
        ) : null}

        {!loading && !err ? (
          <FlatList
            style={styles.list}
            data={list}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <AlertRow
                alert={item}
                showResolve={filter === 'active'}
                onPress={() => openDetail(item)}
                onResolve={
                  filter === 'active'
                    ? () => {
                        resolveMut.mutate(item.id);
                      }
                    : undefined
                }
                resolveBusy={resolveMut.isPending && resolveMut.variables === item.id}
              />
            )}
            refreshControl={<RefreshControl refreshing={listQuery.isFetching} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <AppText style={{ color: colors.textSecondary, marginTop: spacing.md }}>
                {filter === 'active' ? 'No active alerts. Tap refresh to run the alert engine.' : 'No resolved alerts yet.'}
              </AppText>
            }
            contentContainerStyle={styles.listContent}
          />
        ) : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  segmentScroll: {
    flexGrow: 1,
    gap: 8,
    paddingRight: 4,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  syncBtn: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});
