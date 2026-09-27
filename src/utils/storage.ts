import { AppData, Expense, MonthlyBudget, SavingsDeposit, UserProfile, SecuritySettings, ExpensePreset, SavingsProject } from '../types';
import { getCurrentMonthKey, getPreviousMonthKey } from './date';
import { DEFAULT_AVATAR } from './avatars';

const STORAGE_KEY = 'monsalaire_app_data_v2_fcfa';

// Données initiales configurées en FCFA (Franc CFA)
export function getDefaultData(): AppData {
  const currentMonth = getCurrentMonthKey(); // "2026-09"
  const prevMonth = getPreviousMonthKey(currentMonth); // "2026-08"

  const defaultUser: UserProfile = {
    fullName: 'Davy Papet',
    phone: '+225 07 42 78 91',
    email: 'davypapet@gmail.com',
    defaultSalary: 750000, // 750 000 FCFA
    currency: 'FCFA',
    avatarUrl: DEFAULT_AVATAR,
    authProvider: 'google',
    isEmailVerified: true,
    isOnboarded: true,
    themePreference: 'dark',
  };

  const defaultSecurity: SecuritySettings = {
    isLockEnabled: false,
    passwordHash: '',
    useBiometrics: true,
    biometricType: 'both',
  };

  // Liste des dépenses configurées / pré-enregistrées
  const defaultExpensePresets: ExpensePreset[] = [
    { id: 'pre-1', title: 'Loyer Maison / Appartement', category: 'Logement', defaultAmount: 220000 },
    { id: 'pre-2', title: 'Facture CIE Électricité', category: 'Factures & Abonnements', defaultAmount: 40000 },
    { id: 'pre-3', title: 'Facture SODECI Eau', category: 'Factures & Abonnements', defaultAmount: 15000 },
    { id: 'pre-4', title: 'Abonnement Internet Fibre & Mobile', category: 'Factures & Abonnements', defaultAmount: 25000 },
    { id: 'pre-5', title: 'Courses Supermarché & Marché', category: 'Alimentation', defaultAmount: 110000 },
    { id: 'pre-6', title: 'Transport / Carburant / VTC', category: 'Transport', defaultAmount: 30000 },
    { id: 'pre-7', title: 'Sorties & Restaurants', category: 'Loisirs & Sorties', defaultAmount: 35000 },
    { id: 'pre-8', title: 'Pharmacie & Soins', category: 'Santé', defaultAmount: 15000 },
  ];

  // Dépenses du mois précédent (Août 2026) en FCFA
  const prevMonthExpenses: Expense[] = [
    {
      id: 'prev-1',
      title: 'Loyer Maison / Appartement',
      amount: 220000,
      category: 'Logement',
      date: `${prevMonth}-02`,
      isRecurring: true,
      isPaid: true,
      note: 'Virement loyer mensuel',
    },
    {
      id: 'prev-2',
      title: 'Courses Supermarché & Marché',
      amount: 125000,
      category: 'Alimentation',
      date: `${prevMonth}-10`,
      isRecurring: false,
      isPaid: true,
    },
    {
      id: 'prev-3',
      title: 'Abonnement Internet Fibre & Mobile',
      amount: 25000,
      category: 'Factures & Abonnements',
      date: `${prevMonth}-05`,
      isRecurring: true,
      isPaid: true,
    },
    {
      id: 'prev-4',
      title: 'Facture Électricité & Eau (CIE / SDE)',
      amount: 40000,
      category: 'Factures & Abonnements',
      date: `${prevMonth}-12`,
      isRecurring: true,
      isPaid: true,
    },
    {
      id: 'prev-5',
      title: 'Carburant / Transport VTC',
      amount: 35000,
      category: 'Transport',
      date: `${prevMonth}-16`,
      isRecurring: false,
      isPaid: true,
    },
    {
      id: 'prev-6',
      title: 'Sorties & Restaurants',
      amount: 45000,
      category: 'Loisirs & Sorties',
      date: `${prevMonth}-22`,
      isRecurring: false,
      isPaid: true,
    },
    {
      id: 'prev-7',
      title: 'Pharmacie & Soins',
      amount: 15000,
      category: 'Santé',
      date: `${prevMonth}-24`,
      isRecurring: false,
      isPaid: true,
    },
  ];

  // Dépenses du mois en cours (Septembre 2026) en FCFA : Dépenses en cours de saisie à valider
  const currentMonthExpenses: Expense[] = [
    {
      id: 'curr-1',
      title: 'Loyer Maison / Appartement',
      amount: 220000,
      category: 'Logement',
      date: `${currentMonth}-02`,
      isRecurring: true,
      isPaid: false,
      note: 'Reconduit chaque mois',
    },
    {
      id: 'curr-2',
      title: 'Ravitaillement courses du mois',
      amount: 110000,
      category: 'Alimentation',
      date: `${currentMonth}-08`,
      isRecurring: false,
      isPaid: false,
    },
    {
      id: 'curr-3',
      title: 'Abonnement Internet Fibre & Mobile',
      amount: 25000,
      category: 'Factures & Abonnements',
      date: `${currentMonth}-05`,
      isRecurring: true,
      isPaid: false,
    },
    {
      id: 'curr-4',
      title: 'Facture Électricité (Ajustée climatisation)',
      amount: 48000, // Ajusté ce mois-ci par rapport aux 40 000 habituels
      recurringOriginalAmount: 40000,
      category: 'Factures & Abonnements',
      date: `${currentMonth}-12`,
      isRecurring: true,
      isPaid: false,
      note: 'Variation de facture ce mois',
    },
    {
      id: 'curr-5',
      title: 'Budget Transport & Carburant',
      amount: 30000,
      category: 'Transport',
      date: `${currentMonth}-01`,
      isRecurring: true,
      isPaid: false,
    },
    {
      id: 'curr-6',
      title: 'Loisirs, Salle de sport & Détente',
      amount: 35000,
      category: 'Loisirs & Sorties',
      date: `${currentMonth}-15`,
      isRecurring: false,
      isPaid: false,
    },
  ];

  // Budgets mensuels en FCFA
  const monthlyBudgets: Record<string, MonthlyBudget> = {
    '2026-04': { monthKey: '2026-04', baseBudget: 520000, salaryReceived: 750000 },
    '2026-05': { monthKey: '2026-05', baseBudget: 540000, salaryReceived: 750000 },
    '2026-06': { monthKey: '2026-06', baseBudget: 600000, salaryReceived: 800000 },
    '2026-07': { monthKey: '2026-07', baseBudget: 530000, salaryReceived: 750000 },
    [prevMonth]: {
      monthKey: prevMonth,
      baseBudget: 550000, // 550 000 FCFA alloués
      salaryReceived: 750000, // 750 000 FCFA
      notes: 'Budget dépenses maîtrisé en août',
    },
    [currentMonth]: {
      monthKey: currentMonth,
      baseBudget: 580000, // 580 000 FCFA
      salaryReceived: 750000,
      notes: 'Salaire perçu : 750 000 FCFA -> 580 000 FCFA alloués aux dépenses, 170 000 FCFA à l\'épargne',
    },
  };

  // Dépenses historiques pour le graphique de tendance (Avril à Juillet 2026)
  const historicalExpenses: Record<string, Expense[]> = {
    '2026-04': [
      { id: 'h4-1', title: 'Loyer Maison', amount: 220000, category: 'Logement', date: '2026-04-02', isRecurring: true, isPaid: true },
      { id: 'h4-2', title: 'Alimentation & Marché', amount: 105000, category: 'Alimentation', date: '2026-04-10', isRecurring: false, isPaid: true },
      { id: 'h4-3', title: 'Factures Eau & Électricité', amount: 38000, category: 'Factures & Abonnements', date: '2026-04-12', isRecurring: true, isPaid: true },
      { id: 'h4-4', title: 'Internet & Mobile', amount: 25000, category: 'Factures & Abonnements', date: '2026-04-05', isRecurring: true, isPaid: true },
      { id: 'h4-5', title: 'Transport / Carburant', amount: 28000, category: 'Transport', date: '2026-04-15', isRecurring: true, isPaid: true },
      { id: 'h4-6', title: 'Loisirs & Sorties', amount: 32000, category: 'Loisirs & Sorties', date: '2026-04-20', isRecurring: false, isPaid: true },
    ],
    '2026-05': [
      { id: 'h5-1', title: 'Loyer Maison', amount: 220000, category: 'Logement', date: '2026-05-02', isRecurring: true, isPaid: true },
      { id: 'h5-2', title: 'Alimentation & Marché', amount: 112000, category: 'Alimentation', date: '2026-05-10', isRecurring: false, isPaid: true },
      { id: 'h5-3', title: 'Factures Eau & Électricité', amount: 42000, category: 'Factures & Abonnements', date: '2026-05-12', isRecurring: true, isPaid: true },
      { id: 'h5-4', title: 'Internet & Mobile', amount: 25000, category: 'Factures & Abonnements', date: '2026-05-05', isRecurring: true, isPaid: true },
      { id: 'h5-5', title: 'Transport / Carburant', amount: 31000, category: 'Transport', date: '2026-05-15', isRecurring: true, isPaid: true },
      { id: 'h5-6', title: 'Pharmacie & Santé', amount: 20000, category: 'Santé', date: '2026-05-18', isRecurring: false, isPaid: true },
      { id: 'h5-7', title: 'Loisirs & Sorties', amount: 40000, category: 'Loisirs & Sorties', date: '2026-05-24', isRecurring: false, isPaid: true },
    ],
    '2026-06': [
      { id: 'h6-1', title: 'Loyer Maison', amount: 220000, category: 'Logement', date: '2026-06-02', isRecurring: true, isPaid: true },
      { id: 'h6-2', title: 'Alimentation & Marché', amount: 120000, category: 'Alimentation', date: '2026-06-10', isRecurring: false, isPaid: true },
      { id: 'h6-3', title: 'Factures Eau & Électricité', amount: 45000, category: 'Factures & Abonnements', date: '2026-06-12', isRecurring: true, isPaid: true },
      { id: 'h6-4', title: 'Internet & Mobile', amount: 25000, category: 'Factures & Abonnements', date: '2026-06-05', isRecurring: true, isPaid: true },
      { id: 'h6-5', title: 'Transport / Carburant', amount: 35000, category: 'Transport', date: '2026-06-15', isRecurring: true, isPaid: true },
      { id: 'h6-6', title: 'Fêtes & Événements', amount: 75000, category: 'Loisirs & Sorties', date: '2026-06-25', isRecurring: false, isPaid: true },
    ],
    '2026-07': [
      { id: 'h7-1', title: 'Loyer Maison', amount: 220000, category: 'Logement', date: '2026-07-02', isRecurring: true, isPaid: true },
      { id: 'h7-2', title: 'Alimentation & Marché', amount: 115000, category: 'Alimentation', date: '2026-07-10', isRecurring: false, isPaid: true },
      { id: 'h7-3', title: 'Factures Eau & Électricité', amount: 39000, category: 'Factures & Abonnements', date: '2026-07-12', isRecurring: true, isPaid: true },
      { id: 'h7-4', title: 'Internet & Mobile', amount: 25000, category: 'Factures & Abonnements', date: '2026-07-05', isRecurring: true, isPaid: true },
      { id: 'h7-5', title: 'Transport / Carburant', amount: 29000, category: 'Transport', date: '2026-07-15', isRecurring: true, isPaid: true },
      { id: 'h7-6', title: 'Loisirs', amount: 30000, category: 'Loisirs & Sorties', date: '2026-07-22', isRecurring: false, isPaid: true },
    ],
  };

  // Épargne avec historique en FCFA (7 versements pour illustrer la pagination à 5 par page avec flèches)
  const savings: SavingsDeposit[] = [
    {
      id: 'sav-1',
      amount: 150000,
      date: `${prevMonth}-05`,
      note: 'Virement épargne de début de mois',
    },
    {
      id: 'sav-2',
      amount: 50000,
      date: `${prevMonth}-28`,
      note: 'Surplus épargné fin de mois',
    },
    {
      id: 'sav-3',
      amount: 120000,
      date: `${currentMonth}-05`,
      note: 'Versement début de mois (salaire)',
    },
    {
      id: 'sav-4',
      amount: 50000,
      date: `${currentMonth}-20`,
      note: 'Complément pour projet',
    },
    {
      id: 'sav-5',
      amount: 40000,
      date: '2026-07-15',
      note: 'Épargne de sécurité',
    },
    {
      id: 'sav-6',
      amount: 60000,
      date: '2026-06-10',
      note: 'Placement réserve de prévoyance',
    },
    {
      id: 'sav-7',
      amount: 45000,
      date: '2026-05-12',
      note: 'Objectif fond d\'urgence',
    },
  ];

  // Projets d'épargne avec objectifs à atteindre
  const defaultSavingsProjects: SavingsProject[] = [
    {
      id: 'proj-1',
      title: 'Achat Ordinateur MacBook Pro & Setup',
      targetAmount: 500000, // 500 000 FCFA
      currentAmount: 500000, // 100% atteint -> Objectif prêt à être clôturé !
      targetDate: `${currentMonth}-30`,
      category: 'Matériel & Travail',
      isClosed: false,
      createdAt: `${prevMonth}-01`,
      note: 'Objectif atteint avec le versement de ce mois !',
    },
    {
      id: 'proj-2',
      title: 'Fonds d\'Urgence & Réserve Sécurité (3 mois)',
      targetAmount: 750000,
      currentAmount: 420000, // 56%
      targetDate: '2026-12-31',
      category: 'Sécurité Financière',
      isClosed: false,
      createdAt: '2026-05-10',
      note: 'Couvrir 3 mois de loyer et charges fixes.',
    },
    {
      id: 'proj-3',
      title: 'Voyage Vacances & Détente',
      targetAmount: 350000,
      currentAmount: 170000, // 48%
      targetDate: '2026-11-15',
      category: 'Loisirs & Voyage',
      isClosed: false,
      createdAt: `${currentMonth}-01`,
    },
  ];

  return {
    user: defaultUser,
    security: defaultSecurity,
    monthlyBudgets,
    expenses: {
      ...historicalExpenses,
      [prevMonth]: prevMonthExpenses,
      [currentMonth]: currentMonthExpenses,
    },
    savings,
    savingsProjects: defaultSavingsProjects,
    expensePresets: defaultExpensePresets,
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultData();
      saveAppData(initial);
      return initial;
    }
    const data: AppData = JSON.parse(raw);
    
    // Assurer FCFA par défaut
    if (!data.user) data.user = getDefaultData().user;
    if (data.user.currency !== 'FCFA') {
      data.user.currency = 'FCFA';
    }
    if (!data.user.avatarUrl || data.user.avatarUrl.includes('unsplash.com')) {
      data.user.avatarUrl = getDefaultData().user.avatarUrl;
    }
    if (data.user.isOnboarded === undefined) {
      data.user.isOnboarded = true;
    }
    if (!data.security) data.security = getDefaultData().security;
    if (data.security.useBiometrics === undefined) {
      data.security.useBiometrics = true;
      data.security.biometricType = 'both';
    }
    if (!data.monthlyBudgets) data.monthlyBudgets = {};
    if (!data.expenses) data.expenses = {};
    if (!data.savings) data.savings = [];
    if (!data.expensePresets || data.expensePresets.length === 0) {
      data.expensePresets = getDefaultData().expensePresets;
    }
    if (!data.savingsProjects || data.savingsProjects.length === 0) {
      data.savingsProjects = getDefaultData().savingsProjects;
    }

    // Assurer les mois pour le graphique de tendance
    const defaultData = getDefaultData();
    Object.keys(defaultData.expenses).forEach((m) => {
      if (!data.expenses[m] || data.expenses[m].length === 0) {
        data.expenses[m] = defaultData.expenses[m];
      }
    });
    Object.keys(defaultData.monthlyBudgets).forEach((m) => {
      if (!data.monthlyBudgets[m]) {
        data.monthlyBudgets[m] = defaultData.monthlyBudgets[m];
      }
    });

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
    const defaultSalary = newData.user.defaultSalary || 750000;
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
