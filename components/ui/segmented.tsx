import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

export type SegmentedProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? theme.raised : 'transparent',
                borderColor: selected ? theme.border : 'transparent',
              },
            ]}
            hitSlop={4}
          >
            <Text
              variant="callout"
              color={selected ? theme.text : theme.muted}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm + 1,
    alignItems: 'center',
    borderWidth: 1,
  },
});
