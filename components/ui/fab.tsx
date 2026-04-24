import { Pressable, StyleSheet } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { glow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

type IconName = Parameters<typeof IconSymbol>[0]['name'];

export function FAB({ icon, onPress }: { icon: IconName; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.accent, opacity: pressed ? 0.9 : 1 },
        glow(theme.accent),
      ]}
      hitSlop={12}
    >
      <IconSymbol name={icon} size={24} color={theme.onAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
});
