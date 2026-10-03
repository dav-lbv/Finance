import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, CheckCircle2, Layers, PiggyBank, Receipt, Repeat, StickyNote, Tag, X } from 'lucide-react';
import { formatDateFr } from '../utils/date';
import { Amount } from './Amount';

export interface TransactionItem {
  id: string;
  type: 'expense' | 'savings';
  title: string;
  category: string;
  amount: number;
  date: string;
  isRecurring?: boolean;
  isPaid?: boolean;
  note?: string;
  projectName?: string;
}

interface TransactionSheetProps {
  item: TransactionItem | null;
  currency: string;
  onClose: () => void;
  onOpenSection: (tab: 'expenses' | 'savings') => void;
}

const Row: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode }> = ({
  icon,
  title,
  subtitle,
  right,
}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-surface-2 border border-line px-3.5 py-3">
    <span className="w-9 h-9 shrink-0 rounded-xl bg-surface-3 text-fg-2 flex items-center justify-center">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold text-fg truncate">{title}</p>
      {subtitle && <p className="text-[11px] text-fg-muted truncate">{subtitle}</p>}
    </div>
    {right}
  </div>
);

/** Détail d'une opération : feuille du bas avec rangées en verre et bouton d'action. */
export const TransactionSheet: React.FC<TransactionSheetProps> = ({ item, currency, onClose, onOpenSection }) => {
  const isExpense = item?.type === 'expense';
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-[34px] bg-surface-solid border border-line p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-line-strong mx-auto mb-4" />

            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                  isExpense ? 'text-fg-2 border-line-strong bg-surface-2' : 'text-success border-success/30 bg-success/10'
                }`}
              >
                {isExpense ? <Receipt className="w-3.5 h-3.5" /> : <PiggyBank className="w-3.5 h-3.5" />}
                {isExpense ? 'Dépense' : 'Épargne'}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-surface-2 border border-line text-fg-muted flex items-center justify-center cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="mt-3 text-[28px] leading-tight font-light tracking-tight text-fg">{item.title}</h3>
            <p className={`mt-2 text-4xl ${isExpense ? 'text-fg' : 'text-success'}`}>
              <Amount value={item.amount} currency={currency} />
            </p>

            <div className="mt-5 space-y-2">
              <Row icon={<Calendar className="w-4 h-4" />} title={formatDateFr(item.date)} subtitle="Date de l'opération" />
              {isExpense ? (
                <>
                  <Row icon={<Tag className="w-4 h-4" />} title={item.category} subtitle="Catégorie" />
                  <Row
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    title={item.isPaid ? 'Validée' : 'En cours'}
                    subtitle="Statut"
                  />
                  {item.isRecurring && (
                    <Row icon={<Repeat className="w-4 h-4" />} title="Récurrente" subtitle="Reconduite chaque mois" />
                  )}
                </>
              ) : (
                <Row
                  icon={<Layers className="w-4 h-4" />}
                  title={item.projectName || 'Versement libre'}
                  subtitle={item.projectName ? 'Projet' : 'Épargne générale'}
                />
              )}
              {item.note && <Row icon={<StickyNote className="w-4 h-4" />} title={item.note} subtitle="Note" />}
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenSection(isExpense ? 'expenses' : 'savings');
                onClose();
              }}
              className="mt-5 w-full py-3.5 rounded-full bg-brand text-brand-fg text-sm font-black cursor-pointer"
            >
              {isExpense ? 'Voir dans Dépenses' : "Voir dans Épargne"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
