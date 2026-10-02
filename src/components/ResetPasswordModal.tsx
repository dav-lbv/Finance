import React, { useState } from 'react';
import { 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  Inbox, 
  Copy, 
  Check 
} from 'lucide-react';
import { UserProfile } from '../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onPasswordResetSuccess: (newPassword: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onPasswordResetSuccess,
}) => {
  const [step, setStep] = useState<'request' | 'verify' | 'new_password' | 'done'>('request');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!isOpen) return null;

  const handleSendEmail = () => {
    setIsSending(true);
    setOtpError('');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    setTimeout(() => {
      setIsSending(false);
      setStep('verify');
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim() === generatedOtp) {
      setOtpError('');
      setStep('new_password');
    } else {
      setOtpError('Code de sécurité incorrect. Veuillez vérifier le code envoyé.');
    }
  };

  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPasswordError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    onPasswordResetSuccess(newPassword);
    setStep('done');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedOtp);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121613] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#232f26] text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#1a221b] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'request' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1c241e] text-[#ccff00] flex items-center justify-center border border-[#2c3a2f]">
              <Mail className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                Réinitialisation du mot de passe
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Le code sera envoyé <strong className="text-white">strictement à l'e-mail de votre profil</strong> :
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161c17] border border-[#263529] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ccff00] text-black font-black flex items-center justify-center text-xs">
                @
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Email vérifié du compte
                </span>
                <span className="text-sm font-black text-white truncate block">
                  {user.email || 'votre adresse e-mail'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="w-full py-3 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] disabled:opacity-50 text-black font-extrabold text-xs sm:text-sm shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <Mail className="w-4 h-4 stroke-[2.5]" />
                  <span>Envoyer l'e-mail de réinitialisation</span>
                </>
              )}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1c241e] text-[#ccff00] flex items-center justify-center border border-[#2c3a2f]">
              <Inbox className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                Code de sécurité transmis
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Envoyé strictement à : <strong className="text-[#ccff00]">{user.email}</strong>.
              </p>
            </div>

            {/* Simulation boîte mail */}
            <div className="p-3.5 rounded-2xl bg-[#0d100e] text-slate-100 border border-[#222e25] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#1b241e] text-[10px] text-slate-400">
                <span>De: securite@monsalaire-app.com</span>
                <span>À l'instant</span>
              </div>
              <div className="font-bold text-white">
                Objet : Votre code de réinitialisation MonSalaire
              </div>
              <div className="flex items-center justify-between bg-[#141a15] p-2.5 rounded-xl border border-[#273429]">
                <span className="font-mono text-xl font-black text-[#ccff00] tracking-widest">
                  {generatedOtp}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-full bg-[#1e2720] hover:bg-[#27342b] text-white text-[10px] font-bold flex items-center gap-1"
                >
                  {hasCopied ? <Check className="w-3 h-3 text-[#ccff00]" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopied ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Saisissez le code à 6 chiffres :
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Ex: 849201"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.3em] font-mono text-2xl font-black py-2.5 rounded-2xl bg-[#161c17] border border-[#28362b] text-white focus:outline-none focus:border-[#ccff00]"
                  autoFocus
                />
              </div>

              {otpError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Vérifier le code</span>
              </button>
            </form>
          </div>
        )}

        {step === 'new_password' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1c241e] text-[#ccff00] flex items-center justify-center border border-[#2c3a2f]">
              <KeyRound className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                Nouveau mot de passe
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Choisissez un nouveau code pour protéger l'application.
              </p>
            </div>

            <form onSubmit={handleSetNewPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Au moins 4 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-full bg-[#161c17] border border-[#28362b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ccff00]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-full bg-[#161c17] border border-[#28362b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ccff00]"
                />
              </div>

              {passwordError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm shadow-md transition-all"
              >
                Enregistrer et déverrouiller
              </button>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center py-3">
            <div className="w-14 h-14 rounded-full bg-[#1c241e] text-[#ccff00] flex items-center justify-center mx-auto border border-[#2c3a2f]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                Mot de passe mis à jour !
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Votre application MonSalaire est déverrouillée.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm"
            >
              Accéder à l'application
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
