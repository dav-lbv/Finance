import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, History, PiggyBank, Plus, Target, Trash2 } from 'lucide-react';
import { AppData, SavingsDeposit, SavingsProject } from '../types';
import { formatCurrency, formatDateFr, formatMonthKey } from '../utils/date';
import { useCountUp } from '../hooks/useCountUp';
import { Amount } from './Amount';
import { getMonthSalary, splitSavings, sumAmounts } from '../utils/finance';
import { SavingsModal } from './SavingsModal';
import { SavingsDayTimeline } from './SavingsDayTimeline';
import { SavingsProjectsSection } from './SavingsProjectsSection';
import { SavingsCardCarousel, CarouselItem } from './SavingsCardCarousel';
import { SavingsHistoryView } from './SavingsHistoryView';

interface SavingsPageProps {
  data: AppData;
  selectedMonth: string;
  selectedDate: string;
  setSelectedMonth: (month: string) => void;
  onAddSavings: (deposit: Omit<SavingsDeposit, 'id'>) => void;
  onDeleteSavings: (depositId: string) => void;
  /** Catégories de projets configurées dans les Réglages */
  projectCategories?: string[];
  onAddProjectCategory?: (name: string) => void;
  /** Ouvre la fenêtre de versement ; `projectId` présélectionne un projet */
  onOpenAddModal?: (projectId?: string) => void;
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

type View = 'home' | 'projects' | 'history';

const DEPOSITS_STEP = 5;

/** Bouton d'action rond sous le carrousel */
const RoundAction: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}> = ({ label, onClick, children, badge }) => (
  <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer group">
    <span className="relative w-14 h-14 rounded-full bg-brand text-brand-fg flex items-center justify-center shadow-[0_10px_26px_rgba(var(--brand-rgb),0.25)] group-hover:scale-105 transition-transform">
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-surface-solid text-fg border border-line-strong text-[10px] font-black flex items-center justify-center">
          {badge}
        </span>
      )}
    </span>
    <span className="text-[11px] font-semibold text-fg-2">{label}</span>
  </button>
);

