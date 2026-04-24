import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

export function SectionHeader({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <Text variant="caps" color={theme.muted}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function SectionCard({ style, children }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderSoft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionDivider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.borderSoft }} />;
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 22,
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
});
