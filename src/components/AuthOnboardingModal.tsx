import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  Wallet, 
  Moon, 
  Sun, 
  Lock, 
  KeyRound, 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  CheckCircle2, 
  X,
  Laptop
} from 'lucide-react';
import { UserProfile, SecuritySettings } from '../types';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency } from '../utils/date';
import { ANIMAL_AVATARS, DEFAULT_AVATAR } from '../utils/avatars';

interface AuthOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  currentSecurity: SecuritySettings;
  onComplete: (user: UserProfile, security: SecuritySettings) => void;
}

type OnboardingStep = 'login' | 'verify_email' | 'user_info' | 'salary' | 'theme' | 'security' | 'success';

const PRESET_AVATARS = ANIMAL_AVATARS.map(a => a.url);

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentSecurity,
  onComplete,
}) => {
  const { themeMode, setThemeMode } = useTheme();

  const [step, setStep] = useState<OnboardingStep>('login');
  
  // Login & Email verification state
  const [authProvider, setAuthProvider] = useState<'google' | 'apple' | 'email'>(currentUser.authProvider || 'google');
  const [emailInput, setEmailInput] = useState(currentUser.email || '');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('749210');
  const [emailSentToast, setEmailSentToast] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // User Profile configuration state
  const [fullName, setFullName] = useState(currentUser.fullName || 'Davy Papet');
  const [phone, setPhone] = useState(currentUser.phone || '+225 07 42 78 91');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || PRESET_AVATARS[0]);

  // Salary & Currency state
  const [defaultSalary, setDefaultSalary] = useState(currentUser.defaultSalary?.toString() || '750000');
  const [currency, setCurrency] = useState(currentUser.currency || 'FCFA');

  // Theme selection state
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light' | 'system'>(
    currentUser.themePreference || themeMode || 'dark'
  );

  // Security & Lock state
  const [isLockEnabled, setIsLockEnabled] = useState(currentSecurity.isLockEnabled || false);
  const [password, setPassword] = useState(currentSecurity.passwordHash || '');
  const [confirmPassword, setConfirmPassword] = useState(currentSecurity.passwordHash || '');
  const [useBiometrics, setUseBiometrics] = useState(currentSecurity.useBiometrics ?? true);
  const [biometricType, setBiometricType] = useState<'faceid' | 'fingerprint' | 'both'>('both');
  const [securityError, setSecurityError] = useState('');

  if (!isOpen) return null;

  // Handle Social Login
  const handleSocialLogin = (provider: 'google' | 'apple') => {
    setAuthProvider(provider);
    if (provider === 'google') {
      setEmailInput(currentUser.email || 'davypapet@gmail.com');
    } else {
      setEmailInput('davypapet@icloud.com');
    }
    // Proceed directly to user configuration
    setStep('user_info');
  };

  // Handle Send Verification Email
  const handleSendVerificationEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) return;
    
    // Generate 6 digit code
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
    setAuthProvider('email');
    setEmailSentToast(true);
    setVerifyError('');
    setStep('verify_email');

    setTimeout(() => {
      setEmailSentToast(false);
    }, 8000);
  };

  // Handle verification code change
  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newCode = [...verificationCode];
    newCode[index] = val;
    setVerificationCode(newCode);

    // Auto move to next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`code-digit-${index + 1}`);
      nextInput?.focus();
    }

    // Check if complete
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      validateCode(fullCode);
    }
  };

  const validateCode = (enteredCode: string) => {
    setIsVerifying(true);
    setVerifyError('');
    setTimeout(() => {
      setIsVerifying(false);
      if (enteredCode === generatedCode || enteredCode === '123456') {
        setStep('user_info');
      } else {
        setVerifyError('Code de confirmation incorrect. Veuillez réessayer.');
      }
    }, 600);
  };

  const handleAutoFillCode = () => {
    const digits = generatedCode.split('');
    setVerificationCode(digits);
    validateCode(generatedCode);
  };

  // Handle File Upload for profile picture
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Security next
  const handleSecurityNext = () => {
    setSecurityError('');
    if (isLockEnabled) {
      if (!password || password.length < 4) {
        setSecurityError('Le mot de passe / code PIN doit comporter au moins 4 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setSecurityError('Les deux mots de passe ne correspondent pas.');
        return;
      }
    }
    setStep('success');
  };

  // Final Complete
  const handleFinalSubmit = () => {
    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: fullName.trim() || 'Utilisateur GesFin',
      email: emailInput.trim(),
      phone: phone.trim(),
      defaultSalary: parseFloat(defaultSalary) || 750000,
      currency,
      avatarUrl,
      authProvider,
      isEmailVerified: true,
      isOnboarded: true,
      themePreference: selectedTheme,
    };

    const updatedSecurity: SecuritySettings = {
      ...currentSecurity,
      isLockEnabled,
      passwordHash: isLockEnabled ? password : '',
      useBiometrics,
      biometricType,
    };

    // Apply theme
    setThemeMode(selectedTheme);
    onComplete(updatedUser, updatedSecurity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {/* Toast notification de simulation d'email */}
      {emailSentToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-11/12 max-w-md bg-[#131b14] border-2 border-[#ccff00] text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-black">
              <Mail className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">E-mail de confirmation reçu !</p>
              <p className="text-xs text-slate-300">
                Code de vérification : <span className="font-mono font-black text-[#ccff00] tracking-widest text-sm">{generatedCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoFillCode}
            className="px-2.5 py-1 rounded-full bg-[#ccff00] text-black font-extrabold text-[11px] hover:bg-[#d9ff33] active:scale-95 transition-all shadow-sm"
          >
            Remplir
          </button>
        </div>
      )}

      <div 
        className="w-full max-w-xl bg-[#0e120f] border border-[#232f26] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header bar with GesFin Logo & Close */}
        <div className="px-5 py-4 border-b border-[#1c261e] bg-[#121813] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ccff00] to-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.4)]">
              <Sparkles className="w-4 h-4 text-black stroke-[2.8]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-white">GesFin</span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                  Setup
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#1f2821] transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar (hidden on success or login) */}
        {step !== 'login' && step !== 'verify_email' && step !== 'success' && (
          <div className="w-full bg-[#161d17] h-1.5 flex">
            <div 
              className="bg-gradient-to-r from-[#ccff00] to-[#10b981] h-full transition-all duration-300"
              style={{
                width: 
                  step === 'user_info' ? '25%' :
                  step === 'salary' ? '50%' :
                  step === 'theme' ? '75%' : '100%'
              }}
            />
          </div>
        )}

        {/* MODAL CONTENT PER STEP */}
        <div className="p-5 sm:p-7 overflow-y-auto max-h-[78vh]">

          {/* ======================================================== */}
          {/* STEP 0: PAGE DE CONNEXION (Google, Apple, Email)         */}
          {/* ======================================================== */}
          {step === 'login' && (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-[#172219] border border-[#2b3b2e] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(204,255,0,0.2)]">
                  <Sparkles className="w-8 h-8 text-[#ccff00]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Bienvenue sur GesFin
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Connectez-vous pour configurer et synchroniser votre espace financier personnel.
                </p>
              </div>

              {/* Social Login Options */}
              <div className="space-y-3 max-w-sm mx-auto">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continuer avec Google</span>
                </button>

                {/* Apple Button */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  className="w-full py-3 px-4 rounded-2xl bg-[#1b221d] hover:bg-[#232c25] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 border border-[#2e3b30] transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.43-5.64-8.52-10.22-18.72-13.73-30.6-3.52-11.88-5.28-23.07-5.28-33.56 0-14.59 3.69-26.68 11.08-36.27 7.38-9.59 16.59-14.48 27.62-14.67 4.13 0 9.07 1.05 14.81 3.17 5.75 2.12 9.47 3.24 11.17 3.35 1.52-.11 5.37-1.29 11.54-3.53 6.18-2.24 11.03-3.24 14.56-3 10.88.54 19.8 4.67 26.76 12.39-9.57 5.76-14.24 13.92-14 24.47.24 8.27 3.37 15.28 9.39 21.03 6.03 5.75 13.26 9.03 21.71 9.83-2.18 6.42-4.8 12.63-7.86 18.63zM119.22 33.15c0-6.75 2.45-13.28 7.35-19.59 4.9-6.31 11.13-10.56 18.69-12.76.65 1.52.98 3.15.98 4.9 0 6.64-2.55 13.23-7.66 19.78-5.11 6.54-11.41 10.74-18.89 12.61-.1-.66-.47-2.31-.47-4.94z"/>
                  </svg>
                  <span>Continuer avec Apple</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 max-w-sm mx-auto">
                <div className="flex-1 h-px bg-[#232f26]"></div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ou avec votre e-mail
                </span>
                <div className="flex-1 h-px bg-[#232f26]"></div>
              </div>

              {/* Email Entry Form */}
              <form onSubmit={handleSendVerificationEmail} className="space-y-3 max-w-sm mx-auto text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="exemple@domaine.com"
                      className="w-full bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Envoyer un code de confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Un code à 6 chiffres sera envoyé à votre adresse pour valider votre identité en toute sécurité.
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 0.5: VÉRIFICATION E-MAIL DU CODE À 6 CHIFFRES       */}
          {/* ======================================================== */}
          {step === 'verify_email' && (
            <div className="space-y-6 text-center animate-fadeIn max-w-sm mx-auto">
              <div>
                <button
                  onClick={() => setStep('login')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-3 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Changer d'e-mail</span>
                </button>
                <h2 className="text-xl font-black text-white">Vérification de l'e-mail</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Saisissez le code à 6 chiffres envoyé à <span className="text-[#ccff00] font-bold">{emailInput}</span>
                </p>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-digit-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    className="w-10 sm:w-12 h-12 sm:h-14 rounded-2xl bg-[#141b15] border-2 border-[#243327] focus:border-[#ccff00] text-center text-lg sm:text-xl font-black text-white focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              {verifyError && (
                <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                  {verifyError}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillCode}
                  className="py-2.5 px-4 rounded-xl bg-[#172219] hover:bg-[#1e2d21] border border-[#2b3d2e] text-[#ccff00] text-xs font-bold transition-all"
                >
                  Remplir automatiquement le code : {generatedCode}
                </button>

                <p className="text-[11px] text-slate-400">
                  Vous n'avez pas reçu le code ?{' '}
                  <button 
                    onClick={handleSendVerificationEmail}
                    className="text-[#ccff00] hover:underline font-bold"
                  >
                    Renvoyer
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: INFORMATIONS UTILISATEUR & PHOTO DE PROFIL       */}
          {/* ======================================================== */}
          {step === 'user_info' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-wider">
                  Étape 1 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Informations de l'utilisateur & Photo
                </h2>
                <p className="text-xs text-slate-300">
                  Personnalisez votre identité pour l'affichage de votre profil.
                </p>
              </div>

              {/* Photo de Profil : Upload ou choix d'avatars */}
              <div className="bg-[#131914] p-4 rounded-2xl border border-[#232f26]">
                <label className="block text-xs font-bold text-slate-300 mb-2.5">
                  Photo de profil
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                    />
                    <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-[9px] text-white font-bold mt-0.5">Modifier</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b251d] hover:bg-[#243327] border border-[#2e4031] text-xs font-bold text-slate-200 cursor-pointer transition-colors active:scale-95 mb-2">
                      <Upload className="w-3.5 h-3.5 text-[#ccff00]" />
                      <span>Importer une image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Ou choisissez une caricature d'animal :
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {ANIMAL_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setAvatarUrl(av.url)}
                          title={av.name}
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                            avatarUrl === av.url ? 'border-[#ccff00] scale-110 shadow-[0_0_10px_rgba(204,255,0,0.5)]' : 'border-[#263628] opacity-75 hover:opacity-100 hover:border-slate-400'
                          }`}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulaire Textuel */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Davy Papet"
                      className="w-full bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 07 42 78 91"
                        className="w-full bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Adresse e-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="davypapet@gmail.com"
                        className="w-full bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep('salary')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
                >
                  <span>Suivant : Salaire & Devise</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: SAISIE DU SALAIRE & DEVISE                       */}
          {/* ======================================================== */}
          {step === 'salary' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-wider">
                  Étape 2 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Alimentation : Salaire & Devise
                </h2>
                <p className="text-xs text-slate-300">
                  Renseignez vos revenus mensuels habituels pour automatiser les calculs.
                </p>
              </div>

              <div className="bg-[#131914] p-5 rounded-2xl border border-[#232f26] space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Salaire mensuel perçu de base
                  </label>
                  <div className="relative">
                    <Wallet className="w-5 h-5 text-[#ccff00] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      value={defaultSalary}
                      onChange={(e) => setDefaultSalary(e.target.value)}
                      placeholder="750000"
                      className="w-full bg-[#18211a] border border-[#2b3d2e] focus:border-[#ccff00] rounded-2xl pl-11 pr-16 py-3 text-base sm:text-lg font-black text-white focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#ccff00]">
                      {currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Devise monétaire
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['FCFA', 'EUR', 'USD', 'CAD', 'CHF', 'GBP'].map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setCurrency(cur)}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                          currency === cur
                            ? 'bg-[#ccff00] text-black shadow-md'
                            : 'bg-[#18201a] text-slate-300 hover:text-white border border-[#263529]'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimation financière */}
                {parseFloat(defaultSalary) > 0 && (
                  <div className="p-3 bg-[#172219] rounded-xl border border-[#263729] grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Base Dépenses (80%)
                      </span>
                      <span className="text-xs sm:text-sm font-black text-rose-300">
                        {formatCurrency(Math.round(parseFloat(defaultSalary) * 0.8), currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Épargne conseillée (20%)
                      </span>
                      <span className="text-xs sm:text-sm font-black text-[#ccff00]">
                        {formatCurrency(Math.round(parseFloat(defaultSalary) * 0.2), currency)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep('user_info')}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep('theme')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
                >
                  <span>Suivant : Choix du thème</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: CHOIX DU THÈME (Inspiré de l'Image 2)           */}
          {/* ======================================================== */}
          {step === 'theme' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-wider">
                  Étape 3 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Apparence & Thème d'affichage
                </h2>
                <p className="text-xs text-slate-300">
                  Choisissez l'univers visuel qui correspond à votre style.
                </p>
              </div>

              {/* Aperçu côte à côte inspiré de l'Image 2 : Light mode VS Dark mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* DARK MODE OPTION */}
                <div
                  onClick={() => setSelectedTheme('dark')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#090b09] text-white shadow-xl ${
                    selectedTheme === 'dark'
                      ? 'border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.25)]'
                      : 'border-[#222c24] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#ccff00]/20 text-[#ccff00] flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-white">Thème Sombre</span>
                    </div>
                    {selectedTheme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Mock card Dark */}
                  <div className="bg-[#121613] p-3 rounded-xl border border-[#232f26] space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-2 w-16 bg-[#253227] rounded-full"></div>
                      <div className="h-2 w-8 bg-[#ccff00] rounded-full"></div>
                    </div>
                    <div className="text-sm font-black text-white">750 000 FCFA</div>
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-4 w-12 bg-[#ccff00]/20 rounded-md"></div>
                      <div className="h-4 w-12 bg-[#1b251d] rounded-md"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2.5">
                    Contraste absolu, accents vert néon, confort visuel OLED.
                  </p>
                </div>

                {/* LIGHT MODE OPTION */}
                <div
                  onClick={() => setSelectedTheme('light')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#f4f6f8] text-slate-900 shadow-xl ${
                    selectedTheme === 'light'
                      ? 'border-[#0f8a3c] shadow-[0_0_20px_rgba(15,138,60,0.25)]'
                      : 'border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">Thème Clair</span>
                    </div>
                    {selectedTheme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-[#0f8a3c] text-white flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Mock card Light */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-2 w-16 bg-slate-200 rounded-full"></div>
                      <div className="h-2 w-8 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="text-sm font-black text-slate-900">750 000 FCFA</div>
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-4 w-12 bg-emerald-100 rounded-md"></div>
                      <div className="h-4 w-12 bg-slate-100 rounded-md"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5">
                    Élégance immaculée, haute luminosité, typographie ciselée.
                  </p>
                </div>
              </div>

              {/* Option Auto / Système */}
              <div 
                onClick={() => setSelectedTheme('system')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedTheme === 'system' 
                    ? 'border-[#ccff00] bg-[#161f18]' 
                    : 'border-[#232f26] bg-[#121813] hover:bg-[#161e15]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-[#ccff00]" />
                  <div>
                    <span className="text-xs font-bold text-white block">Automatique (Système)</span>
                    <span className="text-[11px] text-slate-400">S'adapte aux réglages de votre smartphone ou ordinateur</span>
                  </div>
                </div>
                {selectedTheme === 'system' && (
                  <span className="w-4 h-4 rounded-full bg-[#ccff00] text-black text-[10px] font-black flex items-center justify-center">
                    ✓
                  </span>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep('salary')}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep('security')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
                >
                  <span>Suivant : Sécurité & Verrouillage</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: SÉCURITÉ & VERROUILLAGE (Mot de passe, Face ID)   */}
          {/* ======================================================== */}
          {step === 'security' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-wider">
                  Étape 4 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Sécurité & Verrouillage de GesFin
                </h2>
                <p className="text-xs text-slate-300">
                  Protégez vos données financières avec un mot de passe et vos données biométriques.
                </p>
              </div>

              <div className="bg-[#131914] p-5 rounded-2xl border border-[#232f26] space-y-4">
                {/* Toggle Lock */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#172219] border border-[#253628]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-white block">
                        Verrouillage par code PIN / mot de passe
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Demande un mot de passe à l'ouverture de l'application
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLockEnabled}
                      onChange={(e) => setIsLockEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#253227] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ccff00]"></div>
                  </label>
                </div>

                {/* Saisie mot de passe si activé */}
                {isLockEnabled && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Définir un mot de passe ou code PIN
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#18211a] border border-[#2b3c2e] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#18211a] border border-[#2b3c2e] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggle Face ID / Empreinte */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#172219] border border-[#253628]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <ScanFace className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-white block">
                        Déverrouillage biométrique (Face ID & Empreinte)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Authentification instantanée via capteur biométrique
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useBiometrics}
                      onChange={(e) => setUseBiometrics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#253227] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ccff00]"></div>
                  </label>
                </div>

                {securityError && (
                  <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                    {securityError}
                  </p>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep('theme')}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleSecurityNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
                >
                  <span>Valider la configuration</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: ÉCRAN DE CONFIRMATION MINIMALISTE (Image 4)       */}
          {/* ======================================================== */}
          {step === 'success' && (
            <div className="space-y-6 text-center animate-fadeIn max-w-sm mx-auto py-2">
              {/* Checkmark Circle Icon style Image 4 */}
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 rounded-full bg-[#ccff00]/15 text-[#ccff00] border-2 border-[#ccff00] flex items-center justify-center shadow-[0_0_35px_rgba(204,255,0,0.35)] animate-pulse">
                  <Check className="w-10 h-10 text-[#ccff00] stroke-[3.5]" />
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Configuration terminée avec succès !
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Votre espace <span className="text-[#ccff00] font-black">GesFin</span> est maintenant configuré et prêt pour la gestion de vos finances.
                </p>
              </div>

              {/* Résumé des réglages validés */}
              <div className="bg-[#141b15] p-4 rounded-2xl border border-[#232f26] text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1f2821]">
                  <span className="text-slate-400">Profil utilisateur</span>
                  <div className="flex items-center gap-2">
                    <img src={avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-bold text-white">{fullName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1f2821]">
                  <span className="text-slate-400">Salaire mensuel</span>
                  <span className="font-extrabold text-[#ccff00]">
                    {formatCurrency(parseFloat(defaultSalary) || 750000, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1f2821]">
                  <span className="text-slate-400">Thème d'affichage</span>
                  <span className="font-bold text-white capitalize">{selectedTheme}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sécurité</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {isLockEnabled ? 'Verrouillé + Biométrie' : 'Session protégée'}
                  </span>
                </div>
              </div>

              {/* Bouton pour tout valider et entrer dans l'application */}
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full py-3.5 rounded-2xl bg-[#ccff00] hover:bg-[#d9ff33] text-black font-black text-sm tracking-tight shadow-[0_0_25px_rgba(204,255,0,0.35)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Accéder à mon GesFin</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
