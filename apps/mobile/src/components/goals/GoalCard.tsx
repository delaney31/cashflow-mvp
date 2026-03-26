import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { GoalListKind } from '../../api/http';
import type { GoalResponse } from '../../api/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { radii, spacing, typography } from '../../theme/theme';
import { goalProgress } from '../../utils/dashboard';
import { formatUsdFromString } from '../../utils/money';

function formatDue(d: string | null): string {
  if (!d) return 'No due date';
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  try {
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  goal: GoalResponse;
  segment: GoalListKind;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
};

export function GoalCard({
  goal,
  segment,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  onRestore,
}: Props) {
  const { colors } = useAppTheme();
  const pct = goalProgress(goal);
  const deleted = !!goal.deletedAt;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText style={[typography.subtitle, { color: colors.text, marginBottom: spacing.sm }]} numberOfLines={2}>
        {goal.title}
      </AppText>

      <View style={styles.metaRow}>
        <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Status</AppText>
        <AppText style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{statusLabel(goal.status)}</AppText>
      </View>
      <View style={styles.metaRow}>
        <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Priority</AppText>
        <AppText style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{goal.priority}</AppText>
      </View>
      <View style={styles.metaRow}>
        <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>Due</AppText>
        <AppText style={{ color: colors.text, fontSize: 13 }}>{formatDue(goal.dueDate)}</AppText>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.amountRow}>
          <AppText style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>Progress</AppText>
          <AppText style={{ color: colors.textSecondary, fontSize: 14 }}>
            {formatUsdFromString(goal.currentAmount)} / {formatUsdFromString(goal.targetAmount)}
          </AppText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
        </View>
        <AppText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          {pct.toFixed(0)}% of target
        </AppText>
      </View>

      <View style={styles.actions}>
        {!deleted ? (
          <>
            <Pressable onPress={onEdit} style={styles.actionBtn}>
              <AppText style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Edit</AppText>
            </Pressable>
            {segment === 'active' ? (
              <Pressable onPress={onArchive} style={styles.actionBtn}>
                <AppText style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Archive</AppText>
              </Pressable>
            ) : null}
            {segment === 'archived' ? (
              <Pressable onPress={onUnarchive} style={styles.actionBtn}>
                <AppText style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Unarchive</AppText>
              </Pressable>
            ) : null}
            {segment === 'completed' ? (
              <Pressable onPress={onArchive} style={styles.actionBtn}>
                <AppText style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Archive</AppText>
              </Pressable>
            ) : null}
            <Pressable onPress={onDelete} style={styles.actionBtn}>
              <AppText style={{ color: colors.danger, fontSize: 14, fontWeight: '600' }}>Delete</AppText>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={onRestore} style={styles.actionBtn}>
            <AppText style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Restore</AppText>
          </Pressable>
        )}
      </View>
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});
