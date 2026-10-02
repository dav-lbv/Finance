import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Edit3, 
  Trash2, 
  Repeat, 
  Search, 
  Check, 
  X,
  Sparkles,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { AppData, Expense, ExpenseCategory } from '../types';
import { formatCurrency, formatDateFr, formatMonthKey } from '../utils/date';
import { ExpenseTrendChart } from './ExpenseTrendChart';
import { FintechSelect } from './FintechSelect';

interface ExpensesPageProps {
  data: AppData;
  selectedMonth: string;
  setSelectedMonth?: (month: string) => void;
  onUpdateBaseBudget?: (monthKey: string, newAmount: number) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenAddModal: () => void;
  onValidateAllMonthExpenses: (monthKey: string, validate?: boolean) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Logement',
  'Alimentation',
  'Factures & Abonnements',
  'Transport',
  'Santé',
  'Loisirs & Sorties',
  'Shopping & Divers',
  'Autre',
];

const ITEMS_PER_PAGE = 5;

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  data,
  selectedMonth,
  setSelectedMonth,
  onAddExpense: _onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onOpenAddModal,
  onValidateAllMonthExpenses,
}) => {
  const currency = data.user.currency || 'FCFA';
  const expenses = data.expenses[selectedMonth] || [];

  // =========================================================================
  // CALCULS DÉPENSES SANS LA LOGIQUE DU SOLDE ALLOUÉ
  // Suivi exclusif des dépenses réelles : Total, Récurrentes & Ponctuelles
  // =========================================================================
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Dépenses récurrentes (charges fixes conservées chaque mois)
  const recurringExpenses = expenses.filter(e => e.isRecurring);
  const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Dépenses ponctuelles / variables (qui s'effacent lors de la validation)
  const oneOffExpenses = expenses.filter(e => !e.isRecurring);
  const totalOneOff = oneOffExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Séparation : Dépenses en cours vs Dépenses déjà réglées / archivées
  const unsettledExpenses = expenses.filter(e => !e.isPaid);
  const settledExpenses = expenses.filter(e => e.isPaid);
  const totalPaidExpenses = settledExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPendingExpenses = unsettledExpenses.reduce((sum, e) => sum + e.amount, 0);

  // État d'affichage de l'historique réglé
  const [showSettledHistory, setShowSettledHistory] = useState(false);

  // Filtres et recherche appliqués sur les dépenses en cours
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [filterRecurringOnly, setFilterRecurringOnly] = useState(false);

  // Toast de validation
  const [validationToast, setValidationToast] = useState<string | null>(null);

  // Édition rapide de montant d'une dépense en ligne
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');

  // =========================================================================
  // PAGINATION 1 : Liste active des dépenses (Strictement 5 maximum par vue)
  // =========================================================================
  const [activePage, setActivePage] = useState(1);

  // =========================================================================
  // PAGINATION 2 : Historique des dépenses réglées (5 maximum par vue)
  // =========================================================================
  const [settledPage, setSettledPage] = useState(1);

  // =========================================================================
  // PAGINATION 3 : Historique des dépenses des mois (5 lignes maximum par vue)
  // =========================================================================
  const [monthsHistoryPage, setMonthsHistoryPage] = useState(1);
  const [expandedHistoryMonth, setExpandedHistoryMonth] = useState<string | null>(null);
  const allRecordedMonths = Object.keys(data.expenses).sort().reverse();
  const totalMonthsPages = Math.ceil(allRecordedMonths.length / ITEMS_PER_PAGE) || 1;
  const paginatedRecordedMonths = allRecordedMonths.slice(
    (monthsHistoryPage - 1) * ITEMS_PER_PAGE,
    monthsHistoryPage * ITEMS_PER_PAGE
  );

  // Validation du mois :
  // "si parmis les catégories de dépenses lister y'en a qui sont en mode récurent
  // lorsqu'on les as enregistrer il ne s'éfaces pas lorsqu'on a valider les dépense du mois par contre le reste oui"
  const handleValidate = () => {
    onValidateAllMonthExpenses(selectedMonth, true);
    setValidationToast(
      `Dépenses de ${formatMonthKey(selectedMonth)} validées ! Vos dépenses récurrentes restent conservées dans la liste, le reste des dépenses a été réglé.`
    );
    setActivePage(1);
    setTimeout(() => setValidationToast(null), 6000);
  };

  const handleStartEditAmount = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setTempAmount(exp.amount.toString());
  };

  const handleSaveExpenseAmount = (exp: Expense) => {
    const newAmount = parseFloat(tempAmount);
    if (!isNaN(newAmount) && newAmount >= 0) {
      const updated: Expense = {
        ...exp,
        amount: newAmount,
        recurringOriginalAmount: exp.isRecurring 
          ? (exp.recurringOriginalAmount ?? exp.amount) 
          : undefined,
      };
      onUpdateExpense(updated);
    }
    setEditingExpenseId(null);
  };

  // Liste active des dépenses en cours de saisie filtrée
  const displayedActiveExpenses = unsettledExpenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'all' || exp.category === selectedCategoryFilter;
    const matchesRecurring = !filterRecurringOnly || exp.isRecurring;
    return matchesSearch && matchesCategory && matchesRecurring;
  });

  const activeTotal = displayedActiveExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calcul pagination liste active (5 par page)
  const totalActivePages = Math.ceil(displayedActiveExpenses.length / ITEMS_PER_PAGE) || 1;
  const paginatedActiveExpenses = displayedActiveExpenses.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  // Calcul pagination liste réglée (5 par page)
  const totalSettledPages = Math.ceil(settledExpenses.length / ITEMS_PER_PAGE) || 1;
  const paginatedSettledExpenses = settledExpenses.slice(
    (settledPage - 1) * ITEMS_PER_PAGE,
    settledPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-5 pb-28 stagger">
      {/* EN-TÊTE PAGE DÉPENSES - Totalement adaptatif smartphone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
            Gestion des Dépenses
          </h1>
          <p className="text-fg-muted text-xs sm:text-sm mt-0.5">
            Période de <span className="font-bold text-brand">{formatMonthKey(selectedMonth)}</span>
          </p>
        </div>

        {/* Bouton d'ajout de dépense */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={onOpenAddModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(var(--brand-rgb),0.3)] transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      {/* TOAST FEEDBACK VALIDATION DÉPENSES */}
      {validationToast && (
        <div className="p-3.5 rounded-2xl bg-surface-2 border border-line-strong text-xs font-bold text-brand flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 pr-2">
            <CheckCheck className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="leading-snug">{validationToast}</span>
          </div>
          <button 
            onClick={() => setValidationToast(null)} 
            className="text-fg-muted hover:text-fg shrink-0 p-1"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3 NOUVELLES CARTES DÉPENSES SANS SOLDE ALLOUÉ :                           */}
      {/* 1. TOTAL DÉPENSES MOIS | 2. CHARGES RÉCURRENTES | 3. DÉPENSES PONCTUELLES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* 1. TOTAL DES DÉPENSES DU MOIS */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-line relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-surface-2 text-brand flex items-center justify-center border border-line-strong shrink-0">
                  <Receipt className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand block truncate">
                    Total Dépenses
                  </span>
                  <h3 className="text-xs text-fg-2 font-medium truncate">
                    Total engagé ce mois
                  </h3>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface-2 text-fg-2 border border-line-strong shrink-0">
                {expenses.length} au total
              </span>
            </div>

            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-black text-fg tracking-tight break-words">
                {formatCurrency(totalExpenses, currency)}
              </span>
            </div>
            
            <p className="text-[11px] text-fg-muted mt-1">
              {settledExpenses.length} réglée{settledExpenses.length > 1 ? 's' : ''} • {unsettledExpenses.length} en cours
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-fg-2">
            <span>Réglé : <strong className="text-brand">{formatCurrency(totalPaidExpenses, currency)}</strong></span>
            {totalPendingExpenses > 0 && (
              <span className="text-fg-muted text-[11px]">En attente : {formatCurrency(totalPendingExpenses, currency)}</span>
            )}
          </div>
        </div>

        {/* 2. DÉPENSES RÉCURRENTES (CHARGES FIXES CONSERVÉES À CHAQUE VALIDATION) */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-line relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-surface-2 text-brand flex items-center justify-center border border-line-strong shrink-0">
                  <Repeat className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand block truncate">
                    Charges Récurrentes
                  </span>
                  <h3 className="text-xs text-fg-2 font-medium truncate">
                    Loyer, factures, abonnements...
                  </h3>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-3 text-brand border border-line-strong shrink-0">
                {recurringExpenses.length} fixes
              </span>
            </div>

            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-black text-fg tracking-tight break-words">
                {formatCurrency(totalRecurring, currency)}
              </span>
            </div>

            <p className="text-[11px] text-fg-muted mt-1">
              Ne s'effacent pas lors de la validation du mois.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-brand font-semibold">
            <span className="inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Conservées chaque mois</span>
            </span>
            <span className="text-fg-muted">
              {totalExpenses > 0 ? Math.round((totalRecurring / totalExpenses) * 100) : 0}% du total
            </span>
          </div>
        </div>

        {/* 3. DÉPENSES PONCTUELLES (VARIABLES QUI S'EFFACENT LORS DE LA VALIDATION) */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-line relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-surface-2 text-fg-2 flex items-center justify-center border border-line-strong shrink-0">
                  <TrendingDown className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-fg-muted block truncate">
                    Dépenses Ponctuelles
                  </span>
                  <h3 className="text-xs text-fg-2 font-medium truncate">
                    Courses, sorties, imprévus...
                  </h3>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 text-fg-muted border border-line-strong shrink-0">
                {oneOffExpenses.length} variables
              </span>
            </div>

            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-black text-fg tracking-tight break-words">
                {formatCurrency(totalOneOff, currency)}
              </span>
            </div>

            <p className="text-[11px] text-fg-muted mt-1">
              S'effacent et s'archivent lors de la validation.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-fg-muted font-semibold">
            <span>S'effacent à la validation</span>
            <span>
              {totalExpenses > 0 ? Math.round((totalOneOff / totalExpenses) * 100) : 0}% du total
            </span>
          </div>
        </div>

      </div>

      {/* GRAPHIQUE DE TENDANCE DES DÉPENSES MENSUELLES */}
      <ExpenseTrendChart
        data={data}
        selectedMonth={selectedMonth}
        currency={currency}
        onSelectMonth={setSelectedMonth}
      />

      {/* RECHERCHE & FILTRES - Responsive Smartphone */}
      <div className="bg-surface rounded-3xl p-3 sm:p-4 border border-line flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une dépense (Loyer, CIE, Courses)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActivePage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-2 border border-line text-xs sm:text-sm text-fg placeholder-slate-400 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FintechSelect
            value={selectedCategoryFilter}
            className="w-auto min-w-[170px]"
            triggerClassName="py-2 text-xs"
            options={[
              { value: 'all', label: 'Toutes catégories' },
              ...CATEGORIES.map(cat => ({
                value: cat,
                label: cat,
              }))
            ]}
            onChange={(val) => {
              setSelectedCategoryFilter(val);
              setActivePage(1);
            }}
          />

          <button
            onClick={() => {
              setFilterRecurringOnly(!filterRecurringOnly);
              setActivePage(1);
            }}
            className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors border ${
              filterRecurringOnly
                ? 'bg-brand text-brand-fg border-brand'
                : 'bg-surface-2 text-fg-2 border-line hover:text-fg'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Récurrentes • {recurringExpenses.length}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTE DES DÉPENSES DU MOIS (PAGINÉE STRICTEMENT À 5 MAXI AVEC FLÈCHES)    */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-3xl border border-line overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-extrabold text-fg flex items-center gap-2">
              <span>Dépenses du mois</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface-2 text-brand border border-brand/25">
              {displayedActiveExpenses.length} en cours
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-fg-muted">Total en cours :</span>
            <span className="font-black px-2.5 py-1 rounded-full bg-surface-2 border border-line-strong text-xs text-brand">
              {formatCurrency(activeTotal, currency)}
            </span>
          </div>
        </div>

        {displayedActiveExpenses.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 text-brand flex items-center justify-center mx-auto mb-3 border border-line">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-fg">
              {settledExpenses.length > 0 
                ? `Toutes les dépenses ponctuelles de ${formatMonthKey(selectedMonth)} ont été réglées !`
                : 'Aucune dépense en cours pour ce mois'}
            </h3>
            <p className="text-xs text-fg-muted max-w-sm mx-auto mt-1">
              {settledExpenses.length > 0 
                ? 'Les dépenses réglées sont archivées. Vous pouvez rajouter une nouvelle dépense à tout moment.'
                : 'Commencez à lister vos dépenses en cliquant sur le bouton ci-dessous.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(var(--brand-rgb),0.35)] active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Ajouter une dépense</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-line">
              {paginatedActiveExpenses.map((exp) => {
                const isEditingThis = editingExpenseId === exp.id;
                const hasVariation = exp.recurringOriginalAmount !== undefined && exp.recurringOriginalAmount !== exp.amount;

                return (
                  <div
                    key={exp.id}
                    className="p-3.5 sm:p-4 flex flex-col xs:flex-row xs:items-center justify-between gap-3 transition-colors hover:bg-surface"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-surface-2 text-brand flex items-center justify-center border border-line shrink-0 mt-0.5">
                        <Receipt className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-fg break-words">
                            {exp.title}
                          </span>

                          {exp.isRecurring && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 text-brand border border-brand/30 shrink-0">
                              <Repeat className="w-3 h-3" />
                              <span>Récurrente • Conservée</span>
                            </span>
                          )}

                          {hasVariation && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                              Ajusté • base : {formatCurrency(exp.recurringOriginalAmount!, currency)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-fg-muted mt-1">
                          <span className="font-semibold text-fg-2">{exp.category}</span>
                          <span>•</span>
                          <span>{formatDateFr(exp.date)}</span>
                          {exp.note && (
                            <>
                              <span>•</span>
                              <span className="italic text-fg-muted truncate max-w-xs">{exp.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between xs:justify-end gap-2.5 pt-1 xs:pt-0 shrink-0 border-t xs:border-t-0 border-line">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-full border border-line-strong">
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={tempAmount}
                            onChange={(e) => setTempAmount(e.target.value)}
                            className="w-24 px-2 py-0.5 text-xs font-bold bg-surface text-fg rounded-full border border-line-strong focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveExpenseAmount(exp)}
                            className="p-1 rounded-full bg-brand text-brand-fg hover:bg-brand-hover"
                            title="Confirmer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => setEditingExpenseId(null)}
                            className="p-1 rounded-full bg-surface-3 text-fg-2"
                            title="Annuler"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditAmount(exp)}
                          className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 hover:bg-surface-2 border border-line text-right"
                          title="Cliquer pour ajuster le montant"
                        >
                          <span className="text-sm font-black text-fg">
                            {formatCurrency(exp.amount, currency)}
                          </span>
                          <Edit3 className="w-3 h-3 text-fg-muted group-hover:text-brand" />
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 rounded-full text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Supprimer la dépense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BARRE DE NAVIGATION FLÈCHES GAUCHE / DROITE SI PLUS DE 5 DÉPENSES */}
            {displayedActiveExpenses.length > ITEMS_PER_PAGE && (
              <div className="px-4 sm:px-5 py-3 border-t border-line flex items-center justify-between text-xs bg-surface">
                <span className="text-fg-muted font-medium text-[11px] sm:text-xs">
                  {displayedActiveExpenses.length} dépenses • Page {activePage} sur {totalActivePages} (5 maxi par vue)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activePage === 1}
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                    title="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Précédent</span>
                  </button>
                  <button
                    type="button"
                    disabled={activePage === totalActivePages}
                    onClick={() => setActivePage((p) => Math.min(totalActivePages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                    title="Page suivante"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOUTON « VALIDER » : Placé STRICTEMENT sous la liste des dépenses */}
      {/* Conserve les récurrentes et règle les dépenses ponctuelles */}
      {displayedActiveExpenses.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-xs text-fg-muted text-center sm:text-left">
            <span className="text-brand font-bold">Astuce :</span> Les dépenses récurrentes resteront dans la liste. Le reste des dépenses ponctuelles sera validé et archivé.
          </p>

          <button
            type="button"
            onClick={handleValidate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-sm sm:text-base shadow-[0_0_25px_rgba(var(--brand-rgb),0.4)] transition-all duration-150 active:scale-95 cursor-pointer"
            title="Valider les dépenses du mois"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Valider les dépenses du mois</span>
          </button>
        </div>
      )}

      {/* HISTORIQUE CONSULTATIF DES DÉPENSES RÉGLÉES (PAGINÉ À 5 MAXI AVEC FLÈCHES) */}
      {settledExpenses.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-line space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-brand">
              <CheckCheck className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="font-extrabold text-fg">
                {settledExpenses.length} dépense{settledExpenses.length > 1 ? 's' : ''} réglée{settledExpenses.length > 1 ? 's' : ''} en {formatMonthKey(selectedMonth)} ({formatCurrency(totalPaidExpenses, currency)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettledHistory(!showSettledHistory)}
                className="px-3.5 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 text-fg-2 hover:text-fg border border-line-strong text-[11px] font-bold transition-all cursor-pointer"
              >
                {showSettledHistory ? 'Masquer les réglées' : `Consulter les réglées (${settledExpenses.length})`}
              </button>

              <button
                type="button"
                onClick={() => onValidateAllMonthExpenses(selectedMonth, false)}
                className="px-3 py-1.5 rounded-full bg-surface-2 text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 border border-line-strong text-[10px] font-semibold transition-all cursor-pointer"
                title="Dévalider pour réactiver ces dépenses dans la liste"
              >
                Dévalider
              </button>
            </div>
          </div>

          {showSettledHistory && (
            <div className="pt-2 border-t border-line animate-fadeIn">
              <div className="divide-y divide-line">
                {paginatedSettledExpenses.map((exp) => (
                  <div key={exp.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                      <span className="font-bold text-fg-2 truncate">{exp.title}</span>
                      <span className="text-[10px] text-fg-muted shrink-0">({exp.category})</span>
                    </div>
                    <span className="font-black text-brand shrink-0">{formatCurrency(exp.amount, currency)}</span>
                  </div>
                ))}
              </div>

              {/* Navigation flèches si plus de 5 dépenses réglées */}
              {settledExpenses.length > ITEMS_PER_PAGE && (
                <div className="pt-3 mt-2 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-fg-muted text-[11px]">
                    Page {settledPage} sur {totalSettledPages} (5 réglées par vue)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={settledPage === 1}
                      onClick={() => setSettledPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Page précédente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={settledPage === totalSettledPages}
                      onClick={() => setSettledPage((p) => Math.min(totalSettledPages, p + 1))}
                      className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Page suivante"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE DE L'HISTORIQUE DES DÉPENSES DES MOIS (5 LIGNES MAXI ET AU-DELÀ)      */}
      {/* "la vue de l'historique des dépenses des mois doit avoir la meme logique    */}
      {/* que celle de épargne (5lignes maxi et au delà...)"                        */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-3xl border border-line overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-2 text-brand flex items-center justify-center border border-line-strong">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-fg">
                Historique des dépenses des mois
              </h2>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-surface-2 text-brand border border-brand/25 shrink-0">
            {allRecordedMonths.length} mois au total
          </span>
        </div>

        <div className="divide-y divide-line">
          {paginatedRecordedMonths.map((mKey) => {
            const mPaid = (data.expenses[mKey] || [])
              .filter((e) => e.isPaid)
              .sort((x, y) => y.date.localeCompare(x.date));
            const mTotal = mPaid.reduce((s, e) => s + e.amount, 0);
            const isSelected = mKey === selectedMonth;
            const isOpen = expandedHistoryMonth === mKey;

            return (
              <div key={mKey} className={isSelected ? 'bg-surface-2' : ''}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth && setSelectedMonth(mKey);
                    setExpandedHistoryMonth(isOpen ? null : mKey);
                  }}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      isSelected ? 'bg-brand text-brand-fg border-brand' : 'bg-surface-2 text-fg-2 border-line'
                    }`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-fg">{formatMonthKey(mKey)}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-brand/15 text-brand border border-brand/30">
                            Mois actif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-fg-muted mt-0.5">
                        {mPaid.length === 0
                          ? 'Aucune dépense validée'
                          : `${mPaid.length} dépense${mPaid.length > 1 ? 's' : ''} validée${mPaid.length > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black text-fg tabular-nums">{formatCurrency(mTotal, currency)}</span>
                    <ChevronRight className={`w-4 h-4 text-fg-muted transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3.5 sm:px-4 pb-3.5 animate-fadeIn">
                    {mPaid.length === 0 ? (
                      <p className="text-xs text-fg-muted py-2 pl-12">
                        Validez les dépenses du mois pour les retrouver ici.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {mPaid.map((e) => (
                          <li
                            key={e.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-surface border border-line px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-fg truncate">{e.title}</p>
                              <p className="text-[10px] text-fg-muted">{formatDateFr(e.date)} • {e.category}</p>
                            </div>
                            <span className="text-xs font-black text-rose-400 tabular-nums whitespace-nowrap">
                              -{formatCurrency(e.amount, currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation flèches gauche / droite de l'historique des mois si > 5 mois */}
        {allRecordedMonths.length > ITEMS_PER_PAGE && (
          <div className="px-4 sm:px-5 py-3 border-t border-line flex items-center justify-between text-xs bg-surface">
            <span className="text-fg-muted font-medium text-[11px] sm:text-xs">
              Affichage de {paginatedRecordedMonths.length} sur {allRecordedMonths.length} mois (Page {monthsHistoryPage} sur {totalMonthsPages})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={monthsHistoryPage === 1}
                onClick={() => setMonthsHistoryPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                title="Mois précédents"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>
              <button
                type="button"
                disabled={monthsHistoryPage === totalMonthsPages}
                onClick={() => setMonthsHistoryPage((p) => Math.min(totalMonthsPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-strong text-fg-2 hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                title="Mois suivants"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
