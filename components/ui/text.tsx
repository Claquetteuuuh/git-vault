import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

export type TypeVariant = keyof typeof type;

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  color?: string;
  caps?: boolean;
};

export function Text({
  variant = 'body',
  color,
  caps,
  style,
  children,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const base = type[variant] as TextStyle;
  const upper = caps ? String(children).toUpperCase() : children;
  return (
    <RNText
      style={[base, { color: color ?? theme.text }, style]}
      {...rest}
    >
      {upper as React.ReactNode}
    </RNText>
  );
}
