import { forwardRef, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useTheme } from '@/hooks/use-theme-color';
import { buildEditorHtml, type ThemeForEditor } from './editor-html';

export type MarkdownEditorRef = {
  focus: () => void;
  blur: () => void;
  undo: () => void;
  redo: () => void;
  wrap: (before: string, after: string, placeholder?: string) => void;
  prefixLine: (prefix: string) => void;
};

export type MarkdownEditorProps = {
  /** Initial document content. The editor takes over from here on. */
  initialValue: string;
  onChange: (text: string) => void;
  onReady?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const MarkdownEditor = forwardRef(function MarkdownEditorImpl(
  props: MarkdownEditorProps,
  ref: Ref<MarkdownEditorRef>,
) {
  const theme = useTheme();
  const webviewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const queueRef = useRef<unknown[]>([]);

  const editorTheme: ThemeForEditor = useMemo(
    () => ({
      bg: theme.bg,
      text: theme.text,
      textDim: theme.textDim,
      muted: theme.muted,
      mutedDeep: theme.mutedDeep,
      accent: theme.accent,
      accentSoft: theme.accentSoft,
      surface: theme.surface,
      borderSoft: theme.borderSoft,
    }),
    [theme],
  );

  // Build the HTML once per (theme, initialValue) — note that initialValue
  // changes only when navigating between notes, which is when we want to
  // re-bootstrap the editor anyway.
  const html = useMemo(
    () => buildEditorHtml({ value: props.initialValue, theme: editorTheme }),
    [props.initialValue, editorTheme],
  );

  const send = (msg: unknown) => {
    if (!isReadyRef.current) {
      queueRef.current.push(msg);
      return;
    }
    const safe = JSON.stringify(JSON.stringify(msg));
    webviewRef.current?.injectJavaScript(`window.__editor_handle && window.__editor_handle(${safe}); true;`);
  };

  useImperativeHandle(ref, () => ({
    focus: () => send({ type: 'focus' }),
    blur: () => send({ type: 'blur' }),
    undo: () => send({ type: 'undo' }),
    redo: () => send({ type: 'redo' }),
    wrap: (before, after, placeholder) => send({ type: 'wrap', before, after, placeholder }),
    prefixLine: (prefix) => send({ type: 'prefixLine', prefix }),
  }));

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: { type: string; [k: string]: unknown };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'ready':
        isReadyRef.current = true;
        // Flush any queued messages.
        const queue = queueRef.current;
        queueRef.current = [];
        for (const m of queue) {
          const safe = JSON.stringify(JSON.stringify(m));
          webviewRef.current?.injectJavaScript(
            `window.__editor_handle && window.__editor_handle(${safe}); true;`,
          );
        }
        props.onReady?.();
        break;
      case 'change':
        if (typeof msg.text === 'string') props.onChange(msg.text);
        break;
      case 'error':
        // Surface to console for debugging — non-fatal.
        // eslint-disable-next-line no-console
        console.warn('[markdown-editor]', msg.message);
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }, props.style]}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView
        automaticallyAdjustContentInsets={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={[styles.webview, { backgroundColor: theme.bg }]}
        // Allow the WebView to access esm.sh for CodeMirror modules.
        mixedContentMode="always"
        // Faster boot, no cache headaches during dev.
        cacheEnabled
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
