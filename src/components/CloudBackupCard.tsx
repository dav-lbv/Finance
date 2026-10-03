import React, { useRef, useState } from 'react';
import { Cloud, FileUp, Loader2, Share2 } from 'lucide-react';
import { AppData } from '../types';
import { exportBackup, readBackupFile } from '../utils/backup';

interface CloudBackupCardProps {
  data: AppData;
  onRestoreData: (data: AppData) => void;
}

/** Sauvegarde locale transférable vers le cloud personnel de l'utilisateur, et restauration. */
export const CloudBackupCard: React.FC<CloudBackupCardProps> = ({ data, onRestoreData }) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fn();
      if (text) setMsg({ ok: true, text });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Opération impossible.' });
    } finally {
      setBusy(false);
    }
  };

  const save = () => run(async () => ((await exportBackup(data)) ? 'Sauvegarde créée. Choisissez « Enregistrer dans Fichiers » (iCloud Drive, Google Drive…).' : null));

  const restoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await run(async () => {
      const parsed = await readBackupFile(file);
      if (!window.confirm('Remplacer les données de cet appareil par cette sauvegarde ?')) return 'Restauration annulée.';
      onRestoreData(parsed);
      return 'Données restaurées.';
    });
  };

  const btn =
    'px-4 py-2 rounded-full bg-surface-2 hover:bg-surface-3 text-fg border border-line-strong font-bold text-xs shrink-0 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5';

  return (
    <div className="p-4 rounded-2xl bg-surface-2 border border-line-strong space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-surface border border-line flex items-center justify-center shrink-0">
          <Cloud className="w-5 h-5 text-fg-2" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-xs sm:text-sm text-fg">Sauvegarde sur mon cloud</h3>
          <p className="text-[11px] text-fg-muted">
            Vos données restent sur ce téléphone. Envoyez une copie vers iCloud Drive, Google Drive ou Fichiers pour la retrouver sur un autre appareil.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={busy} className={btn}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} Sauvegarder vers mon cloud
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={btn}>
          <FileUp className="w-3.5 h-3.5" /> Restaurer une sauvegarde
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={restoreFile} />
      </div>

      {msg && (
        <p role="status" className={`text-[11px] font-semibold ${msg.ok ? 'text-success' : 'text-danger'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
};
