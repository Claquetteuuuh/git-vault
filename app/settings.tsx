import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Chip } from '@/components/ui/chip';
import { IconTile, gradientForName } from '@/components/ui/icon-tile';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SectionHeader, SectionCard, SectionDivider } from '@/components/ui/section';
import { radii, space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';
import { useAuthStore } from '@/store/auth';
import { useVaultStore } from '@/store/vaults';
import { useSyncStore } from '@/store/sync';
import { vaultDirUri } from '@/lib/git';
import { deleteDirectory } from '@/lib/git-fs';

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuthStore();
  const { vaults, removeVault } = useVaultStore();
  const lastConflicts = useSyncStore((s) => s.lastConflicts);
  const [autoSync, setAutoSync] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);

  const confirmDisconnect = () => {
    Alert.alert(
      'Disconnect GitHub?',
      'Your local vaults stay on device, but you will need to reconnect to sync them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ],
    );
  };

  const confirmRemoveVault = (vaultId: string, vaultName: string) => {
    Alert.alert(
      `Remove "${vaultName}"?`,
      'The local copy will be deleted from this device. Your remote repository stays intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteDirectory(vaultDirUri(vaultId));
            await removeVault(vaultId);
          },
        },
      ],
    );
  };

  const conflictCount = lastConflicts?.paths.length ?? 0;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <IconSymbol name="xmark" size={20} color={theme.textDim} />
        </Pressable>
        <Text variant="bodyEm" color={theme.text}>
          Settings
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: space[10] }}>
        {/* Account */}
        <SectionHeader label="Account" />
        <SectionCard>
          {user ? (
            <View style={styles.accountRow}>
              <IconTile
                icon="doc.text.fill"
                size={44}
                gradient={gradientForName(user.login)}
              />
              <View style={{ flex: 1 }}>
                <Text variant="callout" color={theme.text}>
                  {user.name ?? user.login}
                </Text>
                <Text variant="mono" color={theme.muted}>
                  @{user.login}
                </Text>
              </View>
              <Chip label="connected" variant="accent" mono />
            </View>
          ) : (
            <View style={styles.accountRow}>
              <IconTile icon="exclamationmark.triangle.fill" size={44} bg={theme.surface} iconColor={theme.muted} />
              <View style={{ flex: 1 }}>
                <Text variant="callout" color={theme.text}>
                  Not connected
                </Text>
                <Pressable onPress={() => router.push('/onboarding')}>
                  <Text variant="sub" color={theme.accent}>
                    Connect GitHub →
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </SectionCard>

        {/* Vaults */}
        <SectionHeader label="Vaults" />
        <SectionCard>
          {vaults.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text variant="sub" color={theme.muted}>
                No vaults yet.
              </Text>
            </View>
          ) : (
            vaults.map((v, idx) => (
              <View key={v.id}>
                <View style={styles.vaultRow}>
                  <IconTile icon="folder.fill" size={36} gradient={gradientForName(v.repo)} />
                  <View style={{ flex: 1 }}>
                    <Text variant="callout" color={theme.text}>
                      {v.name}
                    </Text>
                    <Text variant="monoSm" color={theme.muted}>
                      {v.owner}/{v.repo} · {v.branch}
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmRemoveVault(v.id, v.name)} hitSlop={8} style={{ padding: 6 }}>
                    <IconSymbol name="trash" size={18} color={theme.danger} />
                  </Pressable>
                </View>
                {idx < vaults.length - 1 ? <SectionDivider /> : null}
              </View>
            ))
          )}
          <SectionDivider />
          <Pressable onPress={() => router.push('/vault/new')} style={styles.addRow}>
            <IconSymbol name="plus" size={18} color={theme.accent} />
            <Text variant="callout" color={theme.accent}>
              Add a vault
            </Text>
          </Pressable>
        </SectionCard>

        {/* Sync */}
        <SectionHeader label="Sync" />
        <SectionCard>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text variant="callout" color={theme.text}>
                Auto-sync
              </Text>
              <Text variant="sub" color={theme.muted}>
                Pull on open, push after edits
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: theme.raised, true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
          <SectionDivider />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text variant="callout" color={theme.text}>
                Wi-Fi only
              </Text>
              <Text variant="sub" color={theme.muted}>
                Skip sync on cellular
              </Text>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={setWifiOnly}
              trackColor={{ false: theme.raised, true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
          <SectionDivider />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text variant="callout" color={theme.text}>
                Pending conflicts
              </Text>
              <Text variant="sub" color={theme.muted}>
                Files with divergent local edits
              </Text>
            </View>
            {conflictCount > 0 ? (
              <Chip label={`${conflictCount}`} variant="warn" mono />
            ) : (
              <Text variant="mono" color={theme.mutedDeep}>
                —
              </Text>
            )}
          </View>
        </SectionCard>

        {/* About */}
        <SectionHeader label="About" />
        <SectionCard>
          <View style={styles.aboutRow}>
            <Text variant="callout" color={theme.text}>
              What's new
            </Text>
            <IconSymbol name="chevron.right" size={14} color={theme.muted} />
          </View>
          <SectionDivider />
          <View style={styles.aboutRow}>
            <Text variant="callout" color={theme.text}>
              Privacy
            </Text>
            <IconSymbol name="chevron.right" size={14} color={theme.muted} />
          </View>
          <SectionDivider />
          <Pressable onPress={confirmDisconnect} style={styles.aboutRow}>
            <Text variant="callout" color={theme.danger}>
              Disconnect GitHub
            </Text>
          </Pressable>
        </SectionCard>

        <View style={styles.footer}>
          <Text variant="mono" color={theme.mutedDeep}>
            GitVault · v0.1 · alpha
          </Text>
          <Text variant="foot" color={theme.mutedDeep} style={{ marginTop: 4 }}>
            Your notes. Your repo. Your rules.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[4],
  },
  emptyRow: { padding: space[4] },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[3],
    minHeight: 52,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: space[3],
    minHeight: 52,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    gap: space[3],
    minHeight: 52,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space[4],
    minHeight: 52,
  },
  footer: {
    alignItems: 'center',
    marginTop: space[8],
  },
});