export const SavingsPage: React.FC<SavingsPageProps> = ({
  data,
  selectedMonth,
  selectedDate,
  onDeleteSavings,
  projectCategories = [],
  onAddProjectCategory,
  onOpenAddModal,
  onAddSavings,
  onAddSavingsProject,
  onUpdateSavingsProject,
  onDeleteSavingsProject,
  onCloseSavingsProject,
  onContributeToSavingsProject,
}) => {
  const currency = data.user.currency || 'FCFA';
  const salaryReceived = getMonthSalary(data, selectedMonth);

  const [view, setView] = useState<View>('home');
  const [cardIndex, setCardIndex] = useState(0);
  const [visibleDeposits, setVisibleDeposits] = useState(DEPOSITS_STEP);
  const [toast, setToast] = useState<string | null>(null);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [localModalProject, setLocalModalProject] = useState<string | undefined>(undefined);

  const allProjects = data.savingsProjects || [];
  const activeProjects = allProjects.filter((p) => !p.isClosed);
  const closedCount = allProjects.length - activeProjects.length;

  // Calculs d'épargne
  // L'épargne générale ne contient QUE les versements hors projets : l'argent des projets
  // reste sur leurs propres cartes.
  const { general: generalDeposits } = splitSavings(data.savings);
  const totalSavings = sumAmounts(generalDeposits);
  const monthTotalSavings = sumAmounts(generalDeposits.filter((d) => d.date.startsWith(selectedMonth)));
  const savingsRate = salaryReceived > 0 ? Math.round((monthTotalSavings / salaryReceived) * 100) : 0;

  // Cartes du carrousel : 1re = total ; ensuite un projet en cours = une carte
  const items: CarouselItem[] = [
    { kind: 'total', id: 'total', total: totalSavings, monthTotal: monthTotalSavings, count: generalDeposits.length },
    ...activeProjects.map((project) => ({ kind: 'project' as const, id: project.id, project })),
  ];
  const safeIndex = Math.min(cardIndex, items.length - 1);
  const focused = items[safeIndex];
  const focusedProject = focused.kind === 'project' ? focused.project : null;

  // Carte affichée : montant animé au changement de carte
  const focusedAmount = focused.kind === 'total' ? totalSavings : focused.project.currentAmount;
  const animatedAmount = useCountUp(focusedAmount, 700);
  const focusedLabel = focused.kind === 'total' ? 'Total épargné' : focused.project.title;

  // Revenir sur la nouvelle carte quand un projet vient d'être créé
  const projectCountOnLeave = useRef(activeProjects.length);
  useEffect(() => {
    if (view === 'projects') projectCountOnLeave.current = activeProjects.length;
  }, [view, activeProjects.length]);
  useEffect(() => {
    if (view === 'home' && activeProjects.length > projectCountOnLeave.current) {
      setCardIndex(1); // les nouveaux projets sont ajoutés en tête de liste
      projectCountOnLeave.current = activeProjects.length;
    }
  }, [view, activeProjects.length]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const openDeposit = (projectId?: string) => {
    if (onOpenAddModal) onOpenAddModal(projectId);
    else {
      setLocalModalProject(projectId);
      setIsLocalModalOpen(true);
    }
  };

  const handleCloseProject = (projectId: string) => {
    const title = allProjects.find((p) => p.id === projectId)?.title || 'Projet';
    onCloseSavingsProject?.(projectId, true);
    setCardIndex(0);
    setToast(`🎉 « ${title} » est clôturé : objectif atteint, projet archivé dans l'historique.`);
  };

  // Liste affichée sous les actions : tous les versements ou ceux du projet
  const listSource = (focusedProject ? data.savings.filter((d) => d.projectId === focusedProject.id) : generalDeposits)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const shownDeposits = listSource.slice(0, visibleDeposits);

  useEffect(() => {
    setVisibleDeposits(DEPOSITS_STEP);
  }, [focused.id]);

  // ============================ SOUS-VUES ============================
  if (view === 'projects') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setView('home')}
          className="inline-flex items-center gap-2 text-xs font-bold text-fg-2 bg-surface px-4 py-2 rounded-full border border-line cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'épargne</span>
        </button>
        <SavingsProjectsSection
          projects={allProjects}
          currency={currency}
          selectedMonth={selectedMonth}
          onAddProject={(p) => onAddSavingsProject?.(p)}
          onUpdateProject={(p) => onUpdateSavingsProject?.(p)}
          onDeleteProject={(id) => onDeleteSavingsProject?.(id)}
          onCloseProject={(id, close) => onCloseSavingsProject?.(id, close)}
          onContributeToProject={(id, amt, alsoRec) => onContributeToSavingsProject?.(id, amt, alsoRec)}
          categories={projectCategories}
          onAddCategory={(name) => onAddProjectCategory?.(name)}
        />
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div>
        <SavingsHistoryView
          projects={allProjects}
          deposits={data.savings}
          currency={currency}
          onBack={() => setView('home')}
          onReopen={(id) => {
            onCloseSavingsProject?.(id, false);
            setView('home');
          }}
        />
      </div>
    );
  }

  // ============================== ACCUEIL ==============================
  return (
    <div className="max-w-md mx-auto stagger">
      {/* Solde de la carte au premier plan */}
      <div className="text-center pt-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={focused.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-[44px] leading-tight text-fg">
              <Amount value={animatedAmount} currency={currency} />
            </p>
            <p className="text-xs text-fg-muted mt-0.5 truncate px-6">{focusedLabel}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3">
        <SavingsCardCarousel
          items={items}
          index={safeIndex}
          onIndexChange={setCardIndex}
          currency={currency}
          holder={data.user.fullName}
          year={selectedMonth.slice(0, 4)}
          onCloseProject={handleCloseProject}
        />
      </div>

      {/* Boutons d'action ronds */}
      <div className="mt-5 flex items-start justify-center gap-8">
        <RoundAction label="Versement" onClick={() => openDeposit(focusedProject?.id)}>
          <Plus className="w-6 h-6 stroke-[2.6]" />
        </RoundAction>
        <RoundAction label="Projets" onClick={() => setView('projects')} badge={activeProjects.length}>
          <Target className="w-6 h-6" />
        </RoundAction>
        <RoundAction label="Historique" onClick={() => setView('history')} badge={closedCount}>
          <History className="w-6 h-6" />
        </RoundAction>
      </div>

      {/* Contenu de la carte active */}
      <div className="mt-6 space-y-4">
        {focusedProject ? (
          <div className="rounded-3xl bg-surface border border-line p-4 grid grid-cols-3 gap-2 text-center">
            {[
              ['Épargné', formatCurrency(focusedProject.currentAmount, currency)],
              ['Reste', formatCurrency(Math.max(0, focusedProject.targetAmount - focusedProject.currentAmount), currency)],
              ['Objectif', formatCurrency(focusedProject.targetAmount, currency)],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">{label}</span>
                <p className="text-xs font-black text-fg tabular-nums mt-0.5 break-words">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-surface border border-line p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                Épargné en {formatMonthKey(selectedMonth)}
              </span>
              <p className="text-lg font-black text-fg tabular-nums">+{formatCurrency(monthTotalSavings, currency)}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-surface-2 border border-line text-fg-2">
              {savingsRate}% du salaire
            </span>
          </div>
        )}

        {!focusedProject && (
          <SavingsDayTimeline
            deposits={generalDeposits}
            selectedDate={selectedDate}
            currency={currency}
            savingsRate={savingsRate}
            onDelete={onDeleteSavings}
          />
        )}

        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-fg">
              {focusedProject ? 'Versements du projet' : 'Derniers versements'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 border border-line text-fg-2">
              {listSource.length} au total
            </span>
          </div>

          {listSource.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-dashed border-line-strong p-6 text-center">
              <PiggyBank className="w-7 h-7 mx-auto text-fg-muted mb-1.5" />
              <p className="text-xs font-bold text-fg">Aucun versement</p>
              <p className="text-[11px] text-fg-muted mt-0.5">Appuyez sur « Versement » pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shownDeposits.map((dep) => (
                <div
                  key={dep.id}
                  className="rounded-2xl bg-surface border border-line p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-surface-2 border border-line-strong text-fg flex items-center justify-center shrink-0">
                      <PiggyBank className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-fg tabular-nums">+{formatCurrency(dep.amount, currency)}</p>
                      <p className="text-[10px] text-fg-muted truncate">
                        {formatDateFr(dep.date)}
                        {dep.projectName ? ` • ${dep.projectName}` : dep.note ? ` • ${dep.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSavings(dep.id)}
                    className="p-2.5 -mr-1 text-fg-muted hover:text-rose-400 cursor-pointer shrink-0"
                    title="Supprimer ce versement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {listSource.length > visibleDeposits && (
                <button
                  type="button"
                  onClick={() => setVisibleDeposits((n) => n + DEPOSITS_STEP)}
                  className="w-full py-2.5 rounded-full bg-surface border border-line text-xs font-bold text-fg-2 cursor-pointer"
                >
                  Afficher plus
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message de félicitations après clôture */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed left-4 right-4 bottom-28 z-50 max-w-md mx-auto rounded-2xl bg-brand text-brand-fg p-4 text-xs font-bold shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fenêtre de versement locale si le parent n'en fournit pas */}
      <SavingsModal
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        onSave={onAddSavings}
        selectedMonth={selectedMonth}
        currency={currency}
        projects={allProjects}
        initialProjectId={localModalProject}
        onContributeToProject={onContributeToSavingsProject}
      />
    </div>
  );
};
