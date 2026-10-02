export type ExpenseCategory = 
  | 'Logement'
  | 'Alimentation'
  | 'Factures & Abonnements'
  | 'Transport'
  | 'Santé'
  | 'Loisirs & Sorties'
  | 'Shopping & Divers'
  | 'Autre';

export interface ExpensePreset {
  id: string;
  title: string;
  category: ExpenseCategory;
  defaultAmount?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  isRecurring: boolean; // Si true, reconduit chaque mois
  recurringOriginalAmount?: number; // Montant initial si modifié pour ce mois
  note?: string;
  isPaid?: boolean;
}

export interface SavingsDeposit {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  depositType?: 'monthly' | 'project';
  projectId?: string;
  projectName?: string;
}

export interface MonthlyBudget {
  monthKey: string; // Format "YYYY-MM" (ex: "2026-09")
  baseBudget: number; // Montant de base alloué aux dépenses ce mois
  salaryReceived?: number; // Salaire réel perçu ce mois (optionnel, par défaut celui des paramètres)
  notes?: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  username?: string;
  fullName: string;
  phone: string;
  email: string;
  defaultSalary: number;
  currency: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'apple' | 'email';
  isEmailVerified?: boolean;
  isOnboarded?: boolean;
  themePreference?: 'dark' | 'light' | 'system';
}

export interface SecuritySettings {
  isLockEnabled: boolean;
  passwordHash: string; // Base64 or plain hash for client-side lock
  lastLockedAt?: number;
  useBiometrics?: boolean;
  biometricType?: 'faceid' | 'fingerprint' | 'both';
}

export interface SavingsProject {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  category?: string;
  isClosed: boolean;
  closedAt?: string;
  createdAt: string;
  note?: string;
}

export interface AppData {
  user: UserProfile;
  security: SecuritySettings;
  monthlyBudgets: Record<string, MonthlyBudget>; // key: "YYYY-MM"
  expenses: Record<string, Expense[]>; // key: "YYYY-MM"
  savings: SavingsDeposit[]; // Global savings transactions
  savingsProjects?: SavingsProject[]; // Projets d'épargne avec objectifs à atteindre
  expensePresets: ExpensePreset[]; // Liste de dépenses configurées dans les paramètres
}
