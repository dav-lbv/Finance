import { Capacitor } from '@capacitor/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

/**
 * Biométrie : Face ID / Touch ID / empreinte.
 *  - Application native (iOS / Android) : API biométrique du système (plugin Capacitor).
 *  - Web / PWA : WebAuthn avec l'authentificateur de la plateforme (Face ID / Touch ID du
 *    navigateur). La vérification est locale : elle sert de verrou d'accès sur l'appareil.
 */

export type BiometricKind = 'face' | 'touch' | 'other' | 'none';
export type BiometricMode = 'native' | 'webauthn' | 'none';

export interface BiometricStatus {
  available: boolean;
  mode: BiometricMode;
  kind: BiometricKind;
  /** Raison lisible quand la biométrie n'est pas utilisable */
  reason?: string;
}

export interface BiometricResult {
  ok: boolean;
  cancelled?: boolean;
  error?: string;
  /** Identifiant de la clé créée (mode WebAuthn uniquement) */
  credentialId?: string;
}

const isNative = () => Capacitor.isNativePlatform();

function kindFromType(type: BiometryType): BiometricKind {
  switch (type) {
    case BiometryType.faceId:
    case BiometryType.faceAuthentication:
      return 'face';
    case BiometryType.touchId:
    case BiometryType.fingerprintAuthentication:
      return 'touch';
    case BiometryType.none:
      return 'none';
    default:
      return 'other';
  }
}

export function biometricLabel(kind: BiometricKind): string {
  if (kind === 'face') return 'Face ID';
  if (kind === 'touch') return 'Touch ID / empreinte';
  if (kind === 'other') return 'la biométrie';
  return 'la biométrie';
}

// ---------- WebAuthn (PWA) ----------

const toB64Url = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromB64Url = (s: string): ArrayBuffer => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
};

async function webAuthnAvailable(): Promise<boolean> {
  try {
    return (
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

// ---------- API publique ----------

export async function getBiometricStatus(): Promise<BiometricStatus> {
  if (isNative()) {
    try {
      const info = await BiometricAuth.checkBiometry();
      return {
        available: info.isAvailable,
        mode: 'native',
        kind: kindFromType(info.biometryType),
        reason: info.isAvailable ? undefined : info.reason || "Aucune donnée biométrique n'est enregistrée sur cet appareil.",
      };
    } catch (e) {
      return { available: false, mode: 'native', kind: 'none', reason: (e as Error).message };
    }
  }
  if (await webAuthnAvailable()) {
    const ua = navigator.userAgent;
    const kind: BiometricKind = /iPhone|iPad|Macintosh/.test(ua) ? 'face' : 'other';
    return { available: true, mode: 'webauthn', kind };
  }
  return {
    available: false,
    mode: 'none',
    kind: 'none',
    reason: "Ce navigateur ou cet appareil ne propose pas de déverrouillage biométrique.",
  };
}

/**
 * Demande l'autorisation et enregistre la biométrie.
 * Sur iOS natif, c'est ici que le système affiche la demande d'accès à Face ID.
 */
export async function enrollBiometrics(): Promise<BiometricResult> {
  const status = await getBiometricStatus();
  if (!status.available) return { ok: false, error: status.reason };

  if (status.mode === 'native') {
    return authenticateBiometric('Activer le déverrouillage biométrique de Mon_Kanda');
  }

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Mon_Kanda' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'mon-kanda', displayName: 'Mon_Kanda' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    if (!credential) return { ok: false, cancelled: true };
    return { ok: true, credentialId: toB64Url(credential.rawId) };
  } catch (e) {
    const err = e as DOMException;
    if (err.name === 'NotAllowedError') return { ok: false, cancelled: true, error: 'Autorisation refusée ou annulée.' };
    return { ok: false, error: err.message };
  }
}

/** Demande à l'utilisateur de s'authentifier (Face ID, Touch ID, empreinte). */
export async function authenticateBiometric(
  reason = 'Déverrouiller Mon_Kanda',
  credentialId?: string
): Promise<BiometricResult> {
  if (isNative()) {
    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Annuler',
        allowDeviceCredential: false,
        iosFallbackTitle: '',
        androidTitle: 'Mon_Kanda',
        androidSubtitle: reason,
      });
      return { ok: true };
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const cancelled = ['userCancel', 'appCancel', 'systemCancel'].includes(err.code || '');
      return { ok: false, cancelled, error: cancelled ? undefined : err.message };
    }
  }

  if (!credentialId) return { ok: false, error: 'La biométrie n\'est pas encore activée sur cet appareil.' };
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: fromB64Url(credentialId) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return assertion ? { ok: true } : { ok: false, cancelled: true };
  } catch (e) {
    const err = e as DOMException;
    if (err.name === 'NotAllowedError') return { ok: false, cancelled: true };
    return { ok: false, error: err.message };
  }
}
