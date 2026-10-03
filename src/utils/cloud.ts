import { Capacitor } from '@capacitor/core';
import { AppData } from '../types';
import { parseBackup } from './storage';

/**
 * Liaison à un compte pour retrouver sa configuration sur un nouveau téléphone.
 * Google : sauvegarde dans le dossier privé « appDataFolder » de Google Drive
 * (invisible dans Drive, accessible uniquement par Mon Kanda).
 */
export type CloudProviderId = 'google' | 'apple';

export interface CloudAccount {
  provider: CloudProviderId;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface CloudBackupInfo {
  modifiedTime: string;
}

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
const BACKUP_NAME = 'mon-kanda-backup.json';
const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.appdata';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: TokenResponse) => void;
            error_callback?: (e: { type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let googleToken: { value: string; expiresAt: number } | null = null;

/** Disponibilité de chaque fournisseur, avec la raison quand il n'est pas utilisable. */
export function providerStatus(provider: CloudProviderId): { available: boolean; reason?: string } {
  if (provider === 'google') {
    if (!GOOGLE_CLIENT_ID) return { available: false, reason: "Connexion Google non configurée (VITE_GOOGLE_CLIENT_ID manquant, voir NATIVE.md)." };
    if (Capacitor.isNativePlatform()) return { available: false, reason: 'Connexion Google native non encore configurée dans l’application iOS (voir NATIVE.md).' };
    return { available: true };
  }
  return { available: false, reason: 'Connexion Apple / iCloud : nécessite un compte Apple Developer et la configuration native (voir NATIVE.md).' };
}

export function isGoogleSessionActive(): boolean {
  return !!googleToken && googleToken.expiresAt > Date.now() + 30_000;
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Impossible de charger Google (connexion internet ?).'));
    document.head.appendChild(s);
  });
}

async function requestGoogleToken(prompt: string): Promise<string> {
  await loadGoogleScript();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (r) => {
        if (r.access_token) {
          googleToken = { value: r.access_token, expiresAt: Date.now() + (r.expires_in || 3600) * 1000 };
          resolve(r.access_token);
        } else reject(new Error(r.error || 'Connexion Google refusée.'));
      },
      error_callback: (e) => reject(new Error(e.type === 'popup_closed' ? 'Connexion annulée.' : 'Connexion Google impossible.')),
    });
    client.requestAccessToken({ prompt });
  });
}

async function drive(path: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google Drive a répondu ${res.status}.`);
  return res;
}

async function findBackup(token: string): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name='${BACKUP_NAME}'`);
  const res = await drive(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`,
    token,
  );
  const json = (await res.json()) as { files?: { id: string; modifiedTime: string }[] };
  return json.files?.[0] ?? null;
}

/** Ouvre la connexion Google et renvoie le compte. */
export async function signInWithGoogle(): Promise<CloudAccount> {
  const status = providerStatus('google');
  if (!status.available) throw new Error(status.reason);
  const token = await requestGoogleToken('select_account');
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Profil Google introuvable.');
  const u = (await res.json()) as { name?: string; email?: string; picture?: string };
  return { provider: 'google', name: u.name || '', email: u.email || '', avatarUrl: u.picture };
}

async function googleTokenOrAsk(): Promise<string> {
  return isGoogleSessionActive() ? googleToken!.value : requestGoogleToken('');
}

export async function getCloudBackupInfo(): Promise<CloudBackupInfo | null> {
  const f = await findBackup(await googleTokenOrAsk());
  return f ? { modifiedTime: f.modifiedTime } : null;
}

export async function downloadCloudBackup(): Promise<AppData | null> {
  const token = await googleTokenOrAsk();
  const f = await findBackup(token);
  if (!f) return null;
  const res = await drive(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, token);
  return parseBackup(await res.json());
}

export async function uploadCloudBackup(data: AppData): Promise<void> {
  const token = await googleTokenOrAsk();
  const existing = await findBackup(token);
  const body = JSON.stringify(data);
  if (existing) {
    await drive(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return;
  }
  const boundary = 'kanda' + Math.random().toString(36).slice(2);
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name: BACKUP_NAME, parents: ['appDataFolder'] }) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  await drive('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', token, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
}
