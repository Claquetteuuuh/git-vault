import { LinearGradient } from 'expo-linear-gradient';
import { View, type ViewProps } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

type IconName = Parameters<typeof IconSymbol>[0]['name'];

export type IconTileProps = ViewProps & {
  icon: IconName;
  size?: number;
  gradient?: [string, string];
  bg?: string;
  iconColor?: string;
  iconSize?: number;
};

export function IconTile({
  icon,
  size = 44,
  gradient,
  bg,
  iconColor,
  iconSize,
  style,
  ...rest
}: IconTileProps) {
  const theme = useTheme();
  const innerSize = iconSize ?? Math.round(size * 0.5);
  const color = iconColor ?? '#fff';
  const r = Math.max(10, Math.round(size * 0.28));

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          { width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
        {...rest}
      >
        <IconSymbol name={icon} size={innerSize} color={color} />
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: bg ?? theme.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      {...rest}
    >
      <IconSymbol name={icon} size={innerSize} color={color} />
    </View>
  );
}

// A deterministic gradient from a repo name — used to color vault tiles.
export function gradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const hue2 = (hue + 35) % 360;
  const c1 = `hsl(${hue} 65% 55%)`;
  const c2 = `hsl(${hue2} 75% 40%)`;
  return [c1, c2];
}
