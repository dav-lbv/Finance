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
        <div className="bg-gradient-to-r from-[#172219] via-[#121613] to-[#101411] border border-[#2b3c2e] rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1c271e] text-[#ccff00] flex items-center justify-center shrink-0 border border-[#2e4030]">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Installer sur votre smartphone</span>
                <span className="px-2 py-0.2 rounded-full bg-[#ccff00]/15 text-[#ccff00] text-[10px] font-black border border-[#ccff00]/30">PWA</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilisez MonSalaire en plein écran sans barre de navigation, comme une vraie application mobile.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenPrompt}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all active:scale-95 shrink-0"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Installer l'app mobile</span>
          </button>
        </div>
      ) : variant === 'full' ? (
        <button
          onClick={handleOpenPrompt}
          className="w-full py-2.5 px-4 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all active:scale-95"
        >
          <Smartphone className="w-4 h-4 stroke-[2.5]" />
          <span>Installer sur mon smartphone</span>
        </button>
      ) : (
        <button
          onClick={handleOpenPrompt}
          title="Installer sur votre smartphone"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18201a] hover:bg-[#202b23] text-[#ccff00] border border-[#ccff00]/30 text-xs font-bold transition-all active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installer l'app</span>
        </button>
      )}

      {/* MODAL GUIDE D'INSTALLATION SMARTPHONE */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121613] border border-[#232f26] rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#1c271e] text-[#ccff00] flex items-center justify-center mx-auto mb-4 border border-[#2e4030]">
              <Smartphone className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-black text-center text-white">
              Installation sur smartphone
            </h3>
            <p className="text-xs text-slate-400 text-center mt-1 mb-5">
              Ajoutez <strong className="text-white">MonSalaire</strong> à votre écran d'accueil :
            </p>

            {isIOS ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161c17] border border-[#253227]">
                  <div className="w-7 h-7 rounded-xl bg-[#1f2a20] text-[#ccff00] flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">1. Bouton Partager</span>
                    <span className="text-slate-400">Dans la barre en bas de Safari sur iPhone.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161c17] border border-[#253227]">
                  <div className="w-7 h-7 rounded-xl bg-[#1f2a20] text-[#ccff00] flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">2. "Sur l'écran d'accueil"</span>
                    <span className="text-slate-400">Faites défiler le volet vers le bas.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161c17] border border-[#253227]">
                  <div className="w-7 h-7 rounded-xl bg-[#ccff00] text-black flex items-center justify-center shrink-0 font-black">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-white block">3. Validez "Ajouter"</span>
                    <span className="text-slate-400">L'application s'installera sur votre écran.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161c17] border border-[#253227]">
                  <div className="w-7 h-7 rounded-xl bg-[#1f2a20] text-[#ccff00] flex items-center justify-center shrink-0 font-bold">
                    ⋮
                  </div>
                  <div>
                    <span className="font-bold text-white block">1. Menu Chrome</span>
                    <span className="text-slate-400">Touchez les 3 points en haut à droite.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161c17] border border-[#253227]">
                  <div className="w-7 h-7 rounded-xl bg-[#1f2a20] text-[#ccff00] flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">2. "Installer l'application"</span>
                    <span className="text-slate-400">Ou "Ajouter à l'écran d'accueil".</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-full bg-[#18201a] hover:bg-[#202b23] text-white font-bold text-xs transition-colors border border-[#28362b]"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
