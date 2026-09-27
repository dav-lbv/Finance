import React from 'react';
import { 
  PiggyBank, 
  Receipt, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Plus,
  Coins,
  User,
  Sliders,
  Tag,
  Palette,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AppData } from '../types';
import { 
  formatCurrency, 
  formatDateFr, 
  formatMonthKey, 
  getPreviousMonthKey 
} from '../utils/date';
import { SettingsSection } from './SettingsPage';
import { DEFAULT_AVATAR } from '../utils/avatars';

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

  const fallbackAvatar = DEFAULT_AVATAR;
  const avatarImage = data.user.avatarUrl || fallbackAvatar;

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

  // VRAI CALCUL DEMANDÉ PAR L'UTILISATEUR :
  // "Sur le dashboard j'ai le calcul de combien il me reste le mois après avoir enlevé les dépenses et l'épargne"
  // Solde Net Restant = Salaire perçu - Dépenses du mois - Épargne versée ce mois
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
    <div className="space-y-5 pb-12 animate-fadeIn">

      {/* ======================================================== */}
      {/* VUE SUR MON PROFIL & SECTIONS PARAMÈTRES (DEMANDÉ)       */}
      {/* ======================================================== */}
      <div className="bg-[#111612] rounded-3xl p-4 sm:p-5 border border-[#232f26] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Identité Profil : Photo de profil + Nom */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div 
            onClick={() => onNavigateToTab('settings', 'user_info')}
            className="relative cursor-pointer group shrink-0"
            title="Modifier ma photo de profil"
          >
            <img
              src={avatarImage}
              alt={data.user.fullName}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.3)] group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#111612]"></span>
          </div>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
              {data.user.fullName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
              <span className="truncate">{data.user.email}</span>
              {data.user.phone && (
                <>
                  <span>•</span>
                  <span className="whitespace-nowrap font-medium text-slate-300">{data.user.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Accès direct aux Sections Principales des Paramètres */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => onNavigateToTab('settings', 'user_info')}
            className="px-3.5 py-1.5 rounded-full bg-[#172019] hover:bg-[#1f2b22] text-slate-300 hover:text-white border border-[#27372b] text-[11px] font-bold whitespace-nowrap transition-all active:scale-95"
            title="Informations utilisateur"
          >
            <span>Informations</span>
          </button>

          <button
            onClick={() => onNavigateToTab('settings', 'budget_salary')}
            className="px-3.5 py-1.5 rounded-full bg-[#172019] hover:bg-[#1f2b22] text-slate-300 hover:text-white border border-[#27372b] text-[11px] font-bold whitespace-nowrap transition-all active:scale-95"
            title="Alimentation Dépenses & Épargne"
          >
            <span>Alimentation</span>
          </button>

          <button
            onClick={() => onNavigateToTab('settings', 'categories')}
            className="px-3.5 py-1.5 rounded-full bg-[#172019] hover:bg-[#1f2b22] text-slate-300 hover:text-white border border-[#27372b] text-[11px] font-bold whitespace-nowrap transition-all active:scale-95"
            title="Catégories & Dépenses Prédéfinies"
          >
            <span>Catégories</span>
          </button>

          <button
            onClick={() => onNavigateToTab('settings', 'appearance')}
            className="px-3.5 py-1.5 rounded-full bg-[#172019] hover:bg-[#1f2b22] text-slate-300 hover:text-white border border-[#27372b] text-[11px] font-bold whitespace-nowrap transition-all active:scale-95"
            title="Apparence & Thème d'affichage"
          >
            <span>Thème</span>
          </button>

          <button
            onClick={() => onNavigateToTab('settings', 'security')}
            className="px-3.5 py-1.5 rounded-full bg-[#172019] hover:bg-[#1f2b22] text-slate-300 hover:text-white border border-[#27372b] text-[11px] font-bold whitespace-nowrap transition-all active:scale-95"
            title="Sécurité & Verrouillage"
          >
            <span>Sécurité</span>
          </button>
        </div>

      </div>
      
      {/* ======================================================== */}
      {/* CARTE HERO FINTECH SOLDE RESTANT & ACTIONS               */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl p-5 sm:p-7 text-white overflow-hidden bg-gradient-to-br from-[#18231a] via-[#111713] to-[#0a0e0b] border border-[#27382a] shadow-[0_20px_50px_rgba(0,0,0,0.65)] select-none">
        
        {/* Glow néon d'arrière-plan */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#ccff00]/12 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#122e17]/35 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          {/* Solde Restant & Mois actif */}
          <div className="min-w-0">
            {/* Badge mois actif */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18221a] text-[#ccff00] text-xs font-bold border border-[#ccff00]/30 shadow-sm mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
              <span>{formatMonthKey(selectedMonth)}</span>
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Solde restant
            </span>
            <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
              <h1 className={`text-3xl xs:text-4xl sm:text-5xl font-black tracking-tight break-words drop-shadow-md ${
                isPositiveNet ? 'text-white' : 'text-rose-400'
              }`}>
                {formatCurrency(netRemaining, currency)}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                isPositiveNet
                  ? 'bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {isPositiveNet ? `${100 - usedRatio}% disponible` : 'Déficit'}
              </span>
            </div>
          </div>

          {/* Les deux boutons d'action : Dépenses (pour en ajouter) et Épargne (pour créer une épargne) */}
          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(204,255,0,0.35)] transition-all duration-150 active:scale-95 cursor-pointer"
              title="Ajouter une dépense"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Dépenses</span>
            </button>
            
            <button
              type="button"
              onClick={onOpenAddSavings}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1b251d] hover:bg-[#233126] text-white font-extrabold text-xs sm:text-sm border border-[#2d4030] hover:border-[#ccff00]/40 transition-all duration-150 active:scale-95 cursor-pointer"
              title="Créer une épargne"
            >
              <PiggyBank className="w-4 h-4 text-[#ccff00]" />
              <span>Épargne</span>
            </button>
          </div>

        </div>

        {/* 3 Cartes de métriques réelles : SALAIRE PERÇU | TOTAL DÉPENSES | TOTAL ÉPARGNE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 mt-6 pt-5 border-t border-[#1f2a21]">
          <div className="bg-[#121713]/80 rounded-2xl p-3.5 border border-[#212c23]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 block">Salaire / Revenu perçu</span>
              <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
            </div>
            <span className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 block">
              +{formatCurrency(salaryReceived, currency)}
            </span>
          </div>

          <div 
            onClick={() => onNavigateToTab('expenses')}
            className="bg-[#121713]/80 rounded-2xl p-3.5 border border-[#212c23] hover:border-rose-500/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 block">Dépenses du mois</span>
              <span className="text-[10px] text-rose-400 font-bold">Voir</span>
            </div>
            <span className="text-lg sm:text-xl font-black text-rose-400 tracking-tight mt-1 block">
              -{formatCurrency(currentTotalExpenses, currency)}
            </span>
          </div>

          <div 
            onClick={() => onNavigateToTab('savings')}
            className="bg-[#121713]/80 rounded-2xl p-3.5 border border-[#212c23] hover:border-[#ccff00]/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 block">Épargne versée ce mois</span>
              <span className="text-[10px] text-[#ccff00] font-bold">Voir</span>
            </div>
            <span className="text-lg sm:text-xl font-black text-[#ccff00] tracking-tight mt-1 block">
              -{formatCurrency(currentMonthSavings, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION DUO : DÉPENSES MOIS PRÉCÉDENT & SOLDE D'ÉPARGNE */}
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
            className="mt-5 w-full py-2.5 rounded-full bg-[#161d17] hover:bg-[#1d271e] text-slate-300 hover:text-white border border-[#222e24] text-xs font-bold transition-all text-center"
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
              className="flex-1 py-2.5 rounded-full bg-[#161d17] hover:bg-[#1d271e] text-slate-300 hover:text-white border border-[#222e24] text-xs font-bold transition-all text-center"
            >
              Voir historique des versements
            </button>
            <button
              onClick={onOpenAddSavings}
              className="px-4 py-2.5 rounded-full bg-[#ccff00] text-black font-extrabold text-xs hover:bg-[#d9ff33] transition-all"
            >
              + Épargner
            </button>
          </div>
        </div>

      </div>

      {/* SECTION RÉPARTITION PAR CATÉGORIE & GRAPHIQUE BARRES FINTECH */}
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

    </div>
  );
};
