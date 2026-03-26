import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export type SpendingAwarenessIllustrationProps = {
  /** Total width in dp */
  width?: number;
  /** Total height in dp */
  height?: number;
  /** Primary brand color (bars, focus ring) */
  accent: string;
  /** Card / panel fill */
  surface: string;
  /** Border and soft accents */
  muted: string;
};

/**
 * Vector illustration: spending bars + trend + focus “awareness” ring — reinforces habit tracking.
 */
export function SpendingAwarenessIllustration({
  width = 280,
  height = 120,
  accent,
  surface,
  muted,
}: SpendingAwarenessIllustrationProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 280 120"
      accessibilityRole="image"
      accessibilityLabel="Spending chart with an awareness focus — stay mindful of habits"
    >
      <Defs>
        <LinearGradient id="spendBarGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent} stopOpacity="1" />
          <Stop offset="1" stopColor={accent} stopOpacity="0.55" />
        </LinearGradient>
      </Defs>

      <Rect x="4" y="8" width="272" height="104" rx="14" fill={surface} stroke={muted} strokeWidth="1" />

      <Path
        d="M 28 54 Q 68 36 118 46"
        stroke={accent}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity={0.45}
      />

      <Rect x="28" y="64" width="18" height="36" rx="4" fill="url(#spendBarGrad)" />
      <Rect x="54" y="50" width="18" height="50" rx="4" fill="url(#spendBarGrad)" opacity={0.88} />
      <Rect x="80" y="58" width="18" height="42" rx="4" fill="url(#spendBarGrad)" opacity={0.72} />
      <Rect x="106" y="44" width="18" height="56" rx="4" fill="url(#spendBarGrad)" opacity={0.95} />

      <Circle cx="24" cy="28" r="3.5" fill={accent} opacity={0.3} />
      <Circle cx="40" cy="22" r="2.5" fill={accent} opacity={0.4} />
      <Circle cx="54" cy="26" r="3" fill={accent} opacity={0.25} />

      <G>
        <Circle cx="210" cy="60" r="24" fill="none" stroke={accent} strokeWidth="2" opacity={0.28} />
        <Circle cx="210" cy="60" r="15" fill="none" stroke={accent} strokeWidth="2.2" />
        <Circle cx="210" cy="60" r="5" fill={accent} />
      </G>
    </Svg>
  );
}
