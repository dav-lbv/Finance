import React, { useState } from 'react';
import { 
  PiggyBank, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Wallet,
  ChevronLeft,
  ChevronRight,
  Target,
  ArrowRight
} from 'lucide-react';
import { AppData, SavingsDeposit, SavingsProject } from '../types';
import { 
  formatCurrency, 
  formatDateFr, 
  formatMonthKey, 
  getCalendarGrid, 
  FRENCH_DAYS_SHORT,
  getPreviousMonthKey,
  getNextMonthKey
} from '../utils/date';
import { SavingsFintechCard } from './SavingsFintechCard';
import { SavingsModal } from './SavingsModal';
import { SavingsProjectsSection } from './SavingsProjectsSection';

interface SavingsPageProps {
  data: AppData;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onAddSavings: (deposit: Omit<SavingsDeposit, 'id'>) => void;
  onDeleteSavings: (depositId: string) => void;
  onOpenAddModal?: () => void;
  onAddSavingsProject?: (project: Omit<SavingsProject, 'id' | 'createdAt' | 'isClosed'>) => void;
  onUpdateSavingsProject?: (project: SavingsProject) => void;
  onDeleteSavingsProject?: (projectId: string) => void;
  onCloseSavingsProject?: (projectId: string, close: boolean) => void;
  onContributeToSavingsProject?: (
    projectId: string,
    amount: number,
    alsoRecordSavings: boolean,
    closeProjectIfReached?: boolean,
    customDate?: string,
    customNote?: string
  ) => void;
}

