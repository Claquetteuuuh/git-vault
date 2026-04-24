import { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { IconTile, gradientForName } from '@/components/ui/icon-tile';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { radii, space, type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';
import { useAuthStore } from '@/store/auth';
import { useVaultStore } from '@/store/vaults';
import type { Vault } from '@/lib/types';

export default function IndexScreen() {
  const { user, hydrated: authHydrated, hydrate: hydrateAuth } = useAuthStore();
  const { vaults, hydrated: vaultsHydrated, hydrate: hydrateVaults } = useVaultStore();

  useEffect(() => {
    hydrateAuth();
    hydrateVaults();
  }, [hydrateAuth, hydrateVaults]);

  const loading = !authHydrated || !vaultsHydrated;
  if (loading) return <LoadingScreen />;
  return user ? <VaultsHome vaults={vaults} username={user.login} /> : <Landing />;
}

// -- Loading ---------------------------------------------------------------

function LoadingScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </View>
    </Screen>
  );
}

// -- Landing ---------------------------------------------------------------

function Landing() {
  const theme = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.landingHeader}>
        <View style={styles.brandLockup}>
          <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
            <IconSymbol name="doc.text.fill" size={16} color={theme.onAccent} />
          </View>
          <Text variant="bodyEm" color={theme.text}>
            GitVault
          </Text>
        </View>
        <Chip label="v0.1" variant="ghost" />
      </View>

      <View style={styles.landingBody}>
        <Chip label="MARKDOWN · GIT · PRIVATE" variant="default" mono />
        <Text
          style={[
            {
              fontSize: 38,
              lineHeight: 48,
              fontWeight: '700',
              letterSpacing: -0.8,
              color: theme.text,
              marginTop: space[4],
            },
          ]}
        >
          Your notes, your repo.{'\n'}
          <Text
            style={{
              fontSize: 38,
              lineHeight: 48,
              fontWeight: '700',
              letterSpacing: -0.8,
              color: theme.accent,
            }}
          >
            Your rules.
          </Text>
        </Text>
        <Text
          variant="body"
          color={theme.textDim}
          style={{ maxWidth: 320, marginTop: space[4] }}
        >
          GitVault reads and edits markdown notes straight from a Git repository you own. No cloud in the middle. Just clone, read, write, push.
        </Text>

        <View style={{ marginTop: space[10], gap: space[4] }}>
          <FeatureRow
            icon="folder.fill"
            title="Your Git, your rules"
            desc="GitHub, self-hosted — whatever you already use."
          />
          <FeatureRow
            icon="arrow.clockwise"
            title="Sync quietly in the background"
            desc="Edits commit and push automatically. No drama."
          />
          <FeatureRow
            icon="eye.slash"
            title="No cloud, no tracking"
            desc="A token and your files. That's all the app holds."
          />
        </View>
      </View>

      <View style={styles.landingFooter}>
        <Button
          label="Connect GitHub"
          onPress={() => router.push('/onboarding')}
          variant="primary"
          size="lg"
        />
        <Text
          variant="foot"
          color={theme.muted}
          style={{ textAlign: 'center', marginTop: space[3] }}
        >
          No passwords leave github.com.
        </Text>
      </View>
    </Screen>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: 'folder.fill' | 'arrow.clockwise' | 'eye.slash';
  title: string;
  desc: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
        <IconSymbol name={icon} size={18} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="callout" color={theme.text}>
          {title}
        </Text>
        <Text variant="sub" color={theme.muted}>
          {desc}
        </Text>
      </View>
    </View>
  );
}

// -- Authenticated home ----------------------------------------------------

function VaultsHome({ vaults, username }: { vaults: Vault[]; username: string }) {
  const theme = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.homeHeader}>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <IconSymbol name="gearshape.fill" size={22} color={theme.textDim} />
        </Pressable>
        <View style={styles.brandLockup}>
          <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
            <IconSymbol name="doc.text.fill" size={16} color={theme.onAccent} />
          </View>
          <Text variant="bodyEm" color={theme.text}>
            GitVault
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ paddingHorizontal: space[5], marginTop: space[4] }}>
        <Text variant="mono" color={theme.muted}>
          welcome back, @{username}
        </Text>
        <Text
          style={{
            ...(type.title as object),
            color: theme.text,
            marginTop: space[1],
          }}
        >
          Your vaults
        </Text>
      </View>

      <FlatList
        data={vaults}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: space[4], gap: space[3], paddingBottom: space[8] }}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyTile,
              { borderColor: theme.borderSoft },
            ]}
          >
            <IconTile icon="folder.fill" size={44} bg={theme.surface} iconColor={theme.muted} />
            <Text variant="bodyEm" color={theme.text} style={{ marginTop: space[3] }}>
              Let's set up your first vault
            </Text>
            <Text variant="sub" color={theme.muted} style={{ textAlign: 'center', marginTop: space[1] }}>
              Pick a GitHub repo or paste a URL. We'll clone it locally so you can read and edit offline.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/vault/[vaultId]', params: { vaultId: item.id } })}
            style={({ pressed }) => [
              styles.vaultCard,
              {
                backgroundColor: pressed ? theme.raised : theme.surface,
                borderColor: theme.borderSoft,
              },
            ]}
          >
            <IconTile icon="folder.fill" size={44} gradient={gradientForName(item.repo)} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="callout" color={theme.text}>
                {item.name}
              </Text>
              <View style={styles.metaRow}>
                <Chip label={item.branch} variant="default" mono />
                <Text variant="monoSm" color={theme.muted}>
                  {formatRelative(item.lastSyncedAt)}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color={theme.muted} />
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable
            onPress={() => router.push('/vault/new')}
            style={({ pressed }) => [
              styles.addTile,
              {
                borderColor: pressed ? theme.accent : theme.accentDim,
                backgroundColor: pressed ? theme.accentSoft : 'transparent',
              },
            ]}
          >
            <IconSymbol name="plus" size={18} color={theme.accent} />
            <Text variant="callout" color={theme.accent}>
              Add a vault
            </Text>
          </Pressable>
        }
      />
    </Screen>
  );
}

function formatRelative(ts: number | null): string {
  if (!ts) return 'never synced';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just synced';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

// -- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  landingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[2],
  },
  landingBody: {
    flex: 1,
    paddingHorizontal: space[5],
    paddingTop: space[4],
  },
  landingFooter: {
    paddingHorizontal: space[5],
    paddingBottom: space[4],
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingTop: space[3],
  },
  emptyTile: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.xl,
    padding: space[6],
    alignItems: 'center',
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[3],
    borderWidth: 1,
    borderRadius: radii.xl,
    minHeight: 76,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  addTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.xl,
    paddingVertical: space[5],
    marginTop: space[2],
  },
});
