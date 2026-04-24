import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function VaultLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = Colors[scheme];
  return (
    <Stack
      screenOptions={{
        // Every screen in the vault carries its own in-app header (back +
        // title + actions) built from the design system. Showing the native
        // Stack header on top produces a double-header that crops the real
        // content.
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    />
  );
}
