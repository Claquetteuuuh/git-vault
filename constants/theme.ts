import { Platform, type TextStyle, type ViewStyle } from 'react-native';

// -- Color tokens -------------------------------------------------------------

const darkPalette: ThemeColors = {
  bg: '#0E1113',
  surface: '#16191C',
  raised: '#1D2125',
  border: '#272B30',
  borderSoft: '#1F2327',
  text: '#E6E8EB',
  textDim: '#B4B9C0',
  muted: '#8A9099',
  mutedDeep: '#5E646C',
  accent: '#4BD9C9',
  accentSoft: '#4BD9C924',
  accentDim: '#4BD9C98C',
  success: '#57D9A3',
  warn: '#D9B04B',
  danger: '#E07474',
  onAccent: '#041013',
  // -- Legacy aliases (for not-yet-migrated files) --
  background: '#0E1113',
  backgroundAlt: '#16191C',
  tint: '#4BD9C9',
  icon: '#B4B9C0',
  textMuted: '#8A9099',
};

const lightPalette: ThemeColors = {
  bg: '#FFFFFF',
  surface: '#F6F7F8',
  raised: '#EEF0F2',
  border: '#E3E5E7',
  borderSoft: '#EDEFF1',
  text: '#1A1C1E',
  textDim: '#3B4045',
  muted: '#6B7078',
  mutedDeep: '#9AA0A7',
  accent: '#2BA99A',
  accentSoft: '#2BA99A1F',
  accentDim: '#2BA99A99',
  success: '#1B9467',
  warn: '#AB8425',
  danger: '#C04343',
  onAccent: '#FFFFFF',
  // -- Legacy aliases --
  background: '#FFFFFF',
  backgroundAlt: '#F6F7F8',
  tint: '#2BA99A',
  icon: '#3B4045',
  textMuted: '#6B7078',
};

export type ThemeColors = {
  bg: string;
  surface: string;
  raised: string;
  border: string;
  borderSoft: string;
  text: string;
  textDim: string;
  muted: string;
  mutedDeep: string;
  accent: string;
  accentSoft: string;
  accentDim: string;
  success: string;
  warn: string;
  danger: string;
  onAccent: string;
  background: string;
  backgroundAlt: string;
  tint: string;
  icon: string;
  textMuted: string;
};

export const Colors = {
  dark: darkPalette,
  light: lightPalette,
};

// -- Typography --------------------------------------------------------------

type TypeEntry = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'fontFamily'
>;

export const type = {
  display: { fontSize: 34, lineHeight: 44, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  h1: { fontSize: 22, lineHeight: 30, fontWeight: '600', letterSpacing: -0.3 },
  h2: { fontSize: 18, lineHeight: 26, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyEm: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  callout: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  sub: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  foot: { fontSize: 12, lineHeight: 18, fontWeight: '500', letterSpacing: 0.2 },
  caps: { fontSize: 11, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8 },
  mono: { fontSize: 13, lineHeight: 20, fontWeight: '500', fontFamily: 'IBMPlexMono_500Medium' },
  monoSm: { fontSize: 11, lineHeight: 16, fontWeight: '500', fontFamily: 'IBMPlexMono_500Medium' },
} satisfies Record<string, TypeEntry>;

// -- Spacing (4pt grid) ------------------------------------------------------

export const space = {
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  14: 56,
} as const;

// -- Radii -------------------------------------------------------------------

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 9999,
} as const;

// -- Shadows -----------------------------------------------------------------

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 48,
    elevation: 12,
  },
} satisfies Record<string, ShadowStyle>;

// Glow requires a color — only makes sense on iOS. Callers pass the tint.
export function glow(color: string): ShadowStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.65 : 0,
    shadowRadius: 18,
    elevation: 0,
  };
}

// -- Motion ------------------------------------------------------------------

export const motion = {
  fast: 160,
  base: 220,
  slow: 340,
  springEasing: [0.34, 1.56, 0.64, 1] as const,
} as const;

// -- Legacy alias (kept for files still importing Fonts) ---------------------

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "'IBM Plex Mono', SFMono-Regular, Menlo, Consolas, monospace",
  },
});
