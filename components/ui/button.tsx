import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { glow, radii, type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'md' | 'lg';

type IconName = Parameters<typeof IconSymbol>[0]['name'];

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  leadingIcon,
  trailingIcon,
  loading,
  disabled,
  fullWidth = true,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const height = size === 'lg' ? 54 : 48;
  const { bg, color, border, withGlow } = resolveVariant(variant, theme);

  return (
    <Pressable
      {...rest}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          minHeight: 44,
          backgroundColor: bg,
          borderColor: border ?? undefined,
          borderWidth: border ? 1 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        withGlow ? glow(theme.accent) : null,
      ]}
      hitSlop={6}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={color} />
        ) : (
          <>
            {leadingIcon ? <IconSymbol name={leadingIcon} size={18} color={color} /> : null}
            <Text variant="bodyEm" style={[type.bodyEm, { color }]}>
              {label}
            </Text>
            {trailingIcon ? <IconSymbol name={trailingIcon} size={18} color={color} /> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

function resolveVariant(
  v: ButtonVariant,
  theme: ReturnType<typeof useTheme>,
): { bg: string; color: string; border: string | null; withGlow: boolean } {
  switch (v) {
    case 'primary':
      return { bg: theme.accent, color: theme.onAccent, border: null, withGlow: true };
    case 'secondary':
      return { bg: theme.raised, color: theme.text, border: theme.borderSoft, withGlow: false };
    case 'ghost':
      return { bg: 'transparent', color: theme.textDim, border: null, withGlow: false };
    case 'destructive':
      return { bg: 'transparent', color: theme.danger, border: theme.danger, withGlow: false };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
