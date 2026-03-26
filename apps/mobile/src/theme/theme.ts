/**
 * Design tokens — single source for spacing, type scale, and palettes.
 * Dark palette is stubbed for future useColorScheme wiring.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '600' as const },
  subtitle: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
};

export type ColorPalette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  danger: string;
  tabBar: string;
  tabBarBorder: string;
};

export const lightColors: ColorPalette = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0F4',
  text: '#111418',
  textSecondary: '#5C6570',
  border: '#D8DEE6',
  primary: '#1B6B93',
  danger: '#C0392B',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E6EC',
};

/** Placeholder — wire to Appearance / useColorScheme later. */
export const darkColors: ColorPalette = {
  background: '#0F1114',
  surface: '#1A1D22',
  surfaceMuted: '#242830',
  text: '#F2F4F7',
  textSecondary: '#9BA3AE',
  border: '#2E3440',
  primary: '#5DADE2',
  danger: '#EC7063',
  tabBar: '#1A1D22',
  tabBarBorder: '#2E3440',
};
