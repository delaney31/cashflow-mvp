import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  restoreGoal,
  softDeleteGoal,
  updateGoal,
  type GoalListKind,
} from '../api/http';
import { useApiConfig } from '../api/ApiContext';
import type { GoalResponse } from '../api/types';
import { GoalCard } from '../components/goals/GoalCard';
import { ErrorState } from '../components/ErrorState';
import { ScreenShell } from '../components/ScreenShell';
import { useGoalsListQuery } from '../hooks/useGoalsListQuery';
import { useInvalidateGoalsAndDashboard } from '../hooks/useInvalidateGoalsAndDashboard';
import type { GoalsStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/theme';

const SEGMENTS: { key: GoalListKind; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'completed', label: 'Done' },
  { key: 'deleted', label: 'Deleted' },
];

type Nav = NativeStackNavigationProp<GoalsStackParamList, 'GoalsList'>;

export function GoalsScreen() {
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const navigation = useNavigation<Nav>();
  const [segment, setSegment] = useState<GoalListKind>('active');
  const listQuery = useGoalsListQuery(segment);
  const invalidate = useInvalidateGoalsAndDashboard();

  const archiveMut = useMutation({
    mutationFn: (id: string) =>
      updateGoal(token, id, { archivedAt: new Date().toISOString() }),
    onSuccess: () => void invalidate(),
  });

  const unarchiveMut = useMutation({
    mutationFn: (id: string) => updateGoal(token, id, { archivedAt: null }),
    onSuccess: () => void invalidate(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => softDeleteGoal(token, id),
    onSuccess: () => void invalidate(),
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => restoreGoal(token, id),
    onSuccess: () => void invalidate(),
  });

  const onRefresh = useCallback(() => {
    void listQuery.refetch();
  }, [listQuery]);

  const confirmDelete = useCallback(
    (goal: GoalResponse) => {
      Alert.alert(
        'Delete goal?',
        `"${goal.title}" will be moved to trash. You can restore it from the Deleted tab.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMut.mutate(goal.id),
          },
        ],
      );
    },
    [deleteMut],
  );

  const renderItem = useCallback(
    ({ item }: { item: GoalResponse }) => (
      <GoalCard
        goal={item}
        segment={segment}
        onEdit={() => navigation.navigate('GoalForm', { goalId: item.id })}
        onArchive={() => archiveMut.mutate(item.id)}
        onUnarchive={() => unarchiveMut.mutate(item.id)}
        onDelete={() => confirmDelete(item)}
        onRestore={() => restoreMut.mutate(item.id)}
      />
    ),
    [segment, navigation, archiveMut, unarchiveMut, confirmDelete, restoreMut],
  );

  if (!token) {
    return (
      <ScreenShell title="Goals" subtitle="Savings and cash-flow targets">
        <AppText style={{ color: colors.textSecondary }}>
          Set EXPO_PUBLIC_API_TOKEN to load goals.
        </AppText>
      </ScreenShell>
    );
  }

  const list = listQuery.data ?? [];
  const loading = listQuery.isPending && !listQuery.data;
  const err = listQuery.error;

  return (
    <ScreenShell title="Goals" subtitle="Savings and cash-flow targets" scroll={false}>
      <View style={styles.shell}>
        <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentScroll}>
          {SEGMENTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSegment(s.key)}
              style={[
                styles.segment,
                {
                  borderColor: segment === s.key ? colors.primary : colors.border,
                  backgroundColor: segment === s.key ? colors.surfaceMuted : colors.surface,
                },
              ]}
            >
              <AppText
                style={{
                  color: segment === s.key ? colors.primary : colors.text,
                  fontWeight: segment === s.key ? '700' : '500',
                  fontSize: 14,
                }}
              >
                {s.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          onPress={() => navigation.navigate('GoalForm', {})}
          accessibilityLabel="Add goal"
          style={styles.addBtn}
        >
          <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
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
          keyExtractor={(g) => g.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={listQuery.isFetching} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <AppText style={{ color: colors.textSecondary, marginTop: spacing.md }}>
              {segment === 'active'
                ? 'No active goals. Tap + to create one.'
                : segment === 'archived'
                  ? 'No archived goals.'
                  : segment === 'completed'
                    ? 'No completed goals yet.'
                    : 'Trash is empty.'}
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
  addBtn: {
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
