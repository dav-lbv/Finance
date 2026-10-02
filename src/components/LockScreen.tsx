import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, Mail, AlertCircle, ScanFace, Fingerprint, CheckCircle2 } from 'lucide-react';
import { UserProfile, SecuritySettings } from '../types';
import { ResetPasswordModal } from './ResetPasswordModal';
import { DEFAULT_AVATAR } from '../utils/avatars';

interface LockScreenProps {
  user: UserProfile;
  security: SecuritySettings;
  onUnlock: () => void;
  onUpdateSecurity: (newSecurity: SecuritySettings) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  user,
  security,
  onUnlock,
  onUpdateSecurity,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const fallbackAvatar = DEFAULT_AVATAR;
  const avatarImage = user.avatarUrl || fallbackAvatar;

  const handleAttemptUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    if (password === security.passwordHash) {
      setError('');
      onUnlock();
    } else {
      setError('Mot de passe incorrect. Réessayez ou utilisez "Mot de passe oublié ?".');
    }
  };

  const handleBiometricUnlock = () => {
    setIsBiometricScanning(true);
    setError('');
    setTimeout(() => {
      setIsBiometricScanning(false);
      onUnlock();
    }, 700);
  };

  const handlePasswordResetSuccess = (newPassword: string) => {
    onUpdateSecurity({
      ...security,
      isLockEnabled: true,
      passwordHash: newPassword,
    });
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app/98 backdrop-blur-2xl animate-fadeIn">
      <div className="max-w-md w-full bg-surface border border-line rounded-3xl p-7 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        
        {/* Glow neon de fond */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Cadenas néon vibrant */}
        <div className="relative mx-auto w-16 h-16 rounded-3xl bg-brand text-brand-fg flex items-center justify-center shadow-[0_0_30px_rgba(var(--brand-rgb),0.4)] mb-4">
          <Lock className="w-8 h-8 stroke-[2.8]" />
        </div>

        <h1 className="text-2xl font-black text-fg tracking-tight">
          Mon_Kanda Sécurisé
        </h1>
        <p className="text-fg-muted text-xs sm:text-sm mt-1 mb-5">
          Authentification requise pour accéder à votre espace financier.
        </p>

        {/* Profil utilisateur reconnu avec photo */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-2 border border-line-strong mb-5">
          <img
            src={avatarImage}
            alt={user.fullName}
            className="w-6 h-6 rounded-full object-cover border border-brand"
          />
          <span className="text-xs font-bold text-fg">
            {user.fullName || 'Utilisateur'}
          </span>
          <span className="text-[10px] text-fg-muted">
            ({user.email})
          </span>
        </div>

        {/* Formulaire de mot de passe */}
        <form onSubmit={handleAttemptUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Votre mot de passe..."
              className="w-full px-4 py-3 rounded-full bg-app border border-line-strong text-fg placeholder-slate-500 text-center font-bold tracking-wider focus:outline-none focus:border-brand transition-colors"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-sm shadow-[0_0_20px_rgba(var(--brand-rgb),0.35)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4 stroke-[2.5]" />
              <span>Déverrouiller avec le mot de passe</span>
            </button>

            {/* Bouton de déverrouillage biométrique */}
            {security.useBiometrics && (
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isBiometricScanning}
                className="w-full py-2.5 rounded-full bg-surface-2 hover:bg-surface-3 text-brand border border-brand/30 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isBiometricScanning ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin"></span>
                    <span>Scan biométrique en cours...</span>
                  </>
                ) : (
                  <>
                    <ScanFace className="w-4 h-4" />
                    <span>Déverrouiller avec Face ID / Empreinte</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Mot de passe oublié */}
        <div className="mt-5 pt-5 border-t border-line">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="text-xs font-bold text-fg-muted hover:text-brand transition-colors inline-flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Mot de passe oublié ?</span>
          </button>
          <p className="text-[11px] text-fg-muted mt-0.5">
            Réinitialisation strictement sur <strong className="text-fg-2">{user.email}</strong>
          </p>
        </div>
      </div>

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        user={user}
        onPasswordResetSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};
