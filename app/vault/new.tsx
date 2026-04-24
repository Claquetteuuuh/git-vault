import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { IconTile, gradientForName } from '@/components/ui/icon-tile';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { glow, radii, space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';
import { useAuthStore } from '@/store/auth';
import { useVaultStore } from '@/store/vaults';
import { cloneVault, listUserRepos, parseRepoUrl, type RepoSummary } from '@/lib/git';
import type { Vault } from '@/lib/types';

type Tab = 'repos' | 'url';

function makeVaultId(owner: string, repo: string): string {
  return `${owner}-${repo}-${Date.now().toString(36)}`;
}

export default function AddVaultScreen() {
  const theme = useTheme();
  const token = useAuthStore((s) => s.token);
  const addVault = useVaultStore((s) => s.addVault);

  const [tab, setTab] = useState<Tab>('repos');
  const [repos, setRepos] = useState<RepoSummary[] | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [filter, setFilter] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selected, setSelected] = useState<RepoSummary | null>(null);
  const [cloning, setCloning] = useState<{
    name: string;
    status: string;
    percent: number;
    indeterminate: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingRepos(true);
        const list = await listUserRepos(token);
        if (!cancelled) setRepos(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoadingRepos(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const startClone = useCallback(
    async (params: { owner: string; repo: string; branch: string; cloneUrl: string; htmlUrl: string }) => {
      if (!token) {
        setError('Not authenticated');
        return;
      }
      setError(null);
      setCloning({ name: params.repo, status: 'Resolving refs…', percent: 0, indeterminate: false });

      // Once network progress hits 100%, isomorphic-git enters checkout (writing
      // files to expo-file-system one by one). That phase emits no progress, so
      // we flip to an indeterminate "finalising" state after a short quiet period.
      let finalisingTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleFinalising = () => {
        if (finalisingTimer) clearTimeout(finalisingTimer);
        finalisingTimer = setTimeout(() => {
          setCloning((c) =>
            c
              ? {
                  ...c,
                  status: 'Writing files to disk — this is slower on mobile…',
                  indeterminate: true,
                }
              : c,
          );
        }, 3000);
      };

      const vaultId = makeVaultId(params.owner, params.repo);
      try {
        await cloneVault(vaultId, {
          cloneUrl: params.cloneUrl,
          branch: params.branch,
          token,
          depth: 1,
          onProgress: (phase, loaded, total) => {
            const percent =
              total && loaded ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
            setCloning({ name: params.repo, status: phase, percent, indeterminate: false });
            if (percent === 100) scheduleFinalising();
            else if (finalisingTimer) {
              clearTimeout(finalisingTimer);
              finalisingTimer = null;
            }
          },
        });
        if (finalisingTimer) clearTimeout(finalisingTimer);

        const vault: Vault = {
          id: vaultId,
          name: params.repo,
          owner: params.owner,
          repo: params.repo,
          branch: params.branch,
          cloneUrl: params.cloneUrl,
          htmlUrl: params.htmlUrl,
          localPath: `vaults/${vaultId}/repo`,
          addedAt: Date.now(),
          lastSyncedAt: Date.now(),
        };
        await addVault(vault);
        router.replace({ pathname: '/vault/[vaultId]', params: { vaultId } });
      } catch (err) {
        setCloning(null);
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [token, addVault],
  );

  const cloneSelected = useCallback(() => {
    if (!selected) return;
    startClone({
      owner: selected.owner,
      repo: selected.name,
      branch: selected.defaultBranch,
      cloneUrl: selected.cloneUrl,
      htmlUrl: selected.htmlUrl,
    });
  }, [selected, startClone]);

  const cloneFromUrl = useCallback(async () => {
    const parsed = parseRepoUrl(urlInput);
    if (!parsed) {
      setError('That does not look like a GitHub URL.');
      return;
    }
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (!res.ok) {
        setError(`GitHub responded ${res.status}. Is the repo accessible with your token?`);
        return;
      }
      const info = await res.json();
      await startClone({
        owner: parsed.owner,
        repo: parsed.repo,
        branch: info.default_branch ?? 'main',
        cloneUrl: info.clone_url,
        htmlUrl: info.html_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [urlInput, token, startClone]);

  if (cloning) {
    return (
      <CloningScreen
        name={cloning.name}
        status={cloning.status}
        percent={cloning.percent}
        indeterminate={cloning.indeterminate}
      />
    );
  }

  const filtered =
    repos?.filter((r) => r.fullName.toLowerCase().includes(filter.toLowerCase())) ?? [];

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <IconSymbol name="chevron.left" size={22} color={theme.textDim} />
        </Pressable>
        <Text variant="bodyEm" color={theme.text}>
          Add a vault
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ paddingHorizontal: space[5], paddingTop: space[2] }}>
        <Segmented
          value={tab}
          onChange={(v) => {
            setTab(v);
            setError(null);
          }}
          options={[
            { label: 'Your repos', value: 'repos' },
            { label: 'Paste URL', value: 'url' },
          ]}
        />
      </View>

      {tab === 'repos' ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: space[5], paddingTop: space[3] }}>
            <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
              <IconSymbol name="chevron.right" size={14} color={theme.muted} />
              <TextInput
                value={filter}
                onChangeText={setFilter}
                placeholder="filter repos…"
                placeholderTextColor={theme.mutedDeep}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ flex: 1, color: theme.text, fontFamily: 'IBMPlexMono_500Medium', fontSize: 14 }}
              />
            </View>
          </View>

          {loadingRepos ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: space[5], gap: space[2], paddingBottom: 140 }}
              ListEmptyComponent={
                <Text variant="sub" color={theme.muted} style={{ textAlign: 'center', marginTop: space[6] }}>
                  No matching repositories.
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = selected?.id === item.id;
                return (
                  <Pressable
                    onPress={() => setSelected(item)}
                    style={({ pressed }) => [
                      styles.repoRow,
                      {
                        backgroundColor: isSelected ? theme.accentSoft : pressed ? theme.raised : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.borderSoft,
                      },
                    ]}
                  >
                    <IconTile icon="folder.fill" size={36} gradient={gradientForName(item.name)} />
                    <View style={{ flex: 1 }}>
                      <Text variant="mono" color={theme.text}>
                        {item.fullName}
                      </Text>
                      {item.description ? (
                        <Text variant="sub" color={theme.muted} numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: isSelected ? theme.accent : theme.border,
                          backgroundColor: isSelected ? theme.accent : 'transparent',
                        },
                      ]}
                    >
                      {isSelected ? <IconSymbol name="checkmark" size={14} color={theme.onAccent} /> : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space[5], paddingTop: space[5] }}>
          <Text variant="caps" color={theme.muted}>
            REPOSITORY URL
          </Text>
          <View style={[styles.urlBox, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://github.com/owner/repo"
              placeholderTextColor={theme.mutedDeep}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ color: theme.text, fontFamily: 'IBMPlexMono_500Medium', fontSize: 14 }}
            />
          </View>
          <Text variant="sub" color={theme.muted} style={{ marginTop: space[3] }}>
            Works with any GitHub repo your token can access. We clone it shallow (depth=1) to save space.
          </Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorBar}>
          <Text variant="sub" color={theme.danger}>
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        {tab === 'repos' ? (
          <Button
            label={selected ? `Clone ${selected.name}` : 'Select a repository'}
            onPress={cloneSelected}
            variant="primary"
            disabled={!selected}
            leadingIcon="plus"
          />
        ) : (
          <Button
            label="Clone from URL"
            onPress={cloneFromUrl}
            variant="primary"
            disabled={!urlInput.trim()}
            leadingIcon="plus"
          />
        )}
      </View>
    </Screen>
  );
}

