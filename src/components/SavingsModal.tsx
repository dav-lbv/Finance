import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  PiggyBank, 
  AlertCircle, 
  Target, 
  Sparkles, 
  Plus
} from 'lucide-react';
import { SavingsDeposit, SavingsProject } from '../types';
import { formatCurrency } from '../utils/date';
import { DatePicker } from './DatePicker';
import { FintechSelect } from './FintechSelect';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deposit: Omit<SavingsDeposit, 'id'>) => void;
  selectedMonth: string;
  currency: string;
  projects?: SavingsProject[];
  /** Projet présélectionné à l'ouverture (mode « Projets ») */
  initialProjectId?: string;
  onContributeToProject?: (
    projectId: string,
    amount: number,
    alsoRecordSavings: boolean,
    closeProjectIfReached: boolean,
    customDate?: string,
    customNote?: string
  ) => void;
  onOpenCreateProject?: () => void;
}

export const SavingsModal: React.FC<SavingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedMonth,
  currency,
  projects = [],
  initialProjectId,
  onContributeToProject,
  onOpenCreateProject,
}) => {
  // Le choix demandé : d'un côté "Versement" et de l'autre "Projets"
  const [savingsMode, setSavingsMode] = useState<'monthly' | 'project'>('monthly');

  // Champs de saisie (sans note/description, le système détermine automatiquement le libellé)
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(`${selectedMonth}-05`);
  const [error, setError] = useState('');

  // Projets actifs (non clôturés)
  const activeProjects = projects.filter((p) => !p.isClosed);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjects.length > 0 ? activeProjects[0].id : ''
  );
  const [autoCloseIfReached, setAutoCloseIfReached] = useState(true);

  // Synchroniser la sélection de projet
  useEffect(() => {
    if (activeProjects.length > 0 && !activeProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Réinitialiser les champs quand le mois change ou quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setDate(`${selectedMonth}-05`);
      setAmount('');
      setError('');
      if (initialProjectId && projects.some((p) => p.id === initialProjectId && !p.isClosed)) {
        setSavingsMode('project');
        setSelectedProjectId(initialProjectId);
      } else {
        setSavingsMode('monthly');
      }
    }
  }, [isOpen, selectedMonth, initialProjectId]);

  if (!isOpen) return null;

  const selectedProject = activeProjects.find((p) => p.id === selectedProjectId);
  const parsedAmount = parseFloat(amount) || 0;

  // Calculs de simulation si mode projet
  const currentProjAmount = selectedProject ? selectedProject.currentAmount : 0;
  const targetProjAmount = selectedProject ? selectedProject.targetAmount : 1;
  const newProjAmount = currentProjAmount + parsedAmount;
  const currentPercentage = Math.min(100, Math.round((currentProjAmount / targetProjAmount) * 100));
  const newPercentage = Math.min(100, Math.round((newProjAmount / targetProjAmount) * 100));
  const isGoalReachedWithThisDeposit = selectedProject ? newProjAmount >= selectedProject.targetAmount : false;
  const remainingBefore = Math.max(0, targetProjAmount - currentProjAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }

    if (savingsMode === 'monthly') {
      // 1. Versement classique : Le système sait automatiquement qu'il s'agit d'un versement mensuel
      onSave({
        amount: parsedAmount,
        date,
        note: 'Versement mensuel',
        depositType: 'monthly',
      });
    } else {
      // 2. Projet : Le système sait automatiquement qu'il s'agit d'une épargne projet et figure toujours dans l'historique général
      if (!selectedProject) {
        setError('Veuillez sélectionner un projet en cours.');
        return;
      }

      if (onContributeToProject) {
        onContributeToProject(
          selectedProject.id,
          parsedAmount,
          true, // TOUJOURS enregistré dans l'historique général automatiquement
          autoCloseIfReached,
          date,
          `Projet : ${selectedProject.title}`
        );
      } else {
        // Fallback
        onSave({
          amount: parsedAmount,
          date,
          note: `Projet : ${selectedProject.title}`,
          depositType: 'project',
          projectId: selectedProject.id,
          projectName: selectedProject.title,
        });
      }
    }

    setAmount('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-surface rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-line text-fg relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Titre & Icône */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-surface-2 text-brand flex items-center justify-center border border-line-strong shrink-0">
            {savingsMode === 'monthly' ? (
              <PiggyBank className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <Target className="w-5 h-5 text-brand stroke-[2.2]" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-fg tracking-tight">
              Saisir une Épargne
            </h2>
            <p className="text-xs text-fg-muted">
              Choisissez d'effectuer un versement ou d'alimenter un projet
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LE CHOIX DEMANDÉ : D'UN CÔTÉ "VERSEMENT" ET DE L'AUTRE "PROJETS"*/}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface rounded-2xl border border-line mb-5">
          <button
            type="button"
            onClick={() => {
              setSavingsMode('monthly');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer text-xs font-black flex items-center justify-center gap-2 ${
              savingsMode === 'monthly'
                ? 'bg-brand text-brand-fg shadow-md'
                : 'text-fg-muted hover:text-fg hover:bg-surface-2'
            }`}
          >
            <span>Versement</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSavingsMode('project');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer text-xs font-black flex items-center justify-center gap-2 ${
              savingsMode === 'project'
                ? 'bg-brand text-brand-fg shadow-md'
                : 'text-fg-muted hover:text-fg hover:bg-surface-2'
            }`}
          >
            <span>Projets</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                savingsMode === 'project'
                  ? 'bg-brand text-brand-fg'
                  : 'bg-brand/20 text-brand'
              }`}
            >
              {activeProjects.length}
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ========================================================== */}
          {/* SÉLECTION DU PROJET (SI MODE PROJETS)                      */}
          {/* ========================================================== */}
          {savingsMode === 'project' && (
            <div className="space-y-3 animate-fadeIn">
              {activeProjects.length === 0 ? (
                <div className="p-4 rounded-2xl bg-surface-2 border border-line-strong text-center">
                  <Target className="w-8 h-8 text-fg-muted mx-auto mb-2" />
                  <p className="text-xs font-bold text-fg">
                    Aucun projet en cours pour l'instant
                  </p>
                  <p className="text-[11px] text-fg-muted mt-1 mb-3">
                    Créez un premier projet avec un objectif (ordinateur, voyage...) pour l'alimenter.
                  </p>
                  {onOpenCreateProject && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCreateProject();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-brand-fg font-extrabold text-xs shadow-md hover:bg-brand-hover"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Créer un projet</span>
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <FintechSelect
                    label="Projet non clôturé à alimenter"
                    value={selectedProjectId}
                    options={activeProjects.map((p) => ({
                      value: p.id,
                      label: p.title,
                      badge: `${Math.min(100, Math.round((p.currentAmount / p.targetAmount) * 100))}%`,
                      description: `${formatCurrency(p.currentAmount, currency)} sur ${formatCurrency(p.targetAmount, currency)}`,
                    }))}
                    onChange={(val) => setSelectedProjectId(val)}
                  />

                  {/* Fiche récapitulative du projet choisi */}
                  {selectedProject && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-surface-2 border border-line-strong">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-black text-fg truncate">{selectedProject.title}</span>
                        <span className="text-[10px] font-black text-brand bg-surface px-2 py-0.5 rounded-full border border-line-strong">
                          {currentPercentage}% atteint
                        </span>
                      </div>
                      
                      <div className="w-full bg-surface h-2 rounded-full overflow-hidden my-1.5 border border-line">
                        <div
                          className="h-full bg-gradient-to-r from-fg-muted to-brand transition-all duration-300"
                          style={{ width: `${currentPercentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-fg-muted">
                        <span>Actuel : {formatCurrency(selectedProject.currentAmount, currency)}</span>
                        <span>Objectif : {formatCurrency(selectedProject.targetAmount, currency)}</span>
                      </div>
                      <div className="text-[10px] text-fg-2 mt-1">
                        Reste à verser : <strong className="text-fg">{formatCurrency(remainingBefore, currency)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* MONTANT                                                    */}
          {/* ========================================================== */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-fg-2 mb-1">
              Montant du versement ({currency})
            </label>
            <input
              type="number" inputMode="decimal"
              step="any"
              min="1"
              required
              placeholder={currency === 'FCFA' || currency === 'CFA' ? 'Ex: 50000' : 'Ex: 400'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-surface-2 border border-line-strong text-base font-black text-fg focus:outline-none focus:border-brand"
              autoFocus
            />
          </div>

          {/* Simulation projet en temps réel si montant saisi */}
          {savingsMode === 'project' && selectedProject && parsedAmount > 0 && (
            <div className={`p-3 rounded-2xl border transition-all animate-fadeIn ${
              isGoalReachedWithThisDeposit
                ? 'bg-surface-2 border-brand text-fg shadow-[0_0_15px_rgba(var(--brand-rgb),0.15)]'
                : 'bg-surface-2 border-line-strong'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-fg-2">Nouveau total visé :</span>
                <span className="font-black text-brand text-xs">
                  {newPercentage}% • {formatCurrency(newProjAmount, currency)} sur {formatCurrency(targetProjAmount, currency)}
                </span>
              </div>

              <div className="w-full bg-surface h-2 rounded-full overflow-hidden my-1 border border-line">
                <div
                  className="h-full bg-gradient-to-r from-fg-muted via-fg-2 to-brand transition-all duration-300"
                  style={{ width: `${newPercentage}%` }}
                />
              </div>

              {isGoalReachedWithThisDeposit ? (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-brand">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Objectif atteint à 100% avec ce versement !</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-fg font-bold bg-surface-3 p-2 rounded-xl border border-line-strong cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCloseIfReached}
                      onChange={(e) => setAutoCloseIfReached(e.target.checked)}
                      className="accent-brand rounded"
                    />
                    <span>Fermer et clôturer ce projet</span>
                  </label>
                </div>
              ) : (
                <span className="text-[10px] text-fg-muted block">
                  Reste après versement : {formatCurrency(Math.max(0, targetProjAmount - newProjAmount), currency)}
                </span>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* NOUVEAU CALENDRIER POPOVER DÉROULANT STYLE SHADCN          */}
          {/* ========================================================== */}
          <div>
            <DatePicker
              label="Date du versement"
              value={date}
              onChange={setDate}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="sheet-footer flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-full bg-surface-2 hover:bg-surface-3 text-fg-2 text-sm font-semibold whitespace-nowrap"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={savingsMode === 'project' && activeProjects.length === 0}
              className="flex-1 sm:flex-none px-5 py-3 rounded-full bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-brand-fg font-extrabold text-sm whitespace-nowrap shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)] flex items-center justify-center gap-2 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {savingsMode === 'monthly'
                  ? 'Enregistrer'
                  : isGoalReachedWithThisDeposit && autoCloseIfReached
                  ? 'Verser & Clôturer'
                  : 'Alimenter le projet'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
