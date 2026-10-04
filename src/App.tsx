/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ExpensesPage } from './components/ExpensesPage';
import { SavingsPage } from './components/SavingsPage';
import { SettingsPage } from './components/SettingsPage';
import { LockScreen } from './components/LockScreen';
import { ExpenseModal } from './components/ExpenseModal';
import { SavingsModal } from './components/SavingsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SettingsSection } from './components/SettingsPage';
import { AuthOnboardingModal } from './components/AuthOnboardingModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { 
  AppData, 
  Expense, 
  SavingsDeposit, 
  UserProfile, 
  SecuritySettings,
  ExpensePreset,
  SavingsProject
} from './types';
import { 
  loadAppData, 
  saveAppData, 
  getDefaultData, 
  ensureMonthInitialized 
} from './utils/storage';
import { getCurrentMonthKey, getTodayDateString } from './utils/date';
import { WeekCalendarBar } from './components/WeekCalendarBar';
import { getMonthSalary } from './utils/finance';

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadAppData();
    return ensureMonthInitialized(loaded, getCurrentMonthKey());
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'expenses' | 'savings' | 'settings'>('dashboard');
  const [initialSettingsSection, setInitialSettingsSection] = useState<SettingsSection>('menu');
  // L'application démarre verrouillée si l'utilisateur a activé le verrouillage
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const security = loadAppData().security;
    return security.isLockEnabled && !!security.passwordHash;
  });

  // Modales
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [savingsModalProjectId, setSavingsModalProjectId] = useState<string | undefined>(undefined);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Première utilisation : l'assistant de configuration est obligatoire
  const needsOnboarding = !data.user.isOnboarded;
  // Première page : choix du compte / restauration, avant l'assistant de configuration
  const [welcomeDone, setWelcomeDone] = useState(false);

  // Navigation fluide avec support des sous-sections de paramètres
  const handleNavigateToTab = (tab: 'expenses' | 'savings' | 'settings', section?: SettingsSection) => {
    if (tab === 'settings' && section) {
      setInitialSettingsSection(section);
    } else if (tab === 'settings') {
      setInitialSettingsSection('menu');
    }
    setCurrentTab(tab);
  };

  // Re-verrouillage quand l'application revient d'un passage en arrière-plan (> 30 s)
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 30_000) {
        const security = loadAppData().security;
        if (security.isLockEnabled && security.passwordHash) setIsLocked(true);
        hiddenAt = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Garder le jour sélectionné dans le mois affiché (changement de mois depuis un autre écran)
  useEffect(() => {
    setSelectedDate((prev) => {
      if (prev.startsWith(selectedMonth)) return prev;
      const today = getTodayDateString();
      return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
    });
  }, [selectedMonth]);

  // Sélection d'un jour dans le calendrier permanent : met aussi à jour le mois
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    if (!date.startsWith(selectedMonth)) setSelectedMonth(date.slice(0, 7));
  };

  // Assurer l'initialisation du mois lorsque l'utilisateur change de mois
  useEffect(() => {
    setData((prev) => ensureMonthInitialized(prev, selectedMonth));
  }, [selectedMonth]);

  // Écouter les changements éventuels
  useEffect(() => {
    const handleStorageChange = () => {
      setData(loadAppData());
    };
    window.addEventListener('monsalaire_data_changed', handleStorageChange);
    return () => window.removeEventListener('monsalaire_data_changed', handleStorageChange);
  }, []);

  // Gestion du budget de base alloué (Page Dépenses)
  const handleUpdateBaseBudget = (monthKey: string, newAmount: number) => {
    const updated: AppData = {
      ...data,
      monthlyBudgets: {
        ...data.monthlyBudgets,
        [monthKey]: {
          ...(data.monthlyBudgets[monthKey] || {
            monthKey,
            salaryReceived: data.user.defaultSalary,
          }),
          baseBudget: newAmount,
        },
      },
    };
    setData(updated);
    saveAppData(updated);
  };

  // Ajout d'une dépense
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    const currentMonthExpenses = data.expenses[selectedMonth] || [];
    const updated: AppData = {
      ...data,
      expenses: {
        ...data.expenses,
        [selectedMonth]: [newExpense, ...currentMonthExpenses],
      },
    };
    setData(updated);
    saveAppData(updated);
  };

  // Mise à jour d'une dépense
  const handleUpdateExpense = (updatedExpense: Expense) => {
    const currentMonthExpenses = data.expenses[selectedMonth] || [];
    const updatedList = currentMonthExpenses.map((e) =>
      e.id === updatedExpense.id ? updatedExpense : e
    );

    const updated: AppData = {
      ...data,
      expenses: {
        ...data.expenses,
        [selectedMonth]: updatedList,
      },
    };
    setData(updated);
    saveAppData(updated);
  };

  // Suppression d'une dépense
  const handleDeleteExpense = (expenseId: string) => {
    const currentMonthExpenses = data.expenses[selectedMonth] || [];
    const updatedList = currentMonthExpenses.filter((e) => e.id !== expenseId);

    const updated: AppData = {
      ...data,
      expenses: {
        ...data.expenses,
        [selectedMonth]: updatedList,
      },
    };
    setData(updated);
    saveAppData(updated);
  };

  // Validation / Dévalidation : Les dépenses non récurrentes sont réglées/archivées, les récurrentes ne s'effacent pas et restent actives
  const handleValidateAllMonthExpenses = (monthKey: string, validate: boolean = true) => {
    const currentMonthExpenses = data.expenses[monthKey] || [];
    const updatedList = currentMonthExpenses.map((e) => ({
      ...e,
      // Si on valide : les dépenses récurrentes restent actives (isPaid: false), le reste est réglé (isPaid: true)
      // Si on dévalide : tout redevient actif (isPaid: false)
      isPaid: validate ? (e.isRecurring ? false : true) : false,
    }));

    const updated: AppData = {
      ...data,
      expenses: {
        ...data.expenses,
        [monthKey]: updatedList,
      },
    };
    setData(updated);
    saveAppData(updated);
  };

  // Gestion des modèles de dépenses prédéfinies (Presets)
  const handleAddExpensePreset = (presetData: Omit<ExpensePreset, 'id'>) => {
    const newPreset: ExpensePreset = {
      ...presetData,
      id: `pre-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    const updated: AppData = {
      ...data,
      expensePresets: [...(data.expensePresets || []), newPreset],
    };
    setData(updated);
    saveAppData(updated);
  };

  const handleUpdateExpensePreset = (updatedPreset: ExpensePreset) => {
    const currentPresets = data.expensePresets || [];
    const updatedList = currentPresets.map((p) =>
      p.id === updatedPreset.id ? updatedPreset : p
    );

    const updated: AppData = {
      ...data,
      expensePresets: updatedList,
    };
    setData(updated);
    saveAppData(updated);
  };

  const handleDeleteExpensePreset = (presetId: string) => {
    const currentPresets = data.expensePresets || [];
    const updatedList = currentPresets.filter((p) => p.id !== presetId);

    const updated: AppData = {
      ...data,
      expensePresets: updatedList,
    };
    setData(updated);
    saveAppData(updated);
  };

  // Ajout d'un versement d'épargne (montant variable chaque mois)
  const handleAddSavings = (depositData: Omit<SavingsDeposit, 'id'>) => {
    const newDeposit: SavingsDeposit = {
      ...depositData,
      id: `sav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    let updatedProjects = data.savingsProjects;
    if (depositData.projectId && data.savingsProjects) {
      updatedProjects = data.savingsProjects.map((p) => {
        if (p.id === depositData.projectId) {
          return {
            ...p,
            currentAmount: p.currentAmount + depositData.amount,
          };
        }
        return p;
      });
    }

    const updated: AppData = {
      ...data,
      savings: [newDeposit, ...data.savings],
      savingsProjects: updatedProjects,
    };
    setData(updated);
    saveAppData(updated);
  };

  // Suppression d'un versement d'épargne
  const handleDeleteSavings = (depositId: string) => {
    const updated: AppData = {
      ...data,
      savings: data.savings.filter((s) => s.id !== depositId),
    };
    setData(updated);
    saveAppData(updated);
  };

  // Gestion des projets d'épargne (Création, Modification, Clôture, Contribution)
  const handleAddSavingsProject = (projectData: Omit<SavingsProject, 'id' | 'createdAt' | 'isClosed'>) => {
    const newProject: SavingsProject = {
      ...projectData,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
      isClosed: false,
    };

    const updated: AppData = {
      ...data,
      savingsProjects: [newProject, ...(data.savingsProjects || [])],
    };
    setData(updated);
    saveAppData(updated);
  };

  const handleUpdateSavingsProject = (updatedProject: SavingsProject) => {
    const current = data.savingsProjects || [];
    const updatedList = current.map((p) => (p.id === updatedProject.id ? updatedProject : p));
    const updated: AppData = {
      ...data,
      savingsProjects: updatedList,
    };
    setData(updated);
    saveAppData(updated);
  };

  const handleDeleteSavingsProject = (projectId: string) => {
    const current = data.savingsProjects || [];
    const updatedList = current.filter((p) => p.id !== projectId);
    const updated: AppData = {
      ...data,
      savingsProjects: updatedList,
    };
    setData(updated);
    saveAppData(updated);
  };

  const handleCloseSavingsProject = (projectId: string, close: boolean) => {
    const current = data.savingsProjects || [];
    const updatedList = current.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          isClosed: close,
          closedAt: close ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return p;
    });

    const updated: AppData = {
      ...data,
      savingsProjects: updatedList,
    };
    setData(updated);
    saveAppData(updated);
  };

  const handleContributeToSavingsProject = (
    projectId: string,
    amount: number,
    alsoRecordSavings: boolean = true,
    closeProjectIfReached: boolean = false,
    customDate?: string,
    customNote?: string
  ) => {
    const current = data.savingsProjects || [];
    let projectTitle = '';
    const updatedProjects = current.map((p) => {
      if (p.id === projectId) {
        projectTitle = p.title;
        const newTotal = p.currentAmount + amount;
        const isReached = newTotal >= p.targetAmount;
        const shouldClose = closeProjectIfReached && isReached;
        return {
          ...p,
          currentAmount: newTotal,
          isClosed: shouldClose ? true : p.isClosed,
          closedAt: shouldClose ? new Date().toISOString().split('T')[0] : p.closedAt,
        };
      }
      return p;
    });

    let updatedSavings = data.savings;
    if (alsoRecordSavings) {
      const newDeposit: SavingsDeposit = {
        id: `sav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        amount,
        date: customDate || `${selectedMonth}-01`,
        note: customNote || `Affectation projet : ${projectTitle}`,
        depositType: 'project',
        projectId,
        projectName: projectTitle,
      };
      updatedSavings = [newDeposit, ...data.savings];
    }

    const updated: AppData = {
      ...data,
      savings: updatedSavings,
      savingsProjects: updatedProjects,
    };
    setData(updated);
    saveAppData(updated);
  };

  // Mise à jour du profil utilisateur (Nom, Téléphone, E-mail)
  const handleUpdateUser = (newUser: UserProfile) => {
    const updated: AppData = {
      ...data,
      user: newUser,
    };
    setData(updated);
    saveAppData(updated);
  };

  // Mise à jour des paramètres de sécurité (mot de passe / verrouillage)
  const handleUpdateSecurity = (newSecurity: SecuritySettings) => {
    const updated: AppData = {
      ...data,
      security: newSecurity,
    };
    setData(updated);
    saveAppData(updated);
  };

  // Mise à jour du salaire spécifique au mois
  const handleUpdateMonthSalary = (monthKey: string, salary: number) => {
    const updated: AppData = {
      ...data,
      monthlyBudgets: {
        ...data.monthlyBudgets,
        [monthKey]: {
          ...(data.monthlyBudgets[monthKey] || {
            monthKey,
            baseBudget: Math.round(salary * 0.8),
          }),
          salaryReceived: salary,
        },
      },
    };
    setData(updated);
    saveAppData(updated);
  };

  // Catégories de projets d'épargne (entièrement configurées par l'utilisateur)
  const handleAddProjectCategory = (name: string) => {
    const clean = name.trim();
    const current = data.projectCategories || [];
    if (!clean || current.some((c) => c.toLowerCase() === clean.toLowerCase())) return;
    const updated: AppData = { ...data, projectCategories: [...current, clean] };
    setData(updated);
    saveAppData(updated);
  };

  const handleRenameProjectCategory = (oldName: string, newName: string) => {
    const clean = newName.trim();
    const current = data.projectCategories || [];
    if (!clean || clean === oldName || current.some((c) => c !== oldName && c.toLowerCase() === clean.toLowerCase())) return;
    const updated: AppData = {
      ...data,
      projectCategories: current.map((c) => (c === oldName ? clean : c)),
      savingsProjects: (data.savingsProjects || []).map((p) => (p.category === oldName ? { ...p, category: clean } : p)),
    };
    setData(updated);
    saveAppData(updated);
  };

  const handleDeleteProjectCategory = (name: string) => {
    const updated: AppData = {
      ...data,
      projectCategories: (data.projectCategories || []).filter((c) => c !== name),
    };
    setData(updated);
    saveAppData(updated);
  };

  // Réinitialisation complète : base vierge, l'assistant de configuration se relance
  const handleResetData = () => {
    const initial = getDefaultData();
    setData(initial);
    saveAppData(initial);
    setWelcomeDone(false);
  };

  const handleRestoreData = (restored: AppData) => {
    setData(restored);
    saveAppData(restored);
    setWelcomeDone(true);
  };

  const appCurrency = data.user.currency || 'FCFA';

  // Repères du calendrier : jours avec dépenses (rouge) et versements d'épargne (vert)
  const expenseDates = new Set<string>();
  Object.values(data.expenses).forEach((list) => list.forEach((e) => expenseDates.add(e.date)));
  const savingsDates = new Set<string>(data.savings.map((d) => d.date));

  const currentExpenses = data.expenses[selectedMonth] || [];
  const currentTotalExpenses = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const currentTotalSavings = data.savings.reduce((acc, curr) => acc + curr.amount, 0);
  const monthSalary = getMonthSalary(data, selectedMonth);
  const monthSavings = data.savings.filter((d) => d.date.startsWith(selectedMonth)).reduce((a, d) => a + d.amount, 0);
  const availableRatio = monthSalary > 0
    ? Math.max(0, Math.round((1 - (currentTotalExpenses + monthSavings) / monthSalary) * 100))
    : 0;

  return (
    <div className="relative min-h-screen bg-app text-fg flex flex-col selection:bg-brand selection:text-brand-fg">
      {/* Écran de verrouillage si activé */}
      {isLocked && data.security.isLockEnabled && (
        <LockScreen
          user={data.user}
          security={data.security}
          onUnlock={() => setIsLocked(false)}
          onUpdateSecurity={handleUpdateSecurity}
          onEraseEverything={() => {
            handleResetData();
            setIsLocked(false);
          }}
        />
      )}

      {/* En-tête de navigation : ordinateur uniquement (sur mobile, le tableau de bord a son propre en-tête et les autres écrans le calendrier) */}
      <div className="hidden md:block">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        user={data.user}
        security={data.security}
        onLockApp={() => setIsLocked(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        totalExpenses={currentTotalExpenses}
        totalSavings={currentTotalSavings}
      />
      </div>

      {/* Liseré fixe tout en haut : Safari en tire la couleur de sa barre d'état */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]"
        style={{ background: currentTab === 'settings' ? 'var(--app)' : 'var(--cal-bar)' }}
      />

      {/* Halo neutre derrière le calendrier */}
      {currentTab !== 'dashboard' && currentTab !== 'settings' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-fg/[0.08] via-fg/[0.03] to-transparent" />
      )}

      {/* Calendrier permanent : remplace l'en-tête sur tous les autres écrans */}
      {currentTab !== 'dashboard' && currentTab !== 'settings' && (
        <div className="sticky top-0 z-30 w-full md:max-w-3xl md:mx-auto">
          <WeekCalendarBar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            expenseDates={expenseDates}
            savingsDates={savingsDates}
            ringValue={availableRatio}
          />
        </div>
      )}

      {/* Emplacement de la barre profil du tableau de bord : même place et même structure que le calendrier */}
      {currentTab === 'dashboard' && <div id="top-bar-slot" className="sticky top-0 z-30 w-full md:max-w-3xl md:mx-auto" />}

      {/* Contenu principal (avec padding inférieur optimisé pour la barre mobile) */}
      <main className={`relative flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-[calc(env(safe-area-inset-bottom,0px)+112px)] md:pb-8 ${currentTab === 'settings' ? 'pt-[calc(env(safe-area-inset-top,0px)+16px)]' : ''}`}>
        {currentTab === 'dashboard' && (
          <Dashboard
            data={data}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onNavigateToTab={handleNavigateToTab}
            onOpenAddExpense={() => setIsExpenseModalOpen(true)}
            onOpenAddSavings={() => {
              setSavingsModalProjectId(undefined);
              setIsSavingsModalOpen(true);
            }}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesPage
            data={data}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onUpdateBaseBudget={handleUpdateBaseBudget}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onOpenAddModal={() => setIsExpenseModalOpen(true)}
            onValidateAllMonthExpenses={handleValidateAllMonthExpenses}
          />
        )}

        {currentTab === 'savings' && (
          <SavingsPage
            data={data}
            selectedMonth={selectedMonth}
            selectedDate={selectedDate}
            projectCategories={data.projectCategories || []}
            onAddProjectCategory={handleAddProjectCategory}
            setSelectedMonth={setSelectedMonth}
            onAddSavings={handleAddSavings}
            onDeleteSavings={handleDeleteSavings}
            onOpenAddModal={(projectId) => {
              setSavingsModalProjectId(projectId);
              setIsSavingsModalOpen(true);
            }}
            onAddSavingsProject={handleAddSavingsProject}
            onUpdateSavingsProject={handleUpdateSavingsProject}
            onDeleteSavingsProject={handleDeleteSavingsProject}
            onCloseSavingsProject={handleCloseSavingsProject}
            onContributeToSavingsProject={handleContributeToSavingsProject}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage
            data={data}
            selectedMonth={selectedMonth}
            initialSection={initialSettingsSection}
            onUpdateUser={handleUpdateUser}
            onUpdateSecurity={handleUpdateSecurity}
            onUpdateMonthSalary={handleUpdateMonthSalary}
            onResetData={handleResetData}
            onRestoreData={handleRestoreData}
            onAddProjectCategory={handleAddProjectCategory}
            onRenameProjectCategory={handleRenameProjectCategory}
            onDeleteProjectCategory={handleDeleteProjectCategory}
            onLockAppNow={() => {
              if (data.security.isLockEnabled) {
                setIsLocked(true);
              } else {
                alert('Veuillez activer le verrouillage et définir un mot de passe d\'abord.');
              }
            }}
            onAddPreset={handleAddExpensePreset}
            onUpdatePreset={handleUpdateExpensePreset}
            onDeletePreset={handleDeleteExpensePreset}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Barre de navigation basse pour smartphones (Style Workout App Dock) */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Modal Assistant de Connexion & Onboarding Setup */}
      {needsOnboarding && !welcomeDone && (
        <WelcomeScreen
          onStart={() => setWelcomeDone(true)}
          onRestore={handleRestoreData}
        />
      )}

      {(isOnboardingOpen || (needsOnboarding && welcomeDone)) && (
      <AuthOnboardingModal
        key={data.user.email || 'new'}
        isOpen
        required={needsOnboarding}
        onClose={() => setIsOnboardingOpen(false)}
        currentUser={data.user}
        currentSecurity={data.security}
        onComplete={(updatedUser, updatedSecurity) => {
          const updated: AppData = { ...data, user: updatedUser, security: updatedSecurity };
          setData(updated);
          saveAppData(updated);
          setIsOnboardingOpen(false);
        }}
      />
      )}

      {/* Modal Ajout Dépense avec sélection de modèles et popup d'enregistrement */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleAddExpense}
        selectedMonth={selectedMonth}
        currency={appCurrency}
        expensePresets={data.expensePresets || []}
        onAddPreset={handleAddExpensePreset}
      />

      {/* Modal Ajout Épargne avec choix versement mensuel ou projet non clôturé */}
      <SavingsModal
        isOpen={isSavingsModalOpen}
        onClose={() => setIsSavingsModalOpen(false)}
        onSave={handleAddSavings}
        selectedMonth={selectedMonth}
        currency={appCurrency}
        projects={data.savingsProjects || []}
        initialProjectId={savingsModalProjectId}
        onContributeToProject={handleContributeToSavingsProject}
        onOpenCreateProject={() => {
          setCurrentTab('savings');
        }}
      />

      {/* Footer épuré (masqué sur smartphone pour privilégier la bottom nav) */}
      <footer className="hidden md:block border-t border-line bg-app py-4 text-center text-xs text-fg-muted">
        <p>Mon Kanda • Gestion financière, dépenses & épargne</p>
      </footer>
    </div>
  );
}
