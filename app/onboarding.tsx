import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Card } from '@/components/ui/card';
import { IconTile } from '@/components/ui/icon-tile';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { glow, radii, space, type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';
import { useAuthStore } from '@/store/auth';
import {
  type DeviceCodeResponse,
  fetchGithubUser,
  pollUntilAuthorized,
  requestDeviceCode,
} from '@/lib/github-oauth';

type Phase = 'idle' | 'requesting' | 'code' | 'polling' | 'success' | 'error';

export default function OnboardingScreen() {
  const theme = useTheme();
  const setSession = useAuthStore((s) => s.setSession);

  const [phase, setPhase] = useState<Phase>('idle');
  const [device, setDevice] = useState<DeviceCodeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  // Countdown timer for expiration.
  useEffect(() => {
    if (phase !== 'code' && phase !== 'polling') return;
    if (!device) return;
    const started = Date.now();
    setExpiresIn(device.expires_in);
    const t = setInterval(() => {
      const remaining = Math.max(0, device.expires_in - Math.floor((Date.now() - started) / 1000));
      setExpiresIn(remaining);
    }, 1000);
    return () => clearInterval(t);
  }, [phase, device]);

  const startFlow = useCallback(async () => {
    setErrorMsg(null);
    setPhase('requesting');
    try {
      const code = await requestDeviceCode();
      setDevice(code);
      setPhase('code');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, []);

  const startPolling = useCallback(async () => {
    if (!device) return;
    setPhase('polling');
    const controller = new AbortController();
    abortRef.current = controller;

    const outcome = await pollUntilAuthorized(
      device.device_code,
      device.interval,
      device.expires_in,
      controller.signal,
    );

    if (outcome.kind === 'success') {
      try {
        const user = await fetchGithubUser(outcome.token);
        await setSession(outcome.token, user);
        setPhase('success');
        setTimeout(() => router.replace('/'), 1500);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    } else if (outcome.kind === 'expired') {
      setErrorMsg('This code has expired. Get a new one.');
      setPhase('error');
    } else if (outcome.kind === 'denied') {
      setErrorMsg('Access was denied on GitHub.');
      setPhase('error');
    } else {
      setErrorMsg(outcome.message);
      setPhase('error');
    }
  }, [device, setSession]);

  const copyAndOpen = useCallback(async () => {
    if (!device) return;
    await Clipboard.setStringAsync(device.user_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    try {
      await WebBrowser.openBrowserAsync(device.verification_uri);
    } catch (e) {
      Alert.alert('Could not open browser', e instanceof Error ? e.message : String(e));
    }
  }, [device]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setDevice(null);
    setErrorMsg(null);
    setPhase('idle');
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <IconSymbol name="chevron.left" size={22} color={theme.textDim} />
        </Pressable>
        <Text variant="mono" color={theme.muted}>
          {phase === 'success' ? 'done' : phase === 'error' ? 'oops' : 'step 1 / 2'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        {phase === 'idle' || phase === 'requesting' ? (
          <Idle onStart={startFlow} loading={phase === 'requesting'} />
        ) : null}

        {phase === 'code' && device ? (
          <CodeState
            device={device}
            copied={copied}
            expiresIn={expiresIn}
            onCopyAndOpen={copyAndOpen}
            onContinue={startPolling}
            onCancel={reset}
          />
        ) : null}

        {phase === 'polling' && device ? (
          <Polling code={device.user_code} expiresIn={expiresIn} onCancel={reset} />
        ) : null}

        {phase === 'success' ? <Success /> : null}

        {phase === 'error' ? (
          <ErrorState message={errorMsg ?? 'Something went wrong.'} onRetry={reset} />
        ) : null}
      </View>
    </Screen>
  );
}

// -- States ----------------------------------------------------------------

function Idle({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  const theme = useTheme();
  const steps = [
    { n: '1', text: 'Tap "Get my code" — you get a short 8-char code.' },
    { n: '2', text: 'We open github.com/login/device in a browser tab.' },
    { n: '3', text: 'Paste the code on GitHub. You come back. You’re in.' },
  ];
  return (
    <>
      <IconTile icon="doc.text.fill" size={72} bg={theme.accent} iconColor={theme.onAccent} />
      <Text
        style={{
          ...(type.h1 as object),
          color: theme.text,
          marginTop: space[5],
        }}
      >
        Connect GitHub
      </Text>
      <Text
        variant="body"
        color={theme.textDim}
        style={{ textAlign: 'center', marginTop: space[3], maxWidth: 320 }}
      >
        GitVault uses GitHub’s Device Flow. Your password never leaves github.com.
      </Text>

      <Card style={{ marginTop: space[8], gap: space[3], width: '100%' }}>
        {steps.map((s) => (
          <View key={s.n} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: theme.accentSoft, borderColor: theme.accentDim }]}>
              <Text variant="monoSm" color={theme.accent}>
                {s.n}
              </Text>
            </View>
            <Text variant="callout" color={theme.textDim} style={{ flex: 1 }}>
              {s.text}
            </Text>
          </View>
        ))}
      </Card>

      <View style={styles.cta}>
        <Button label="Get my code" onPress={onStart} variant="primary" loading={loading} />
      </View>
    </>
  );
}

function CodeState({
  device,
  copied,
  expiresIn,
  onCopyAndOpen,
  onContinue,
  onCancel,
}: {
  device: DeviceCodeResponse;
  copied: boolean;
  expiresIn: number;
  onCopyAndOpen: () => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  return (
    <>
      <Text variant="caps" color={theme.muted}>
        YOUR CODE
      </Text>
      <Card
        style={[
          styles.codeCard,
          { marginTop: space[3], borderColor: theme.accentDim },
          glow(theme.accent),
        ]}
      >
        <Text
          style={{
            fontFamily: 'IBMPlexMono_600SemiBold',
            fontSize: 40,
            lineHeight: 52,
            letterSpacing: 8,
            textAlign: 'center',
            color: theme.text,
          }}
        >
          {device.user_code}
        </Text>
      </Card>
      <Text variant="mono" color={theme.muted} style={{ marginTop: space[3] }}>
        expires in {formatDuration(expiresIn)}
      </Text>

      <Card style={{ marginTop: space[6], width: '100%', gap: space[3] }}>
        <Text variant="callout" color={theme.text}>
          Next — paste it on GitHub
        </Text>
        <Text variant="sub" color={theme.muted}>
          We’ll copy the code to your clipboard and open github.com/login/device.
        </Text>
      </Card>

      <View style={styles.cta}>
        <Button
          label={copied ? 'Copied — opening GitHub…' : 'Copy & open GitHub'}
          onPress={onCopyAndOpen}
          variant="primary"
          leadingIcon={copied ? 'checkmark' : 'doc.on.doc'}
        />
        <View style={{ height: space[2] }} />
        <Button
          label="I pasted it — keep waiting"
          onPress={onContinue}
          variant="secondary"
        />
        <Pressable onPress={onCancel} style={{ alignSelf: 'center', padding: space[3] }}>
          <Text variant="foot" color={theme.muted}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function Polling({
  code,
  expiresIn,
  onCancel,
}: {
  code: string;
  expiresIn: number;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <IconTile icon="arrow.clockwise" size={64} bg={theme.accentSoft} iconColor={theme.accent} />
      </Animated.View>
      <Text
        style={{
          ...(type.h1 as object),
          color: theme.text,
          marginTop: space[5],
        }}
      >
        Waiting for GitHub…
      </Text>
      <Text
        variant="body"
        color={theme.textDim}
        style={{ textAlign: 'center', marginTop: space[3], maxWidth: 300 }}
      >
        Authorize on GitHub with the code below. This screen will update automatically.
      </Text>

      <View style={{ marginTop: space[6] }}>
        <Chip label={code} variant="accent" mono />
      </View>
      <Text variant="mono" color={theme.muted} style={{ marginTop: space[3] }}>
        {formatDuration(expiresIn)} left
      </Text>

      <View style={styles.cta}>
        <Button label="Cancel" onPress={onCancel} variant="ghost" />
      </View>
    </>
  );
}

function Success() {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scale]);
  return (
    <>
      <Animated.View style={{ transform: [{ scale }] }}>
        <IconTile
          icon="checkmark"
          size={80}
          bg={theme.success + '22'}
          iconColor={theme.success}
          iconSize={36}
        />
      </Animated.View>
      <Text
        style={{
          ...(type.h1 as object),
          color: theme.text,
          marginTop: space[5],
        }}
      >
        You’re in.
      </Text>
      <Text variant="body" color={theme.textDim} style={{ marginTop: space[3] }}>
        Taking you to your vaults…
      </Text>
    </>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();
  return (
    <>
      <IconTile
        icon="exclamationmark.triangle.fill"
        size={64}
        bg={theme.danger + '22'}
        iconColor={theme.danger}
        iconSize={28}
      />
      <Text
        style={{
          ...(type.h1 as object),
          color: theme.text,
          marginTop: space[5],
        }}
      >
        Something stopped us
      </Text>
      <Text
        variant="body"
        color={theme.textDim}
        style={{ textAlign: 'center', marginTop: space[3], maxWidth: 320 }}
      >
        {message}
      </Text>
      <View style={styles.cta}>
        <Button label="Get a new code" onPress={onRetry} variant="primary" />
      </View>
    </>
  );
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingTop: space[3],
  },
  body: {
    flex: 1,
    paddingHorizontal: space[5],
    paddingTop: space[8],
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCard: {
    paddingVertical: space[5],
    width: '100%',
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space[4],
    paddingHorizontal: space[5],
  },
});
