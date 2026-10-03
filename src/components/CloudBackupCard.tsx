import React, { useRef, useState } from 'react';
import { CloudUpload, CloudDownload, FileUp, Loader2 } from 'lucide-react';
import { AppData, UserProfile } from '../types';
import { downloadCloudBackup, providerStatus, signInWithGoogle, uploadCloudBackup } from '../utils/cloud';
import { parseBackup } from '../utils/storage';

interface CloudBackupCardProps {
  data: AppData;
  onUpdateUser: (user: UserProfile) => void;
  onRestoreData: (data: AppData) => void;
}

/** Compte lié (Google) pour sauvegarder la configuration et la retrouver sur un autre téléphone. */
export const CloudBackupCard: React.FC<CloudBackupCardProps> = ({ data, onUpdateUser, onRestoreData }) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const linked = data.user.authProvider === 'google';
  const google = providerStatus('google');

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Opération impossible.' });
    } finally {
      setBusy(false);
    }
  };

  const link = () =>
    run(async () => {
      const account = await signInWithGoogle();
      const user = { ...data.user, authProvider: 'google' as const, email: data.user.email || account.email };
      onUpdateUser(user);
      await uploadCloudBackup({ ...data, user });
      return `Compte ${account.email} lié et données sauvegardées.`;
    });

  const save = () =>
    run(async () => {
      await uploadCloudBackup(data);
      return 'Sauvegarde envoyée sur votre compte Google.';
    });

  const restore = () =>
    run(async () => {
      if (!window.confirm('Remplacer les données de cet appareil par la sauvegarde du compte ?')) return 'Restauration annulée.';
      const backup = await downloadCloudBackup();
      if (!backup) throw new Error('Aucune sauvegarde trouvée sur ce compte.');
      onRestoreData(backup);
      return 'Données restaurées.';
    });

  const restoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await run(async () => {
      let parsed: AppData;
      try {
        parsed = parseBackup(JSON.parse(await file.text()));
      } catch (err) {
        throw err instanceof SyntaxError ? new Error("Ce fichier n'est pas une sauvegarde valide.") : err;
      }
      if (!window.confirm('Remplacer les données de cet appareil par ce fichier ?')) return 'Restauration annulée.';
      onRestoreData(parsed);
      return 'Données restaurées depuis le fichier.';
    });
  };

  const btn =
    'px-4 py-2 rounded-full bg-surface-2 hover:bg-surface-3 text-fg border border-line-strong font-bold text-xs shrink-0 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5';

  return (
    <div className="p-4 rounded-2xl bg-surface-2 border border-line-strong space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-surface border border-line flex items-center justify-center shrink-0">
          <CloudUpload className="w-5 h-5 text-fg-2" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-xs sm:text-sm text-fg">Compte & changement de téléphone</h3>
          <p className="text-[11px] text-fg-muted">
            {linked ? `Lié à Google${data.user.email ? ` (${data.user.email})` : ''}` : 'Liez un compte pour retrouver vos données sur un nouvel appareil.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {linked ? (
          <>
            <button type="button" onClick={save} disabled={busy} className={btn}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />} Sauvegarder maintenant
            </button>
            <button type="button" onClick={restore} disabled={busy} className={btn}>
              <CloudDownload className="w-3.5 h-3.5" /> Restaurer du cloud
            </button>
          </>
        ) : (
          <button type="button" onClick={link} disabled={busy || !google.available} className={btn}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Lier mon compte Google
          </button>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={btn}>
          <FileUp className="w-3.5 h-3.5" /> Restaurer un fichier
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={restoreFile} />
      </div>

      {!linked && !google.available && <p className="text-[11px] text-fg-muted">{google.reason}</p>}
      {msg && (
        <p role="status" className={`text-[11px] font-semibold ${msg.ok ? 'text-success' : 'text-danger'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
};
