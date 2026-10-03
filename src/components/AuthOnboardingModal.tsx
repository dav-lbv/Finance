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
import { BiometricToggle } from './BiometricToggle';
import { hashPassword } from '../utils/crypto';
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(currentSecurity.useBiometrics ?? false);
  const [biometricCredentialId, setBiometricCredentialId] = useState(currentSecurity.biometricCredentialId);
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
  const handleFinalSubmit = async () => {
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
      passwordHash: isLockEnabled ? (password ? await hashPassword(password) : currentSecurity.passwordHash) : '',
      useBiometrics: isLockEnabled && useBiometrics,
      biometricCredentialId: isLockEnabled && useBiometrics ? biometricCredentialId : undefined,
      biometricType,
    };

    // Apply theme
    setThemeMode(selectedTheme);
    onComplete(updatedUser, updatedSecurity);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app animate-fadeIn">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col min-h-0">
        {/* Top Header bar with Mon Kanda Logo & Close */}
        <div className="px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="w-9 h-9 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-fg">Mon Kanda</span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30">
                  Setup
                </span>
              </div>
            </div>
          </div>

          {!required && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar (hidden on success or login) */}
        {step !== 'success' && (
          <div className="w-full bg-surface-2 h-1.5 flex">
            <div 
              className="bg-gradient-to-r from-fg-muted to-brand h-full transition-all duration-300"
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
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 pt-6">

          {/* ======================================================== */}
          {/* STEP 1: INFORMATIONS UTILISATEUR & PHOTO DE PROFIL       */}
          {/* ======================================================== */}
          {step === 'user_info' && (
            <div className="flex flex-col gap-5 min-h-full animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-brand uppercase tracking-wider">
                  Étape 1 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-fg">
                  Informations de l'utilisateur & Photo
                </h2>
                <p className="text-xs text-fg-2">
                  Personnalisez votre identité pour l'affichage de votre profil.
                </p>
              </div>

              {/* Photo de Profil : Upload ou choix d'avatars */}
              <div className="bg-surface p-4 rounded-2xl border border-line">
                <label className="block text-xs font-bold text-fg-2 mb-2.5">
                  Photo de profil
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)]"
                    />
                    <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-fg" />
                      <span className="text-[9px] text-fg font-bold mt-0.5">Modifier</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 border border-line-strong text-xs font-bold text-fg-2 cursor-pointer transition-colors active:scale-95 mb-2">
                      <Upload className="w-3.5 h-3.5 text-brand" />
                      <span>Importer une image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[11px] text-fg-muted">
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
                            avatarUrl === av.url ? 'border-brand scale-110 shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]' : 'border-line-strong opacity-75 hover:opacity-100 hover:border-line-strong'
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
                  <label className="block text-xs font-bold text-fg-2 mb-1">
                    Prénom <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-3 text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1">
                    Nom <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-3 text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1">
                    Pseudo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Pseudo (optionnel)"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-3 text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Téléphone (optionnel)"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-3 text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="E-mail (optionnel)"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-3 text-sm text-fg focus:outline-none"
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
              <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] mt-auto bg-app/85 backdrop-blur-xl border-t border-line flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleInfoNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
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
            <div className="flex flex-col gap-5 min-h-full animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-brand uppercase tracking-wider">
                  Étape 2 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-fg">
                  Alimentation : Salaire & Devise
                </h2>
                <p className="text-xs text-fg-2">
                  Renseignez vos revenus mensuels habituels pour automatiser les calculs.
                </p>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-line space-y-4">
                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1.5">
                    Salaire mensuel perçu de base
                  </label>
                  <div className="relative">
                    <Wallet className="w-5 h-5 text-brand absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="number" inputMode="decimal"
                      required
                      value={defaultSalary}
                      onChange={(e) => setDefaultSalary(e.target.value)}
                      placeholder="Ex : 500000"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-11 pr-16 py-3 text-base sm:text-lg font-black text-fg focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-brand">
                      {currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1.5">
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
                            ? 'bg-brand text-brand-fg shadow-md'
                            : 'bg-surface-2 text-fg-2 hover:text-fg border border-line-strong'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimation financière */}
                {parseFloat(defaultSalary) > 0 && (
                  <div className="p-3 bg-surface-2 rounded-xl border border-line-strong grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-fg-muted uppercase font-bold block">
                        Base Dépenses (80%)
                      </span>
                      <span className="text-xs sm:text-sm font-black text-rose-300">
                        {formatCurrency(Math.round(parseFloat(defaultSalary) * 0.8), currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-fg-muted uppercase font-bold block">
                        Épargne conseillée (20%)
                      </span>
                      <span className="text-xs sm:text-sm font-black text-brand">
                        {formatCurrency(Math.round(parseFloat(defaultSalary) * 0.2), currency)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] mt-auto bg-app/85 backdrop-blur-xl border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('user_info')}
                  className="px-4 py-2 text-xs font-bold text-fg-muted hover:text-fg"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep('theme')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
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
            <div className="flex flex-col gap-5 min-h-full animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-brand uppercase tracking-wider">
                  Étape 3 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-fg">
                  Apparence & Thème d'affichage
                </h2>
                <p className="text-xs text-fg-2">
                  Choisissez l'univers visuel qui correspond à votre style.
                </p>
              </div>

              {/* Aperçu côte à côte inspiré de l'Image 2 : Light mode VS Dark mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* DARK MODE OPTION */}
                <div
                  onClick={() => setSelectedTheme('dark')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden bg-app text-fg shadow-xl ${
                    selectedTheme === 'dark'
                      ? 'border-brand shadow-[0_0_20px_rgba(var(--brand-rgb),0.25)]'
                      : 'border-line opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand/20 text-brand flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-fg">Thème Sombre</span>
                    </div>
                    {selectedTheme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-brand text-brand-fg flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Mock card Dark */}
                  <div className="bg-surface p-3 rounded-xl border border-line space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-2 w-16 bg-surface-3 rounded-full"></div>
                      <div className="h-2 w-8 bg-brand rounded-full"></div>
                    </div>
                    <div className="h-3 w-24 bg-brand/30 rounded-full"></div>
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-4 w-12 bg-brand/20 rounded-md"></div>
                      <div className="h-4 w-12 bg-surface-2 rounded-md"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-fg-muted mt-2.5">
                    Contraste absolu, accents vert néon, confort visuel OLED.
                  </p>
                </div>

                {/* LIGHT MODE OPTION */}
                <div
                  onClick={() => setSelectedTheme('light')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden bg-fg-2 text-fg shadow-xl ${
                    selectedTheme === 'light'
                      ? 'border-success shadow-[0_0_20px_rgba(15,138,60,0.25)]'
                      : 'border-line-strong opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-fg">Thème Clair</span>
                    </div>
                    {selectedTheme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Mock card Light */}
                  <div className="bg-white p-3 rounded-xl border border-line-strong shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-2 w-16 bg-surface-3 rounded-full"></div>
                      <div className="h-2 w-8 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="h-3 w-24 bg-emerald-300 rounded-full"></div>
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-4 w-12 bg-emerald-100 rounded-md"></div>
                      <div className="h-4 w-12 bg-surface-3 rounded-md"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-fg-muted mt-2.5">
                    Élégance immaculée, haute luminosité, typographie ciselée.
                  </p>
                </div>
              </div>

              {/* Option Auto / Système */}
              <div 
                onClick={() => setSelectedTheme('system')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedTheme === 'system' 
                    ? 'border-brand bg-surface-2' 
                    : 'border-line bg-surface hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-brand" />
                  <div>
                    <span className="text-xs font-bold text-fg block">Automatique (Système)</span>
                    <span className="text-[11px] text-fg-muted">S'adapte aux réglages de votre smartphone ou ordinateur</span>
                  </div>
                </div>
                {selectedTheme === 'system' && (
                  <span className="w-4 h-4 rounded-full bg-brand text-brand-fg text-[10px] font-black flex items-center justify-center">
                    ✓
                  </span>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] mt-auto bg-app/85 backdrop-blur-xl border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('salary')}
                  className="px-4 py-2 text-xs font-bold text-fg-muted hover:text-fg"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep('security')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
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
            <div className="flex flex-col gap-5 min-h-full animate-fadeIn">
              <div>
                <span className="text-[10px] font-black text-brand uppercase tracking-wider">
                  Étape 4 sur 4
                </span>
                <h2 className="text-lg sm:text-xl font-black text-fg">
                  Sécurité & Verrouillage de Mon Kanda
                </h2>
                <p className="text-xs text-fg-2">
                  Protégez vos données financières avec un mot de passe et vos données biométriques.
                </p>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-line space-y-4">
                {/* Toggle Lock */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-line-strong">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-fg block">
                        Verrouillage par code PIN / mot de passe
                      </span>
                      <span className="text-[11px] text-fg-muted">
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
                    <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>

                {/* Saisie mot de passe si activé */}
                {isLockEnabled && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-fg-2 mb-1">
                        Définir un mot de passe ou code PIN
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-2 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Déverrouillage biométrique (demande l'autorisation au système) */}
                <BiometricToggle
                  enabled={useBiometrics && isLockEnabled}
                  lockEnabled={isLockEnabled}
                  onChange={(enabled, credentialId) => {
                    setUseBiometrics(enabled);
                    setBiometricCredentialId(credentialId);
                  }}
                />

                {securityError && (
                  <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                    {securityError}
                  </p>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] mt-auto bg-app/85 backdrop-blur-xl border-t border-line flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('theme')}
                  className="px-4 py-2 text-xs font-bold text-fg-muted hover:text-fg"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleSecurityNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
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
            <div className="space-y-6 text-center animate-fadeIn max-w-sm mx-auto py-2 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
              {/* Checkmark Circle Icon style Image 4 */}
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 rounded-full bg-brand/15 text-brand border-2 border-brand flex items-center justify-center shadow-[0_0_35px_rgba(var(--brand-rgb),0.35)] animate-pulse">
                  <Check className="w-10 h-10 text-brand stroke-[3.5]" />
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-fg tracking-tight">
                  Configuration terminée avec succès !
                </h2>
                <p className="text-xs text-fg-2 mt-1.5 leading-relaxed">
                  Votre espace <span className="text-brand font-black">Mon Kanda</span> est maintenant configuré et prêt pour la gestion de vos finances.
                </p>
              </div>

              {/* Résumé des réglages validés */}
              <div className="bg-surface p-4 rounded-2xl border border-line text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-line">
                  <span className="text-fg-muted">Profil utilisateur</span>
                  <div className="flex items-center gap-2">
                    <img src={avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-bold text-fg">{fullName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-line">
                  <span className="text-fg-muted">Salaire mensuel</span>
                  <span className="font-extrabold text-brand">
                    {formatCurrency(parseFloat(defaultSalary) || 0, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-line">
                  <span className="text-fg-muted">Thème d'affichage</span>
                  <span className="font-bold text-fg capitalize">{selectedTheme}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">Sécurité</span>
                  <span className="font-bold text-fg flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {isLockEnabled ? 'Verrouillé + Biométrie' : 'Session protégée'}
                  </span>
                </div>
              </div>

              {/* Bouton pour tout valider et entrer dans l'application */}
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-brand-fg font-black text-sm tracking-tight shadow-[0_0_25px_rgba(var(--brand-rgb),0.35)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Accéder à Mon Kanda</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
