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
import { SavingsDayTimeline } from './SavingsDayTimeline';
import { SavingsProjectsSection } from './SavingsProjectsSection';

interface SavingsPageProps {
  data: AppData;
  selectedMonth: string;
  selectedDate: string;
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
  selectedDate,
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
    <div className="space-y-6 pb-28 stagger relative">
      {/* ============================================================== */}
      {/* EN-TÊTE ÉPURÉ DE LA PAGE (SANS COMMUTATEUR MANUEL)             */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
            Gestion de l'Épargne
          </h1>
          <p className="text-fg-muted text-xs sm:text-sm mt-0.5">
            Suivi du capital épargné en <span className="font-bold text-brand">{formatMonthKey(selectedMonth)}</span>
          </p>
        </div>

        {/* Bouton Desktop unique pour ajouter une épargne (1 seul symbole +, pas de ++ !) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-brand-fg text-xs font-black shadow-[0_0_15px_rgba(var(--brand-rgb),0.35)] active:scale-95 transition-all"
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
              ? 'bg-brand text-brand-fg shadow-md'
              : 'bg-surface text-fg-2 hover:text-fg border border-line-strong'
          }`}
        >
          Versement
        </button>

        <button
          type="button"
          onClick={() => setSavingsTab('projects')}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            savingsTab === 'projects'
              ? 'bg-brand text-brand-fg shadow-md'
              : 'bg-surface text-fg-2 hover:text-fg border border-line-strong'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Projets</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            savingsTab === 'projects' ? 'bg-brand text-brand-fg' : 'bg-brand/15 text-brand'
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
        <div className="grid grid-cols-1 gap-2.5">
          {/* Épargné ce mois */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-line">
            <span className="text-[10px] font-bold uppercase text-fg-muted block">
              Épargné ce mois
            </span>
            <span className="text-base font-black text-brand tracking-tight block mt-0.5 break-words">
              +{formatCurrency(monthTotalSavings, currency)}
            </span>
            <div className="text-[10px] text-fg-muted mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-brand shrink-0" />
              <span>{savingsRate}% du salaire</span>
            </div>
          </div>
        </div>

        {/* CALENDRIER D'ÉPARGNE (bandeau semaine + timeline du jour) */}
        <SavingsDayTimeline
            deposits={data.savings}
            selectedDate={selectedDate}
          currency={currency}
          savingsRate={savingsRate}
          onDelete={onDeleteSavings}
        />

        {/* BANNIÈRE PROJETS D'ÉPARGNE SUR SMARTPHONE */}
        {activeProjects.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-surface-2 to-surface border border-line-strong shadow-md flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-brand/15 text-brand border border-brand/30 tracking-wider">
                  {activeProjects.length} Projet{activeProjects.length > 1 ? 's' : ''} en cours
                </span>
                {activeProjects.some((p) => p.currentAmount >= p.targetAmount) && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-brand text-brand-fg animate-pulse">
                    Objectif atteint
                  </span>
                )}
              </div>
              <p className="text-xs font-black text-fg truncate">
                {activeProjects[0].title}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-fg-muted mt-0.5">
                <span>{formatCurrency(activeProjects[0].currentAmount, currency)} / {formatCurrency(activeProjects[0].targetAmount, currency)}</span>
                <span className="text-brand font-bold">• {Math.min(100, Math.round((activeProjects[0].currentAmount / activeProjects[0].targetAmount) * 100))}%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSavingsTab('projects')}
              className="px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 text-brand border border-line-strong text-xs font-black whitespace-nowrap active:scale-95 shrink-0"
            >
              Gérer
            </button>
          </div>
        )}

        {/* HISTORIQUE MOBILE DES VERSEMENTS */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-extrabold text-fg uppercase tracking-wider">
              Derniers versements
            </span>
            <span className="text-[10px] font-bold text-brand bg-surface-2 px-2 py-0.5 rounded-full border border-line-strong">
              {data.savings.length} au total
            </span>
          </div>

          {sortedDeposits.length === 0 ? (
            <div className="py-8 text-center bg-surface rounded-2xl border border-line px-4">
              <PiggyBank className="w-8 h-8 text-fg-muted mx-auto mb-2" />
              <p className="text-xs text-fg-2 font-semibold">Aucun versement d'épargne.</p>
              <p className="text-[11px] text-fg-muted mt-1">
                Appuyez sur le bouton <span className="text-brand font-black">+</span> sur la carte ci-dessus pour rajouter votre premier versement.
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
                        ? 'bg-surface-2 border-line-strong'
                        : 'bg-surface border-line opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-surface-3 text-brand flex items-center justify-center shrink-0 border border-line-strong">
                        <PiggyBank className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-fg">
                            +{formatCurrency(dep.amount, currency)}
                          </span>
                          {isCurrentMonth && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-fg-muted mt-0.5 flex items-center gap-1.5 truncate">
                          <span>{formatDateFr(dep.date)}</span>
                          {dep.projectName && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-surface-3 text-brand border border-line-strong shrink-0">
                                {dep.projectName}
                              </span>
                            </>
                          )}
                          {dep.note && !dep.projectName && (
                            <>
                              <span>•</span>
                              <span className="text-fg-2 italic truncate">
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
                      className="p-1.5 rounded-lg text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-2 shrink-0"
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
                  <span className="text-fg-muted text-[11px] font-medium">
                    Page {depositsPage} sur {totalDepositPages} (5 maxi par vue)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={depositsPage === 1}
                      onClick={() => setDepositsPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                      title="Versements précédents"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Préc.</span>
                    </button>
                    <button
                      type="button"
                      disabled={depositsPage === totalDepositPages}
                      onClick={() => setDepositsPage((p) => Math.min(totalDepositPages, p + 1))}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
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
              <div className="bg-surface rounded-2xl p-4 border border-line">
                <div className="flex items-center justify-between text-[10px] font-bold text-fg-muted uppercase">
                  <span>Épargné ce mois</span>
                  <TrendingUp className="w-3.5 h-3.5 text-brand" />
                </div>
                <div className="mt-1.5">
                  <span className="text-xl font-black text-brand tracking-tight">
                    +{formatCurrency(monthTotalSavings, currency)}
                  </span>
                </div>
                <div className="text-[10px] text-fg-muted mt-1 flex items-center gap-1">
                  <span className="font-bold text-fg">{monthDeposits.length}</span>
                  <span>versements en {formatMonthKey(selectedMonth)}</span>
                </div>
              </div>

              {/* PART DU SALAIRE */}
              <div className="bg-surface rounded-2xl p-4 border border-line">
                <div className="flex items-center justify-between text-[10px] font-bold text-fg-muted uppercase">
                  <span>Part du salaire</span>
                  <Wallet className="w-3.5 h-3.5 text-fg-muted" />
                </div>
                <div className="mt-1.5">
                  <span className="text-xl font-black text-fg tracking-tight">
                    {savingsRate}%
                  </span>
                </div>
                <div className="text-[10px] text-fg-muted mt-1 truncate">
                  <span>Sur {formatCurrency(salaryReceived, currency)} perçus</span>
                </div>
              </div>
            </div>

            {/* CARTE RAPIDE PROJETS D'ÉPARGNE LIÉS (DESKTOP) */}
            <div className="bg-surface rounded-2xl p-4 border border-line">
              <div className="flex items-center justify-between text-[10px] font-bold text-fg-muted uppercase pb-2 border-b border-line">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-brand" />
                  <span>Projets d'Épargne • {activeProjects.length} en cours</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSavingsTab('projects')}
                  className="text-brand hover:underline font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <span>Gérer les projets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {activeProjects.length === 0 ? (
                <div className="py-3 text-center">
                  <p className="text-xs text-fg-muted">Aucun projet actif en cours.</p>
                  <button
                    type="button"
                    onClick={() => setSavingsTab('projects')}
                    className="mt-2 text-xs font-bold text-brand hover:underline"
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
                      <div key={proj.id} className="p-2.5 rounded-xl bg-surface-2 border border-line">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-fg truncate max-w-[180px]">{proj.title}</span>
                          {isDone ? (
                            <span className="text-[9px] font-black text-brand-fg bg-brand px-1.5 py-0.2 rounded-full">
                              Prêt à fermer
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-brand">{pct}%</span>
                          )}
                        </div>
                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden my-1">
                          <div
                            className="h-full bg-gradient-to-r from-fg-muted to-brand"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-fg-muted">
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

          {/* COLONNE DROITE (7 colonnes) : CALENDRIER SEMAINE / MOIS + TIMELINE DU JOUR */}
          <SavingsDayTimeline
            deposits={data.savings}
            selectedDate={selectedDate}
            currency={currency}
            savingsRate={savingsRate}
            onDelete={onDeleteSavings}
          />
        </div>

        {/* RANGÉE INFÉRIEURE : HISTORIQUE COMPLET DES VERSEMENTS */}
        <div className="bg-surface rounded-3xl border border-line overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold text-fg">
              Historique complet des versements d'épargne
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-surface-2 text-brand border border-brand/25">
              {data.savings.length} versement{data.savings.length > 1 ? 's' : ''}
            </span>
          </div>

          {sortedDeposits.length === 0 ? (
            <div className="py-10 text-center text-sm text-fg-muted">
              Aucun versement d'épargne enregistré pour l'instant.
            </div>
          ) : (
            <div>
              <div className="divide-y divide-line">
                {paginatedDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-2 text-brand flex items-center justify-center shrink-0 border border-line-strong">
                        <PiggyBank className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-fg">
                            +{formatCurrency(dep.amount, currency)}
                          </span>
                          {dep.date.startsWith(selectedMonth) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-3 text-brand border border-line-strong">
                              Ce mois
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-fg-muted mt-0.5 flex items-center gap-2">
                          <span>{formatDateFr(dep.date)}</span>
                          {dep.projectName && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-surface-3 text-brand border border-line-strong">
                              Projet : {dep.projectName}
                            </span>
                          )}
                          {dep.note && !dep.projectName && (
                            <>
                              <span>•</span>
                              <span className="text-fg-2 italic">{dep.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSavings(dep.id)}
                      className="p-2 rounded-full text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Supprimer ce versement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Navigation flèches gauche/droite si plus de 5 versements */}
              {sortedDeposits.length > DEPOSITS_PER_PAGE && (
                <div className="px-5 py-3 border-t border-line flex items-center justify-between text-xs bg-surface">
                  <span className="text-fg-muted font-medium">
                    Affichage de {paginatedDeposits.length} sur {sortedDeposits.length} versements • Page {depositsPage} sur {totalDepositPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={depositsPage === 1}
                      onClick={() => setDepositsPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                      title="Page précédente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Précédent</span>
                    </button>
                    <button
                      type="button"
                      disabled={depositsPage === totalDepositPages}
                      onClick={() => setDepositsPage((p) => Math.min(totalDepositPages, p + 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
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
