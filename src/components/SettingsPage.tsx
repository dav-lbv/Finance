import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Phone, 
  Mail, 
  Wallet, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RotateCcw, 
  Check, 
  Tag, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Sparkles, 
  Sun, 
  Moon, 
  Laptop, 
  Palette, 
  ArrowLeft, 
  ChevronRight, 
  ScanFace, 
  Camera, 
  Upload, 
  Database,
  Sliders,
  DollarSign
} from 'lucide-react';
import { AppData, UserProfile, SecuritySettings, ExpensePreset, ExpenseCategory } from '../types';
import { formatCurrency, formatMonthKey } from '../utils/date';
import { ANIMAL_AVATARS, DEFAULT_AVATAR } from '../utils/avatars';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../hooks/useTheme';
import { CategorySelect } from './CategorySelect';
import { FintechSelect } from './FintechSelect';

export type SettingsSection = 
  | 'menu' 
  | 'user_info' 
  | 'budget_salary' 
  | 'categories' 
  | 'appearance' 
  | 'security' 
  | 'backup';

interface SettingsPageProps {
  data: AppData;
  selectedMonth: string;
  onUpdateUser: (newUser: UserProfile) => void;
  onUpdateSecurity: (newSecurity: SecuritySettings) => void;
  onUpdateMonthSalary: (monthKey: string, salary: number) => void;
  onResetData: () => void;
  onLockAppNow: () => void;
  onAddPreset: (preset: Omit<ExpensePreset, 'id'>) => void;
  onUpdatePreset: (preset: ExpensePreset) => void;
  onDeletePreset: (presetId: string) => void;
  onOpenOnboarding?: () => void;
  initialSection?: SettingsSection;
}

const CATEGORIES: ExpenseCategory[] = [
  'Logement',
  'Alimentation',
  'Factures & Abonnements',
  'Transport',
  'Santé',
  'Loisirs & Sorties',
  'Shopping & Divers',
  'Autre',
];

