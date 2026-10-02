import React, { useState } from 'react';
import { X, Check, Repeat, Receipt, AlertCircle, BookmarkPlus, Sparkles } from 'lucide-react';
import { Expense, ExpenseCategory, ExpensePreset } from '../types';
import { DatePicker } from './DatePicker';
import { CategorySelect } from './CategorySelect';
import { FintechSelect } from './FintechSelect';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
  selectedMonth: string;
  currency: string;
  expensePresets?: ExpensePreset[];
  onAddPreset?: (preset: Omit<ExpensePreset, 'id'>) => void;
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

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedMonth,
  currency,
  expensePresets = [],
  onAddPreset,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Alimentation');
  const [date, setDate] = useState(`${selectedMonth}-05`);
  const [isRecurring, setIsRecurring] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // État popup de confirmation pour enregistrer une nouvelle dépense dans les modèles
  const [showSavePresetPrompt, setShowSavePresetPrompt] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<Omit<Expense, 'id'> | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    if (!presetId) return;
    const found = expensePresets.find((p) => p.id === presetId);
    if (found) {
      setTitle(found.title);
      setCategory(found.category);
      if (found.defaultAmount) {
        setAmount(found.defaultAmount.toString());
      }
      setError('');
    }
  };

  const handleValidateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!title.trim()) {
      setError('Veuillez saisir un intitulé pour la dépense.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Veuillez saisir un montant valide.');
      return;
    }

    const newExpenseData: Omit<Expense, 'id'> = {
      title: title.trim(),
      amount: parsedAmount,
      category,
      date,
      isRecurring,
      note: note.trim() || undefined,
      isPaid: false,
    };

    // Vérifier si cette dépense existe déjà dans les presets enregistrés
    const cleanTitle = title.trim().toLowerCase();
    const alreadyExists = expensePresets.some(
      (p) => p.title.trim().toLowerCase() === cleanTitle
    );

    // Si elle n'existe pas et qu'on a le handler onAddPreset, afficher la popup de confirmation
    if (!alreadyExists && onAddPreset) {
      setPendingExpense(newExpenseData);
      setShowSavePresetPrompt(true);
      return;
    }

    // Sinon enregistrement direct
    executeSaveExpense(newExpenseData);
  };

  const executeSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    onSave(expenseData);
    resetForm();
    onClose();
  };

  const handleConfirmSavePreset = (saveToPresets: boolean) => {
    if (!pendingExpense) return;

    if (saveToPresets && onAddPreset) {
      onAddPreset({
        title: pendingExpense.title,
        category: pendingExpense.category,
        defaultAmount: pendingExpense.amount,
      });
    }

    executeSaveExpense(pendingExpense);
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setNote('');
    setIsRecurring(false);
    setError('');
    setShowSavePresetPrompt(false);
    setPendingExpense(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-line text-fg relative">
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-surface-2 text-brand flex items-center justify-center border border-line-strong">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-fg">
              Ajouter une dépense
            </h2>
            <p className="text-xs text-fg-muted">
              Puisera dans le solde de base du mois
            </p>
          </div>
        </div>

        {/* POPUP DE CONFIRMATION SI NOUVELLE DÉPENSE (Non enregistrée dans les paramètres) */}
        {showSavePresetPrompt && pendingExpense ? (
          <div className="space-y-4 py-2 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-surface-2 border border-line-strong text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand text-brand-fg flex items-center justify-center mx-auto font-black shadow-[0_0_15px_rgba(var(--brand-rgb),0.35)]">
                <BookmarkPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-fg">
                Enregistrer dans vos dépenses prédéfinies ?
              </h3>
              <p className="text-xs text-fg-2">
                La dépense <span className="font-bold text-brand">« {pendingExpense.title} »</span> n'est pas encore enregistrée dans vos paramètres.
              </p>
              <p className="text-[11px] text-fg-muted">
                Voulez-vous l'ajouter à vos dépenses types pour pouvoir la sélectionner en 1 clic lors de vos prochains mois ?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmSavePreset(true)}
                className="w-full py-3 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Oui, enregistrer dans mes dépenses prédéfinies</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSavePreset(false)}
                className="w-full py-2.5 rounded-full bg-surface-2 hover:bg-surface-3 text-fg-2 font-semibold text-xs transition-colors border border-line-strong"
              >
                Non, juste pour ce mois-ci
              </button>
            </div>
          </div>
        ) : (
          /* FORMULAIRE PRINCIPAL */
          <form onSubmit={handleValidateAndSubmit} className="space-y-3.5">
            {/* 1. SÉLECTION DÉROULANTE DÉPENSES PRÉ-ENREGISTRÉES */}
            {expensePresets.length > 0 && (
              <div className="p-3 rounded-2xl bg-surface-2 border border-line-strong space-y-1.5">
                <label className="flex items-center justify-between text-[10px] font-bold uppercase text-brand">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Sélectionner une dépense enregistrée</span>
                  </span>
                  <span className="text-fg-muted font-normal lowercase">{expensePresets.length} modèles</span>
                </label>
                <div>
                  <FintechSelect
                    value=""
                    placeholder="Choisir parmi les modèles enregistrés..."
                    options={expensePresets.map((preset) => ({
                      value: preset.id,
                      label: preset.title,
                      badge: preset.category,
                      description: preset.defaultAmount
                        ? `${preset.defaultAmount.toLocaleString('fr-FR')} ${currency}`
                        : undefined,
                    }))}
                    onChange={(presetId) => handleSelectPreset(presetId)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase text-fg-2 mb-1">
                Intitulé de la dépense
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Loyer, CIE Électricité, Marché..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-full bg-surface-2 border border-line-strong text-xs sm:text-sm font-semibold text-fg focus:outline-none focus:border-brand"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-fg-2 mb-1">
                  Montant en {currency}
                </label>
                <input
                  type="number"
                  step={currency === 'FCFA' || currency === 'CFA' ? '100' : '0.01'}
                  min={currency === 'FCFA' || currency === 'CFA' ? '100' : '0.01'}
                  required
                  placeholder={currency === 'FCFA' || currency === 'CFA' ? '25000' : '45.00'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-full bg-surface-2 border border-line-strong text-sm font-black text-fg focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <CategorySelect
                  label="Catégorie"
                  value={category}
                  onChange={setCategory}
                  categories={CATEGORIES}
                />
              </div>
            </div>

            <div>
              <DatePicker
                label="Date de la dépense"
                value={date}
                onChange={setDate}
              />
            </div>

            {/* Option Récurrente */}
            <div className="p-3 rounded-2xl bg-surface-2 border border-line-strong">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand focus:ring-brand accent-brand"
                />
                <div>
                  <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-brand" />
                    <span>Dépense récurrente mensuelle</span>
                  </span>
                  <span className="text-[10px] text-fg-muted block mt-0.5">
                    Reconduite automatiquement chaque mois. Son montant restera modifiable si elle varie durant le mois.
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-fg-2 mb-1">
                Note (optionnelle)
              </label>
              <input
                type="text"
                placeholder="Ex: Facture reçue le 15..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-full bg-surface-2 border border-line-strong text-xs text-fg focus:outline-none focus:border-brand"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 rounded-full bg-surface-2 hover:bg-surface-3 text-fg-2 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-brand hover:bg-brand-hover text-brand-fg font-extrabold text-xs shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)] flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Enregistrer la dépense</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
