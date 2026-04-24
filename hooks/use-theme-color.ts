import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors,
) {
  const theme = useColorScheme() ?? 'dark';
  const colorFromProps = props[theme];
  if (colorFromProps) return colorFromProps;
  return Colors[theme][colorName];
}

export function useTheme(): ThemeColors {
  const theme = useColorScheme() ?? 'dark';
  return Colors[theme];
}

export function useColorSchemeName() {
  return useColorScheme() ?? 'dark';
}
