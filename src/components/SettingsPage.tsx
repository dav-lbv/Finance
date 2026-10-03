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
  Target,
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
import { getMonthSalary } from '../utils/finance';
import { CloudBackupCard } from './CloudBackupCard';
import { SettingsMenu } from './SettingsMenu';
import { SettingsSubHeader } from './SettingsSubHeader';
import { BiometricToggle } from './BiometricToggle';
import { hashPassword } from '../utils/crypto';
import { ProjectCategoriesSettings } from './ProjectCategoriesSettings';
import { FintechSelect } from './FintechSelect';

export type SettingsSection = 
  | 'menu' 
  | 'user_info' 
  | 'budget_salary' 
  | 'categories' 
  | 'project_categories' 
  | 'security' 
  | 'backup';

interface SettingsPageProps {
  data: AppData;
  selectedMonth: string;
  onUpdateUser: (newUser: UserProfile) => void;
  onUpdateSecurity: (newSecurity: SecuritySettings) => void;
  onUpdateMonthSalary: (monthKey: string, salary: number) => void;
  onResetData: () => void;
  onRestoreData: (data: AppData) => void;
  onAddProjectCategory: (name: string) => void;
  onRenameProjectCategory: (oldName: string, newName: string) => void;
  onDeleteProjectCategory: (name: string) => void;
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
  onRestoreData,
  onAddProjectCategory,
  onRenameProjectCategory,
  onDeleteProjectCategory,
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
    getMonthSalary(data, selectedMonth).toString()
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
  // Le mot de passe n'est jamais relu : seul son hachage est conservé
  const hasPassword = !!data.security.passwordHash;
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(data.security.useBiometrics ?? false);
  const [biometricCredentialId, setBiometricCredentialId] = useState(data.security.biometricCredentialId);
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
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    let nextHash = data.security.passwordHash;

    if (isLockEnabled) {
      const typed = passwordInput.trim();
      if (!hasPassword || typed) {
        if (typed.length < 4) {
          setSecurityMessage({ type: 'error', text: 'Le mot de passe doit comporter au moins 4 caractères.' });
          return;
        }
        if (passwordInput !== confirmPasswordInput) {
          setSecurityMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
          return;
        }
        nextHash = await hashPassword(typed);
      }
    } else {
      nextHash = '';
    }

    onUpdateSecurity({
      ...data.security,
      isLockEnabled,
      passwordHash: nextHash,
      useBiometrics: isLockEnabled && useBiometrics,
      biometricType: 'both',
      biometricCredentialId: isLockEnabled && useBiometrics ? biometricCredentialId : undefined,
    });
    setPasswordInput('');
    setConfirmPasswordInput('');

    setSecurityMessage({
      type: 'success',
      text: isLockEnabled ? 'Sécurité mise à jour avec succès.' : 'Verrouillage désactivé.',
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
    downloadAnchor.setAttribute('download', `mon-kanda_export_${new Date().toISOString().split('T')[0]}.json`);
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
      {/* MENU PRINCIPAL : listes groupées façon iOS               */}
      {/* ======================================================== */}
      {activeSection === 'menu' && (
        <SettingsMenu
          data={data}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          onNavigate={setActiveSection}
          onLockNow={onLockAppNow}
          onReset={() => setIsResetModalOpen(true)}
        />
      )}

      {/* ======================================================== */}
      {/* SOUS-PAGE 1 : INFORMATIONS DE L'UTILISATEUR              */}
      {/* ======================================================== */}
      {activeSection === 'user_info' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header de sous-page avec bouton retour */}
          <SettingsSubHeader title="Profil" onBack={() => setActiveSection('menu')} />

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
          <SettingsSubHeader title="Salaire & budget" onBack={() => setActiveSection('menu')} />

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-fg">Salaires</h2>
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
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs active:scale-95 transition-all shadow-sm"
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
          <SettingsSubHeader title="Dépenses récurrentes" onBack={() => setActiveSection('menu')} />

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
      {/* SOUS-PAGE 5 : SÉCURITÉ & VERROUILLAGE                    */}
      {/* ======================================================== */}
      {activeSection === 'project_categories' && (
        <ProjectCategoriesSettings
          categories={data.projectCategories || []}
          usage={(data.savingsProjects || []).reduce<Record<string, number>>((acc, p) => {
            if (p.category) acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
          }, {})}
          onAdd={onAddProjectCategory}
          onRename={onRenameProjectCategory}
          onDelete={onDeleteProjectCategory}
          onBack={() => setActiveSection('menu')}
        />
      )}

      {activeSection === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <SettingsSubHeader title="Sécurité" onBack={() => setActiveSection('menu')} />

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-fg">Sécurité & Verrouillage</h2>
              <p className="text-xs text-fg-muted mt-1">
                Gérez la protection par mot de passe et l'accès biométrique à Mon Kanda.
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

              {/* Déverrouillage biométrique (demande l'autorisation au système) */}
              <BiometricToggle
                enabled={useBiometrics && isLockEnabled}
                lockEnabled={isLockEnabled}
                onChange={(enabled, credentialId) => {
                  setUseBiometrics(enabled);
                  setBiometricCredentialId(credentialId);
                }}
              />

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
                    Verrouiller immédiatement Mon Kanda
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
          <SettingsSubHeader title="Données" onBack={() => setActiveSection('menu')} />

          <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-line shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-fg">Sauvegarde & Données Mon Kanda</h2>
              <p className="text-xs text-fg-muted mt-1">
                Exportez vos données financières locales ou réinitialisez l'application.
              </p>
            </div>

            <div className="space-y-4">
              <CloudBackupCard data={data} onUpdateUser={onUpdateUser} onRestoreData={onRestoreData} />

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
