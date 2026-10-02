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
  getPreviousMonthKey 
} from '../utils/date';
import { SettingsSection } from './SettingsPage';
import { DEFAULT_AVATAR } from '../utils/avatars';
import { NotificationsModal } from './NotificationsModal';
import { CATEGORY_CONFIG } from './CategorySelect';
import { useCountUp } from '../hooks/useCountUp';

const WEEK_LABELS = ['S1', 'S2', 'S3', 'S4', 'S5'];

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

  // Dépenses réelles regroupées par semaine du mois (S1 = jours 1-7, ... S5 = 29+)
  const weekTotals = [0, 0, 0, 0, 0];
  currentExpenses.forEach((exp) => {
    const day = parseInt(exp.date.slice(8, 10), 10) || 1;
    weekTotals[Math.min(4, Math.floor((day - 1) / 7))] += exp.amount;
  });
  const maxWeek = Math.max(...weekTotals, 1);
  const peakWeek = weekTotals.indexOf(Math.max(...weekTotals));

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

  const heroValue = balanceView === 'balance' ? netRemaining : totalSavingsAccrued;
  const animatedHero = useCountUp(heroValue);

  return (
    <div className="space-y-6 pb-28 stagger max-w-4xl mx-auto">

      {/* ======================================================== */}
      {/* 1. EN-TÊTE POCKETPAL : AVATAR, GREETING & CLOCHE NOTIF   */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-4 px-1 pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full p-0.5 border border-line-strong bg-surface overflow-hidden flex items-center justify-center">
              <img
                src={avatarImage}
                alt={data.user.fullName || 'Profil'}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-app pulse-dot" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-black text-fg truncate tracking-tight">
              Bonjour, {data.user.username || data.user.firstName || data.user.fullName || 'vous'} !
            </h2>
            <span className="text-[11px] font-medium text-fg-muted block tracking-wide first-letter:uppercase">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNotificationsOpen(true)}
          className="relative w-11 h-11 rounded-full bg-surface border border-line flex items-center justify-center text-fg transition-all hover:border-line-strong cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-fg-2" />
        </button>
      </div>

      <h1 className="text-[34px] leading-[1.05] font-black tracking-tight text-fg px-1">
        Aperçu<br />financier
      </h1>

      {/* ======================================================== */}
      {/* HERO : SOLDE + ACTIVITÉ HEBDOMADAIRE (BARRES HACHURÉES)   */}
      {/* ======================================================== */}
      <div className="relative rounded-[28px] bg-surface border border-line p-5 sm:p-6 overflow-hidden select-none lift">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-fg-muted">
            {balanceView === 'balance' ? 'Solde du mois' : 'Épargne cumulée'}
          </span>
          <div className="p-0.5 rounded-full bg-surface-2 border border-line inline-flex items-center">
            {(['balance', 'wallet'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBalanceView(v)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                  balanceView === v ? 'bg-brand text-brand-fg' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {v === 'balance' ? 'Solde' : 'Épargne'}
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-fg tracking-tight mt-2 break-words tabular-nums">
          {formatCurrency(animatedHero, currency)}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            balanceView === 'balance' && !isPositiveNet
              ? 'text-rose-400 border-rose-400/30 bg-rose-400/10'
              : 'text-success border-success/30 bg-success/10'
          }`}>
            {balanceView === 'balance'
              ? (isPositiveNet ? `${100 - usedRatio}% disponible` : 'Déficit')
              : `${data.savings.length} versement${data.savings.length > 1 ? 's' : ''}`}
          </span>
          <span className="text-[11px] text-fg-muted">{formatMonthKey(selectedMonth)}</span>
        </div>

        {/* Barres hachurées : dépenses par semaine */}
        <div className="mt-5 pt-7 flex items-end justify-between gap-2.5 h-40">
          {weekTotals.map((amount, i) => {
            const isPeak = i === peakWeek && amount > 0;
            const h = amount > 0 ? Math.max(14, Math.round((amount / maxWeek) * 100)) : 6;
            return (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5">
                <div className="relative w-full flex-1 flex items-end">
                  <div
                    className={`grow-up w-full rounded-2xl border ${
                      isPeak ? 'bg-brand border-brand' : 'hatch bg-surface-2 border-line-strong'
                    }`}
                    style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                  >
                    {amount > 0 && (
                      <span className={`absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        isPeak ? 'bg-brand text-brand-fg border-brand' : 'bg-surface-solid text-fg-2 border-line-strong'
                      }`}>
                        {formatCompact(amount)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-fg-muted">{WEEK_LABELS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BOUTONS D'ACTIONS RAPIDES : DÉPENSES, ÉPARGNE, PROJETS */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-3xl p-4 sm:p-6 border border-line shadow-xl">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          
          {/* Action 1 : DÉPENSES (DEMANDÉ) */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="flex flex-col items-center gap-2 group cursor-pointer"
            title="Ajouter une dépense"
          >
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-surface-2 border border-line-strong group-hover:border-brand group-hover:bg-surface-3 text-brand flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center border border-brand/30">
                <ArrowUpRight className="w-4 h-4 stroke-[2.8]" />
              </div>
            </div>
            <span className="text-xs font-bold text-fg-2 group-hover:text-fg transition-colors text-center">
              Dépenses
            </span>
          </button>

          {/* Action 2 : ÉPARGNE (DEMANDÉ) */}
          <button
            type="button"
            onClick={onOpenAddSavings}
            className="flex flex-col items-center gap-2 group cursor-pointer"
            title="Créer une épargne / Versement"
          >
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-surface-2 border border-line-strong group-hover:border-brand group-hover:bg-surface-3 text-brand flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center border border-brand/30">
                <ArrowDownLeft className="w-4 h-4 stroke-[2.8]" />
              </div>
            </div>
            <span className="text-xs font-bold text-fg-2 group-hover:text-fg transition-colors text-center">
              Épargne
            </span>
          </button>

          {/* Action 3 : PROJETS (DEMANDÉ) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('savings')}
            className="flex flex-col items-center gap-2 group cursor-pointer"
            title="Voir et créer des projets d'épargne"
          >
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-surface-2 border border-line-strong group-hover:border-brand group-hover:bg-surface-3 text-brand flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center border border-brand/30">
                <Target className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <span className="text-xs font-bold text-fg-2 group-hover:text-fg transition-colors text-center">
              Projets
            </span>
          </button>

          {/* Action 4 : HISTORIQUE / PLUS (COMPLÉMENT POCKETPAL) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('expenses')}
            className="flex flex-col items-center gap-2 group cursor-pointer"
            title="Historique complet des opérations"
          >
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-surface-2 border border-line-strong group-hover:border-fg/40 group-hover:bg-surface-3 text-fg-2 group-hover:text-fg flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-fg/5 flex items-center justify-center border border-fg/10">
                <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <span className="text-xs font-bold text-fg-2 group-hover:text-fg transition-colors text-center">
              Historique
            </span>
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. HISTORIQUE DES TRANSACTIONS (STYLE SHEET POCKETPAL)    */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line shadow-xl space-y-4">
        
        {/* Poignée de feuille élégante (Pull indicator bar) */}
        <div className="w-10 h-1 bg-surface-3 rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h3 className="text-base sm:text-lg font-black text-fg tracking-tight">
            Transaction history
          </h3>
          <button
            type="button"
            onClick={() => onNavigateToTab('expenses')}
            className="text-xs font-extrabold text-brand hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-fg-muted text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-fg-muted" />
            <p>Aucune transaction enregistrée pour {formatMonthKey(selectedMonth)}.</p>
            <button
              onClick={onOpenAddExpense}
              className="mt-3 px-4 py-1.5 rounded-full bg-brand text-brand-fg text-xs font-extrabold cursor-pointer"
            >
              + Ajouter une première dépense
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              const config = CATEGORY_CONFIG[tx.category] || {
                label: tx.category,
                color: 'text-fg-2',
                bg: 'bg-surface-3 border-line-strong',
                icon: Receipt,
              };
              const IconComponent = isExpense ? config.icon : PiggyBank;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface-2 hover:bg-surface-2 border border-line-strong transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isExpense ? config.bg : 'bg-brand/15 border-brand/30'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${isExpense ? config.color : 'text-brand'}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-fg truncate">
                        {tx.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-fg-muted mt-0.5">
                        <span>{formatDateFr(tx.date)}</span>
                        <span>•</span>
                        <span className="font-medium text-fg-2">{tx.category}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs sm:text-sm font-black whitespace-nowrap ${
                    isExpense ? 'text-rose-400' : 'text-brand'
                  }`}>
                    {isExpense ? '-' : '+'}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. 3 CARTES DE MÉTRIQUES RÉELLES FINTECH DU MOIS         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface rounded-2xl p-4 border border-line">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-fg-muted uppercase">Salaire perçu</span>
            <span className="w-2 h-2 rounded-full bg-brand" />
          </div>
          <span className="text-lg sm:text-xl font-black text-fg tracking-tight mt-1.5 block">
            +{formatCurrency(salaryReceived, currency)}
          </span>
        </div>

        <div 
          onClick={() => onNavigateToTab('expenses')}
          className="bg-surface rounded-2xl p-4 border border-line hover:border-rose-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-fg-muted uppercase">Dépenses ce mois</span>
            <span className="text-[10px] text-rose-400 font-bold">Détails</span>
          </div>
          <span className="text-lg sm:text-xl font-black text-rose-400 tracking-tight mt-1.5 block">
            -{formatCurrency(currentTotalExpenses, currency)}
          </span>
        </div>

        <div 
          onClick={() => onNavigateToTab('savings')}
          className="bg-surface rounded-2xl p-4 border border-line hover:border-brand/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-fg-muted uppercase">Épargne ce mois</span>
            <span className="text-[10px] text-brand font-bold">Détails</span>
          </div>
          <span className="text-lg sm:text-xl font-black text-brand tracking-tight mt-1.5 block">
            -{formatCurrency(currentMonthSavings, currency)}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. SECTION DUO : DÉPENSES DU MOIS PRÉCÉDENT & CUMUL       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* VUE 1 : DÉPENSES DU MOIS PRÉCÉDENT */}
        <div className="bg-surface rounded-3xl p-5 sm:p-6 shadow-sm border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-line">
              <div>
                <span className="text-xs font-semibold text-fg-muted block uppercase tracking-wider">
                  Mois précédent : {formatMonthKey(prevMonthKey)}
                </span>
                <h3 className="text-lg font-extrabold text-fg mt-0.5">
                  Dépenses antérieures
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-2 text-fg-2 border border-line">
                {prevExpenses.length} transactions
              </span>
            </div>

            <div className="my-5 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-fg">
                  {formatCurrency(prevTotalExpenses, currency)}
                </span>
                <span className="text-xs text-fg-muted block mt-0.5">
                  Total consommé le mois dernier
                </span>
              </div>

              {prevTotalExpenses > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  expenseDiff > 0
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-brand/10 text-brand border-brand/30'
                }`}>
                  <TrendingUp className={`w-3.5 h-3.5 ${expenseDiff > 0 ? '' : 'rotate-180'}`} />
                  <span>
                    {expenseDiff > 0 ? `+${expenseDiffPercent}%` : `${expenseDiffPercent}%`} vs ce mois
                  </span>
                </div>
              )}
            </div>

            {/* Top 3 dépenses du mois précédent */}
            <div className="space-y-2 mt-4">
              <span className="text-xs font-bold text-fg-muted uppercase tracking-wider block">
                Principales dépenses d'août
              </span>
              {prevExpenses.slice(0, 3).map((exp) => (
                <div 
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-surface border border-line"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                    <span className="text-xs font-semibold text-fg truncate">
                      {exp.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-fg-2 whitespace-nowrap">
                    {formatCurrency(exp.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setSelectedMonth(prevMonthKey)}
            className="mt-5 w-full py-2.5 rounded-full bg-surface-2 hover:bg-surface-2 text-fg-2 hover:text-fg border border-line text-xs font-bold transition-all text-center cursor-pointer"
          >
            Consulter {formatMonthKey(prevMonthKey)}
          </button>
        </div>

        {/* VUE 2 : TOTAL GLOBAL ÉPARGNE */}
        <div className="bg-surface rounded-3xl p-5 sm:p-6 shadow-sm border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-line">
              <div>
                <span className="text-xs font-semibold text-fg-muted block uppercase tracking-wider">
                  Trésorerie & Sécurité
                </span>
                <h3 className="text-lg font-extrabold text-fg mt-0.5">
                  Épargne totale cumulée
                </h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-brand">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>

            <div className="my-5">
              <span className="text-3xl sm:text-4xl font-black text-brand tracking-tight">
                {formatCurrency(totalSavingsAccrued, currency)}
              </span>
              <span className="text-xs text-fg-muted block mt-1">
                Fonds total disponible mis de côté
              </span>
            </div>

            {/* Statistiques d'épargne du mois */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl bg-surface border border-line">
                <span className="text-[11px] font-semibold text-fg-muted block">
                  Versé en {formatMonthKey(selectedMonth)}
                </span>
                <span className="text-base font-extrabold text-fg mt-1 block">
                  {formatCurrency(currentMonthSavings, currency)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-line">
                <span className="text-[11px] font-semibold text-fg-muted block">
                  Taux d'effort épargne
                </span>
                <span className="text-base font-extrabold text-brand mt-1 block">
                  {savingsRate}% du salaire
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => onNavigateToTab('savings')}
              className="flex-1 py-2.5 rounded-full bg-surface-2 hover:bg-surface-2 text-fg-2 hover:text-fg border border-line text-xs font-bold transition-all text-center cursor-pointer"
            >
              Voir historique versements
            </button>
            <button
              onClick={onOpenAddSavings}
              className="px-4 py-2.5 rounded-full bg-brand text-brand-fg font-extrabold text-xs hover:bg-brand-hover transition-all cursor-pointer"
            >
              + Épargner
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 8. RÉPARTITION PAR CATÉGORIE & ACTIVITÉ JOURNALIÈRE       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Catégories de dépenses */}
        <div className="lg:col-span-2 bg-surface rounded-3xl p-5 sm:p-6 border border-line">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
            <h3 className="font-extrabold text-base text-fg">
              Répartition des dépenses
            </h3>
            <span className="text-xs text-fg-muted font-semibold">
              Ce mois
            </span>
          </div>

          {categoriesSorted.length === 0 ? (
            <div className="text-center py-10 text-fg-muted text-xs">
              Aucune dépense enregistrée pour le mois de {formatMonthKey(selectedMonth)}.
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoriesSorted.map(([category, amount]) => {
                const percentage = currentTotalExpenses > 0 
                  ? Math.round((amount / currentTotalExpenses) * 100) 
                  : 0;

                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-fg">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-fg">{formatCurrency(amount, currency)}</span>
                        <span className="text-fg-muted font-semibold w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-fg-muted to-brand h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