const PRESET_AVATARS = ANIMAL_AVATARS.map(a => a.url);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  data,
  selectedMonth,
  onUpdateUser,
  onUpdateSecurity,
  onUpdateMonthSalary,
  onResetData,
  onLockAppNow,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onOpenOnboarding,
  initialSection = 'menu',
}) => {
  const currency = data.user.currency || 'FCFA';
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();

  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Section 1: User Profile state
  const [fullName, setFullName] = useState(data.user.fullName);
  const [username, setUsername] = useState(data.user.username || '');
  const [phone, setPhone] = useState(data.user.phone);
  const [email, setEmail] = useState(data.user.email);
  const [defaultSalary, setDefaultSalary] = useState(data.user.defaultSalary.toString());
  const [selectedCurrency, setSelectedCurrency] = useState(data.user.currency || 'FCFA');
  const [avatarUrl, setAvatarUrl] = useState(data.user.avatarUrl || PRESET_AVATARS[0]);
  const [userSavedToast, setUserSavedToast] = useState(false);

  // Section 2: Month Salary state
  const currentMonthBudget = data.monthlyBudgets[selectedMonth];
  const [currentMonthSalary, setCurrentMonthSalary] = useState(
    (currentMonthBudget?.salaryReceived ?? data.user.defaultSalary).toString()
  );
  const [salarySavedToast, setSalarySavedToast] = useState(false);

  // Section 3: Presets state
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<ExpenseCategory>('Alimentation');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [presetSavedToast, setPresetSavedToast] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('Alimentation');
  const [editAmount, setEditAmount] = useState('');

  // Section 4: Security state
  const [isLockEnabled, setIsLockEnabled] = useState(data.security.isLockEnabled);
  const [passwordInput, setPasswordInput] = useState(data.security.passwordHash);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState(data.security.passwordHash);
  const [useBiometrics, setUseBiometrics] = useState(data.security.useBiometrics ?? true);
  const [showPassword, setShowPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Handle Image Upload for avatar
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Save User Info
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSalary = parseFloat(defaultSalary) || 0;
    
    const updatedUser: UserProfile = {
      ...data.user,
      fullName: fullName.trim(),
      firstName: fullName.trim().split(/\s+/)[0] || '',
      lastName: fullName.trim().split(/\s+/).slice(1).join(' '),
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      defaultSalary: parsedSalary,
      currency: selectedCurrency,
      avatarUrl,
    };

    onUpdateUser(updatedUser);
    setUserSavedToast(true);
    setTimeout(() => setUserSavedToast(false), 3000);
  };

  // Save Specific Month Salary
  const handleSaveMonthSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(currentMonthSalary);
    if (!isNaN(val) && val >= 0) {
      onUpdateMonthSalary(selectedMonth, val);
      setSalarySavedToast(true);
      setTimeout(() => setSalarySavedToast(false), 3000);
    }
  };

  // Save Security
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (isLockEnabled) {
      if (!passwordInput || passwordInput.trim().length < 4) {
        setSecurityMessage({
          type: 'error',
          text: 'Le mot de passe doit comporter au moins 4 caractères.',
        });
        return;
      }

      if (passwordInput !== confirmPasswordInput) {
        setSecurityMessage({
          type: 'error',
          text: 'Les deux mots de passe ne correspondent pas.',
        });
        return;
      }
    }

    onUpdateSecurity({
      isLockEnabled: isLockEnabled,
      passwordHash: isLockEnabled ? passwordInput.trim() : '',
      useBiometrics,
      biometricType: 'both',
    });

    setSecurityMessage({
      type: 'success',
      text: isLockEnabled 
        ? 'Sécurité et mot de passe mis à jour avec succès.' 
        : 'Verrouillage désactivé.',
    });
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  // Presets Handlers
  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetTitle.trim()) return;

    onAddPreset({
      title: newPresetTitle.trim(),
      category: newPresetCategory,
      defaultAmount: newPresetAmount ? parseFloat(newPresetAmount) : undefined,
    });

    setNewPresetTitle('');
    setNewPresetAmount('');
    setPresetSavedToast(true);
    setTimeout(() => setPresetSavedToast(false), 2500);
  };

  const handleStartEditPreset = (preset: ExpensePreset) => {
    setEditingPresetId(preset.id);
    setEditTitle(preset.title);
    setEditCategory(preset.category);
    setEditAmount(preset.defaultAmount ? preset.defaultAmount.toString() : '');
  };

  const handleSaveEditPreset = (presetId: string) => {
    if (!editTitle.trim()) return;
    onUpdatePreset({
      id: presetId,
      title: editTitle.trim(),
      category: editCategory,
      defaultAmount: editAmount ? parseFloat(editAmount) : undefined,
    });
    setEditingPresetId(null);
  };

  // JSON Export
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gesfin_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto">
      
      {/* Toast notifications */}
      {userSavedToast && (
        <div className="fixed bottom-24 right-4 z-50 bg-surface-2 border-2 border-brand text-fg px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-brand" />
          <span className="text-xs font-bold">Informations utilisateur enregistrées avec succès !</span>
        </div>
      )}

      {salarySavedToast && (
        <div className="fixed bottom-24 right-4 z-50 bg-surface-2 border-2 border-brand text-fg px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-brand" />
          <span className="text-xs font-bold">Salaire mensuel mis à jour !</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION PRINCIPALE (MENU) : STYLE BENTO GRID MODERNE     */}
      {/* ======================================================== */}
      {activeSection === 'menu' && (
        <div className="space-y-6 stagger">
          
          {/* Header de la page */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
                Paramètres de GesFin
              </h1>
              <p className="text-xs sm:text-sm text-fg-2 mt-0.5">
                Organisation en grille Bento pour une gestion claire et intuitive de votre application.
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* GRILLE BENTO ADAPTÉE AUX PARAMÈTRES (INSPIRATION DAYBASE) */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            
            {/* TUILE BENTO 1 (HERO PROFIL - SPAN 2) */}
            <div 
              onClick={() => setActiveSection('user_info')}
              className="md:col-span-2 group bg-gradient-to-br from-surface-2 via-surface to-surface hover:from-surface-2 hover:to-surface p-5 sm:p-6 rounded-3xl border border-line-strong hover:border-brand/50 transition-all duration-200 cursor-pointer shadow-xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-brand shadow-[0_0_20px_rgba(var(--brand-rgb),0.3)]"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-line"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-fg truncate">{fullName}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand/15 text-brand border border-brand/30 shrink-0">
                        {currency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-fg-muted">
                      <span className="truncate">{email}</span>
                      {phone && (
                        <>
                          <span>•</span>
                          <span className="whitespace-nowrap font-medium text-fg-2">{phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection('user_info');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-brand text-brand-fg font-extrabold text-xs shadow-md hover:bg-brand-hover active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Modifier le profil</span>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-fg-muted">
                <span>Informations personnelles & Devise monétaire</span>
                <ChevronRight className="w-4 h-4 text-fg-muted group-hover:text-brand transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 2 (THÈME) */}
            <div
              onClick={() => setActiveSection('appearance')}
              className="group p-5 rounded-3xl border border-line transition-all duration-300 cursor-pointer bg-surface lift flex flex-col justify-between relative overflow-hidden hover:border-line-strong"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-brand" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-fg-muted">
                    Ambiance Visuelle
                  </span>
                </div>
                <h3 className="font-black text-base text-fg tracking-tight">Thème d'affichage</h3>
                <p className="text-xs text-fg-muted mt-0.5">
                  Basculez entre le mode sombre, le mode clair ou le réglage automatique.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border cursor-pointer ${
                      themeMode === 'dark' ? 'bg-brand text-brand-fg border-brand' : 'bg-surface-2 text-fg-2 border-line-strong hover:text-fg'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Sombre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border cursor-pointer ${
                      themeMode === 'light' ? 'bg-brand text-brand-fg border-brand' : 'bg-surface-2 text-fg-2 border-line-strong hover:text-fg'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Clair</span>
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-[11px] text-fg-muted">
                <span>Personnaliser l'affichage</span>
                <ChevronRight className="w-4 h-4 text-fg-muted group-hover:text-brand transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 3 (BUDGET & SALAIRE) */}
            <div
              onClick={() => setActiveSection('budget_salary')}
              className="group bg-surface hover:bg-surface-2 p-5 rounded-3xl border border-line hover:border-brand/50 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-fg-muted">
                    Alimentation Mensuelle
                  </span>
                  <Wallet className="w-4 h-4 text-brand" />
                </div>
                <h3 className="font-black text-base text-fg tracking-tight">
                  Budget & Salaire
                </h3>
                <div className="mt-2 text-xl font-black text-brand">
                  {formatCurrency(Number(defaultSalary) || 0, currency)}
                </div>
                <p className="text-[11px] text-fg-muted mt-0.5">
                  Salaire mensuel de référence par défaut.
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-xs text-fg-muted">
                <span>Ajuster les salaires</span>
                <ChevronRight className="w-4 h-4 text-fg-muted group-hover:text-brand transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 4 (MODÈLES DE DÉPENSES RÉCURRENTES) */}
            <div
              onClick={() => setActiveSection('categories')}
              className="group bg-surface hover:bg-surface-2 p-5 rounded-3xl border border-line hover:border-brand/50 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-fg-muted">
                    Modèles Automatiques
                  </span>
                  <Tag className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-black text-base text-fg tracking-tight">
                  Dépenses Récurrentes
                </h3>
                <div className="mt-2 text-xl font-black text-fg">
                  {data.expensePresets?.length || 0} modèles
                </div>
                <p className="text-[11px] text-fg-muted mt-0.5">
                  Loyer, abonnements, courses et charges fixes.
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-xs text-fg-muted">
                <span>Gérer les modèles</span>
                <ChevronRight className="w-4 h-4 text-fg-muted group-hover:text-brand transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 5 (SÉCURITÉ & VERROUILLAGE) */}
            <div
              onClick={() => setActiveSection('security')}
              className="group bg-surface hover:bg-surface-2 p-5 rounded-3xl border border-line hover:border-brand/50 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-fg-muted">
                    Confidentialité
                  </span>
                  <Lock className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="font-black text-base text-fg tracking-tight">
                  Sécurité & Verrouillage
                </h3>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                    data.security.isLockEnabled
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-surface-3 text-fg-muted border border-line-strong'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${data.security.isLockEnabled ? 'bg-emerald-400' : 'bg-fg-muted'}`} />
                    <span>{data.security.isLockEnabled ? 'Verrouillage Actif' : 'Non protégé'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-fg-muted mt-1.5">
                  Code PIN, empreinte et biométrie.
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-xs text-fg-muted">
                <span>Paramétrer le code</span>
                <ChevronRight className="w-4 h-4 text-fg-muted group-hover:text-brand transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 6 (SAUVEGARDE & DONNÉES - SPAN 3) */}
            <div className="md:col-span-3 bg-gradient-to-r from-surface via-surface-2 to-surface p-5 rounded-3xl border border-line shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-surface-2 border border-line-strong text-brand flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-fg">Sauvegarde & Données GesFin</h3>
                  <p className="text-xs text-fg-muted mt-0.5">
                    Exportez l'ensemble de vos transactions, salaires et projets d'épargne en fichier JSON sécurisé.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-full bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-brand" />
                  <span>Exporter JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('backup')}
                  className="px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-brand-fg text-xs font-extrabold transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <span>Gérer les sauvegardes</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SOUS-PAGE 1 : INFORMATIONS DE L'UTILISATEUR              */}
      {/* ======================================================== */}
      {activeSection === 'user_info' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header de sous-page avec bouton retour */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSection('menu')}
              className="inline-flex items-center gap-2 text-xs font-bold text-fg-2 hover:text-fg bg-surface hover:bg-surface-2 px-4 py-2 rounded-full border border-line-strong transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-brand" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-black text-fg">Informations de l'utilisateur</h2>
              <p className="text-xs text-fg-muted mt-1">
                Configurez votre profil, votre nom et votre photo d'avatar affichés sur le dashboard.
              </p>
            </div>

            {/* Photo de profil */}
            <div className="mb-6 bg-surface-2 p-4 rounded-2xl border border-line-strong">
              <label className="block text-xs font-bold text-fg-2 mb-3">
                Photo de profil
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-brand shadow-[0_0_20px_rgba(var(--brand-rgb),0.35)]"
                  />
                  <label className="absolute inset-0 bg-black/65 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-fg" />
                    <span className="text-[9px] text-fg font-bold mt-0.5">Modifier</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-3 hover:bg-surface-3 border border-line-strong text-xs font-bold text-fg-2 cursor-pointer transition-colors active:scale-95 mb-2">
                    <Upload className="w-3.5 h-3.5 text-brand" />
                    <span>Télécharger une photo</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-fg-muted">
                    Ou choisissez une caricature d'animal :
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-2 flex-wrap">
                    {ANIMAL_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarUrl(av.url)}
                        title={av.name}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                          avatarUrl === av.url ? 'border-brand scale-110 shadow-[0_0_12px_rgba(var(--brand-rgb),0.5)]' : 'border-line-strong opacity-75 hover:opacity-100 hover:border-line-strong'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire complet */}
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1.5">
                    Nom & Prénom
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Prénom Nom"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1.5">
                    Pseudo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Pseudo (optionnel)"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1.5">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Numéro de téléphone"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1.5">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Adresse e-mail"
                      className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <FintechSelect
                    label="Devise monétaire principale"
                    value={selectedCurrency}
                    options={[
                      { value: 'FCFA', label: 'FCFA (Franc CFA)' },
                      { value: 'EUR', label: 'EUR (€ Euro)' },
                      { value: 'USD', label: 'USD ($ Dollar US)' },
                      { value: 'CAD', label: 'CAD ($ Dollar Canadien)' },
                      { value: 'CHF', label: 'CHF (Franc Suisse)' },
                      { value: 'GBP', label: 'GBP (£ Livre Sterling)' },
                    ]}
                    onChange={(val) => setSelectedCurrency(val)}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SOUS-PAGE 2 : ALIMENTATION DÉPENSES & ÉPARGNE            */}
      {/* ======================================================== */}
      {activeSection === 'budget_salary' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSection('menu')}
              className="inline-flex items-center gap-2 text-xs font-bold text-fg-2 hover:text-fg bg-surface hover:bg-surface-2 px-4 py-2 rounded-full border border-line-strong transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-brand" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-fg">Alimentation Dépenses & Épargne</h2>
              <p className="text-xs text-fg-muted mt-1">
                Ajustez le salaire mensuel par défaut ainsi que le salaire spécifique perçu pour le mois actif en {formatMonthKey(selectedMonth)}.
              </p>
            </div>

            {/* Salaire de base par défaut */}
            <div className="bg-surface-2 p-5 rounded-2xl border border-line-strong space-y-3">
              <h3 className="text-sm font-black text-fg flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand" />
                <span>Salaire mensuel de référence</span>
              </h3>
              <p className="text-xs text-fg-muted">
                Ce montant sert de base de calcul automatique lorsqu'un nouveau mois commence.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="number" inputMode="decimal"
                    value={defaultSalary}
                    onChange={(e) => setDefaultSalary(e.target.value)}
                    className="w-full bg-surface border border-line-strong focus:border-brand rounded-2xl pl-4 pr-16 py-2.5 text-sm font-black text-fg focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-brand">
                    {currency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-brand text-brand-fg font-extrabold text-xs hover:bg-brand-hover active:scale-95 transition-all shadow-sm"
                >
                  Sauvegarder le salaire de base
                </button>
              </div>
            </div>

            {/* Salaire perçu pour le mois sélectionné */}
            <div className="bg-surface-2 p-5 rounded-2xl border border-line-strong space-y-3">
              <h3 className="text-sm font-black text-fg flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Salaire perçu en {formatMonthKey(selectedMonth)}</span>
              </h3>
              <p className="text-xs text-fg-muted">
                Ajustez le salaire net réellement versé ce mois-ci : primes, heures supplémentaires ou retenues.
              </p>

              <form onSubmit={handleSaveMonthSalary} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="number" inputMode="decimal"
                    value={currentMonthSalary}
                    onChange={(e) => setCurrentMonthSalary(e.target.value)}
                    className="w-full bg-surface border border-line-strong focus:border-brand rounded-2xl pl-4 pr-16 py-2.5 text-sm font-black text-fg focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400">
                    {currency}
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs active:scale-95 transition-all shadow-sm"
                >
                  Valider pour {formatMonthKey(selectedMonth)}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SOUS-PAGE 3 : CATÉGORIES & DÉPENSES PRÉDÉFINIES          */}
      {/* ======================================================== */}
      {activeSection === 'categories' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSection('menu')}
              className="inline-flex items-center gap-2 text-xs font-bold text-fg-2 hover:text-fg bg-surface hover:bg-surface-2 px-4 py-2 rounded-full border border-line-strong transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-brand" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-fg">Catégories & Dépenses Prédéfinies</h2>
              <p className="text-xs text-fg-muted mt-1">
                Configurez des modèles réutilisables (loyer, abonnements, carburant) pour ajouter vos dépenses en un clic.
              </p>
            </div>

            {/* Formulaire ajout modèle */}
            <form onSubmit={handleCreatePreset} className="bg-surface-2 p-4 rounded-2xl border border-line-strong space-y-3">
              <h3 className="text-xs font-black text-brand uppercase tracking-wider">
                + Ajouter une dépense prédéfinie
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <input
                    type="text"
                    required
                    value={newPresetTitle}
                    onChange={(e) => setNewPresetTitle(e.target.value)}
                    placeholder="Titre (ex: Facture Eau, Loyer...)"
                    className="w-full bg-surface border border-line-strong focus:border-brand rounded-xl px-3 py-2 text-xs text-fg focus:outline-none"
                  />
                </div>
                <div>
                  <CategorySelect
                    value={newPresetCategory}
                    onChange={setNewPresetCategory}
                    categories={CATEGORIES}
                  />
                </div>
                <div>
                  <input
                    type="number" inputMode="decimal"
                    value={newPresetAmount}
                    onChange={(e) => setNewPresetAmount(e.target.value)}
                    placeholder="Montant habituel (optionnel)"
                    className="w-full bg-surface border border-line-strong focus:border-brand rounded-xl px-3 py-2 text-xs text-fg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-brand text-brand-fg font-extrabold text-xs hover:bg-brand-hover active:scale-95 transition-all shadow-sm"
                >
                  Ajouter aux modèles
                </button>
              </div>
            </form>

            {/* Liste des modèles existants */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-fg-2">
                Modèles enregistrés ({data.expensePresets?.length || 0})
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(data.expensePresets || []).map((preset) => {
                  const isEditing = editingPresetId === preset.id;

                  if (isEditing) {
                    return (
                      <div key={preset.id} className="p-3 rounded-2xl bg-surface-2 border border-line-strong flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-surface border border-line-strong rounded-xl px-2.5 py-1.5 text-xs text-fg"
                        />
                        <div className="w-full sm:w-48">
                          <CategorySelect
                            value={editCategory}
                            onChange={setEditCategory}
                            categories={CATEGORIES}
                          />
                        </div>
                        <input
                          type="number" inputMode="decimal"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="Montant"
                          className="w-24 bg-surface border border-line-strong rounded-xl px-2 py-1.5 text-xs text-fg"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEditPreset(preset.id)}
                            className="p-1.5 rounded-lg bg-brand text-brand-fg"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPresetId(null)}
                            className="p-1.5 rounded-lg bg-surface-3 text-fg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={preset.id}
                      className="p-3 rounded-2xl bg-surface-2 hover:bg-surface-2 border border-line flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-brand/15 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                          {preset.category.substring(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-fg block truncate">
                            {preset.title}
                          </span>
                          <span className="text-[10px] text-fg-muted">
                            {preset.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {preset.defaultAmount && (
                          <span className="text-xs font-black text-brand">
                            {formatCurrency(preset.defaultAmount, currency)}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditPreset(preset)}
                            className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePreset(preset.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SOUS-PAGE 4 : APPARENCE & THÈME D'AFFICHAGE              */}
      {/* ======================================================== */}
      {activeSection === 'appearance' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSection('menu')}
              className="inline-flex items-center gap-2 text-xs font-bold text-fg-2 hover:text-fg bg-surface hover:bg-surface-2 px-4 py-2 rounded-full border border-line-strong transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-brand" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/15 text-brand text-[11px] font-black uppercase tracking-wider mb-2 border border-brand/30">
                <Palette className="w-3.5 h-3.5" />
                <span>Personnalisation Visuelle</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-fg">Apparence & Thème d'affichage</h2>
              <p className="text-xs text-fg-muted mt-1">
                Choisissez votre univers chromatique et le mode de luminosité adapté à vos préférences.
              </p>
            </div>

            {/* ======================================================== */}
            {/* 2. MODE DE LUMINOSITÉ (SOMBRE, CLAIR, AUTOMATIQUE)       */}
            {/* ======================================================== */}
            <div className="space-y-4 pt-4 border-t border-line">
              <div>
                <h3 className="text-sm font-black text-fg uppercase tracking-wider">
                  Mode de Luminosité
                </h3>
                <p className="text-xs text-fg-muted">
                  Choisissez entre le Dark Mode permanent, le Light Mode ou l'adaptation automatique au système.
                </p>
              </div>

              {/* Cartes Bento Luminosité */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* Carte Sombre */}
                <div
                  onClick={() => setThemeMode('dark')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'border-brand bg-surface-2 shadow-md'
                      : 'border-line-strong bg-surface hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-fg/10 text-fg flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    {themeMode === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-brand text-brand-fg flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm text-fg block">Sombre</span>
                  <span className="text-[11px] text-fg-muted">OLED Dark permanent</span>
                </div>

                {/* Carte Clair */}
                <div
                  onClick={() => setThemeMode('light')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'border-brand bg-surface-2 shadow-md'
                      : 'border-line-strong bg-surface hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    {themeMode === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-brand text-brand-fg flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm text-fg block">Clair</span>
                  <span className="text-[11px] text-fg-muted">Fond lumineux épuré</span>
                </div>

                {/* Carte Système */}
                <div
                  onClick={() => setThemeMode('system')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'border-brand bg-surface-2 shadow-md'
                      : 'border-line-strong bg-surface hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-400/20 text-sky-300 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    {themeMode === 'system' && (
                      <span className="w-5 h-5 rounded-full bg-brand text-brand-fg flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm text-fg block">Automatique</span>
                  <span className="text-[11px] text-fg-muted">Selon l'appareil ({resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SOUS-PAGE 5 : SÉCURITÉ & VERROUILLAGE                    */}
      {/* ======================================================== */}
      {activeSection === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSection('menu')}
              className="inline-flex items-center gap-2 text-xs font-bold text-fg-2 hover:text-fg bg-surface hover:bg-surface-2 px-4 py-2 rounded-full border border-line-strong transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-brand" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-fg">Sécurité & Verrouillage</h2>
              <p className="text-xs text-fg-muted mt-1">
                Gérez la protection par mot de passe et l'accès biométrique à votre GesFin.
              </p>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-5">
              {/* Toggle Protection mot de passe */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-line-strong">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-fg block">
                      Activer le verrouillage par mot de passe
                    </span>
                    <span className="text-[11px] text-fg-muted">
                      Protège vos montants contre les regards indiscrets
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

              {/* Saisie mot de passe si actif */}
              {isLockEnabled && (
                <div className="bg-surface-2 p-4 rounded-2xl border border-line-strong space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-fg-2 mb-1">
                        Mot de passe / Code PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-surface border border-line-strong focus:border-brand rounded-xl px-3.5 py-2 text-xs sm:text-sm text-fg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-2 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-surface border border-line-strong focus:border-brand rounded-xl px-3.5 py-2 text-xs sm:text-sm text-fg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle Biométrie Face ID / Empreinte */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-line-strong">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-fg block">
                      Déverrouillage biométrique (Face ID & Empreinte)
                    </span>
                    <span className="text-[11px] text-fg-muted">
                      Permet d'ouvrir GesFin avec le capteur de votre smartphone
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
                  <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>

              {securityMessage && (
                <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  securityMessage.type === 'success' 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{securityMessage.text}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {isLockEnabled ? (
                  <button
                    type="button"
                    onClick={onLockAppNow}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-surface-2 hover:bg-surface-3 text-brand border border-brand/30 font-extrabold text-xs transition-all active:scale-95"
                  >
                    Verrouiller immédiatement GesFin
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Enregistrer la sécurité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SOUS-PAGE 6 : SAUVEGARDE & DONNÉES                       */}
      {/* ======================================================== */}
      {activeSection === 'backup' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSection('menu')}
              className="inline-flex items-center gap-2 text-xs font-bold text-fg-2 hover:text-fg bg-surface hover:bg-surface-2 px-4 py-2 rounded-full border border-line-strong transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-brand" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-fg">Sauvegarde & Données GesFin</h2>
              <p className="text-xs text-fg-muted mt-1">
                Exportez vos données financières locales ou réinitialisez l'application.
              </p>
            </div>

            <div className="space-y-4">
              {/* Export JSON */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-line-strong flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-fg">Exporter mes données (JSON)</h3>
                    <p className="text-[11px] text-fg-muted">Téléchargez une copie complète de vos dépenses, épargnes et profils</p>
                  </div>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-full bg-surface-2 hover:bg-surface-3 text-brand border border-brand/30 font-bold text-xs shrink-0 transition-colors"
                >
                  Télécharger le fichier
                </button>
              </div>



              {/* Réinitialisation */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-rose-300">Réinitialiser les données</h3>
                    <p className="text-[11px] text-rose-400/80">Efface toutes vos données et relance la configuration</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs shrink-0 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de réinitialisation */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-surface border border-line-strong rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-fg">Réinitialiser les données ?</h3>
              <p className="text-xs text-fg-2 mt-1">
                Cette action supprimera définitivement votre profil, vos dépenses, votre épargne et vos projets. L'assistant de configuration se relancera ensuite.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-2 text-fg-2 hover:text-fg border border-line-strong font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setIsResetModalOpen(false);
                  setActiveSection('menu');
                }}
                className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md"
              >
                Tout effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
