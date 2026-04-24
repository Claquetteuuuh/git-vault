import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { radii, type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

type IconName = Parameters<typeof IconSymbol>[0]['name'];
export type ChipVariant = 'default' | 'accent' | 'warn' | 'danger' | 'success' | 'ghost';

export type ChipProps = {
  label: string;
  variant?: ChipVariant;
  leadingIcon?: IconName;
  mono?: boolean;
};

export function Chip({ label, variant = 'default', leadingIcon, mono = true }: ChipProps) {
  const theme = useTheme();
  const { bg, border, color } = resolveVariant(variant, theme);
  return (
    <View style={[styles.base, { backgroundColor: bg, borderColor: border }]}>
      {leadingIcon ? <IconSymbol name={leadingIcon} size={12} color={color} /> : null}
      <Text style={[mono ? type.monoSm : type.foot, { color }]}>{label}</Text>
    </View>
  );
}

function resolveVariant(v: ChipVariant, theme: ReturnType<typeof useTheme>) {
  switch (v) {
    case 'default':
      return { bg: theme.raised, border: theme.borderSoft, color: theme.textDim };
    case 'accent':
      return { bg: theme.accentSoft, border: theme.accentDim, color: theme.accent };
    case 'warn':
      return { bg: theme.warn + '1F', border: theme.warn + '55', color: theme.warn };
    case 'danger':
      return { bg: theme.danger + '1F', border: theme.danger + '55', color: theme.danger };
    case 'success':
      return { bg: theme.success + '1F', border: theme.success + '55', color: theme.success };
    case 'ghost':
      return { bg: 'transparent', border: theme.borderSoft, color: theme.muted };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
