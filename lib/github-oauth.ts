import type { GitHubUser } from './types';

export const GITHUB_CLIENT_ID = 'Ov23liMV0oAHsOQmTWZd';
export const GITHUB_SCOPES = 'repo read:user';

const DEVICE_CODE_URL = 'https://github.com/login/device/code';
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const USER_URL = 'https://api.github.com/user';

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

type TokenOk = { access_token: string; token_type: string; scope: string };
type TokenErr = { error: string; error_description?: string };
export type AccessTokenResponse = TokenOk | TokenErr;

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch(DEVICE_CODE_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: GITHUB_SCOPES }),
  });
  if (!res.ok) throw new Error(`Device code request failed: ${res.status}`);
  return res.json();
}

export async function pollAccessToken(deviceCode: string): Promise<AccessTokenResponse> {
  const res = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });
  return res.json();
}

export async function fetchGithubUser(token: string): Promise<GitHubUser> {
  const res = await fetch(USER_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  const data = await res.json();
  return {
    login: data.login,
    name: data.name ?? null,
    avatarUrl: data.avatar_url ?? null,
  };
}

export function isAccessTokenOk(r: AccessTokenResponse): r is TokenOk {
  return 'access_token' in r;
}

export type PollOutcome =
  | { kind: 'success'; token: string }
  | { kind: 'expired' }
  | { kind: 'denied' }
  | { kind: 'error'; message: string };

export async function pollUntilAuthorized(
  deviceCode: string,
  intervalSeconds: number,
  expiresInSeconds: number,
  signal: AbortSignal,
): Promise<PollOutcome> {
  const deadline = Date.now() + expiresInSeconds * 1000;
  let interval = Math.max(intervalSeconds, 5);

  while (Date.now() < deadline) {
    if (signal.aborted) return { kind: 'error', message: 'aborted' };
    await new Promise((r) => setTimeout(r, interval * 1000));
    if (signal.aborted) return { kind: 'error', message: 'aborted' };

    try {
      const resp = await pollAccessToken(deviceCode);
      if (isAccessTokenOk(resp)) return { kind: 'success', token: resp.access_token };

      switch (resp.error) {
        case 'authorization_pending':
          continue;
        case 'slow_down':
          interval += 5;
          continue;
        case 'expired_token':
          return { kind: 'expired' };
        case 'access_denied':
          return { kind: 'denied' };
        default:
          return { kind: 'error', message: resp.error_description ?? resp.error };
      }
    } catch (err) {
      return { kind: 'error', message: err instanceof Error ? err.message : String(err) };
    }
  }
  return { kind: 'expired' };
}
