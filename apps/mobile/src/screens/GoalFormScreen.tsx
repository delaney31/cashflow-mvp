import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppText } from '@cashflow/ui';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createGoal, updateGoal, type CreateGoalBody } from '../api/http';
import { useApiConfig } from '../api/ApiContext';
import { ControlCard } from '../components/dashboard/ControlCard';
import { ErrorState } from '../components/ErrorState';
import { ScreenShell } from '../components/ScreenShell';
import { useGoalDetailQuery } from '../hooks/useGoalDetailQuery';
import { useInvalidateGoalsAndDashboard } from '../hooks/useInvalidateGoalsAndDashboard';
import type { GoalsStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/theme';

const GOAL_TYPES = [
  'CUSTOM',
  'MONTHLY_SPENDING_CAP',
  'CASH_BUFFER_TARGET',
  'DEBT_PAYOFF_TARGET',
  'MIN_CHECKING_BALANCE',
  'PURCHASE_GUARDRAIL',
] as const;

const FORM_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'] as const;

/** Matches API `CreateGoalDto` decimal validation */
const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

function typeLabel(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type Nav = NativeStackNavigationProp<GoalsStackParamList, 'GoalForm'>;

export function GoalFormScreen() {
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<GoalsStackParamList, 'GoalForm'>>();
  const goalId = route.params?.goalId;
  const isEdit = !!goalId;

  const detailQuery = useGoalDetailQuery(goalId);
  const invalidate = useInvalidateGoalsAndDashboard();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<(typeof GOAL_TYPES)[number]>('CUSTOM');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<(typeof FORM_STATUSES)[number]>('ACTIVE');
  const [priority, setPriority] = useState('0');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const g = detailQuery.data;
    if (!g || !isEdit) return;
    setTitle(g.title);
    const match = GOAL_TYPES.find((t) => t === g.type);
    setType(match ?? 'CUSTOM');
    setTargetAmount(g.targetAmount);
    setCurrentAmount(g.currentAmount);
    setDueDate(g.dueDate ?? '');
    setStatus(
      FORM_STATUSES.includes(g.status as (typeof FORM_STATUSES)[number])
        ? (g.status as (typeof FORM_STATUSES)[number])
        : 'ACTIVE',
    );
    setPriority(String(g.priority));
    setNotes(g.notes ?? '');
  }, [detailQuery.data, isEdit]);

  const createMut = useMutation({
    mutationFn: (body: CreateGoalBody) => createGoal(token, body),
    onSuccess: async () => {
      await invalidate();
      navigation.goBack();
    },
  });

  const updateMut = useMutation({
    mutationFn: (body: Parameters<typeof updateGoal>[2]) =>
      updateGoal(token, goalId!, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['goals', 'detail', goalId] });
      await invalidate();
      navigation.goBack();
    },
  });

  const saving = createMut.isPending || updateMut.isPending;
  const err = createMut.error ?? updateMut.error;

  const onSubmit = useCallback(() => {
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    const ta = targetAmount.trim();
    const ca = currentAmount.trim() || '0';
    if (!DECIMAL_PATTERN.test(ta)) {
      setFormError('Target must be a non-negative decimal (e.g. 1000 or 1000.50).');
      return;
    }
    if (!DECIMAL_PATTERN.test(ca)) {
      setFormError('Current progress must be a valid decimal.');
      return;
    }
    setFormError(null);
    const p = Number.parseInt(priority, 10);
    const priorityNum = Number.isFinite(p) && p >= 0 ? p : 0;
    const body: CreateGoalBody = {
      title: title.trim(),
      type,
      targetAmount: ta,
      currentAmount: ca,
      dueDate: dueDate.trim() || undefined,
      status,
      priority: priorityNum,
      notes: notes.trim() ? notes.trim() : null,
    };
    if (isEdit) {
      updateMut.mutate(body);
    } else {
      createMut.mutate(body);
    }
  }, [title, type, targetAmount, currentAmount, dueDate, status, priority, notes, isEdit, createMut, updateMut]);

  const deleted = detailQuery.data?.deletedAt;

  if (!token) {
    return (
      <ScreenShell title={isEdit ? 'Edit goal' : 'New goal'} scroll={false}>
        <AppText style={{ color: colors.textSecondary }}>Set EXPO_PUBLIC_API_TOKEN to save goals.</AppText>
      </ScreenShell>
    );
  }

  if (isEdit && detailQuery.isPending && !detailQuery.data) {
    return (
      <ScreenShell title="Edit goal" scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenShell>
    );
  }

  if (isEdit && detailQuery.isError) {
    return (
      <ScreenShell title="Edit goal" scroll={false}>
        <ErrorState message={detailQuery.error.message} onRetry={() => void detailQuery.refetch()} />
      </ScreenShell>
    );
  }

  if (deleted) {
    return (
      <ScreenShell title="Edit goal" scroll={false}>
        <AppText style={{ color: colors.textSecondary }}>
          This goal is in the trash. Restore it from the Deleted tab before editing.
        </AppText>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={isEdit ? 'Edit goal' : 'New goal'} subtitle="Targets and progress" scroll={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {formError ? (
          <AppText style={{ color: colors.danger, marginBottom: spacing.sm }}>{formError}</AppText>
        ) : null}
        {err ? (
          <AppText style={{ color: colors.danger, marginBottom: spacing.sm }}>
            {err instanceof Error ? err.message : 'Could not save'}
          </AppText>
        ) : null}

        <ControlCard title="Title">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Emergency fund"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </ControlCard>

        <ControlCard title="Type">
          <View style={styles.chips}>
            {GOAL_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.chip,
                  {
                    borderColor: type === t ? colors.primary : colors.border,
                    backgroundColor: type === t ? colors.surfaceMuted : colors.surface,
                  },
                ]}
              >
                <AppText style={{ color: colors.text, fontSize: 13 }}>{typeLabel(t)}</AppText>
              </Pressable>
            ))}
          </View>
        </ControlCard>

        <ControlCard title="Amounts (decimal string)">
          <AppText style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>Target</AppText>
          <TextInput
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="10000.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <AppText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, marginBottom: 6 }}>
            Current progress
          </AppText>
          <TextInput
            value={currentAmount}
            onChangeText={setCurrentAmount}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </ControlCard>

        <ControlCard title="Due date (YYYY-MM-DD)">
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="Optional"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </ControlCard>

        <ControlCard title="Status">
          <View style={styles.chips}>
            {(isEdit ? FORM_STATUSES : FORM_STATUSES.filter((s) => s !== 'ARCHIVED')).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[
                  styles.chip,
                  {
                    borderColor: status === s ? colors.primary : colors.border,
                    backgroundColor: status === s ? colors.surfaceMuted : colors.surface,
                  },
                ]}
              >
                <AppText style={{ color: colors.text, fontSize: 13 }}>{s}</AppText>
              </Pressable>
            ))}
          </View>
        </ControlCard>

        <ControlCard title="Priority (0+)">
          <TextInput
            value={priority}
            onChangeText={setPriority}
            keyboardType="number-pad"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </ControlCard>

        <ControlCard title="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[styles.input, styles.notes, { color: colors.text, borderColor: colors.border }]}
          />
        </ControlCard>

        <Pressable
          onPress={onSubmit}
          disabled={saving || !title.trim()}
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: saving || !title.trim() ? 0.5 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <AppText style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{isEdit ? 'Save' : 'Create'}</AppText>
          )}
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 16,
  },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
