import { AppData, Expense, UserProfile, SecuritySettings } from '../types';
import { DEFAULT_AVATAR } from './avatars';
import { Capacitor } from '@capacitor/core';
import { LOCAL_STORAGE_KEY, StorageBackend, createBackend } from '../db/backends';

/** Anciennes clés de stockage local (jeu de test v2) : supprimées au démarrage. */
const LEGACY_STORAGE_KEYS = ['monsalaire_app_data_v2_fcfa'];

// Application vierge : l'assistant de configuration se charge du profil
export function getDefaultData(): AppData {
  const defaultUser: UserProfile = {
    fullName: '',
    phone: '',
    email: '',
    defaultSalary: 0,
    currency: 'FCFA',
    avatarUrl: DEFAULT_AVATAR,
    isOnboarded: false,
    themePreference: 'dark',
  };

  const defaultSecurity: SecuritySettings = {
    isLockEnabled: false,
    passwordHash: '',
    useBiometrics: false,
    biometricType: 'both',
  };

  return {
    user: defaultUser,
    security: defaultSecurity,
    monthlyBudgets: {},
    expenses: {},
    savings: [],
    savingsProjects: [],
    expensePresets: [],
    projectCategories: [],
  };
}

/** Complète d'éventuels champs manquants (données écrites par une ancienne version). */
function normalize(data: AppData): AppData {
  const defaults = getDefaultData();
  const security = { ...defaults.security, ...data.security };
  // Anciennes versions : la biométrie était « activée » par défaut sans jamais avoir été autorisée.
  // Sur le web, elle n'est valide que si une clé a été enregistrée.
  if (!Capacitor.isNativePlatform() && security.useBiometrics && !security.biometricCredentialId) {
    security.useBiometrics = false;
  }
  return {
    ...data,
    user: { ...defaults.user, ...data.user },
    security,
    monthlyBudgets: data.monthlyBudgets || {},
    expenses: data.expenses || {},
    savings: data.savings || [],
    savingsProjects: data.savingsProjects || [],
    expensePresets: data.expensePresets || [],
    projectCategories: data.projectCategories || [],
  };
}

// ------------------------------------------------------------------
// Cache mémoire + écriture asynchrone en base
// ------------------------------------------------------------------
let backend: StorageBackend | null = null;
let cache: AppData = getDefaultData();
let writing = false;
let dirty = false;

export function getStorageKind(): string {
  return backend?.kind ?? 'none';
}

/**
 * À appeler UNE fois avant d'afficher l'application : ouvre la base (SQLite sur
 * iOS / Android, IndexedDB sur le web) et charge les données en mémoire.
 */
export async function initStorage(): Promise<AppData> {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignoré */
    }
  });

  backend = await createBackend();
  let stored = await backend.load();

  // Migration web : les données de l'ancienne version étaient dans localStorage
  if (!stored && backend.kind !== 'localstorage') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        stored = JSON.parse(raw) as AppData;
        await backend.save(normalize(stored));
        localStorage.removeItem(LOCAL_STORAGE_KEY); // plus de doublon des données financières
      }
    } catch (err) {
      console.error('Migration depuis localStorage impossible', err);
    }
  }

  cache = stored ? normalize(stored) : getDefaultData();
  if (!stored) await backend.save(cache);
  return cache;
}

export function loadAppData(): AppData {
  return cache;
}

async function flush(): Promise<void> {
  if (writing || !backend) return;
  writing = true;
  try {
    while (dirty) {
      dirty = false;
      await backend.save(cache);
    }
  } catch (err) {
    console.error('Erreur sauvegarde données', err);
  } finally {
    writing = false;
  }
}

export function saveAppData(data: AppData): void {
  cache = data;
  dirty = true;
  void flush();
  window.dispatchEvent(new CustomEvent('monsalaire_data_changed'));
}

/**
 * Assure qu'un mois donné a son budget et ses dépenses récurrentes initialisées
 */
export function ensureMonthInitialized(data: AppData, targetMonthKey: string): AppData {
  let modified = false;
  const newData = { ...data };

  // 1. Initialiser le budget du mois s'il n'existe pas
  if (!newData.monthlyBudgets[targetMonthKey]) {
    const defaultSalary = newData.user.defaultSalary || 0;
    const suggestedBase = Math.round(defaultSalary * 0.8);
    newData.monthlyBudgets[targetMonthKey] = {
      monthKey: targetMonthKey,
      baseBudget: suggestedBase,
      salaryReceived: defaultSalary,
    };
    modified = true;
  }

  // 2. Initialiser les dépenses récurrentes (charges fixes conservées chaque mois) si le mois n'a pas encore de dépenses
  if (!newData.expenses[targetMonthKey]) {
    const allMonths = Object.keys(newData.expenses).sort().reverse();
    const sourceMonth = allMonths.find((m) => m !== targetMonthKey && (newData.expenses[m] || []).some(e => e.isRecurring));
    
    if (sourceMonth) {
      const recurringToCopy: Expense[] = (newData.expenses[sourceMonth] || [])
        .filter((e) => e.isRecurring)
        .map((e) => ({
          ...e,
          id: `rec-${targetMonthKey}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: `${targetMonthKey}-02`,
          isPaid: false,
        }));
      newData.expenses[targetMonthKey] = recurringToCopy;
      modified = true;
    } else {
      newData.expenses[targetMonthKey] = [];
      modified = true;
    }
  }

  if (modified) {
    saveAppData(newData);
  }

  return newData;
}
