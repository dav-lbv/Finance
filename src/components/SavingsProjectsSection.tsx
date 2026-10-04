import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  FolderCheck, 
  Trash2, 
  Edit3, 
  Coins, 
  Check, 
  X,
  Archive,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { SavingsProject } from '../types';
import { formatCurrency, formatDateFr } from '../utils/date';
import { DatePicker } from './DatePicker';
import { FintechSelect } from './FintechSelect';

interface SavingsProjectsSectionProps {
  projects: SavingsProject[];
  currency: string;
  selectedMonth: string;
  onAddProject: (project: Omit<SavingsProject, 'id' | 'createdAt' | 'isClosed'>) => void;
  onUpdateProject: (project: SavingsProject) => void;
  onDeleteProject: (projectId: string) => void;
  onCloseProject: (projectId: string, close: boolean) => void;
  onContributeToProject: (projectId: string, amount: number, alsoRecordSavings: boolean) => void;
  /** Catégories configurées par l'utilisateur (Réglages > Catégories de projets) */
  categories: string[];
  onAddCategory: (name: string) => void;
}

export const SavingsProjectsSection: React.FC<SavingsProjectsSectionProps> = ({
  projects,
  currency,
  selectedMonth,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onCloseProject,
  onContributeToProject,
  categories,
  onAddCategory,
}) => {
  // États Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SavingsProject | null>(null);
  const [contributeProject, setContributeProject] = useState<SavingsProject | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  // Formulaire Projet
  const [projectTitle, setProjectTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [note, setNote] = useState('');

  // Filtre d'affichage
  const [viewFilter, setViewFilter] = useState<'active' | 'closed'>('active');
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);

  const activeProjects = projects.filter((p) => !p.isClosed);
  const closedProjects = projects.filter((p) => p.isClosed);

  const displayedProjects = viewFilter === 'active' ? activeProjects : closedProjects;

  // Calculs totaux
  const totalTarget = activeProjects.reduce((sum, p) => sum + p.targetAmount, 0);
  const totalSaved = activeProjects.reduce((sum, p) => sum + p.currentAmount, 0);
  const globalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  // Ouvrir modal ajout
  const handleOpenAdd = () => {
    setEditingProject(null);
    setProjectTitle('');
    setTargetAmount('');
    setInitialAmount('');
    setTargetDate('');
    setCategory('');
    setNewCategory('');
    setNote('');
    setIsAddModalOpen(true);
  };

  // Ouvrir modal édition
  const handleOpenEdit = (project: SavingsProject) => {
    setEditingProject(project);
    setProjectTitle(project.title);
    setTargetAmount(project.targetAmount.toString());
    setInitialAmount(project.currentAmount.toString());
    setTargetDate(project.targetDate || '');
    setCategory(project.category || '');
    setNewCategory('');
    setNote(project.note || '');
    setIsAddModalOpen(true);
  };

  // Soumission formulaire projet
  const handleSaveProjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0 || !projectTitle.trim()) return;

    const parsedCurrent = parseFloat(initialAmount) || 0;

    if (editingProject) {
      onUpdateProject({
        ...editingProject,
        title: projectTitle.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        targetDate: targetDate || undefined,
        category: category || undefined,
        note: note.trim() || undefined,
      });
    } else {
      onAddProject({
        title: projectTitle.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        targetDate: targetDate || undefined,
        category: category || undefined,
        note: note.trim() || undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  // Soumission versement sur projet
  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeProject) return;

    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) return;

    onContributeToProject(contributeProject.id, amount, true);

    // Vérifier si l'objectif est atteint
    const newTotal = contributeProject.currentAmount + amount;
    if (newTotal >= contributeProject.targetAmount) {
      setCelebrationToast(`Bravo ! L'objectif pour "${contributeProject.title}" est maintenant atteint (100%) ! Vous pouvez le clôturer.`);
      setTimeout(() => setCelebrationToast(null), 6000);
    }

    setContributeProject(null);
    setContributeAmount('');
  };

  // Clôturer un projet avec toast
  const handleClose = (projectId: string) => {
    onCloseProject(projectId, true);
    setCelebrationToast('Projet clôturé et archivé avec succès ! Félicitations pour la réalisation de cet objectif.');
    setTimeout(() => setCelebrationToast(null), 5000);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Toast Célébration */}
      {celebrationToast && (
        <div className="p-4 rounded-2xl bg-surface-2 border-2 border-brand text-fg flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-brand shrink-0" />
            <p className="text-xs sm:text-sm font-bold leading-snug">{celebrationToast}</p>
          </div>
          <button
            onClick={() => setCelebrationToast(null)}
            className="text-fg-muted hover:text-fg p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* En-tête de section Projets */}
      <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30 tracking-wider">
                Objectifs & Projets
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-fg tracking-tight">
              Projets Liés à une Épargne
            </h2>
            <p className="text-xs sm:text-sm text-fg-muted mt-0.5">
              Affectez vos versements à des objectifs précis. Une fois l'objectif atteint, vous pouvez clôturer le projet.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nouveau Projet</span>
            </button>
          </div>
        </div>

        {/* Synthèse globale des projets actifs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line-strong">
            <span className="text-[10px] font-bold uppercase text-fg-muted block">
              Projets en cours
            </span>
            <span className="text-lg font-black text-fg mt-0.5 block">
              {activeProjects.length} projet{activeProjects.length > 1 ? 's' : ''} actif{activeProjects.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line-strong">
            <span className="text-[10px] font-bold uppercase text-fg-muted block">
              Capital alloué aux projets
            </span>
            <span className="text-lg font-black text-brand mt-0.5 block truncate">
              {formatCurrency(totalSaved, currency)}
            </span>
            <span className="text-[10px] text-fg-muted">
              sur {formatCurrency(totalTarget, currency)} visés
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line-strong flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-fg-muted block">
                Progression globale
              </span>
              <span className="text-xs font-black text-brand">{globalProgress}%</span>
            </div>
            <div className="w-full bg-surface h-2 rounded-full overflow-hidden mt-1.5 border border-line">
              <div 
                className="h-full bg-gradient-to-r from-fg-muted to-brand transition-all duration-300"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Onglets Filtre : En cours vs Clôturés */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-line">
          <button
            onClick={() => setViewFilter('active')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
              viewFilter === 'active'
                ? 'bg-brand text-brand-fg shadow-sm'
                : 'bg-surface-2 text-fg-muted hover:text-fg border border-line-strong'
            }`}
          >
            En cours ({activeProjects.length})
          </button>

          <button
            onClick={() => setViewFilter('closed')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
              viewFilter === 'closed'
                ? 'bg-brand text-brand-fg shadow-sm'
                : 'bg-surface-2 text-fg-muted hover:text-fg border border-line-strong'
            }`}
          >
            Clôturés / Réalisés ({closedProjects.length})
          </button>
        </div>
      </div>

      {/* Grille des Cartes Projets */}
      {displayedProjects.length === 0 ? (
        <div className="py-10 text-center bg-surface rounded-3xl border border-line p-6">
          <Target className="w-10 h-10 text-fg-muted mx-auto mb-2" />
          <p className="text-sm font-bold text-fg">
            {viewFilter === 'active' ? 'Aucun projet d\'épargne en cours' : 'Aucun projet clôturé pour le moment'}
          </p>
          <p className="text-xs text-fg-muted max-w-sm mx-auto mt-1">
            {viewFilter === 'active' 
              ? 'Créez votre premier projet (voyage, équipement, urgence...) pour suivre votre progression pas-à-pas.' 
              : 'Les projets dont l\'objectif est atteint et que vous clôturez apparaîtront ici.'}
          </p>
          {viewFilter === 'active' && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 rounded-full bg-brand text-brand-fg font-extrabold text-xs hover:bg-brand-hover transition-all"
            >
              + Créer un premier projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedProjects.map((project) => {
            const progress = project.targetAmount > 0 
              ? Math.min(100, Math.round((project.currentAmount / project.targetAmount) * 100))
              : 0;
            const isCompleted = project.currentAmount >= project.targetAmount;
            const remaining = Math.max(0, project.targetAmount - project.currentAmount);

            return (
              <div
                key={project.id}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                  project.isClosed
                    ? 'bg-surface/70 border-line opacity-80'
                    : isCompleted
                    ? 'bg-gradient-to-b from-surface-2 to-surface border-brand/60 shadow-[0_0_20px_rgba(var(--brand-rgb),0.15)]'
                    : 'bg-surface border-line hover:border-line-strong'
                }`}
              >
                <div>
                  {/* Top Bar du projet */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-fg-muted tracking-wider block">
                        {project.category || 'Épargne Projet'}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-fg tracking-tight truncate mt-0.5">
                        {project.title}
                      </h3>
                    </div>

                    {/* Badge Statut */}
                    {project.isClosed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-surface-3 text-fg-2 border border-line-strong shrink-0">
                        <FolderCheck className="w-3 h-3 text-emerald-400" />
                        <span>Clôturé</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-brand text-brand-fg shadow-sm shrink-0 animate-pulse">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Objectif Atteint !</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold text-brand px-2 py-0.5 rounded-full bg-surface-2 border border-line-strong shrink-0">
                        {progress}%
                      </span>
                    )}
                  </div>

                  {/* Notes / Description */}
                  {project.note && (
                    <p className="text-xs text-fg-2 mb-3 line-clamp-2">
                      {project.note}
                    </p>
                  )}

                  {/* Chiffres & Progression */}
                  <div className="my-3 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl sm:text-2xl font-black text-fg tracking-tight">
                        {formatCurrency(project.currentAmount, currency)}
                      </span>
                      <span className="text-xs font-bold text-fg-muted">
                        sur <strong className="text-fg">{formatCurrency(project.targetAmount, currency)}</strong>
                      </span>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-surface h-2.5 rounded-full overflow-hidden border border-line">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-fg-muted via-fg-2 to-brand'
                            : 'bg-gradient-to-r from-fg-muted to-brand'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-fg-muted pt-0.5">
                      <span>
                        {isCompleted ? (
                          <span className="text-brand font-bold">Objectif 100% complété</span>
                        ) : (
                          <span>Reste : <strong className="text-fg-2">{formatCurrency(remaining, currency)}</strong></span>
                        )}
                      </span>
                      {project.targetDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Échéance : {project.targetDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions sur le projet */}
                <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Clôturer / Réaliser le projet si objectif atteint ou projet ouvert */}
                    {!project.isClosed && isCompleted ? (
                      <button
                        onClick={() => handleClose(project.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-black text-xs shadow-[0_0_15px_rgba(var(--brand-rgb),0.35)] transition-all active:scale-95 cursor-pointer animate-pulse"
                        title="Objectif atteint à 100% ! Cliquez pour fermer / archiver ce projet"
                      >
                        <FolderCheck className="w-4 h-4 stroke-[2.8]" />
                        <span>Fermer le projet • Objectif atteint</span>
                      </button>
                    ) : !project.isClosed ? (
                      <button
                        onClick={() => {
                          setContributeProject(project);
                          setContributeAmount('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 text-brand border border-line-strong font-extrabold text-xs transition-all active:scale-95"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Verser des fonds</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onCloseProject(project.id, false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 text-fg-2 hover:text-fg border border-line-strong font-bold text-xs"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        <span>Rouvrir le projet</span>
                      </button>
                    )}

                    {/* Si projet non clôturé et déjà des fonds, permettre quand même de clôturer si souhaité */}
                    {!project.isClosed && !isCompleted && (
                      <button
                        onClick={() => handleClose(project.id)}
                        className="text-[11px] text-fg-muted hover:text-fg px-2 py-1"
                        title="Fermer ce projet manuellement"
                      >
                        Fermer
                      </button>
                    )}
                  </div>

                  {/* Boutons d'édition & suppression */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(project)}
                      className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
                      title="Modifier le projet"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CRÉATION / ÉDITION PROJET                          */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-md bg-surface border border-line-strong rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base sm:text-lg font-black text-fg">
                {editingProject ? 'Modifier le Projet' : 'Nouveau Projet d\'Épargne'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-fg-muted hover:text-fg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-fg-2 mb-1">
                  Intitulé du projet à réaliser
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="ex: Achat Ordinateur, Voyage, Urgence..."
                  className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 items-end gap-3">
                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1">
                    Objectif ({currency})
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="500000"
                    className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg-2 mb-1">
                    Déjà versé ({currency})
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-fg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  {categories.length > 0 && (
                    <FintechSelect
                      label="Catégorie (optionnel)"
                      value={category}
                      options={[
                        { value: '', label: 'Sans catégorie' },
                        ...categories.map((cat) => ({ value: cat, label: cat })),
                      ]}
                      onChange={setCategory}
                    />
                  )}

                  {/* Création d'une catégorie : elle est enregistrée dans les Réglages */}
                  <label className="block text-xs font-bold text-fg-2 mt-2.5 mb-1">
                    {categories.length > 0 ? 'Ou créer une nouvelle catégorie' : 'Catégorie (optionnel)'}
                  </label>
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const name = newCategory.trim();
                          if (name) {
                            onAddCategory(name);
                            setCategory(name);
                            setNewCategory('');
                          }
                        }
                      }}
                      placeholder="Ex : Voyage, Urgence…"
                      className="flex-1 min-w-0 bg-surface-2 border border-line-strong focus:border-brand rounded-2xl px-4 py-2.5 text-sm text-fg focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!newCategory.trim()}
                      onClick={() => {
                        const name = newCategory.trim();
                        if (!name) return;
                        onAddCategory(name);
                        setCategory(name);
                        setNewCategory('');
                      }}
                      className="shrink-0 px-5 rounded-2xl bg-brand text-brand-fg text-sm font-black disabled:opacity-40 cursor-pointer flex items-center"
                    >
                      Ajouter
                    </button>
                  </div>
                  {categories.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-fg-muted">
                      Aucune catégorie configurée : saisissez-en une, elle sera conservée dans vos Réglages.
                    </p>
                  )}
                </div>

                <div>
                  <DatePicker
                    label="Date limite (Optionnel)"
                    value={targetDate}
                    onChange={setTargetDate}
                    placeholder="Choisir une date d'échéance"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-2 mb-1">
                  Note ou détails (Optionnel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Détails du projet..."
                  rows={2}
                  className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl px-4 py-2 text-xs text-fg focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-surface-2 text-fg-2 hover:text-fg border border-line-strong font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs shadow-md"
                >
                  {editingProject ? 'Enregistrer les modifications' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL VERSER DES FONDS SUR UN PROJET                     */}
      {/* ======================================================== */}
      {contributeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-sm bg-surface border border-line-strong rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <span className="text-[10px] font-black text-brand uppercase">
                  Alimenter le projet
                </span>
                <h3 className="text-base font-black text-fg truncate">
                  {contributeProject.title}
                </h3>
              </div>
              <button
                onClick={() => setContributeProject(null)}
                className="text-fg-muted hover:text-fg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg-2 mb-1">
                  Montant à verser en {currency}
                </label>
                <div className="relative">
                  <input
                    type="number" inputMode="decimal"
                    required
                    min="1"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    placeholder="ex: 50000"
                    autoFocus
                    className="w-full bg-surface-2 border border-line-strong focus:border-brand rounded-2xl pl-4 pr-16 py-3 text-base font-black text-fg focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-brand">
                    {currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-fg-muted mt-1.5">
                  <span>Actuellement : {formatCurrency(contributeProject.currentAmount, currency)}</span>
                  <span>Objectif : {formatCurrency(contributeProject.targetAmount, currency)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContributeProject(null)}
                  className="flex-1 py-2.5 rounded-full bg-surface-2 text-fg-2 hover:text-fg border border-line-strong font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs shadow-md"
                >
                  Confirmer le versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
