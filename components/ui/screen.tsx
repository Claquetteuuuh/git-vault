import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme-color';

export type ScreenProps = ViewProps & {
  edges?: Edge[];
  safe?: boolean;
};

export function Screen({
  children,
  edges = ['top', 'bottom'],
  safe = true,
  style,
  ...rest
}: ScreenProps) {
  const theme = useTheme();
  const content = (
    <View style={[styles.flex, { backgroundColor: theme.bg }, style]} {...rest}>
      {children}
    </View>
  );
  if (!safe) return content;
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: theme.bg }]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
