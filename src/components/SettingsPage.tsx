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
  const { themeMode, resolvedTheme, colorPalette, setThemeMode, setColorPalette } = useTheme();

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
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Toast notifications */}
      {userSavedToast && (
        <div className="fixed bottom-24 right-4 z-50 bg-[#142217] border-2 border-[#ccff00] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#ccff00]" />
          <span className="text-xs font-bold">Informations utilisateur enregistrées avec succès !</span>
        </div>
      )}

      {salarySavedToast && (
        <div className="fixed bottom-24 right-4 z-50 bg-[#142217] border-2 border-[#ccff00] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#ccff00]" />
          <span className="text-xs font-bold">Salaire mensuel mis à jour !</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION PRINCIPALE (MENU) : STYLE BENTO GRID MODERNE     */}
      {/* ======================================================== */}
      {activeSection === 'menu' && (
        <div className="space-y-6">
          
          {/* Header de la page */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Paramètres de GesFin
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Organisation en grille Bento pour une gestion claire et intuitive de votre application.
              </p>
            </div>

            {/* Pastille indiquant la palette active */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161c17] border border-[#28362b] text-xs font-bold self-start sm:self-auto">
              <span className={`w-2.5 h-2.5 rounded-full ${colorPalette === 'manga_orange' ? 'bg-[#FF4D00]' : 'bg-[#ccff00]'}`} />
              <span className="text-slate-300">Palette :</span>
              <span className="text-white font-extrabold">
                {colorPalette === 'manga_orange' ? 'Manga Orange' : 'Neon Lime'}
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* GRILLE BENTO ADAPTÉE AUX PARAMÈTRES (INSPIRATION DAYBASE) */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            
            {/* TUILE BENTO 1 (HERO PROFIL - SPAN 2) */}
            <div 
              onClick={() => setActiveSection('user_info')}
              className="md:col-span-2 group bg-gradient-to-br from-[#161f18] via-[#121713] to-[#0f1310] hover:from-[#1b271d] hover:to-[#121813] p-5 sm:p-6 rounded-3xl border border-[#273a2b] hover:border-[#ccff00]/50 transition-all duration-200 cursor-pointer shadow-xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#121613]"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white truncate">{fullName}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 shrink-0">
                        {currency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="truncate">{email}</span>
                      {phone && (
                        <>
                          <span>•</span>
                          <span className="whitespace-nowrap font-medium text-slate-300">{phone}</span>
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
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#ccff00] text-black font-extrabold text-xs shadow-md hover:bg-[#d9ff33] active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Modifier le profil</span>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#233125] flex items-center justify-between text-xs text-slate-400">
                <span>Informations personnelles & Devise monétaire</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#ccff00] transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 2 (THÈME & PALETTE RAPIDE - SPAN 1 STYLE DAYBASE) */}
            <div 
              onClick={() => setActiveSection('appearance')}
              className={`group p-5 rounded-3xl border transition-all duration-200 cursor-pointer shadow-xl flex flex-col justify-between relative overflow-hidden ${
                colorPalette === 'manga_orange'
                  ? 'bg-gradient-to-br from-[#241712] via-[#1a120e] to-[#111111] border-[#3f271c] hover:border-[#FF4D00]/60'
                  : 'bg-gradient-to-br from-[#162018] via-[#121813] to-[#0f1310] border-[#293c2c] hover:border-[#ccff00]/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#ccff00]" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Ambiance Visuelle
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    colorPalette === 'manga_orange'
                      ? 'bg-[#FF4D00] text-white shadow-sm'
                      : 'bg-[#ccff00] text-black shadow-sm'
                  }`}>
                    {colorPalette === 'manga_orange' ? 'Manga Bento' : 'Neon Lime'}
                  </span>
                </div>

                <h3 className="font-black text-base text-white tracking-tight">
                  Palette de Couleurs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Basculez instantanément entre FinTech Neon Lime et Manga Orange Daybase.
                </p>

                {/* Boutons de bascule rapide Bento */}
                <div className="grid grid-cols-2 gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setColorPalette('neon_lime')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      colorPalette === 'neon_lime'
                        ? 'bg-[#ccff00] text-black border-[#ccff00] shadow-md'
                        : 'bg-[#151c16] text-slate-300 border-[#263528] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                    <span>Neon Lime</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColorPalette('manga_orange')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      colorPalette === 'manga_orange'
                        ? 'bg-[#FF4D00] text-white border-[#FF4D00] shadow-md'
                        : 'bg-[#1a1411] text-slate-300 border-[#382319] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FF4D00]" />
                    <span>Manga</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Personnaliser l'affichage</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#ccff00] transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 3 (BUDGET & SALAIRE) */}
            <div
              onClick={() => setActiveSection('budget_salary')}
              className="group bg-[#121613] hover:bg-[#161d17] p-5 rounded-3xl border border-[#232f26] hover:border-[#ccff00]/50 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Alimentation Mensuelle
                  </span>
                  <Wallet className="w-4 h-4 text-[#ccff00]" />
                </div>
                <h3 className="font-black text-base text-white tracking-tight">
                  Budget & Salaire
                </h3>
                <div className="mt-2 text-xl font-black text-[#ccff00]">
                  {formatCurrency(Number(defaultSalary) || 0, currency)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Salaire mensuel de référence par défaut.
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#1f2821] flex items-center justify-between text-xs text-slate-400">
                <span>Ajuster les salaires</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#ccff00] transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 4 (MODÈLES DE DÉPENSES RÉCURRENTES) */}
            <div
              onClick={() => setActiveSection('categories')}
              className="group bg-[#121613] hover:bg-[#161d17] p-5 rounded-3xl border border-[#232f26] hover:border-[#ccff00]/50 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Modèles Automatiques
                  </span>
                  <Tag className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-black text-base text-white tracking-tight">
                  Dépenses Récurrentes
                </h3>
                <div className="mt-2 text-xl font-black text-white">
                  {data.expensePresets?.length || 0} modèles
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Loyer, abonnements, courses et charges fixes.
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#1f2821] flex items-center justify-between text-xs text-slate-400">
                <span>Gérer les modèles</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#ccff00] transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 5 (SÉCURITÉ & VERROUILLAGE) */}
            <div
              onClick={() => setActiveSection('security')}
              className="group bg-[#121613] hover:bg-[#161d17] p-5 rounded-3xl border border-[#232f26] hover:border-[#ccff00]/50 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Confidentialité
                  </span>
                  <Lock className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="font-black text-base text-white tracking-tight">
                  Sécurité & Verrouillage
                </h3>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                    data.security.isLockEnabled
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${data.security.isLockEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span>{data.security.isLockEnabled ? 'Verrouillage Actif' : 'Non protégé'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Code PIN, empreinte et biométrie.
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#1f2821] flex items-center justify-between text-xs text-slate-400">
                <span>Paramétrer le code</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#ccff00] transition-colors" />
              </div>
            </div>

            {/* TUILE BENTO 6 (SAUVEGARDE & DONNÉES - SPAN 3) */}
            <div className="md:col-span-3 bg-gradient-to-r from-[#121713] via-[#151c16] to-[#121713] p-5 rounded-3xl border border-[#232f26] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#1b241d] border border-[#2d3f30] text-[#ccff00] flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Sauvegarde & Données GesFin</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exportez l'ensemble de vos transactions, salaires et projets d'épargne en fichier JSON sécurisé.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-full bg-[#18201a] hover:bg-[#202b23] border border-[#28362b] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Exporter JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('backup')}
                  className="px-4 py-2 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black text-xs font-extrabold transition-all cursor-pointer shadow-md active:scale-95"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#141b15] hover:bg-[#1b241d] px-4 py-2 rounded-full border border-[#263529] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#ccff00]" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-[#121613] p-5 sm:p-7 rounded-3xl border border-[#232f26] shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Informations de l'utilisateur</h2>
              <p className="text-xs text-slate-400 mt-1">
                Configurez votre profil, votre nom et votre photo d'avatar affichés sur le dashboard.
              </p>
            </div>

            {/* Photo de profil */}
            <div className="mb-6 bg-[#161d17] p-4 rounded-2xl border border-[#263628]">
              <label className="block text-xs font-bold text-slate-300 mb-3">
                Photo de profil
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.35)]"
                  />
                  <label className="absolute inset-0 bg-black/65 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <span className="text-[9px] text-white font-bold mt-0.5">Modifier</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e2820] hover:bg-[#263428] border border-[#2f4031] text-xs font-bold text-slate-200 cursor-pointer transition-colors active:scale-95 mb-2">
                    <Upload className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Télécharger une photo</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-400">
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
                          avatarUrl === av.url ? 'border-[#ccff00] scale-110 shadow-[0_0_12px_rgba(204,255,0,0.5)]' : 'border-[#263628] opacity-75 hover:opacity-100 hover:border-slate-400'
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
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nom & Prénom
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Prénom Nom"
                      className="w-full bg-[#161c17] border border-[#28362b] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Pseudo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Pseudo (optionnel)"
                      className="w-full bg-[#161c17] border border-[#28362b] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Numéro de téléphone"
                      className="w-full bg-[#161c17] border border-[#28362b] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Adresse e-mail"
                      className="w-full bg-[#161c17] border border-[#28362b] focus:border-[#ccff00] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
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
                  className="px-6 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#141b15] hover:bg-[#1b241d] px-4 py-2 rounded-full border border-[#263529] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#ccff00]" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-[#121613] p-5 sm:p-7 rounded-3xl border border-[#232f26] shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Alimentation Dépenses & Épargne</h2>
              <p className="text-xs text-slate-400 mt-1">
                Ajustez le salaire mensuel par défaut ainsi que le salaire spécifique perçu pour le mois actif en {formatMonthKey(selectedMonth)}.
              </p>
            </div>

            {/* Salaire de base par défaut */}
            <div className="bg-[#161d17] p-5 rounded-2xl border border-[#263628] space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#ccff00]" />
                <span>Salaire mensuel de référence</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ce montant sert de base de calcul automatique lorsqu'un nouveau mois commence.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="number"
                    value={defaultSalary}
                    onChange={(e) => setDefaultSalary(e.target.value)}
                    className="w-full bg-[#101411] border border-[#2b3c2e] focus:border-[#ccff00] rounded-2xl pl-4 pr-16 py-2.5 text-sm font-black text-white focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#ccff00]">
                    {currency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#ccff00] text-black font-extrabold text-xs hover:bg-[#d9ff33] active:scale-95 transition-all shadow-sm"
                >
                  Sauvegarder le salaire de base
                </button>
              </div>
            </div>

            {/* Salaire perçu pour le mois sélectionné */}
            <div className="bg-[#161d17] p-5 rounded-2xl border border-[#263628] space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Salaire perçu en {formatMonthKey(selectedMonth)}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ajustez le salaire net réellement versé ce mois-ci : primes, heures supplémentaires ou retenues.
              </p>

              <form onSubmit={handleSaveMonthSalary} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="number"
                    value={currentMonthSalary}
                    onChange={(e) => setCurrentMonthSalary(e.target.value)}
                    className="w-full bg-[#101411] border border-[#2b3c2e] focus:border-[#ccff00] rounded-2xl pl-4 pr-16 py-2.5 text-sm font-black text-white focus:outline-none"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#141b15] hover:bg-[#1b241d] px-4 py-2 rounded-full border border-[#263529] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#ccff00]" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-[#121613] p-5 sm:p-7 rounded-3xl border border-[#232f26] shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Catégories & Dépenses Prédéfinies</h2>
              <p className="text-xs text-slate-400 mt-1">
                Configurez des modèles réutilisables (loyer, abonnements, carburant) pour ajouter vos dépenses en un clic.
              </p>
            </div>

            {/* Formulaire ajout modèle */}
            <form onSubmit={handleCreatePreset} className="bg-[#161d17] p-4 rounded-2xl border border-[#263628] space-y-3">
              <h3 className="text-xs font-black text-[#ccff00] uppercase tracking-wider">
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
                    className="w-full bg-[#101411] border border-[#2a382c] focus:border-[#ccff00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                    type="number"
                    value={newPresetAmount}
                    onChange={(e) => setNewPresetAmount(e.target.value)}
                    placeholder="Montant habituel (optionnel)"
                    className="w-full bg-[#101411] border border-[#2a382c] focus:border-[#ccff00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#ccff00] text-black font-extrabold text-xs hover:bg-[#d9ff33] active:scale-95 transition-all shadow-sm"
                >
                  Ajouter aux modèles
                </button>
              </div>
            </form>

            {/* Liste des modèles existants */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300">
                Modèles enregistrés ({data.expensePresets?.length || 0})
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(data.expensePresets || []).map((preset) => {
                  const isEditing = editingPresetId === preset.id;

                  if (isEditing) {
                    return (
                      <div key={preset.id} className="p-3 rounded-2xl bg-[#162018] border border-[#2c3d2e] flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-[#101411] border border-[#2e4231] rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                        <div className="w-full sm:w-48">
                          <CategorySelect
                            value={editCategory}
                            onChange={setEditCategory}
                            categories={CATEGORIES}
                          />
                        </div>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="Montant"
                          className="w-24 bg-[#101411] border border-[#2e4231] rounded-xl px-2 py-1.5 text-xs text-white"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEditPreset(preset.id)}
                            className="p-1.5 rounded-lg bg-[#ccff00] text-black"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPresetId(null)}
                            className="p-1.5 rounded-lg bg-slate-700 text-white"
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
                      className="p-3 rounded-2xl bg-[#151c16] hover:bg-[#18221a] border border-[#232f26] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#ccff00]/15 text-[#ccff00] flex items-center justify-center font-bold text-xs shrink-0">
                          {preset.category.substring(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-white block truncate">
                            {preset.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {preset.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {preset.defaultAmount && (
                          <span className="text-xs font-black text-[#ccff00]">
                            {formatCurrency(preset.defaultAmount, currency)}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditPreset(preset)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2821] transition-colors"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#141b15] hover:bg-[#1b241d] px-4 py-2 rounded-full border border-[#263529] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#ccff00]" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-[#121613] p-5 sm:p-7 rounded-3xl border border-[#232f26] shadow-xl space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/15 text-[#ccff00] text-[11px] font-black uppercase tracking-wider mb-2 border border-[#ccff00]/30">
                <Palette className="w-3.5 h-3.5" />
                <span>Personnalisation Visuelle</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Apparence & Thème d'affichage</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choisissez votre univers chromatique et le mode de luminosité adapté à vos préférences.
              </p>
            </div>

            {/* ======================================================== */}
            {/* 1. CHOIX DE LA PALETTE DE COULEURS (STYLE BENTO DAYBASE) */}
            {/* ======================================================== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Palettes de Couleurs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Basculez entre le thème d'origine et la nouvelle palette Manga Daybase.
                  </p>
                </div>
                <span className="text-[11px] font-black text-slate-400">
                  {colorPalette === 'manga_orange' ? 'Manga Orange actif' : 'Neon Lime actif'}
                </span>
              </div>

              {/* GRILLE BENTO DES 2 PALETTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CARTE PALETTE 1 : THÈME PAR DÉFAUT (FINTECH NEON LIME) */}
                <div
                  onClick={() => setColorPalette('neon_lime')}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    colorPalette === 'neon_lime'
                      ? 'border-[#ccff00] bg-gradient-to-br from-[#162018] via-[#121813] to-[#0d120e] shadow-[0_0_30px_rgba(204,255,0,0.25)]'
                      : 'border-[#263529] bg-[#121613] hover:border-[#384c3c] opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                          Thème Par Défaut
                        </span>
                        <span className="text-xs font-bold text-slate-300">Ship X FinTech</span>
                      </div>
                      {colorPalette === 'neon_lime' && (
                        <span className="w-6 h-6 rounded-full bg-[#ccff00] text-black font-black text-xs flex items-center justify-center shadow-md">
                          ✓
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-white tracking-tight">
                      FinTech Neon Lime
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Contraste néon vibrant sur fond titane sombre et vert émeraude profond.
                    </p>

                    {/* Nuancier de la palette */}
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex items-center gap-1.5 bg-[#172019] px-2.5 py-1.5 rounded-xl border border-[#27382a]">
                        <span className="w-4 h-4 rounded-full bg-[#ccff00] border border-black/20 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-300">#ccff00</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#172019] px-2.5 py-1.5 rounded-xl border border-[#27382a]">
                        <span className="w-4 h-4 rounded-full bg-[#080a08] border border-white/20 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-300">#080a08</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#172019] px-2.5 py-1.5 rounded-xl border border-[#27382a]">
                        <span className="w-4 h-4 rounded-full bg-[#ffffff] border border-black/20 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-300">#ffffff</span>
                      </div>
                    </div>

                    {/* Mini démo de composant Bento Neon Lime */}
                    <div className="bg-[#151c16] p-3.5 rounded-2xl border border-[#27392b] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Solde disponible</span>
                        <span className="text-[#ccff00] font-black">85% restant</span>
                      </div>
                      <div className="text-lg font-black text-white">452 000 FCFA</div>
                      <div className="flex gap-2 pt-1">
                        <div className="px-3 py-1 bg-[#ccff00] text-black text-[10px] font-extrabold rounded-full">
                          + Dépense
                        </div>
                        <div className="px-3 py-1 bg-[#1b251d] text-slate-300 text-[10px] font-bold rounded-full border border-[#2c3d2e]">
                          Épargne
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      {colorPalette === 'neon_lime' ? 'Palette actuellement active' : 'Cliquez pour sélectionner'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setColorPalette('neon_lime')}
                      className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                        colorPalette === 'neon_lime'
                          ? 'bg-[#ccff00] text-black shadow-md'
                          : 'bg-[#1b251d] text-slate-300 hover:text-white'
                      }`}
                    >
                      {colorPalette === 'neon_lime' ? 'Active' : 'Sélectionner'}
                    </button>
                  </div>
                </div>

                {/* CARTE PALETTE 2 : MANGA ORANGE & DAYBASE BENTO (IMAGE 1 & 2) */}
                <div
                  onClick={() => setColorPalette('manga_orange')}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    colorPalette === 'manga_orange'
                      ? 'border-[#FF4D00] bg-gradient-to-br from-[#221611] via-[#1a120e] to-[#111111] shadow-[0_0_30px_rgba(255,77,0,0.3)]'
                      : 'border-[#33221b] bg-[#141211] hover:border-[#FF4D00]/50 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40">
                          Manga Canvas
                        </span>
                        <span className="text-xs font-bold text-slate-300">Style Daybase Bento</span>
                      </div>
                      {colorPalette === 'manga_orange' && (
                        <span className="w-6 h-6 rounded-full bg-[#FF4D00] text-white font-black text-xs flex items-center justify-center shadow-md">
                          ✓
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-white tracking-tight">
                      Manga Orange & Daybase
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Palette dynamique inspirée des mangas et de l'interface Bento Daybase : orange électrique & noir carbone mat.
                    </p>

                    {/* Nuancier exact de l'image 1 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-4">
                      <div className="flex items-center gap-1.5 bg-[#1b1512] px-2 py-1.5 rounded-xl border border-[#382319]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#FF4D00] shrink-0" />
                        <span className="text-[10px] font-mono text-slate-200">#FF4D00</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#1b1512] px-2 py-1.5 rounded-xl border border-[#382319]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#111111] border border-white/20 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-200">#111111</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#1b1512] px-2 py-1.5 rounded-xl border border-[#382319]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#F2F2F2] shrink-0" />
                        <span className="text-[10px] font-mono text-slate-200">#F2F2F2</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#1b1512] px-2 py-1.5 rounded-xl border border-[#382319]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#8E8E8E] shrink-0" />
                        <span className="text-[10px] font-mono text-slate-200">#8E8E8E</span>
                      </div>
                    </div>

                    {/* Mini démo de composant Bento Daybase Orange */}
                    <div className="bg-[#181818] p-3.5 rounded-2xl border border-[#2d221c] space-y-2">
                      <div className="bg-[#FF4D00] text-white p-2.5 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between text-[10px] font-bold text-white/80">
                          <span>HABIT / OBJECTIF</span>
                          <span>78.9%</span>
                        </div>
                        <div className="text-sm font-black text-white mt-0.5">Focus projet & Épargne</div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <div className="px-3 py-1 bg-[#FF4D00] text-white text-[10px] font-extrabold rounded-full shadow-sm">
                          + Dépense
                        </div>
                        <div className="px-3 py-1 bg-[#222222] text-[#F2F2F2] text-[10px] font-bold rounded-full border border-[#333333]">
                          Épargne
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      {colorPalette === 'manga_orange' ? 'Palette actuellement active' : 'Cliquez pour sélectionner'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setColorPalette('manga_orange')}
                      className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                        colorPalette === 'manga_orange'
                          ? 'bg-[#FF4D00] text-white shadow-md'
                          : 'bg-[#261c17] text-slate-300 hover:text-white'
                      }`}
                    >
                      {colorPalette === 'manga_orange' ? 'Active' : 'Sélectionner'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ======================================================== */}
            {/* 2. MODE DE LUMINOSITÉ (SOMBRE, CLAIR, AUTOMATIQUE)       */}
            {/* ======================================================== */}
            <div className="space-y-4 pt-4 border-t border-[#1f2821]">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Mode de Luminosité
                </h3>
                <p className="text-xs text-slate-400">
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
                      ? 'border-[#ccff00] bg-[#162018] shadow-md'
                      : 'border-[#243327] bg-[#121613] hover:bg-[#161d17]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    {themeMode === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm text-white block">Sombre</span>
                  <span className="text-[11px] text-slate-400">OLED Dark permanent</span>
                </div>

                {/* Carte Clair */}
                <div
                  onClick={() => setThemeMode('light')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'border-[#ccff00] bg-[#162018] shadow-md'
                      : 'border-[#243327] bg-[#121613] hover:bg-[#161d17]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    {themeMode === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm text-white block">Clair</span>
                  <span className="text-[11px] text-slate-400">Fond lumineux épuré</span>
                </div>

                {/* Carte Système */}
                <div
                  onClick={() => setThemeMode('system')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'border-[#ccff00] bg-[#162018] shadow-md'
                      : 'border-[#243327] bg-[#121613] hover:bg-[#161d17]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-400/20 text-sky-300 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    {themeMode === 'system' && (
                      <span className="w-5 h-5 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm text-white block">Automatique</span>
                  <span className="text-[11px] text-slate-400">Selon l'appareil ({resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})</span>
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
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#141b15] hover:bg-[#1b241d] px-4 py-2 rounded-full border border-[#263529] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#ccff00]" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-[#121613] p-5 sm:p-7 rounded-3xl border border-[#232f26] shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Sécurité & Verrouillage</h2>
              <p className="text-xs text-slate-400 mt-1">
                Gérez la protection par mot de passe et l'accès biométrique à votre GesFin.
              </p>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-5">
              {/* Toggle Protection mot de passe */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#161d17] border border-[#253628]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-white block">
                      Activer le verrouillage par mot de passe
                    </span>
                    <span className="text-[11px] text-slate-400">
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
                  <div className="w-11 h-6 bg-[#253227] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ccff00]"></div>
                </label>
              </div>

              {/* Saisie mot de passe si actif */}
              {isLockEnabled && (
                <div className="bg-[#161d17] p-4 rounded-2xl border border-[#253628] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Mot de passe / Code PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#101411] border border-[#2c3d2e] focus:border-[#ccff00] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#101411] border border-[#2c3d2e] focus:border-[#ccff00] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle Biométrie Face ID / Empreinte */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#161d17] border border-[#253628]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-white block">
                      Déverrouillage biométrique (Face ID & Empreinte)
                    </span>
                    <span className="text-[11px] text-slate-400">
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
                  <div className="w-11 h-6 bg-[#253227] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ccff00]"></div>
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#18231a] hover:bg-[#1e2c20] text-[#ccff00] border border-[#ccff00]/30 font-extrabold text-xs transition-all active:scale-95"
                  >
                    Verrouiller immédiatement GesFin
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#141b15] hover:bg-[#1b241d] px-4 py-2 rounded-full border border-[#263529] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#ccff00]" />
              <span>Retour aux paramètres</span>
            </button>
          </div>

          <div className="bg-[#121613] p-5 sm:p-7 rounded-3xl border border-[#232f26] shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Sauvegarde & Données GesFin</h2>
              <p className="text-xs text-slate-400 mt-1">
                Exportez vos données financières locales ou réinitialisez l'application.
              </p>
            </div>

            <div className="space-y-4">
              {/* Export JSON */}
              <div className="p-4 rounded-2xl bg-[#161d17] border border-[#253628] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">Exporter mes données (JSON)</h3>
                    <p className="text-[11px] text-slate-400">Téléchargez une copie complète de vos dépenses, épargnes et profils</p>
                  </div>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-full bg-[#1b251d] hover:bg-[#233126] text-[#ccff00] border border-[#ccff00]/30 font-bold text-xs shrink-0 transition-colors"
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
          <div className="max-w-md w-full bg-[#121613] border border-[#2b3a2e] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-white">Réinitialiser les données ?</h3>
              <p className="text-xs text-slate-300 mt-1">
                Cette action supprimera définitivement votre profil, vos dépenses, votre épargne et vos projets. L'assistant de configuration se relancera ensuite.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-[#18201a] text-slate-300 hover:text-white border border-[#243327] font-bold text-xs"
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
