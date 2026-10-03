import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  biometricsEnabled: boolean;
  onClose: () => void;
  /** Efface toutes les données et recommence à zéro */
  onEraseEverything: () => void;
}

/**
 * Mon Kanda fonctionne sans serveur : aucun e-mail ne peut être envoyé et le mot de passe
 * n'est pas récupérable (il n'est stocké que haché). La seule issue est de tout effacer.
 */
export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  biometricsEnabled,
  onClose,
  onEraseEverything,
}) => {
  const [confirmation, setConfirmation] = useState('');
  if (!isOpen) return null;

  const canErase = confirmation.trim().toUpperCase() === 'EFFACER';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-solid border border-line rounded-3xl p-6 text-fg relative">
        <button
          type="button"
          onClick={() => {
            setConfirmation('');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-fg-muted hover:text-fg cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black pr-8">Mot de passe oublié ?</h2>
        <p className="text-xs text-fg-muted mt-2 leading-relaxed">
          Vos données restent uniquement sur cet appareil, sans compte ni serveur : le mot de passe ne peut donc pas être
          envoyé par e-mail ni récupéré.
        </p>
        {biometricsEnabled && (
          <p className="text-xs text-fg-2 mt-2 leading-relaxed">
            Astuce : fermez cette fenêtre et utilisez le déverrouillage biométrique pour entrer, puis changez le mot de
            passe dans Réglages &gt; Sécurité.
          </p>
        )}

        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-xs font-bold text-rose-300">Dernier recours : tout effacer</p>
          <p className="text-[11px] text-fg-2 mt-1">
            Profil, dépenses, épargne et projets seront supprimés définitivement. Tapez <strong>EFFACER</strong> pour
            confirmer.
          </p>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoCapitalize="characters"
            placeholder="EFFACER"
            className="mt-3 w-full bg-surface-2 border border-line-strong focus:border-rose-400 rounded-2xl px-4 py-3 text-sm text-fg text-center font-bold tracking-widest focus:outline-none"
          />
          <button
            type="button"
            disabled={!canErase}
            onClick={() => {
              setConfirmation('');
              onEraseEverything();
            }}
            className="mt-3 w-full py-3 rounded-full bg-rose-500 text-white text-sm font-black disabled:opacity-40 cursor-pointer"
          >
            Effacer toutes les données
          </button>
        </div>
      </div>
    </div>
  );
};
