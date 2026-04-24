import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LiquidPill } from '@/components/ui/liquid-pill';
import { MarkdownEditor, type MarkdownEditorRef } from '@/components/note-editor/markdown-editor';
import { radii, space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';
import { basename, readNote, writeNote } from '@/lib/vault-fs';
import { useVaultStore } from '@/store/vaults';

const SAVE_DEBOUNCE_MS = 600;
// Approximate rendered height of the two liquid-glass pills + their row padding.
const TOOLBAR_HEIGHT = 60;

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export default function NoteScreen() {
  const theme = useTheme();
  const { vaultId, path } = useLocalSearchParams<{ vaultId: string; path: string }>();

  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const draftRef = useRef<string>('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<MarkdownEditorRef>(null);

  // Track the real keyboard frame height so the toolbar can dock at the exact
  // top edge of the keyboard, not at some KeyboardAvoidingView guess.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const txt = await readNote(vaultId, path);
      draftRef.current = txt;
      setOriginal(txt);
      setSaveState('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [vaultId, path]);

  useEffect(() => {
    load();
  }, [load]);

  const flushSave = useCallback(
    async (contents: string) => {
      try {
        setSaveState('saving');
        await writeNote(vaultId, path, contents);
        // Track this specific path as dirty so the sync flow can commit
        // only it, not re-scan the entire working tree.
        await useVaultStore.getState().addDirtyPath(vaultId, path);
        setSaveState('saved');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setSaveState('error');
      }
    },
    [vaultId, path],
  );

  const onChangeFromEditor = useCallback(
    (text: string) => {
      draftRef.current = text;
      setSaveState('dirty');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flushSave(text), SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const onBack = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (draftRef.current !== original && original !== null) {
      await flushSave(draftRef.current);
    }
    router.back();
  }, [original, flushSave]);

  const filename = basename(path);
  const title = filename.replace(/\.md$/i, '');

  // Toolbar wires to the WebView editor — CM6 owns the cursor + history.
  const toolbarActions = {
    onUndo: () => editorRef.current?.undo(),
    onRedo: () => editorRef.current?.redo(),
    onH1: () => editorRef.current?.prefixLine('# '),
    onBold: () => editorRef.current?.wrap('**', '**', 'bold'),
    onItalic: () => editorRef.current?.wrap('*', '*', 'italic'),
    onList: () => editorRef.current?.prefixLine('- '),
    onLink: () => editorRef.current?.wrap('[', '](url)', 'text'),
    onCode: () => editorRef.current?.wrap('`', '`', 'code'),
    onDismiss: () => {
      editorRef.current?.blur();
      Keyboard.dismiss();
    },
  };

  return (
    <Screen edges={['top']} safe={true}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <IconSymbol name="chevron.left" size={22} color={theme.textDim} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: space[3] }}>
          <Text variant="bodyEm" color={theme.text} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <StatusDot state={saveState} />
        </View>
      </View>

      {error ? (
        <View style={[styles.errorBar, { borderColor: theme.danger, backgroundColor: theme.danger + '1F' }]}>
          <Text variant="sub" color={theme.danger}>
            {error}
          </Text>
        </View>
      ) : null}

      {original === null && !error ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/*
            Wrapper shrinks the editor's frame so its bottom edge is just
            above the floating toolbar + keyboard. CodeMirror handles its
            own caret-tracking inside that frame.
          */}
          <View
            style={{
              flex: 1,
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + TOOLBAR_HEIGHT : 0,
            }}
          >
            <MarkdownEditor
              ref={editorRef}
              initialValue={original ?? ''}
              onChange={onChangeFromEditor}
            />
          </View>
          {keyboardHeight > 0 ? (
            <View
              pointerEvents="box-none"
              style={[styles.toolbarOverlay, { bottom: keyboardHeight }]}
            >
              <FloatingToolbar {...toolbarActions} />
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function StatusDot({ state }: { state: SaveState }) {
  const theme = useTheme();
  const { color, size } = (() => {
    switch (state) {
      case 'dirty':
        return { color: theme.warn, size: 7 };
      case 'saving':
        return { color: theme.accent, size: 7 };
      case 'saved':
        return { color: theme.success, size: 6 };
      case 'error':
        return { color: theme.danger, size: 7 };
      default:
        return { color: 'transparent', size: 7 };
    }
  })();
  return <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />;
}

type ToolbarActions = {
  onUndo: () => void;
  onRedo: () => void;
  onH1: () => void;
  onBold: () => void;
  onItalic: () => void;
  onList: () => void;
  onLink: () => void;
  onCode: () => void;
  onDismiss: () => void;
};

function FloatingToolbar(props: ToolbarActions) {
  const theme = useTheme();

  const IconBtn = ({
    icon,
    letter,
    onPress,
  }: {
    icon?: Parameters<typeof IconSymbol>[0]['name'];
    letter?: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.pillBtn, { opacity: pressed ? 0.6 : 1 }]}
    >
      {icon ? (
        <IconSymbol name={icon} size={18} color={theme.text} />
      ) : (
        <Text
          style={{
            color: theme.text,
            fontSize: 15,
            fontWeight: '600',
            width: 18,
            textAlign: 'center',
          }}
        >
          {letter}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.toolbarRow} pointerEvents="box-none">
      <LiquidPill style={styles.toolbarPill} radius={22}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.toolbarRowInner}
        >
          <IconBtn icon="arrow.uturn.backward" onPress={props.onUndo} />
          <IconBtn icon="arrow.uturn.forward" onPress={props.onRedo} />
          <IconBtn letter="H" onPress={props.onH1} />
          <IconBtn letter="B" onPress={props.onBold} />
          <IconBtn letter="I" onPress={props.onItalic} />
          <IconBtn icon="list.bullet" onPress={props.onList} />
          <IconBtn icon="link" onPress={props.onLink} />
          <IconBtn icon="chevron.left.forwardslash.chevron.right" onPress={props.onCode} />
        </ScrollView>
      </LiquidPill>
      <LiquidPill style={styles.dismissPill} radius={22}>
        <Pressable
          onPress={props.onDismiss}
          hitSlop={6}
          style={({ pressed }) => [styles.pillBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <IconSymbol name="keyboard.chevron.compact.down" size={20} color={theme.text} />
        </Pressable>
      </LiquidPill>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[2],
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space[6] },
  errorBar: {
    marginHorizontal: space[5],
    marginTop: space[2],
    padding: space[3],
    borderWidth: 1,
    borderRadius: radii.md,
  },
  dot: { marginRight: 2 },
  toolbarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  toolbarPill: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  toolbarRowInner: {
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
    height: 44,
  },
  dismissPill: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  pillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
