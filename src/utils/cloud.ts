import { Capacitor, registerPlugin } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
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
const GOOGLE_IOS_CLIENT_ID = (import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined) || '';
const isIOS = Capacitor.getPlatform() === 'ios';
const GOOGLE_SCOPES = ['email', 'profile', 'https://www.googleapis.com/auth/drive.appdata'];

/** Plugin natif iOS (ios/App/App/KandaICloudPlugin.swift) : stockage iCloud clé-valeur. */
interface KandaICloudPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  get(): Promise<{ value?: string; modified?: number }>;
  set(opts: { value: string }): Promise<{ ok: boolean }>;
}
const KandaICloud = registerPlugin<KandaICloudPlugin>('KandaICloud');

let socialReady = false;
async function initSocial(): Promise<void> {
  if (socialReady) return;
  await SocialLogin.initialize({
    google: { iOSClientId: GOOGLE_IOS_CLIENT_ID, webClientId: GOOGLE_CLIENT_ID, mode: 'online' },
    apple: {},
  });
  socialReady = true;
}
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
    if (isIOS) {
      return GOOGLE_IOS_CLIENT_ID
        ? { available: true }
        : { available: false, reason: 'Connexion Google non configurée (VITE_GOOGLE_IOS_CLIENT_ID manquant, voir NATIVE.md).' };
    }
    return GOOGLE_CLIENT_ID
      ? { available: true }
      : { available: false, reason: 'Connexion Google non configurée (VITE_GOOGLE_CLIENT_ID manquant, voir NATIVE.md).' };
  }
  return isIOS
    ? { available: true }
    : { available: false, reason: "« Continuer avec Apple » est disponible dans l'application iPhone / iPad." };
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

async function requestNativeGoogle() {
  await initSocial();
  const res = await SocialLogin.login({ provider: 'google', options: { scopes: GOOGLE_SCOPES } });
  if (res.result.responseType !== 'online') throw new Error('Connexion Google incomplète.');
  const token = res.result.accessToken?.token;
  if (!token) throw new Error("Google n'a pas fourni d'accès à Drive.");
  googleToken = { value: token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return { token, profile: res.result.profile };
}

async function requestGoogleToken(prompt: string): Promise<string> {
  if (isIOS) return (await requestNativeGoogle()).token;
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
  if (isIOS) {
    const { profile } = await requestNativeGoogle();
    return {
      provider: 'google',
      name: profile.name || [profile.givenName, profile.familyName].filter(Boolean).join(' '),
      email: profile.email || '',
      avatarUrl: profile.imageUrl || undefined,
    };
  }
  const token = await requestGoogleToken('select_account');
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Profil Google introuvable.');
  const u = (await res.json()) as { name?: string; email?: string; picture?: string };
  return { provider: 'google', name: u.name || '', email: u.email || '', avatarUrl: u.picture };
}

async function googleTokenOrAsk(): Promise<string> {
  return isGoogleSessionActive() ? googleToken!.value : requestGoogleToken('');
}

async function googleBackupInfo(): Promise<CloudBackupInfo | null> {
  const f = await findBackup(await googleTokenOrAsk());
  return f ? { modifiedTime: f.modifiedTime } : null;
}

async function googleDownload(): Promise<AppData | null> {
  const token = await googleTokenOrAsk();
  const f = await findBackup(token);
  if (!f) return null;
  const res = await drive(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, token);
  return parseBackup(await res.json());
}

async function googleUpload(data: AppData): Promise<void> {
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

// ------------------------------------------------------------------
// Apple : connexion native + stockage iCloud
// ------------------------------------------------------------------
const ICLOUD_LIMIT = 900_000; // le stockage clé-valeur iCloud est limité à 1 Mo

export async function signInWithApple(): Promise<CloudAccount> {
  if (!isIOS) throw new Error(providerStatus('apple').reason);
  const { available } = await KandaICloud.isAvailable();
  if (!available) throw new Error('iCloud est désactivé : activez-le dans Réglages → [votre nom] → iCloud.');
  await initSocial();
  const res = await SocialLogin.login({ provider: 'apple', options: { scopes: ['email', 'name'] } });
  const p = res.result.profile;
  return {
    provider: 'apple',
    name: [p.givenName, p.familyName].filter(Boolean).join(' '),
    email: p.email || '',
  };
}

async function appleBackupInfo(): Promise<CloudBackupInfo | null> {
  const r = await KandaICloud.get();
  return r.value ? { modifiedTime: new Date((r.modified || 0) * 1000).toISOString() } : null;
}

async function appleDownload(): Promise<AppData | null> {
  const r = await KandaICloud.get();
  return r.value ? parseBackup(JSON.parse(r.value)) : null;
}

async function appleUpload(data: AppData): Promise<void> {
  let json = JSON.stringify(data);
  if (json.length > ICLOUD_LIMIT) {
    // Une grosse photo de profil ne doit pas empêcher la sauvegarde des finances
    json = JSON.stringify({ ...data, user: { ...data.user, avatarUrl: undefined } });
  }
  if (json.length > ICLOUD_LIMIT) throw new Error('Sauvegarde trop volumineuse pour iCloud (1 Mo max).');
  const { ok } = await KandaICloud.set({ value: json });
  if (!ok) throw new Error('iCloud a refusé la sauvegarde.');
}

// ------------------------------------------------------------------
// API commune
// ------------------------------------------------------------------
export function signIn(provider: CloudProviderId): Promise<CloudAccount> {
  return provider === 'google' ? signInWithGoogle() : signInWithApple();
}

export function getCloudBackupInfo(provider: CloudProviderId): Promise<CloudBackupInfo | null> {
  return provider === 'google' ? googleBackupInfo() : appleBackupInfo();
}

export function downloadCloudBackup(provider: CloudProviderId): Promise<AppData | null> {
  return provider === 'google' ? googleDownload() : appleDownload();
}

export function uploadCloudBackup(provider: CloudProviderId, data: AppData): Promise<void> {
  return provider === 'google' ? googleUpload(data) : appleUpload(data);
}
