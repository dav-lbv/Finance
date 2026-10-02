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
  const salaryReceived = data.monthlyBudgets[selectedMonth]?.salaryReceived ?? data.user.defaultSalary ?? 750000;

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

  // Données pour le bar chart style fintech mobile
  const weekdays = [
    { label: 'Lun', height: 45 },
    { label: 'Mar', height: 75 },
    { label: 'Mer', height: 35 },
    { label: 'Jeu', height: 90 },
    { label: 'Ven', height: 60 },
    { label: 'Sam', height: 80 },
    { label: 'Dim', height: 30 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">

      {/* ======================================================== */}
      {/* 1. EN-TÊTE POCKETPAL : AVATAR, GREETING & CLOCHE NOTIF   */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-4 px-1 pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full p-0.5 border-2 border-white/80 bg-white/10 shadow-md overflow-hidden flex items-center justify-center">
              <img
                src={avatarImage}
                alt={data.user.fullName || 'Profil'}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0e120f]" />
          </div>

          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 block tracking-wide">
              Welcome,
            </span>
            <h2 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
              {data.user.fullName || 'John Doe'}
            </h2>
          </div>
        </div>

        {/* Cloche de notifications avec badge rouge (style PocketPal) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative w-11 h-11 rounded-full bg-[#18201a] border border-[#27382a] hover:border-[#ccff00]/50 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-200" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF4D00] text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0e120f] shadow-sm">
              3
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PILL TAB SWITCHER : BALANCE VS WALLET (POCKETPAL)    */}
      {/* ======================================================== */}
      <div className="flex justify-center pt-1">
        <div className="p-1 rounded-full bg-[#161d17] border border-[#26372a] inline-flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setBalanceView('balance')}
            className={`px-6 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              balanceView === 'balance'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Balance
          </button>
          <button
            type="button"
            onClick={() => setBalanceView('wallet')}
            className={`px-6 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              balanceView === 'wallet'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Wallet
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. HERO CAPSULE CARD POCKETPAL (MINT/NEON VERT OU ORANGE) */}
      {/* ======================================================== */}
      <div className="relative rounded-[32px] p-6 sm:p-8 bg-[#ccff00] text-black shadow-[0_20px_50px_rgba(204,255,0,0.35)] overflow-hidden select-none transition-all">
        
        {/* Lignes graphiques décoratives en filigrane (Watermark Guilloche PocketPal) */}
        <svg 
          className="absolute -right-8 -top-8 w-56 h-56 text-black/10 pointer-events-none" 
          viewBox="0 0 200 200" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
        >
          <path d="M 0,100 C 50,0 150,0 200,100 C 150,200 50,200 0,100 Z" />
          <path d="M 20,100 C 60,20 140,20 180,100 C 140,180 60,180 20,100 Z" />
          <path d="M 40,100 C 70,40 130,40 160,100 C 130,160 70,160 40,100 Z" />
          <circle cx="100" cy="100" r="90" strokeDasharray="3 3" />
        </svg>

        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-black/75">
            {balanceView === 'balance' ? 'Total balance' : 'Total wallet & épargne'}
          </span>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tight my-2 drop-shadow-xs break-words max-w-full">
            {balanceView === 'balance'
              ? formatCurrency(netRemaining, currency)
              : formatCurrency(totalSavingsAccrued, currency)
            }
          </h1>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 text-black text-xs font-black mt-1">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span>
              {balanceView === 'balance'
                ? `${formatMonthKey(selectedMonth)} • ${isPositiveNet ? `${100 - usedRatio}% disponible` : 'Déficit'}`
                : `${data.savings.length} versements enregistrés`
              }
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BOUTONS D'ACTIONS RAPIDES : DÉPENSES, ÉPARGNE, PROJETS */}
      {/* ======================================================== */}
      <div className="bg-[#121713] rounded-3xl p-4 sm:p-6 border border-[#232f26] shadow-xl">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          
          {/* Action 1 : DÉPENSES (DEMANDÉ) */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="flex flex-col items-center gap-2 group cursor-pointer"
            title="Ajouter une dépense"
          >
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#18201a] border border-[#2a3a2d] group-hover:border-[#ccff00] group-hover:bg-[#1f2b22] text-[#ccff00] flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-[#ccff00]/15 flex items-center justify-center border border-[#ccff00]/30">
                <ArrowUpRight className="w-4 h-4 stroke-[2.8]" />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">
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
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#18201a] border border-[#2a3a2d] group-hover:border-[#ccff00] group-hover:bg-[#1f2b22] text-[#ccff00] flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-[#ccff00]/15 flex items-center justify-center border border-[#ccff00]/30">
                <ArrowDownLeft className="w-4 h-4 stroke-[2.8]" />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">
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
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#18201a] border border-[#2a3a2d] group-hover:border-[#ccff00] group-hover:bg-[#1f2b22] text-[#ccff00] flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-[#ccff00]/15 flex items-center justify-center border border-[#ccff00]/30">
                <Target className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">
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
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#18201a] border border-[#2a3a2d] group-hover:border-white/40 group-hover:bg-[#1f2b22] text-slate-300 group-hover:text-white flex items-center justify-center transition-all duration-150 shadow-md group-hover:scale-105 active:scale-95">
              <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">
              Historique
            </span>
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. HISTORIQUE DES TRANSACTIONS (STYLE SHEET POCKETPAL)    */}
      {/* ======================================================== */}
      <div className="bg-[#121613] rounded-3xl p-5 sm:p-6 border border-[#232f26] shadow-xl space-y-4">
        
        {/* Poignée de feuille élégante (Pull indicator bar) */}
        <div className="w-10 h-1 bg-[#253328] rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex items-center justify-between pb-3 border-b border-[#1f2b22]">
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            Transaction history
          </h3>
          <button
            type="button"
            onClick={() => onNavigateToTab('expenses')}
            className="text-xs font-extrabold text-[#ccff00] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>Aucune transaction enregistrée pour {formatMonthKey(selectedMonth)}.</p>
            <button
              onClick={onOpenAddExpense}
              className="mt-3 px-4 py-1.5 rounded-full bg-[#ccff00] text-black text-xs font-extrabold cursor-pointer"
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
                color: 'text-slate-300',
                bg: 'bg-slate-800 border-slate-700',
                icon: Receipt,
              };
              const IconComponent = isExpense ? config.icon : PiggyBank;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#161c17] hover:bg-[#1b231d] border border-[#243327] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isExpense ? config.bg : 'bg-[#ccff00]/15 border-[#ccff00]/30'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${isExpense ? config.color : 'text-[#ccff00]'}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {tx.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatDateFr(tx.date)}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-300">{tx.category}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs sm:text-sm font-black whitespace-nowrap ${
                    isExpense ? 'text-rose-400' : 'text-[#ccff00]'
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
        <div className="bg-[#121613] rounded-2xl p-4 border border-[#232f26]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Salaire perçu</span>
            <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
          </div>
          <span className="text-lg sm:text-xl font-black text-white tracking-tight mt-1.5 block">
            +{formatCurrency(salaryReceived, currency)}
          </span>
        </div>

        <div 
          onClick={() => onNavigateToTab('expenses')}
          className="bg-[#121613] rounded-2xl p-4 border border-[#232f26] hover:border-rose-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Dépenses ce mois</span>
            <span className="text-[10px] text-rose-400 font-bold">Détails</span>
          </div>
          <span className="text-lg sm:text-xl font-black text-rose-400 tracking-tight mt-1.5 block">
            -{formatCurrency(currentTotalExpenses, currency)}
          </span>
        </div>

        <div 
          onClick={() => onNavigateToTab('savings')}
          className="bg-[#121613] rounded-2xl p-4 border border-[#232f26] hover:border-[#ccff00]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Épargne ce mois</span>
            <span className="text-[10px] text-[#ccff00] font-bold">Détails</span>
          </div>
          <span className="text-lg sm:text-xl font-black text-[#ccff00] tracking-tight mt-1.5 block">
            -{formatCurrency(currentMonthSavings, currency)}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. SECTION DUO : DÉPENSES DU MOIS PRÉCÉDENT & CUMUL       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* VUE 1 : DÉPENSES DU MOIS PRÉCÉDENT */}
        <div className="bg-[#111512] rounded-3xl p-5 sm:p-6 shadow-sm border border-[#1f2821] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1b221d]">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Mois précédent : {formatMonthKey(prevMonthKey)}
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Dépenses antérieures
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#172019] text-slate-300 border border-[#222e24]">
                {prevExpenses.length} transactions
              </span>
            </div>

            <div className="my-5 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {formatCurrency(prevTotalExpenses, currency)}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Total consommé le mois dernier
                </span>
              </div>

              {prevTotalExpenses > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  expenseDiff > 0
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/30'
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
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Principales dépenses d'août
              </span>
              {prevExpenses.slice(0, 3).map((exp) => (
                <div 
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#141a15] border border-[#1d271f]"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div className="w-2 h-2 rounded-full bg-[#ccff00] shrink-0" />
                    <span className="text-xs font-semibold text-white truncate">
                      {exp.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                    {formatCurrency(exp.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setSelectedMonth(prevMonthKey)}
            className="mt-5 w-full py-2.5 rounded-full bg-[#161d17] hover:bg-[#1d271e] text-slate-300 hover:text-white border border-[#222e24] text-xs font-bold transition-all text-center cursor-pointer"
          >
            Consulter {formatMonthKey(prevMonthKey)}
          </button>
        </div>

        {/* VUE 2 : TOTAL GLOBAL ÉPARGNE */}
        <div className="bg-[#111512] rounded-3xl p-5 sm:p-6 shadow-sm border border-[#1f2821] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1b221d]">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Trésorerie & Sécurité
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Épargne totale cumulée
                </h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#ccff00]/15 flex items-center justify-center text-[#ccff00]">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>

            <div className="my-5">
              <span className="text-3xl sm:text-4xl font-black text-[#ccff00] tracking-tight">
                {formatCurrency(totalSavingsAccrued, currency)}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                Fonds total disponible mis de côté
              </span>
            </div>

            {/* Statistiques d'épargne du mois */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl bg-[#141a15] border border-[#1d271f]">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Versé en {formatMonthKey(selectedMonth)}
                </span>
                <span className="text-base font-extrabold text-white mt-1 block">
                  {formatCurrency(currentMonthSavings, currency)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#141a15] border border-[#1d271f]">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Taux d'effort épargne
                </span>
                <span className="text-base font-extrabold text-[#ccff00] mt-1 block">
                  {savingsRate}% du salaire
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => onNavigateToTab('savings')}
              className="flex-1 py-2.5 rounded-full bg-[#161d17] hover:bg-[#1d271e] text-slate-300 hover:text-white border border-[#222e24] text-xs font-bold transition-all text-center cursor-pointer"
            >
              Voir historique versements
            </button>
            <button
              onClick={onOpenAddSavings}
              className="px-4 py-2.5 rounded-full bg-[#ccff00] text-black font-extrabold text-xs hover:bg-[#d9ff33] transition-all cursor-pointer"
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
        <div className="lg:col-span-2 bg-[#111512] rounded-3xl p-5 sm:p-6 border border-[#1f2821]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1b221d]">
            <h3 className="font-extrabold text-base text-white">
              Répartition des dépenses
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Ce mois
            </span>
          </div>

          {categoriesSorted.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
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
                      <span className="font-bold text-white">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white">{formatCurrency(amount, currency)}</span>
                        <span className="text-slate-400 font-semibold w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#18201a] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#ccff00] to-[#10b981] h-full rounded-full transition-all duration-300"
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
        <div className="bg-[#111512] rounded-3xl p-5 sm:p-6 border border-[#1f2821] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Flux hebdomadaire
              </span>
              <span className="w-2 h-2 rounded-full bg-[#ccff00]"></span>
            </div>
            <h4 className="text-base font-extrabold text-white">
              Activité des dépenses
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Estimation d'intensité journalière sur 7 jours
            </p>

            <div className="flex items-end justify-between gap-2 h-40 pt-6 px-2">
              {weekdays.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div 
                    className="w-full max-w-[22px] rounded-t-lg transition-all duration-300 relative group cursor-pointer"
                    style={{ 
                      height: `${item.height}%`,
                      backgroundColor: idx === 3 ? '#ccff00' : '#1c261e'
                    }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black px-1.5 py-0.5 rounded text-[10px] text-white font-bold pointer-events-none transition-opacity">
                      {item.height}%
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1b221d] flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Pic hebdomadaire :</span>
            <span className="text-white font-bold">Jeudi • 90% du panier</span>
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
