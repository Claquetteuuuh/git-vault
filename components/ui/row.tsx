import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

type IconName = Parameters<typeof IconSymbol>[0]['name'];

export type RowProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  subtitle?: string;
  leadingIcon?: IconName;
  leadingAccent?: boolean;
  trailing?: 'chevron' | 'none' | React.ReactNode;
  active?: boolean;
};

export function Row({
  title,
  subtitle,
  leadingIcon,
  leadingAccent = true,
  trailing = 'chevron',
  active,
  onPress,
  ...rest
}: RowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      {...rest}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: active ? theme.accentSoft : pressed ? theme.raised : 'transparent',
          borderColor: active ? theme.accentDim : 'transparent',
          borderWidth: active ? 1 : 0,
        },
      ]}
    >
      {leadingIcon ? (
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: leadingAccent ? theme.accentSoft : theme.surface,
            },
          ]}
        >
          <IconSymbol
            name={leadingIcon}
            size={18}
            color={leadingAccent ? theme.accent : theme.textDim}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="callout" color={theme.text}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="sub" color={theme.muted}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing === 'chevron' ? (
        <IconSymbol name="chevron.right" size={16} color={theme.muted} />
      ) : trailing === 'none' ? null : (
        trailing
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
    borderRadius: radii.md,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});
