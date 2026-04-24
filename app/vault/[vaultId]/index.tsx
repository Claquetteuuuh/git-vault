import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Chip } from '@/components/ui/chip';
import { FAB } from '@/components/ui/fab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { radii, space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';
import { useVaultStore } from '@/store/vaults';
import { useSyncStore } from '@/store/sync';
import { listDirectory, writeNote, type VaultEntry } from '@/lib/vault-fs';
import { runFetch, runSync } from '@/lib/sync-controller';

export default function ExplorerScreen() {
  const theme = useTheme();
  const { vaultId, path = '' } = useLocalSearchParams<{ vaultId: string; path?: string }>();
  const getVault = useVaultStore((s) => s.getVault);
  const vault = getVault(vaultId);
  const activeSyncVaultId = useSyncStore((s) => s.activeVaultId);
  const syncStatus = useSyncStore((s) => s.status);
  const lastError = useSyncStore((s) => s.lastError);
  const isSyncing = activeSyncVaultId === vaultId;
  const isRoot = path === '';

  const [entries, setEntries] = useState<VaultEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listDirectory(vaultId, path);
      setEntries(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEntries([]);
    }
  }, [vaultId, path]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isRoot) return;
    // Lightweight check only — no commit, no push. Full sync is a manual action.
    runFetch(vaultId);
  }, [isRoot, vaultId]);

  useEffect(() => {
    if (!isRoot || !lastError || lastError.vaultId !== vaultId) return;
    Alert.alert('Sync error', lastError.message);
    useSyncStore.getState().clearError();
  }, [isRoot, lastError, vaultId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isRoot) await runSync(vaultId, { force: true });
    await load();
    setRefreshing(false);
  }, [load, isRoot, vaultId]);

  const openEntry = (entry: VaultEntry) => {
    if (entry.isDirectory) {
      router.push({
        pathname: '/vault/[vaultId]',
        params: { vaultId, path: entry.path },
      });
    } else if (entry.isMarkdown) {
      router.push({
        pathname: '/vault/[vaultId]/note',
        params: { vaultId, path: entry.path },
      });
    }
  };

  const onNewNote = useCallback(async () => {
    const slug = `untitled-${Date.now().toString(36)}.md`;
    const newPath = path ? `${path}/${slug}` : slug;
    try {
      await writeNote(vaultId, newPath, `# ${slug.replace(/\.md$/, '')}\n\n`);
      await load();
      router.push({
        pathname: '/vault/[vaultId]/note',
        params: { vaultId, path: newPath },
      });
    } catch (err) {
      Alert.alert('Could not create note', err instanceof Error ? err.message : String(err));
    }
  }, [vaultId, path, load]);

  const filtered = (entries ?? []).filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const title = path ? path.split('/').pop() ?? path : vault?.name ?? 'Vault';
  const subtitle = isRoot ? `${vault?.branch ?? 'main'} · ${formatSyncTime(vault?.lastSyncedAt)}` : path;

  return (
    <Screen edges={['top', 'bottom']} safe={true}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <IconSymbol name="chevron.left" size={22} color={theme.textDim} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: space[3] }}>
          <Text variant="bodyEm" color={theme.text} numberOfLines={1}>
            {title}
          </Text>
          <Text variant="monoSm" color={theme.muted} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Pressable
          onPress={() => isRoot && !isSyncing && runSync(vaultId, { force: true }).then(() => load())}
          hitSlop={12}
          disabled={!isRoot}
          style={{ opacity: isRoot ? 1 : 0.35 }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <View>
              <IconSymbol
                name="arrow.clockwise"
                size={22}
                color={vault?.dirty || vault?.remoteAhead ? theme.accent : theme.textDim}
              />
              {vault?.dirty ? (
                <View
                  style={[styles.badge, { backgroundColor: theme.warn, borderColor: theme.bg }]}
                />
              ) : vault?.remoteAhead ? (
                <View
                  style={[styles.badge, { backgroundColor: theme.accent, borderColor: theme.bg }]}
                />
              ) : null}
            </View>
          )}
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space[5], paddingTop: space[2] }}>
        <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
          <IconSymbol name="chevron.right" size={14} color={theme.muted} />
          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder="search in folder…"
            placeholderTextColor={theme.mutedDeep}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, color: theme.text, fontFamily: 'IBMPlexMono_500Medium', fontSize: 14 }}
          />
        </View>
      </View>

      {isSyncing ? (
        <View style={[styles.syncStrip, { backgroundColor: theme.accentSoft, borderColor: theme.accentDim }]}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text variant="foot" color={theme.accent}>
            {syncStatus || 'syncing…'}
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.syncStrip, { backgroundColor: theme.danger + '1F', borderColor: theme.danger + '55' }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={14} color={theme.danger} />
          <Text variant="foot" color={theme.danger} style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : null}

      {entries === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.path}
          contentContainerStyle={{ padding: space[4], gap: 4, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text variant="sub" color={theme.muted}>
                {filter ? 'No matching files.' : 'This folder is empty.'}
              </Text>
              {!filter ? (
                <Text variant="foot" color={theme.mutedDeep} style={{ marginTop: 4 }}>
                  Tap + to create your first note.
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openEntry(item)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed ? theme.raised : 'transparent',
                  borderColor: 'transparent',
                },
              ]}
            >
              <IconSymbol
                name={item.isDirectory ? 'folder.fill' : 'doc.text.fill'}
                size={18}
                color={item.isDirectory ? theme.accent : theme.textDim}
              />
              <Text
                variant="mono"
                color={theme.text}
                style={{ flex: 1 }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.isDirectory ? (
                <Chip label="folder" variant="ghost" mono />
              ) : item.isMarkdown ? null : (
                <Chip label={getExt(item.name)} variant="ghost" mono />
              )}
              <IconSymbol name="chevron.right" size={14} color={theme.mutedDeep} />
            </Pressable>
          )}
        />
      )}

      <FAB icon="plus" onPress={onNewNote} />
    </Screen>
  );
}

function getExt(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? 'file' : name.slice(idx + 1);
}

function formatSyncTime(ts: number | null | undefined): string {
  if (!ts) return 'not synced';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'synced just now';
  if (diff < 3_600_000) return `synced ${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `synced ${Math.round(diff / 3_600_000)}h ago`;
  return `synced ${Math.round(diff / 86_400_000)}d ago`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[3],
    gap: space[2],
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 44,
  },
  syncStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: space[5],
    marginTop: space[3],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[10],
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[3],
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 44,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
