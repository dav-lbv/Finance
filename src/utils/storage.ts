import { AppData, Expense, UserProfile, SecuritySettings } from '../types';
import { DEFAULT_AVATAR } from './avatars';

// v3 : base vierge (les anciennes données de démonstration v2 sont abandonnées)
const STORAGE_KEY = 'monsalaire_app_data_v3';
const LEGACY_STORAGE_KEYS = ['monsalaire_app_data_v2_fcfa'];

// Données initiales : application vierge, l'assistant de configuration se charge du profil
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
    useBiometrics: true,
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

export function loadAppData(): AppData {
  try {
    // Purge des anciennes données de démonstration
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultData();
      saveAppData(initial);
      return initial;
    }
    const data: AppData = JSON.parse(raw);
    const defaults = getDefaultData();

    data.user = { ...defaults.user, ...data.user };
    data.security = { ...defaults.security, ...data.security };
    data.monthlyBudgets = data.monthlyBudgets || {};
    data.expenses = data.expenses || {};
    data.savings = data.savings || [];
    data.savingsProjects = data.savingsProjects || [];
    data.expensePresets = data.expensePresets || [];
    data.projectCategories = data.projectCategories || [];

    return data;
  } catch (err) {
    console.error('Erreur chargement données', err);
    return getDefaultData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('monsalaire_data_changed'));
  } catch (err) {
    console.error('Erreur sauvegarde données', err);
  }
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
