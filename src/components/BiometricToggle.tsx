import React, { useEffect, useState } from 'react';
import { Fingerprint, Loader2, ScanFace } from 'lucide-react';
import {
  BiometricStatus,
  authenticateBiometric,
  biometricLabel,
  enrollBiometrics,
  getBiometricStatus,
} from '../utils/biometrics';

interface BiometricToggleProps {
  enabled: boolean;
  /** Le verrouillage par mot de passe doit être actif pour utiliser la biométrie */
  lockEnabled: boolean;
  onChange: (enabled: boolean, credentialId?: string) => void;
}

/**
 * Interrupteur de déverrouillage biométrique. L'activer demande l'autorisation au système
 * (Face ID / Touch ID / empreinte) : rien n'est activé tant que l'utilisateur n'a pas confirmé.
 */
export const BiometricToggle: React.FC<BiometricToggleProps> = ({ enabled, lockEnabled, onChange }) => {
  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    getBiometricStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  const label = biometricLabel(status?.kind ?? 'none');
  const Icon = status?.kind === 'touch' ? Fingerprint : ScanFace;
  const unavailable = status !== null && !status.available;
  const disabled = busy || unavailable || !lockEnabled || status === null;

  const toggle = async () => {
    setMessage(null);
    if (enabled) {
      onChange(false, undefined);
      return;
    }
    setBusy(true);
    const result = await enrollBiometrics();
    setBusy(false);
    if (result.ok) {
      onChange(true, result.credentialId);
      setMessage({ ok: true, text: `Déverrouillage biométrique activé (${label}). Il vous sera demandé à l'ouverture de l'application.` });
    } else if (result.cancelled) {
      setMessage({ ok: false, text: "Autorisation refusée ou annulée. Vous pouvez réessayer, ou l'accorder dans les réglages de l'appareil." });
    } else {
      setMessage({ ok: false, text: result.error || "Impossible d'activer la biométrie." });
    }
  };

  const test = async () => {
    setBusy(true);
    setMessage(null);
    const result = await authenticateBiometric('Tester le déverrouillage de Mon Kanda');
    setBusy(false);
    setMessage(
      result.ok
        ? { ok: true, text: 'Authentification réussie.' }
        : { ok: false, text: result.cancelled ? 'Authentification annulée.' : result.error || 'Échec de la biométrie.' }
    );
  };

  return (
    <div className="rounded-2xl bg-surface-2 border border-line-strong p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-surface-3 border border-line-strong text-fg flex items-center justify-center">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-extrabold text-fg block">Déverrouillage biométrique</span>
            <span className="text-[11px] text-fg-muted block">
              {status === null
                ? 'Vérification de l\'appareil…'
                : unavailable
                ? status.reason
                : !lockEnabled
                ? 'Activez d\'abord le verrouillage par mot de passe.'
                : `Ouvrir Mon Kanda avec ${label}`}
            </span>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Déverrouillage biométrique"
          disabled={disabled}
          onClick={toggle}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            enabled ? 'bg-brand' : 'bg-surface-3'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow transition-transform ${
              enabled ? 'translate-x-5 bg-brand-fg' : 'bg-fg-muted'
            }`}
          />
        </button>
      </div>

      {enabled && !unavailable && (
        <button
          type="button"
          onClick={test}
          disabled={busy}
          className="mt-3 px-4 py-2 rounded-full bg-surface-3 border border-line-strong text-xs font-bold text-fg cursor-pointer disabled:opacity-40"
        >
          Tester maintenant
        </button>
      )}

      {message && (
        <p className={`mt-3 text-[11px] font-semibold ${message.ok ? 'text-success' : 'text-rose-400'}`}>{message.text}</p>
      )}
    </div>
  );
};
