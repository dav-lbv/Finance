import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, FileUp, Loader2 } from 'lucide-react';
import { AppData } from '../types';
import { readBackupFile } from '../utils/backup';

interface WelcomeScreenProps {
  /** Démarre la création du compte (assistant de configuration) */
  onStart: () => void;
  /** Reprend une configuration existante depuis une sauvegarde */
  onRestore: (data: AppData) => void;
}

const COINS = [
  { left: '12%', top: '18%', size: 26, delay: 0 },
  { left: '82%', top: '28%', size: 20, delay: 0.8 },
  { left: '22%', top: '36%', size: 18, delay: 1.4 },
  { left: '76%', top: '44%', size: 28, delay: 0.4 },
];

/** Première page de l'application : créer son compte ou restaurer une sauvegarde. */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onRestore }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onRestore(await readBackupFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restauration impossible.');
    } finally {
      setBusy(false);
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
              src={`${import.meta.env.BASE_URL}icon.svg`}
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
            onClick={onStart}
            className="w-full h-14 rounded-full bg-fg text-app font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition cursor-pointer"
          >
            Créer mon compte
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full h-14 rounded-full bg-surface border border-line-strong text-fg font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
            Restaurer une sauvegarde
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />

          {error && (
            <p role="alert" className="text-[12px] text-danger text-center leading-snug px-2">
              {error}
            </p>
          )}
        </motion.div>

        <p className="mt-5 text-center text-[11px] text-fg-muted leading-relaxed">
          Vos données restent sur votre téléphone. Une sauvegarde (iCloud Drive, Google Drive, Fichiers) permet de les retrouver si vous changez d'appareil.
        </p>
      </div>
    </div>
  );
};
