import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LiquidPill } from '@/components/ui/liquid-pill';
import { MarkdownViewer } from '@/components/markdown-viewer';
import { radii, space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';
import { basename, readNote, writeNote } from '@/lib/vault-fs';
import { splitFrontmatter } from '@/lib/frontmatter';
import { useVaultStore } from '@/store/vaults';

const SAVE_DEBOUNCE_MS = 600;

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export default function NoteScreen() {
  const theme = useTheme();
  const { vaultId, path } = useLocalSearchParams<{ vaultId: string; path: string }>();

  const [original, setOriginal] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotTime = useRef(0);
  const inputRef = useRef<TextInput>(null);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // Track the real keyboard frame height so the toolbar can dock at the exact
  // top edge of the keyboard, bypassing KeyboardAvoidingView's quirks.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const txt = await readNote(vaultId, path);
      setOriginal(txt);
      setDraft(txt);
      setUndoStack([]);
      setRedoStack([]);
      lastSnapshotTime.current = 0;
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
        setOriginal(contents);
        await useVaultStore.getState().updateVault(vaultId, { dirty: true });
        setSaveState('saved');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setSaveState('error');
      }
    },
    [vaultId, path],
  );

  const onChangeDraft = useCallback(
    (text: string) => {
      setDraft((prev) => {
        // Snapshot the previous state for undo, at most every 800 ms so each
        // burst of typing becomes one undo step (rather than one per keypress).
        const now = Date.now();
        if (now - lastSnapshotTime.current > 800 && prev !== text) {
          lastSnapshotTime.current = now;
          setUndoStack((s) => [...s, prev].slice(-100));
          setRedoStack((r) => (r.length ? [] : r));
        }
        return text;
      });
      setSaveState('dirty');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flushSave(text), SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const prev = stack[stack.length - 1];
      setRedoStack((r) => [...r, draft]);
      setDraft(prev);
      lastSnapshotTime.current = 0;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flushSave(prev), SAVE_DEBOUNCE_MS);
      setSaveState('dirty');
      return stack.slice(0, -1);
    });
  }, [draft, flushSave]);

  const redo = useCallback(() => {
    setRedoStack((stack) => {
      if (stack.length === 0) return stack;
      const next = stack[stack.length - 1];
      setUndoStack((u) => [...u, draft]);
      setDraft(next);
      lastSnapshotTime.current = 0;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flushSave(next), SAVE_DEBOUNCE_MS);
      setSaveState('dirty');
      return stack.slice(0, -1);
    });
  }, [draft, flushSave]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const enterEdit = useCallback(() => {
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const commitAndExit = useCallback(async () => {
    if (draft !== original) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await flushSave(draft);
    }
    inputRef.current?.blur();
    setEditing(false);
  }, [draft, original, flushSave]);

  const wrap = useCallback(
    (before: string, after: string, placeholder = 'text') => {
      const { start, end } = selection;
      const selected = draft.slice(start, end);
      const inner = selected || placeholder;
      const insert = before + inner + after;
      const next = draft.slice(0, start) + insert + draft.slice(end);
      onChangeDraft(next);
      const newStart = start + before.length;
      const newEnd = newStart + inner.length;
      requestAnimationFrame(() => {
        inputRef.current?.setNativeProps({ selection: { start: newStart, end: newEnd } });
      });
      setSelection({ start: newStart, end: newEnd });
    },
    [draft, selection, onChangeDraft],
  );

  const prefixLine = useCallback(
    (prefix: string) => {
      const { start } = selection;
      const lineStart = draft.lastIndexOf('\n', start - 1) + 1;
      const next = draft.slice(0, lineStart) + prefix + draft.slice(lineStart);
      onChangeDraft(next);
      const newPos = start + prefix.length;
      requestAnimationFrame(() => {
        inputRef.current?.setNativeProps({ selection: { start: newPos, end: newPos } });
      });
      setSelection({ start: newPos, end: newPos });
    },
    [draft, selection, onChangeDraft],
  );

  const filename = basename(path);
  const title = filename.replace(/\.md$/i, '');
  const body = original === null ? '' : splitFrontmatter(draft).body;

  const toolbarActions = {
    onUndo: undo,
    onRedo: redo,
    canUndo,
    canRedo,
    onH1: () => prefixLine('# '),
    onBold: () => wrap('**', '**', 'bold'),
    onItalic: () => wrap('*', '*', 'italic'),
    onList: () => prefixLine('- '),
    onLink: () => wrap('[', '](url)', 'text'),
    onCode: () => wrap('`', '`', 'code'),
    onDone: commitAndExit,
  };

  return (
    <Screen edges={['top']} safe={true}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (editing) commitAndExit();
            else router.back();
          }}
          hitSlop={12}
        >
          <IconSymbol
            name={editing ? 'checkmark' : 'chevron.left'}
            size={22}
            color={editing ? theme.accent : theme.textDim}
          />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: space[3] }}>
          <Text variant="bodyEm" color={theme.text} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <StatusDot state={saveState} />
          {!editing ? (
            <Pressable onPress={enterEdit} hitSlop={12} style={{ marginLeft: space[3] }}>
              <IconSymbol name="pencil" size={20} color={theme.textDim} />
            </Pressable>
          ) : null}
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
      ) : editing ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.editScroll,
              // Leave room at the bottom of the text for the keyboard + the
              // floating toolbar so the cursor never ends up hidden.
              { paddingBottom: keyboardHeight + 80 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={onChangeDraft}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              multiline
              autoCapitalize="sentences"
              autoCorrect
              textAlignVertical="top"
              placeholder="Start writing…"
              placeholderTextColor={theme.mutedDeep}
              selectionColor={theme.accent}
              style={[styles.editor, { color: theme.text }]}
            />
          </ScrollView>
          <View
            pointerEvents="box-none"
            style={[styles.toolbarOverlay, { bottom: keyboardHeight }]}
          >
            <FloatingToolbar {...toolbarActions} />
          </View>
        </View>
      ) : (
        // Read mode: the ScrollView handles scrolling. A Pressable inside the
        // contentContainer catches a TAP on the rendered content without
        // eating scroll gestures (scroll = drag, tap = quick touch).
        <ScrollView contentContainerStyle={styles.readScroll}>
          <Pressable onPress={enterEdit} style={{ minHeight: '100%' }}>
            {body.trim() ? (
              <MarkdownViewer source={body} />
            ) : (
              <Text variant="body" color={theme.mutedDeep}>
                Empty note. Tap to start writing.
              </Text>
            )}
          </Pressable>
        </ScrollView>
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
  canUndo: boolean;
  canRedo: boolean;
  onH1: () => void;
  onBold: () => void;
  onItalic: () => void;
  onList: () => void;
  onLink: () => void;
  onCode: () => void;
  onDone: () => void;
};

function FloatingToolbar(props: ToolbarActions) {
  const theme = useTheme();

  const IconBtn = ({
    icon,
    letter,
    onPress,
    disabled,
  }: {
    icon?: Parameters<typeof IconSymbol>[0]['name'];
    letter?: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={disabled ? undefined : onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.pillBtn,
        { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
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
          <IconBtn icon="arrow.uturn.backward" onPress={props.onUndo} disabled={!props.canUndo} />
          <IconBtn icon="arrow.uturn.forward" onPress={props.onRedo} disabled={!props.canRedo} />
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
          onPress={props.onDone}
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
  readScroll: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[14],
    flexGrow: 1,
  },
  editScroll: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[8],
    flexGrow: 1,
  },
  editor: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    minHeight: 300,
  },
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
