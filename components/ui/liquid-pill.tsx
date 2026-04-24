import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { radii } from '@/constants/theme';
import { useColorSchemeName, useTheme } from '@/hooks/use-theme-color';

export type LiquidPillProps = ViewProps & {
  /** Rounded corner radius. Defaults to fully pill-shaped. */
  radius?: number;
  /** Intensity of the blur (0-100). iOS only. Default 60. */
  intensity?: number;
  padded?: boolean;
};

/**
 * Floating "liquid glass" container — a rounded pill with a blurred,
 * translucent background. Matches the pattern Obsidian uses for its editor
 * toolbar and navigation bars on iOS.
 *
 * IMPLEMENTATION: The shell View has a solid translucent backgroundColor
 * (dark-mode surface at ~85% on iOS, ~92% on Android) so the pill is never
 * invisible if BlurView silently fails (e.g. some contexts in Expo Go).
 * On iOS, a BlurView is overlaid via `StyleSheet.absoluteFill` to provide
 * the real Liquid Glass effect on top of the solid fallback.
 */
export function LiquidPill({
  children,
  style,
  radius = radii.pill,
  intensity = 60,
  padded = false,
  ...rest
}: LiquidPillProps) {
  const theme = useTheme();
  const scheme = useColorSchemeName();

  const fallbackBg =
    scheme === 'dark'
      ? Platform.OS === 'ios'
        ? 'rgba(22,25,28,0.82)'
        : 'rgba(22,25,28,0.94)'
      : Platform.OS === 'ios'
        ? 'rgba(255,255,255,0.82)'
        : 'rgba(255,255,255,0.94)';

  return (
    <View
      {...rest}
      style={[
        styles.container,
        {
          borderRadius: radius,
          borderColor: theme.borderSoft,
          padding: padded ? 6 : 0,
          backgroundColor: fallbackBg,
        },
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      ) : null}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
