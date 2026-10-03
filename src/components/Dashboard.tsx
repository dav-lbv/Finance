import React, { useState } from 'react';
import { 
  PiggyBank, 
  Receipt, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Plus,
  ChevronRight, 
  Sparkles,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  LayoutGrid,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import { AppData, ExpenseCategory } from '../types';
import { 
  formatCurrency, 
  formatDateFr, 
  formatMonthKey, 
  getPreviousMonthKey,
  getNextMonthKey
} from '../utils/date';
import { SettingsSection } from './SettingsPage';
import { DEFAULT_AVATAR } from '../utils/avatars';
import { NotificationsModal } from './NotificationsModal';
import { CATEGORY_CONFIG } from './CategorySelect';
import { useCountUp } from '../hooks/useCountUp';
import { CategoryDonutCard, SalaryDonutCard, TrendBarsCard, TrendPoint } from './DashboardCharts';

const SHORT_MONTHS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

interface DashboardProps {
  data: AppData;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onNavigateToTab: (tab: 'expenses' | 'savings' | 'settings', section?: SettingsSection) => void;
  onOpenAddExpense: () => void;
  onOpenAddSavings: () => void;
  onOpenOnboarding?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  selectedMonth,
  setSelectedMonth,
  onNavigateToTab,
  onOpenAddExpense,
  onOpenAddSavings,
  onOpenOnboarding,
}) => {
  const currency = data.user.currency || 'FCFA';
  const prevMonthKey = getPreviousMonthKey(selectedMonth);
  const avatarImage = data.user.avatarUrl || DEFAULT_AVATAR;

  const [balanceView, setBalanceView] = useState<'balance' | 'wallet'>('balance');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Dépenses du mois sélectionné
  const currentExpenses = data.expenses[selectedMonth] || [];
  const currentTotalExpenses = currentExpenses.reduce((sum, item) => sum + item.amount, 0);

  // Dépenses du mois précédent
  const prevExpenses = data.expenses[prevMonthKey] || [];
  const prevTotalExpenses = prevExpenses.reduce((sum, item) => sum + item.amount, 0);

  // Budget et Salaire perçu du mois
  const salaryReceived = data.monthlyBudgets[selectedMonth]?.salaryReceived ?? data.user.defaultSalary ?? 0;

  // Calculs Épargne
  const totalSavingsAccrued = data.savings.reduce((acc, curr) => acc + curr.amount, 0);
  const currentMonthSavings = data.savings
    .filter(s => s.date.startsWith(selectedMonth))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const savingsRate = salaryReceived > 0 ? Math.round((currentMonthSavings / salaryReceived) * 100) : 0;

  // Vrai calcul du solde restant net
  const netRemaining = salaryReceived - currentTotalExpenses - currentMonthSavings;
  const isPositiveNet = netRemaining >= 0;
  const usedRatio = salaryReceived > 0 ? Math.min(100, Math.round(((currentTotalExpenses + currentMonthSavings) / salaryReceived) * 100)) : 0;

  // Comparaison Dépenses Mois Précédent vs Mois Actuel
  const expenseDiff = currentTotalExpenses - prevTotalExpenses;
  const expenseDiffPercent = prevTotalExpenses > 0 
    ? Math.round(((currentTotalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100)
    : 0;

  // Répartition par catégorie
  const categoryTotals: Record<string, number> = {};
  currentExpenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const categoriesSorted = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a);

  // 5 Dernières transactions réelles (dépenses + épargnes)
  const recentTransactions = [
    ...currentExpenses.map(exp => ({
      id: exp.id,
      type: 'expense' as const,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
    })),
    ...data.savings
      .filter(s => s.date.startsWith(selectedMonth))
      .map(sav => ({
        id: sav.id,
        type: 'savings' as const,
        title: sav.note || 'Versement épargne',
        category: 'Autre' as ExpenseCategory,
        amount: sav.amount,
        date: sav.date,
      }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Dépenses réelles par jour de la semaine (Lun → Dim)
  const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  currentExpenses.forEach((exp) => {
    const jsDay = new Date(`${exp.date}T00:00:00`).getDay(); // 0 = dimanche
    weekdayTotals[(jsDay + 6) % 7] += exp.amount;
  });
  const maxWeekday = Math.max(...weekdayTotals, 1);
  const weekdays = WEEKDAY_LABELS.map((label, i) => ({
    label,
    amount: weekdayTotals[i],
    height: weekdayTotals[i] > 0 ? Math.max(8, Math.round((weekdayTotals[i] / maxWeekday) * 100)) : 4,
  }));
  const peakWeekday = weekdayTotals.indexOf(Math.max(...weekdayTotals));

  // 6 derniers mois (jusqu'au mois affiché) : dépenses et épargne réelles
  const trendPoints: TrendPoint[] = (() => {
    const keys: string[] = [];
    let key = selectedMonth;
    for (let i = 0; i < 6; i++) {
      keys.unshift(key);
      key = getPreviousMonthKey(key);
    }
    return keys.map((monthKey) => ({
      monthKey,
      label: `${SHORT_MONTHS[parseInt(monthKey.slice(5, 7), 10) - 1]} ${monthKey.slice(2, 4)}`,
      expenses: (data.expenses[monthKey] || []).reduce((sum, e) => sum + e.amount, 0),
      savings: data.savings.filter((d) => d.date.startsWith(monthKey)).reduce((sum, d) => sum + d.amount, 0),
    }));
  })();

  const heroValue = balanceView === 'balance' ? currentTotalExpenses : totalSavingsAccrued;
  const animatedHero = useCountUp(heroValue);

  const activeProjects = (data.savingsProjects || []).filter((p) => !p.isClosed);
  const featuredProject = activeProjects[0];
  const featuredPct = featuredProject && featuredProject.targetAmount > 0
    ? Math.min(100, Math.round((featuredProject.currentAmount / featuredProject.targetAmount) * 100))
    : 0;

  const quickActions = [
    { label: 'Dépense', icon: ArrowUpRight, onClick: onOpenAddExpense },
    { label: 'Épargne', icon: ArrowDownLeft, onClick: onOpenAddSavings },
    { label: 'Projets', icon: Target, onClick: () => onNavigateToTab('savings') },
    { label: 'Plus', icon: LayoutGrid, onClick: () => onNavigateToTab('expenses') },
  ];

  return (
    <div className="pb-28 max-w-4xl mx-auto stagger">

      {/* ======================================================== */}
      {/* HÉROS : en-tête, solde, actions rapides (pleine largeur)  */}
      {/* ======================================================== */}
      <div className="relative -mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8 px-5 sm:px-8 pt-[calc(env(safe-area-inset-top,0px)+18px)] pb-7 rounded-b-[36px] border-b border-line-strong overflow-hidden bg-gradient-to-b from-success/25 via-surface-2 to-surface">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-64 rounded-full bg-success/20 blur-3xl pointer-events-none" />

        {/* Ligne du haut : avatar + bienvenue, cloche */}
        <div className="relative flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigateToTab('settings')}
            className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
            aria-label="Ouvrir mon profil"
          >
            <span className="relative shrink-0">
              <img
                src={avatarImage}
                alt={data.user.fullName || 'Profil'}
                className="w-11 h-11 rounded-full object-cover border border-line-strong"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-app pulse-dot" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[11px] text-fg-muted">Bon retour</span>
              <span className="block text-sm font-extrabold text-fg truncate">
                {data.user.username || data.user.firstName || data.user.fullName || 'vous'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="w-11 h-11 rounded-full bg-surface-2 border border-line-strong flex items-center justify-center text-fg-2 cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Solde */}
        <div className="relative mt-6 text-center">
          <div className="inline-flex p-0.5 rounded-full bg-surface-2 border border-line">
            {(['balance', 'wallet'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBalanceView(v)}
                className={`px-3.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                  balanceView === v ? 'bg-brand text-brand-fg' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {v === 'balance' ? 'Dépense du mois' : 'Épargne cumulée'}
              </button>
            ))}
          </div>

          <h1 className="mt-3 text-[40px] sm:text-5xl leading-none font-black text-fg tracking-tight tabular-nums break-words">
            {formatCurrency(animatedHero, currency)}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-2 border border-line pl-1 pr-1 py-0.5">
              <button
                type="button"
                onClick={() => setSelectedMonth(getPreviousMonthKey(selectedMonth))}
                className="p-2.5 rounded-full text-fg-muted hover:text-fg cursor-pointer"
                aria-label="Mois précédent"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
              <span className="px-1 text-[11px] font-bold text-fg capitalize">{formatMonthKey(selectedMonth)}</span>
              <button
                type="button"
                onClick={() => setSelectedMonth(getNextMonthKey(selectedMonth))}
                className="p-2.5 rounded-full text-fg-muted hover:text-fg cursor-pointer"
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        </div>

        {/* Actions rapides rondes */}
        <div className="relative mt-7 grid grid-cols-4 gap-2">
          {quickActions.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <span className="w-14 h-14 rounded-full bg-surface-2 border border-line-strong flex items-center justify-center text-fg shadow-[inset_0_1px_0_var(--glass-edge)] group-hover:bg-surface-3 transition-colors">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-fg-2">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 pt-5">
        {/* Carte promo : projet d'épargne en cours */}
        {featuredProject ? (
          <div className="relative rounded-3xl bg-surface border border-line p-4 overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-success/15 blur-2xl pointer-events-none" />
            <div className="relative">
              <p className="text-sm font-extrabold text-fg">Projet en cours</p>
              <p className="text-[11px] text-fg-muted truncate">{featuredProject.title}</p>
              <div className="mt-3 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${featuredPct}%` }} />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-fg-muted tabular-nums">
                  {formatCurrency(featuredProject.currentAmount, currency)} / {formatCurrency(featuredProject.targetAmount, currency)} • {featuredPct}%
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('savings')}
                  className="px-4 py-1.5 rounded-full bg-brand text-brand-fg text-[11px] font-black cursor-pointer"
                >
                  Voir
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Transactions */}
        <div className="rounded-3xl bg-surface border border-line overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h3 className="text-base font-extrabold text-fg tracking-tight">Transactions</h3>
            <button
              type="button"
              onClick={() => onNavigateToTab('expenses')}
              className="text-[11px] font-semibold text-fg-muted hover:text-fg cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center px-4 pb-8 pt-2 text-fg-muted text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Aucune transaction pour {formatMonthKey(selectedMonth)}.</p>
              <button
                onClick={onOpenAddExpense}
                className="mt-3 px-4 py-1.5 rounded-full bg-brand text-brand-fg text-xs font-extrabold cursor-pointer"
              >
                + Ajouter une première dépense
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recentTransactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                const config = CATEGORY_CONFIG[tx.category];
                const IconComponent = isExpense ? (config?.icon || Receipt) : PiggyBank;
                return (
                  <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-full bg-surface-2 border border-line-strong flex items-center justify-center shrink-0 text-fg-2">
                        <IconComponent className="w-[18px] h-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-fg truncate">{tx.title}</p>
                        <p className="text-[11px] text-fg-muted truncate">
                          {isExpense ? tx.category : 'Épargne'} • {formatDateFr(tx.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-black whitespace-nowrap tabular-nums ${isExpense ? 'text-fg' : 'text-success'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(tx.amount, currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      {/* ======================================================== */}
      {/* DIAGRAMMES : répartition du salaire, catégories, évolution */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SalaryDonutCard
          salary={salaryReceived}
          expenses={currentTotalExpenses}
          savings={currentMonthSavings}
          currency={currency}
          monthLabel={formatMonthKey(selectedMonth)}
        />
        <CategoryDonutCard
          totals={categoriesSorted}
          currency={currency}
          monthLabel={formatMonthKey(selectedMonth)}
        />
      </div>

      <TrendBarsCard points={trendPoints} selectedMonth={selectedMonth} currency={currency} />

      {/* Activité journalière */}
      <div className="grid grid-cols-1 gap-5">

        {/* Bar chart fintech style mobile card */}
        <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                Flux hebdomadaire
              </span>
              <span className="w-2 h-2 rounded-full bg-brand"></span>
            </div>
            <h4 className="text-base font-extrabold text-fg">
              Activité des dépenses
            </h4>
            <p className="text-xs text-fg-muted mt-1">
              Répartition de vos dépenses par jour de la semaine
            </p>

            <div className="flex items-end justify-between gap-2 h-40 pt-8 px-1">
              {weekdays.map((item, idx) => {
                const isPeak = idx === peakWeekday && item.amount > 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="relative w-full max-w-[26px] flex-1 flex items-end group">
                      <div
                        className={`grow-up w-full rounded-xl border ${
                          isPeak ? 'bg-brand border-brand' : 'hatch bg-surface-2 border-line-strong'
                        }`}
                        style={{ height: `${item.height}%`, animationDelay: `${idx * 70}ms` }}
                      >
                        {item.amount > 0 && (
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-brand text-brand-fg px-1.5 py-0.5 rounded-full text-[10px] font-bold pointer-events-none transition-opacity whitespace-nowrap">
                            {formatCompact(item.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${isPeak ? 'text-fg' : 'text-fg-muted'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-fg-muted font-medium">
            <span>Jour le plus chargé :</span>
            <span className="text-fg font-bold">
              {currentTotalExpenses > 0
                ? `${['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][peakWeekday]} • ${Math.round((weekdayTotals[peakWeekday] / currentTotalExpenses) * 100)}% du total`
                : 'Aucune dépense'}
            </span>
          </div>
        </div>

      </div>

      </div>

      {/* Modal des notifications */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        selectedMonth={selectedMonth}
        totalExpenses={currentTotalExpenses}
        totalSavings={currentMonthSavings}
        currency={currency}
      />

    </div>
  );
};