function CloningScreen({
  name,
  status,
  percent,
  indeterminate,
}: {
  name: string;
  status: string;
  percent: number;
  indeterminate: boolean;
}) {
  const theme = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!indeterminate) return;
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [indeterminate, shimmer]);

  const shimmerLeft = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['-40%', '100%'],
  });

  return (
    <Screen>
      <View style={styles.cloningBody}>
        <View style={glow(theme.accent)}>
          <IconTile icon="folder.fill" size={88} gradient={gradientForName(name)} iconSize={40} />
        </View>
        <Text
          style={{
            fontSize: 22,
            lineHeight: 30,
            fontWeight: '600',
            color: theme.text,
            marginTop: space[6],
          }}
        >
          Cloning {name}
        </Text>
        <Text
          variant="mono"
          color={theme.muted}
          style={{ marginTop: space[2], textAlign: 'center', maxWidth: 300 }}
        >
          {status}
        </Text>

        <View style={[styles.progressTrack, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
          {indeterminate ? (
            <Animated.View
              style={[
                styles.progressFill,
                {
                  position: 'absolute',
                  width: '40%',
                  left: shimmerLeft,
                  backgroundColor: theme.accent,
                },
                glow(theme.accent),
              ]}
            />
          ) : (
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(4, percent)}%`,
                  backgroundColor: theme.accent,
                },
                glow(theme.accent),
              ]}
            />
          )}
        </View>
        <Text variant="mono" color={theme.muted} style={{ marginTop: space[3] }}>
          {indeterminate ? 'finalising' : `${percent}%`}
        </Text>
        {indeterminate ? (
          <Text
            variant="foot"
            color={theme.mutedDeep}
            style={{ marginTop: space[5], textAlign: 'center', maxWidth: 300 }}
          >
            Please stay on this screen. Leaving may interrupt the checkout.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[3],
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 44,
  },
  repoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space[3],
    minHeight: 60,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: space[2],
  },
  errorBar: {
    marginHorizontal: space[5],
    marginBottom: space[2],
  },
  footer: {
    padding: space[5],
    paddingTop: space[3],
  },
  cloningBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[5],
  },
  progressTrack: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    marginTop: space[6],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
