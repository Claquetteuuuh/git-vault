import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useTheme } from '@/hooks/use-theme-color';

export function MarkdownViewer({ source }: { source: string }) {
  const theme = useTheme();

  const styles = {
    body: { color: theme.textDim, fontSize: 16, lineHeight: 26, letterSpacing: -0.1 },
    heading1: {
      color: theme.text,
      fontSize: 30,
      lineHeight: 38,
      fontWeight: '700',
      letterSpacing: -0.4,
      marginTop: 16,
      marginBottom: 10,
    },
    heading2: {
      color: theme.text,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: '600',
      letterSpacing: -0.2,
      marginTop: 18,
      marginBottom: 8,
    },
    heading3: {
      color: theme.text,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600',
      marginTop: 14,
      marginBottom: 6,
    },
    heading4: { color: theme.text, fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 12 },
    paragraph: { color: theme.textDim, marginTop: 0, marginBottom: 14 },
    link: { color: theme.accent },
    strong: { fontWeight: '700', color: theme.text },
    em: { fontStyle: 'italic' as const, color: theme.text },
    blockquote: {
      backgroundColor: theme.surface,
      borderLeftWidth: 3,
      borderLeftColor: theme.accent,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginVertical: 12,
    },
    code_inline: {
      backgroundColor: theme.surface,
      color: theme.accent,
      fontFamily: 'IBMPlexMono_500Medium',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 14,
    },
    code_block: {
      backgroundColor: theme.surface,
      color: theme.text,
      fontFamily: 'IBMPlexMono_500Medium',
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      fontSize: 13,
      lineHeight: 20,
    },
    fence: {
      backgroundColor: theme.surface,
      color: theme.text,
      fontFamily: 'IBMPlexMono_500Medium',
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      fontSize: 13,
      lineHeight: 20,
      marginVertical: 12,
    },
    bullet_list: { marginBottom: 12 },
    ordered_list: { marginBottom: 12 },
    list_item: { marginVertical: 2 },
    hr: { backgroundColor: theme.border, height: 1, marginVertical: 20 },
    table: { borderColor: theme.border, borderWidth: 1, borderRadius: 8, marginVertical: 12 },
    thead: { backgroundColor: theme.surface },
    th: { color: theme.text, padding: 10, fontWeight: '600' },
    tr: { borderColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
    td: { color: theme.textDim, padding: 10 },
    image: { borderRadius: 8, marginVertical: 10 },
  };

  return <Markdown style={styles as Record<string, object>}>{source}</Markdown>;
}
