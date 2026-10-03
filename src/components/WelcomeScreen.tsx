import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CloudDownload, FileUp, Loader2, Mail, Sparkles, X } from 'lucide-react';
import { AppData, UserProfile } from '../types';
import { CloudAccount, CloudProviderId, downloadCloudBackup, getCloudBackupInfo, providerStatus, signIn } from '../utils/cloud';
import { parseBackup } from '../utils/storage';

interface WelcomeScreenProps {
  /** Démarre la configuration d'un nouveau compte (éventuellement pré-remplie par le compte lié) */
  onStart: (prefill?: Partial<UserProfile>) => void;
  /** Reprend une configuration existante (cloud ou fichier) */
  onRestore: (data: AppData) => void;
}

const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const AppleLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const COINS = [
  { left: '12%', top: '18%', size: 26, delay: 0 },
  { left: '82%', top: '28%', size: 20, delay: 0.8 },
  { left: '22%', top: '36%', size: 18, delay: 1.4 },
  { left: '76%', top: '44%', size: 28, delay: 0.4 },
];

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

/** Première page de l'application : choisir comment commencer ou retrouver sa configuration. */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onRestore }) => {
  const [busy, setBusy] = useState<CloudProviderId | 'file' | null>(null);
  const [error, setError] = useState('');
  const [found, setFound] = useState<{ account: CloudAccount; data: AppData; modifiedTime: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const startWithAccount = (account: CloudAccount) => {
    const { firstName, lastName } = splitName(account.name);
    onStart({
      firstName,
      lastName,
      fullName: account.name,
      email: account.email,
      avatarUrl: account.avatarUrl,
      authProvider: account.provider,
      isEmailVerified: !!account.email,
    });
  };

  const handleProvider = async (provider: CloudProviderId) => {
    setError('');
    const status = providerStatus(provider);
    if (!status.available) return setError(status.reason || 'Indisponible.');
    setBusy(provider);
    try {
      const account = await signIn(provider);
      const info = await getCloudBackupInfo(provider);
      const data = info ? await downloadCloudBackup(provider) : null;
      if (!info || !data) return startWithAccount(account);
      setFound({ account, data: { ...data, user: { ...data.user, authProvider: provider } }, modifiedTime: info.modifiedTime });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible.');
    } finally {
      setBusy(null);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy('file');
    try {
      onRestore(parseBackup(JSON.parse(await file.text())));
    } catch (err) {
      setError(err instanceof SyntaxError ? "Ce fichier n'est pas une sauvegarde valide." : (err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-app text-fg overflow-hidden flex flex-col">
      {/* Halo et pièces flottantes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora-a absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-[60%] rounded-full bg-fg/[0.10] blur-3xl" />
        {COINS.map((c, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-fg/40 to-fg/5 border border-line-strong"
            style={{ left: c.left, top: c.top, width: c.size, height: c.size }}
            animate={{ y: [0, -14, 0], rotate: [0, 12, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
          />
        ))}
      </div>

      <div className="relative flex-1 flex flex-col w-full max-w-md mx-auto px-6 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
          >
            <motion.img
              src="/icon.svg"
              alt="Mon Kanda"
              className="w-40 h-40 sm:w-48 sm:h-48 drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>

        <motion.div className="text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 className="text-5xl font-black tracking-tight">Mon Kanda</h1>
          <p className="mt-2 text-fg-muted text-[15px]">Votre portefeuille, simplement.</p>
        </motion.div>

        <motion.div className="mt-8 space-y-3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <button
            type="button"
            onClick={() => handleProvider('apple')}
            disabled={busy !== null}
            className="w-full h-14 rounded-full bg-fg text-app font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
          >
            {busy === 'apple' ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleLogo />}
            Continuer avec Apple
          </button>
          <button
            type="button"
            onClick={() => handleProvider('google')}
            disabled={busy !== null}
            className="w-full h-14 rounded-full bg-surface border border-line-strong text-fg font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
          >
            {busy === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleG />}
            Continuer avec Google
          </button>
          <button
            type="button"
            onClick={() => onStart()}
            className="w-full h-14 rounded-full bg-surface-2 border border-line text-fg font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition cursor-pointer"
          >
            <Mail className="w-5 h-5" />
            Commencer sans compte
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            className="w-full pt-2 text-[13px] font-semibold text-fg-muted hover:text-fg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            Restaurer depuis un fichier de sauvegarde
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />

          {error && (
            <p role="alert" className="text-[12px] text-danger text-center leading-snug px-2">
              {error}
            </p>
          )}
        </motion.div>

        <p className="mt-5 text-center text-[11px] text-fg-muted leading-relaxed">
          Vos données restent sur votre téléphone. Lier un compte sert uniquement à les retrouver si vous changez d'appareil.
        </p>
      </div>

      {/* Configuration retrouvée sur le compte */}
      <AnimatePresence>
        {found && (
          <motion.div
            className="absolute inset-0 z-10 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="w-full max-w-md rounded-t-[32px] bg-surface-solid border border-line p-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]"
            >
              <div className="w-10 h-1.5 rounded-full bg-line-strong mx-auto mb-5" />
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center">
                  <CloudDownload className="w-6 h-6" />
                </div>
                <button type="button" onClick={() => setFound(null)} aria-label="Fermer" className="p-2 rounded-full bg-surface-2 text-fg-muted cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight">Configuration retrouvée</h2>
              <p className="mt-1 text-sm text-fg-muted">
                {found.account.email || (found.account.provider === 'apple' ? 'iCloud' : 'Google')} · dernière sauvegarde le{' '}
                {new Date(found.modifiedTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
              <button
                type="button"
                onClick={() => onRestore(found.data)}
                className="mt-5 w-full h-14 rounded-full bg-fg text-app font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                Restaurer mes données
              </button>
              <button
                type="button"
                onClick={() => {
                  const acc = found.account;
                  setFound(null);
                  startWithAccount(acc);
                }}
                className="mt-2 w-full h-12 rounded-full text-fg-muted font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Repartir de zéro <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
