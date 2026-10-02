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
  /** Si true, l'assistant ne peut pas être fermé (première configuration) */
  required?: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  currentSecurity: SecuritySettings;
  onComplete: (user: UserProfile, security: SecuritySettings) => void;
}

type OnboardingStep = 'user_info' | 'salary' | 'theme' | 'security' | 'success';

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  isOpen,
  required = false,
  onClose,
  currentUser,
  currentSecurity,
  onComplete,
}) => {
  const { themeMode, setThemeMode } = useTheme();

  const [step, setStep] = useState<OnboardingStep>('user_info');

  // User Profile configuration state
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [emailInput, setEmailInput] = useState(currentUser.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || DEFAULT_AVATAR);
  const [infoError, setInfoError] = useState('');

  // Salary & Currency state
  const [defaultSalary, setDefaultSalary] = useState(currentUser.defaultSalary ? currentUser.defaultSalary.toString() : '');
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

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  // Valide l'étape d'identité avant de passer à la suite
  const handleInfoNext = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setInfoError('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (emailInput.trim() && !/^\S+@\S+\.\S+$/.test(emailInput.trim())) {
      setInfoError("L'adresse e-mail n'est pas valide.");
      return;
    }
    setInfoError('');
    setStep('salary');
  };

  // Final Complete
  const handleFinalSubmit = () => {
    const updatedUser: UserProfile = {
      ...currentUser,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      fullName: fullName,
      email: emailInput.trim().toLowerCase(),
      phone: phone.trim(),
      defaultSalary: parseFloat(defaultSalary) || 0,
      currency,
      avatarUrl,
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

          {!required && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#1f2821] transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar (hidden on success or login) */}
        {step !== 'success' && (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Prénom <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nom <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      className="bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Pseudo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Pseudo (optionnel)"
                      className="bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
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
                      placeholder="Téléphone (optionnel)"
                      className="bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
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
                      placeholder="E-mail (optionnel)"
                      className="bg-[#141b15] border border-[#263529] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
                </div>
              </div>

              {infoError && (
                <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                  {infoError}
                </p>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-end pt-3">
                <button
                  type="button"
                  onClick={handleInfoNext}
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
                      placeholder="Ex : 500000"
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
                    <div className="h-3 w-24 bg-[#ccff00]/30 rounded-full"></div>
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
                    <div className="h-3 w-24 bg-emerald-300 rounded-full"></div>
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
                    {formatCurrency(parseFloat(defaultSalary) || 0, currency)}
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
