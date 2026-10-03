import React from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight, Database, Lock, Repeat, Target, Trash2, Wallet } from 'lucide-react';
import { AppData } from '../types';
import { ThemeMode } from '../hooks/useTheme';
import { formatCurrency } from '../utils/date';
import { DEFAULT_AVATAR } from '../utils/avatars';
import { getStorageKind } from '../utils/storage';
import type { SettingsSection } from './SettingsPage';

interface SettingsMenuProps {
  data: AppData;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  onNavigate: (section: SettingsSection) => void;
  onLockNow: () => void;
  onReset: () => void;
}

// ------------------------------------------------------------------
// Briques : rubrique, groupe arrondi, rangée
// ------------------------------------------------------------------
const Section: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    {title && <h2 className="px-3 mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-muted">{title}</h2>}
    <div className="rounded-[26px] bg-surface border border-line overflow-hidden">{children}</div>
  </section>
);

const Row: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
  chevron?: boolean;
  danger?: boolean;
  first?: boolean;
}> = ({ icon, label, value, onClick, chevron = true, danger, first }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-surface-2/60 transition-colors ${
      first ? '' : 'border-t border-line'
    }`}
  >
    <span
      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
        danger ? 'bg-danger/15 text-danger' : 'bg-surface-3 text-fg'
      }`}
    >
      {icon}
    </span>
    <span className={`flex-1 min-w-0 text-[15px] font-semibold truncate ${danger ? 'text-danger' : 'text-fg'}`}>{label}</span>
    {value && <span className="text-[13px] text-fg-muted truncate max-w-[40%] tabular-nums">{value}</span>}
    {chevron && <ChevronRight className="w-4 h-4 shrink-0 text-fg-muted" />}
  </button>
);

// ------------------------------------------------------------------
// Sélecteur d'apparence : trois vignettes (Système / Clair / Sombre)
// ------------------------------------------------------------------
const MiniScreen: React.FC<{ dark: boolean }> = ({ dark }) => (
  <div
    className="absolute inset-2 rounded-xl overflow-hidden"
    style={{ background: dark ? '#26262b' : '#ffffff', boxShadow: dark ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
  >
    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full" style={{ background: dark ? '#0a0a0c' : '#111113' }} />
    <span className="absolute top-5 left-2 right-2 h-2 rounded-full" style={{ background: dark ? '#3a3a41' : '#e6e6ea' }} />
    <span className="absolute top-9 left-2 w-1/2 h-1.5 rounded-full" style={{ background: dark ? '#34343a' : '#efeff2' }} />
    <span className="absolute bottom-2 left-2 right-2 h-5 rounded-lg" style={{ background: dark ? '#303036' : '#f1f1f4' }} />
  </div>
);

const ThemeThumb: React.FC<{ mode: ThemeMode }> = ({ mode }) => (
  <div
    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden"
    style={{ background: mode === 'dark' ? '#111114' : '#e9e9ee' }}
  >
    {mode === 'system' ? (
      <>
        <MiniScreen dark={false} />
        <div className="absolute inset-0" style={{ clipPath: 'inset(0 0 0 50%)', background: '#111114' }}>
          <MiniScreen dark />
        </div>
      </>
    ) : (
      <MiniScreen dark={mode === 'dark'} />
    )}
  </div>
);

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'Système' },
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
];

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ data, themeMode, setThemeMode, onNavigate, onLockNow, onReset }) => {
  const { user, security } = data;
  const currency = user.currency || 'FCFA';
  const displayName = user.username || user.fullName || 'Mon profil';
  const subtitle = user.email || user.phone || 'Informations, salaire et devise';
  const lockOn = security.isLockEnabled && !!security.passwordHash;
  const presets = data.expensePresets?.length || 0;
  const categories = data.projectCategories?.length || 0;

  return (
    <div className="space-y-6 stagger">
      <h1 className="text-[34px] leading-tight font-light tracking-tight text-fg px-1">Réglages</h1>

      {/* Profil */}
      <button
        type="button"
        onClick={() => onNavigate('user_info')}
        className="w-full flex items-center gap-4 rounded-[26px] bg-surface border border-line p-4 text-left cursor-pointer"
      >
        <img
          src={user.avatarUrl || DEFAULT_AVATAR}
          alt=""
          className="w-14 h-14 rounded-full object-cover border border-line-strong shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold text-fg truncate">{displayName}</span>
          <span className="block text-[12px] text-fg-muted truncate">{subtitle}</span>
          <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-3 text-fg-2">{currency}</span>
        </span>
        <ChevronRight className="w-4 h-4 shrink-0 text-fg-muted" />
      </button>

      {/* Apparence */}
      <section>
        <h2 className="px-3 mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-muted">Apparence</h2>
        <div className="rounded-[26px] bg-surface border border-line p-4 grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const active = themeMode === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => setThemeMode(t.id)}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center gap-2 cursor-pointer"
                aria-pressed={active}
              >
                <div className="relative w-full">
                  <ThemeThumb mode={t.id} />
                  {active && (
                    <motion.span
                      layoutId="theme-ring"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute -inset-1 rounded-[20px] border-2 border-fg pointer-events-none"
                    />
                  )}
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-brand text-brand-fg flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.span>
                  )}
                </div>
                <span className={`text-[13px] ${active ? 'font-bold text-fg' : 'font-medium text-fg-2'}`}>{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Budget */}
      <Section title="Budget">
        <Row
          first
          icon={<Wallet className="w-[18px] h-[18px]" />}
          label="Salaire & budget"
          value={user.defaultSalary ? formatCurrency(user.defaultSalary, currency) : 'À renseigner'}
          onClick={() => onNavigate('budget_salary')}
        />
        <Row
          icon={<Repeat className="w-[18px] h-[18px]" />}
          label="Dépenses récurrentes"
          value={`${presets} modèle${presets > 1 ? 's' : ''}`}
          onClick={() => onNavigate('categories')}
        />
        <Row
          icon={<Target className="w-[18px] h-[18px]" />}
          label="Catégories de projets"
          value={`${categories}`}
          onClick={() => onNavigate('project_categories')}
        />
      </Section>

      {/* Sécurité */}
      <Section title="Sécurité">
        <Row
          first
          icon={<Lock className="w-[18px] h-[18px]" />}
          label="Verrouillage & biométrie"
          value={lockOn ? (security.useBiometrics ? 'Activé • biométrie' : 'Activé') : 'Désactivé'}
          onClick={() => onNavigate('security')}
        />
        {lockOn && (
          <Row icon={<Lock className="w-[18px] h-[18px]" />} label="Verrouiller maintenant" chevron={false} onClick={onLockNow} />
        )}
      </Section>

      {/* Données */}
      <Section title="Données">
        <Row
          first
          icon={<Database className="w-[18px] h-[18px]" />}
          label="Sauvegarde & données"
          value={getStorageKind() === 'sqlite' ? 'SQLite' : 'Sur cet appareil'}
          onClick={() => onNavigate('backup')}
        />
        <Row
          danger
          icon={<Trash2 className="w-[18px] h-[18px]" />}
          label="Réinitialiser l'application"
          chevron={false}
          onClick={onReset}
        />
      </Section>

      <p className="text-center text-[11px] text-fg-muted pb-2">Mon Kanda • vos données restent sur cet appareil</p>
    </div>
  );
};
