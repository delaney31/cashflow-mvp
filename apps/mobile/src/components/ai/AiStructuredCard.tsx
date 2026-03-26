import { StyleSheet, View } from 'react-native';
import { AppText } from '@cashflow/ui';
import type { AiStructuredExplanation } from '../../api/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { radii, spacing, typography } from '../../theme/theme';

type Props = {
  structured: AiStructuredExplanation;
};

export function AiStructuredCard({ structured }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <AppText style={[typography.subtitle, { color: colors.text, marginBottom: spacing.sm }]}>{structured.headline}</AppText>

      <AppText style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Highlights</AppText>
      {structured.keyPoints.map((p, i) => (
        <View key={i} style={styles.bulletRow}>
          <AppText style={{ color: colors.primary, marginRight: 8, marginTop: 2 }}>•</AppText>
          <AppText style={{ color: colors.text, fontSize: 15, flex: 1, lineHeight: 22 }}>{p}</AppText>
        </View>
      ))}

      {structured.cautions?.length ? (
        <>
          <AppText style={[styles.sectionLabel, { color: colors.danger }]}>Cautions</AppText>
          {structured.cautions.map((c, i) => (
            <View key={i} style={styles.bulletRow}>
              <AppText style={{ color: colors.danger, marginRight: 8 }}>!</AppText>
              <AppText style={{ color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>{c}</AppText>
            </View>
          ))}
        </>
      ) : null}

      {structured.nextSteps?.length ? (
        <>
          <AppText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Next steps</AppText>
          {structured.nextSteps.map((c, i) => (
            <View key={i} style={styles.bulletRow}>
              <AppText style={{ color: colors.primary, marginRight: 8 }}>→</AppText>
              <AppText style={{ color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>{c}</AppText>
            </View>
          ))}
        </>
      ) : null}

      <AppText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Summary</AppText>
      <AppText style={{ color: colors.text, fontSize: 15, lineHeight: 24 }}>{structured.narrative}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
});
