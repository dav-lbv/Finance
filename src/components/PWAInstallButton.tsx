import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleOpenPrompt = () => {
    if (isInstallable) {
      install();
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className="bg-gradient-to-r from-surface-2 via-surface to-surface border border-line-strong rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-2 text-brand flex items-center justify-center shrink-0 border border-line-strong">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg flex items-center gap-2">
                <span>Installer sur votre smartphone</span>
                <span className="px-2 py-0.2 rounded-full bg-brand/15 text-brand text-[10px] font-black border border-brand/30">PWA</span>
              </h4>
              <p className="text-xs text-fg-muted mt-0.5">
                Utilisez MonSalaire en plein écran sans barre de navigation, comme une vraie application mobile.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenPrompt}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)] transition-all active:scale-95 shrink-0"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Installer l'app mobile</span>
          </button>
        </div>
      ) : variant === 'full' ? (
        <button
          onClick={handleOpenPrompt}
          className="w-full py-2.5 px-4 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)] transition-all active:scale-95"
        >
          <Smartphone className="w-4 h-4 stroke-[2.5]" />
          <span>Installer sur mon smartphone</span>
        </button>
      ) : (
        <button
          onClick={handleOpenPrompt}
          title="Installer sur votre smartphone"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 text-brand border border-brand/30 text-xs font-bold transition-all active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installer l'app</span>
        </button>
      )}

      {/* MODAL GUIDE D'INSTALLATION SMARTPHONE */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface border border-line rounded-3xl max-w-sm w-full p-6 text-fg shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-fg-muted hover:text-fg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-surface-2 text-brand flex items-center justify-center mx-auto mb-4 border border-line-strong">
              <Smartphone className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-black text-center text-fg">
              Installation sur smartphone
            </h3>
            <p className="text-xs text-fg-muted text-center mt-1 mb-5">
              Ajoutez <strong className="text-fg">MonSalaire</strong> à votre écran d'accueil :
            </p>

            {isIOS ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 border border-line-strong">
                  <div className="w-7 h-7 rounded-xl bg-surface-3 text-brand flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-fg block">1. Bouton Partager</span>
                    <span className="text-fg-muted">Dans la barre en bas de Safari sur iPhone.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 border border-line-strong">
                  <div className="w-7 h-7 rounded-xl bg-surface-3 text-brand flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-fg block">2. "Sur l'écran d'accueil"</span>
                    <span className="text-fg-muted">Faites défiler le volet vers le bas.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 border border-line-strong">
                  <div className="w-7 h-7 rounded-xl bg-brand text-brand-fg flex items-center justify-center shrink-0 font-black">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-fg block">3. Validez "Ajouter"</span>
                    <span className="text-fg-muted">L'application s'installera sur votre écran.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 border border-line-strong">
                  <div className="w-7 h-7 rounded-xl bg-surface-3 text-brand flex items-center justify-center shrink-0 font-bold">
                    ⋮
                  </div>
                  <div>
                    <span className="font-bold text-fg block">1. Menu Chrome</span>
                    <span className="text-fg-muted">Touchez les 3 points en haut à droite.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 border border-line-strong">
                  <div className="w-7 h-7 rounded-xl bg-surface-3 text-brand flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-fg block">2. "Installer l'application"</span>
                    <span className="text-fg-muted">Ou "Ajouter à l'écran d'accueil".</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-full bg-surface-2 hover:bg-surface-3 text-fg font-bold text-xs transition-colors border border-line-strong"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