export const SavingsPage: React.FC<SavingsPageProps> = ({
  data,
  selectedMonth,
  setSelectedMonth,
  onAddSavings,
  onDeleteSavings,
  onOpenAddModal,
  onAddSavingsProject,
  onUpdateSavingsProject,
  onDeleteSavingsProject,
  onCloseSavingsProject,
  onContributeToSavingsProject,
}) => {
  const currency = data.user.currency || 'FCFA';
  const salaryReceived = data.monthlyBudgets[selectedMonth]?.salaryReceived ?? data.user.defaultSalary ?? 0;

  // Onglet actif : 'treasury' (Trésorerie générale) ou 'projects' (Projets & Objectifs)
  const [savingsTab, setSavingsTab] = useState<'treasury' | 'projects'>('treasury');

  // État modal local si onOpenAddModal n'est pas fourni par le parent
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);

  const handleOpenAddModal = () => {
    if (onOpenAddModal) {
      onOpenAddModal();
    } else {
      setIsLocalModalOpen(true);
    }
  };

  // Calculs Épargne
  const totalSavings = data.savings.reduce((acc, curr) => acc + curr.amount, 0);
  const monthDeposits = data.savings.filter(s => s.date.startsWith(selectedMonth));
  const monthTotalSavings = monthDeposits.reduce((acc, curr) => acc + curr.amount, 0);
  const savingsRate = salaryReceived > 0 ? Math.round((monthTotalSavings / salaryReceived) * 100) : 0;

  // Projets actifs
  const activeProjects = (data.savingsProjects || []).filter((p) => !p.isClosed);

  // Jour sélectionné dans le calendrier (desktop)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const calendarGrid = getCalendarGrid(selectedMonth);

  const depositsByDate: Record<string, SavingsDeposit[]> = {};
  data.savings.forEach(dep => {
    if (!depositsByDate[dep.date]) {
      depositsByDate[dep.date] = [];
    }
    depositsByDate[dep.date].push(dep);
  });

  const handleSelectDay = (dateString: string) => {
    setSelectedCalendarDate(dateString);
  };

  const selectedDayDeposits = selectedCalendarDate ? (depositsByDate[selectedCalendarDate] || []) : [];
  const sortedDeposits = [...data.savings].sort((a, b) => b.date.localeCompare(a.date));

  // Pagination des versements d'épargne (strictement 5 lignes maxi, avec flèches de navigation quand > 5)
  const [depositsPage, setDepositsPage] = useState(1);
  const DEPOSITS_PER_PAGE = 5;
  const totalDepositPages = Math.ceil(sortedDeposits.length / DEPOSITS_PER_PAGE) || 1;
  const paginatedDeposits = sortedDeposits.slice(
    (depositsPage - 1) * DEPOSITS_PER_PAGE,
    depositsPage * DEPOSITS_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-12 animate-fadeIn relative">
      {/* ============================================================== */}
      {/* EN-TÊTE ÉPURÉ DE LA PAGE (SANS COMMUTATEUR MANUEL)             */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#1b241d]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestion de l'Épargne
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Suivi du capital épargné en <span className="font-bold text-[#ccff00]">{formatMonthKey(selectedMonth)}</span>
          </p>
        </div>

        {/* Bouton Desktop unique pour ajouter une épargne (1 seul symbole +, pas de ++ !) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black text-xs font-black shadow-[0_0_15px_rgba(204,255,0,0.35)] active:scale-95 transition-all"
            title="Ajouter un versement d'épargne"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Épargner</span>
          </button>
        </div>
      </div>

      {/* Sélecteur d'onglets : Trésorerie vs Projets d'Épargne */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSavingsTab('treasury')}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
            savingsTab === 'treasury'
              ? 'bg-[#ccff00] text-black shadow-md'
              : 'bg-[#141b15] text-slate-300 hover:text-white border border-[#253227]'
          }`}
        >
          Versement
        </button>

        <button
          type="button"
          onClick={() => setSavingsTab('projects')}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            savingsTab === 'projects'
              ? 'bg-[#ccff00] text-black shadow-md'
              : 'bg-[#141b15] text-slate-300 hover:text-white border border-[#253227]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Projets</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            savingsTab === 'projects' ? 'bg-black text-[#ccff00]' : 'bg-[#ccff00]/15 text-[#ccff00]'
          }`}>
            {(data.savingsProjects || []).filter(p => !p.isClosed).length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* VUE 0 : SECTION PROJETS D'ÉPARGNE                              */}
      {/* ============================================================== */}
      {savingsTab === 'projects' && (
        <SavingsProjectsSection
          projects={data.savingsProjects || []}
          currency={currency}
          selectedMonth={selectedMonth}
          onAddProject={(newProj) => onAddSavingsProject && onAddSavingsProject(newProj)}
          onUpdateProject={(upProj) => onUpdateSavingsProject && onUpdateSavingsProject(upProj)}
          onDeleteProject={(pId) => onDeleteSavingsProject && onDeleteSavingsProject(pId)}
          onCloseProject={(pId, close) => onCloseSavingsProject && onCloseSavingsProject(pId, close)}
          onContributeToProject={(pId, amt, alsoRec) => onContributeToSavingsProject && onContributeToSavingsProject(pId, amt, alsoRec)}
        />
      )}

      {/* ============================================================== */}
      {/* VUE 1 : SMARTPHONE AUTOMATIQUE (< md)                           */}
      {/* S'adapte nativement à l'écran du smartphone sans cadre factice  */}
      {/* ============================================================== */}
      {savingsTab === 'treasury' && (
      <>
      <div className="block md:hidden space-y-4">
        {/* CARTE FINTECH HÉROS EN PLEINE LARGEUR */}
        <SavingsFintechCard
          totalSavings={totalSavings}
          monthTotalSavings={monthTotalSavings}
          currency={currency}
          selectedMonth={selectedMonth}
          userName={data.user.fullName}
          savingsCount={data.savings.length}
          onOpenAddModal={handleOpenAddModal}
        />

        {/* STATS DU MOIS & NAVIGATION RAPIDE MOBILE */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
          {/* Épargné ce mois */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#121913] border border-[#223024]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Épargné ce mois
            </span>
            <span className="text-base font-black text-[#ccff00] tracking-tight block mt-0.5 break-words">
              +{formatCurrency(monthTotalSavings, currency)}
            </span>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#ccff00] shrink-0" />
              <span>{savingsRate}% du salaire</span>
            </div>
          </div>

          {/* Navigation Mois Mobile */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#121913] border border-[#223024] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Mois sélectionné
            </span>
            <div className="flex items-center justify-between mt-1 gap-1">
              <button
                type="button"
                onClick={() => setSelectedMonth(getPreviousMonthKey(selectedMonth))}
                className="px-2.5 py-1 rounded-lg bg-[#1a241c] hover:bg-[#253528] border border-[#2c3d2e] text-slate-300 hover:text-white text-[11px] font-bold transition-all"
                aria-label="Mois précédent"
              >
                Préc.
              </button>
              <span className="text-[11px] font-black text-white px-1 truncate">
                {selectedMonth}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth(getNextMonthKey(selectedMonth))}
                className="px-2.5 py-1 rounded-lg bg-[#1a241c] hover:bg-[#253528] border border-[#2c3d2e] text-slate-300 hover:text-white text-[11px] font-bold transition-all"
                aria-label="Mois suivant"
              >
                Suiv.
              </button>
            </div>
            <span className="text-[9px] text-slate-500 text-center block mt-1">
              {monthDeposits.length} versement{monthDeposits.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* BANNIÈRE PROJETS D'ÉPARGNE SUR SMARTPHONE */}
        {activeProjects.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#141e16] to-[#101511] border border-[#243527] shadow-md flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 tracking-wider">
                  {activeProjects.length} Projet{activeProjects.length > 1 ? 's' : ''} en cours
                </span>
                {activeProjects.some((p) => p.currentAmount >= p.targetAmount) && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-[#ccff00] text-black animate-pulse">
                    Objectif atteint
                  </span>
                )}
              </div>
              <p className="text-xs font-black text-white truncate">
                {activeProjects[0].title}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                <span>{formatCurrency(activeProjects[0].currentAmount, currency)} / {formatCurrency(activeProjects[0].targetAmount, currency)}</span>
                <span className="text-[#ccff00] font-bold">• {Math.min(100, Math.round((activeProjects[0].currentAmount / activeProjects[0].targetAmount) * 100))}%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSavingsTab('projects')}
              className="px-3 py-1.5 rounded-full bg-[#1b251d] hover:bg-[#233126] text-[#ccff00] border border-[#2c3f2f] text-xs font-black whitespace-nowrap active:scale-95 shrink-0"
            >
              Gérer
            </button>
          </div>
        )}

        {/* HISTORIQUE MOBILE DES VERSEMENTS */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-extrabold text-white uppercase tracking-wider">
              Derniers versements
            </span>
            <span className="text-[10px] font-bold text-[#ccff00] bg-[#172419] px-2 py-0.5 rounded-full border border-[#273d2a]">
              {data.savings.length} au total
            </span>
          </div>

          {sortedDeposits.length === 0 ? (
            <div className="py-8 text-center bg-[#101611] rounded-2xl border border-[#1e2a20] px-4">
              <PiggyBank className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-semibold">Aucun versement d'épargne.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Appuyez sur le bouton <span className="text-[#ccff00] font-black">+</span> sur la carte ci-dessus pour rajouter votre premier versement.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedDeposits.map((dep) => {
                const isCurrentMonth = dep.date.startsWith(selectedMonth);

                return (
                  <div
                    key={dep.id}
                    className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                      isCurrentMonth
                        ? 'bg-[#151f17] border-[#293c2b]'
                        : 'bg-[#101611] border-[#1b261d] opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#1d2b1f] text-[#ccff00] flex items-center justify-center shrink-0 border border-[#2d4130]">
                        <PiggyBank className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">
                            +{formatCurrency(dep.amount, currency)}
                          </span>
                          {isCurrentMonth && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                          <span>{formatDateFr(dep.date)}</span>
                          {dep.projectName && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#1b2b1d] text-[#ccff00] border border-[#2e4731] shrink-0">
                                {dep.projectName}
                              </span>
                            </>
                          )}
                          {dep.note && !dep.projectName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-300 italic truncate">
                                {dep.note}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSavings(dep.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-2 shrink-0"
                      title="Supprimer ce versement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Navigation flèches gauche/droite si plus de 5 versements */}
              {sortedDeposits.length > DEPOSITS_PER_PAGE && (
                <div className="flex items-center justify-between pt-2.5 px-1 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium">
                    Page {depositsPage} sur {totalDepositPages} (5 maxi par vue)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={depositsPage === 1}
                      onClick={() => setDepositsPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18201a] hover:bg-[#202b23] border border-[#28362b] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                      title="Versements précédents"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Préc.</span>
                    </button>
                    <button
                      type="button"
                      disabled={depositsPage === totalDepositPages}
                      onClick={() => setDepositsPage((p) => Math.min(totalDepositPages, p + 1))}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18201a] hover:bg-[#202b23] border border-[#28362b] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                      title="Versements suivants"
                    >
                      <span>Suiv.</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* VUE 2 : ORDINATEUR / TABLETTE AUTOMATIQUE (>= md)              */}
      {/* Organisation en grille complète avec carte FinTech & calendrier */}
      {/* ============================================================== */}
      <div className="hidden md:block space-y-6">
        {/* RANGÉE SUPÉRIEURE : CARTE FINTECH (GAUCHE) & CALENDRIER (DROITE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* COLONNE GAUCHE (5 colonnes) : CARTE FINTECH + STATS */}
          <div className="lg:col-span-5 space-y-4">
            {/* CARTE FINTECH HÉROS AVEC TOTAL DÉJÀ ÉPARGNÉ & BOUTON (+) */}
            <SavingsFintechCard
              totalSavings={totalSavings}
              monthTotalSavings={monthTotalSavings}
              currency={currency}
              selectedMonth={selectedMonth}
              userName={data.user.fullName}
              savingsCount={data.savings.length}
              onOpenAddModal={handleOpenAddModal}
            />

            {/* CARTES STATISTIQUES MENSUELLES */}
            <div className="grid grid-cols-2 gap-3">
              {/* ÉPARGNÉ CE MOIS */}
              <div className="bg-[#121613] rounded-2xl p-4 border border-[#232f26]">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Épargné ce mois</span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#ccff00]" />
                </div>
                <div className="mt-1.5">
                  <span className="text-xl font-black text-[#ccff00] tracking-tight">
                    +{formatCurrency(monthTotalSavings, currency)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <span className="font-bold text-white">{monthDeposits.length}</span>
                  <span>versements en {formatMonthKey(selectedMonth)}</span>
                </div>
              </div>

              {/* PART DU SALAIRE */}
              <div className="bg-[#121613] rounded-2xl p-4 border border-[#232f26]">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Part du salaire</span>
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="mt-1.5">
                  <span className="text-xl font-black text-white tracking-tight">
                    {savingsRate}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  <span>Sur {formatCurrency(salaryReceived, currency)} perçus</span>
                </div>
              </div>
            </div>

            {/* CARTE RAPIDE PROJETS D'ÉPARGNE LIÉS (DESKTOP) */}
            <div className="bg-[#121613] rounded-2xl p-4 border border-[#232f26]">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase pb-2 border-b border-[#1c241d]">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Projets d'Épargne • {activeProjects.length} en cours</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSavingsTab('projects')}
                  className="text-[#ccff00] hover:underline font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <span>Gérer les projets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {activeProjects.length === 0 ? (
                <div className="py-3 text-center">
                  <p className="text-xs text-slate-400">Aucun projet actif en cours.</p>
                  <button
                    type="button"
                    onClick={() => setSavingsTab('projects')}
                    className="mt-2 text-xs font-bold text-[#ccff00] hover:underline"
                  >
                    + Créer un premier projet
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mt-2.5">
                  {activeProjects.slice(0, 2).map((proj) => {
                    const isDone = proj.currentAmount >= proj.targetAmount;
                    const pct = Math.min(100, Math.round((proj.currentAmount / proj.targetAmount) * 100));
                    return (
                      <div key={proj.id} className="p-2.5 rounded-xl bg-[#161c17] border border-[#222e24]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-white truncate max-w-[180px]">{proj.title}</span>
                          {isDone ? (
                            <span className="text-[9px] font-black text-black bg-[#ccff00] px-1.5 py-0.2 rounded-full">
                              Prêt à fermer
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-[#ccff00]">{pct}%</span>
                          )}
                        </div>
                        <div className="w-full bg-[#0d120e] h-1.5 rounded-full overflow-hidden my-1">
                          <div
                            className="h-full bg-gradient-to-r from-[#ccff00] to-[#10b981]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{formatCurrency(proj.currentAmount, currency)}</span>
                          <span>visé : {formatCurrency(proj.targetAmount, currency)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE (7 colonnes) : CALENDRIER INTERACTIF DES JOURS D'ÉPARGNE */}
          <div className="lg:col-span-7 bg-[#111512] rounded-3xl p-5 sm:p-6 shadow-sm border border-[#1f2821]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b221d] gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1b231d] text-[#ccff00] flex items-center justify-center border border-[#28362b]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    Calendrier des jours d'épargne
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Versements enregistrés en <span className="font-bold text-[#ccff00]">{formatMonthKey(selectedMonth)}</span>
                  </p>
                </div>
              </div>

              {/* Navigation de mois */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMonth(getPreviousMonthKey(selectedMonth))}
                  className="px-2.5 py-1 rounded-full bg-[#18201a] border border-[#263529] hover:bg-[#202b23] text-slate-300 hover:text-[#ccff00] text-xs font-bold transition-colors"
                  aria-label="Mois précédent"
                >
                  Préc.
                </button>
                <span className="text-xs font-bold text-white min-w-[100px] text-center">
                  {formatMonthKey(selectedMonth)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(getNextMonthKey(selectedMonth))}
                  className="px-2.5 py-1 rounded-full bg-[#18201a] border border-[#263529] hover:bg-[#202b23] text-slate-300 hover:text-[#ccff00] text-xs font-bold transition-colors"
                  aria-label="Mois suivant"
                >
                  Suiv.
                </button>
              </div>
            </div>

            {/* Légende discrète */}
            <div className="flex items-center gap-4 py-2.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ccff00] flex items-center justify-center text-black">
                  <PiggyBank className="w-2 h-2 stroke-[2.5]" />
                </span>
                <span>Jour avec versement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-white" />
                <span>Aujourd'hui</span>
              </div>
            </div>

            {/* Grille des jours */}
            <div className="mt-1">
              <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-400 py-1.5 border-b border-[#1b221d]">
                {FRENCH_DAYS_SHORT.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-2">
                {calendarGrid.map((cell) => {
                  const dayDeposits = depositsByDate[cell.dateString] || [];
                  const hasDeposit = dayDeposits.length > 0;
                  const dayTotalSavings = dayDeposits.reduce((acc, d) => acc + d.amount, 0);
                  const isSelected = selectedCalendarDate === cell.dateString;

                  return (
                    <div
                      key={cell.dateString}
                      onClick={() => handleSelectDay(cell.dateString)}
                      className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-150 border ${
                        isSelected
                          ? 'ring-2 ring-[#ccff00] border-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                          : ''
                      } ${
                        hasDeposit
                          ? 'bg-[#18231a] border-[#2e4030] text-white'
                          : cell.isCurrentMonth
                          ? 'bg-[#141a15]/80 border-[#202a22] hover:border-[#2d3b2f]'
                          : 'bg-transparent border-transparent opacity-20 pointer-events-none'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-white text-black font-black shadow-sm'
                            : cell.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-500'
                        }`}>
                          {cell.dayNumber}
                        </span>

                        {hasDeposit && (
                          <span className="w-4 h-4 rounded-full bg-[#ccff00] text-black flex items-center justify-center text-[9px] font-black shadow-[0_0_10px_rgba(204,255,0,0.4)]">
                            <PiggyBank className="w-2.5 h-2.5 stroke-[2.5]" />
                          </span>
                        )}
                      </div>

                      {hasDeposit ? (
                        <div className="mt-0.5">
                          <span className="block text-[10px] sm:text-[11px] font-black text-[#ccff00] truncate">
                            +{formatCurrency(dayTotalSavings, currency)}
                          </span>
                          <span className="hidden sm:block text-[8px] text-slate-400 truncate">
                            {dayDeposits[0].note || 'Épargne'}
                          </span>
                        </div>
                      ) : (
                        <div className="h-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Détail du jour sélectionné dans le calendrier */}
            {selectedCalendarDate && (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#161c17] border border-[#243026] animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Versements du {formatDateFr(selectedCalendarDate)} :
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDate(null)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Fermer
                  </button>
                </div>

                {selectedDayDeposits.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-1.5">
                    Aucun versement enregistré ce jour-là.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {selectedDayDeposits.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0f1411] border border-[#222e24] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#ccff00]">
                            +{formatCurrency(dep.amount, currency)}
                          </span>
                          {dep.note && (
                            <span className="text-slate-300 italic">
                              {dep.note}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteSavings(dep.id)}
                          className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                          title="Supprimer ce versement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RANGÉE INFÉRIEURE : HISTORIQUE COMPLET DES VERSEMENTS */}
        <div className="bg-[#111512] rounded-3xl border border-[#1f2821] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#1b221d] flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              Historique complet des versements d'épargne
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#1b231d] text-[#ccff00] border border-[#ccff00]/25">
              {data.savings.length} versement{data.savings.length > 1 ? 's' : ''}
            </span>
          </div>

          {sortedDeposits.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Aucun versement d'épargne enregistré pour l'instant.
            </div>
          ) : (
            <div>
              <div className="divide-y divide-[#18201a]">
                {paginatedDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#151b16] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1b231d] text-[#ccff00] flex items-center justify-center shrink-0 border border-[#28362b]">
                        <PiggyBank className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">
                            +{formatCurrency(dep.amount, currency)}
                          </span>
                          {dep.date.startsWith(selectedMonth) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1b2b1d] text-[#ccff00] border border-[#2e4731]">
                              Ce mois
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{formatDateFr(dep.date)}</span>
                          {dep.projectName && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#1b2b1d] text-[#ccff00] border border-[#2e4731]">
                              Projet : {dep.projectName}
                            </span>
                          )}
                          {dep.note && !dep.projectName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-300 italic">{dep.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSavings(dep.id)}
                      className="p-2 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Supprimer ce versement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Navigation flèches gauche/droite si plus de 5 versements */}
              {sortedDeposits.length > DEPOSITS_PER_PAGE && (
                <div className="px-5 py-3 border-t border-[#1b221d] flex items-center justify-between text-xs bg-[#0f1310]">
                  <span className="text-slate-400 font-medium">
                    Affichage de {paginatedDeposits.length} sur {sortedDeposits.length} versements • Page {depositsPage} sur {totalDepositPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={depositsPage === 1}
                      onClick={() => setDepositsPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#18201a] hover:bg-[#202b23] border border-[#28362b] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                      title="Page précédente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Précédent</span>
                    </button>
                    <button
                      type="button"
                      disabled={depositsPage === totalDepositPages}
                      onClick={() => setDepositsPage((p) => Math.min(totalDepositPages, p + 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#18201a] hover:bg-[#202b23] border border-[#28362b] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                      title="Page suivante"
                    >
                      <span>Suivant</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* MODAL AJOUT ÉPARGNE AVEC CHOIX VERSEMENT MENSUEL OU PROJET NON CLÔTURÉ */}
      <SavingsModal
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        onSave={onAddSavings}
        selectedMonth={selectedMonth}
        currency={currency}
        projects={data.savingsProjects || []}
        onContributeToProject={(pId, amt, alsoRec, closeIfReached, cDate, cNote) => {
          if (onContributeToSavingsProject) {
            onContributeToSavingsProject(pId, amt, alsoRec, closeIfReached, cDate, cNote);
          }
        }}
        onOpenCreateProject={() => setSavingsTab('projects')}
      />
    </div>
  );
};
