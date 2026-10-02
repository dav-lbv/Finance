import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Archive, CheckCircle2, ChevronRight, RotateCcw, X } from 'lucide-react';
import { SavingsDeposit, SavingsProject } from '../types';
import { formatCurrency, formatDateFr } from '../utils/date';

interface SavingsHistoryViewProps {
  projects: SavingsProject[];
  deposits: SavingsDeposit[];
  currency: string;
  onBack: () => void;
  onReopen: (projectId: string) => void;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Historique des projets clôturés (objectif atteint) avec synthèse détaillée. */
export const SavingsHistoryView: React.FC<SavingsHistoryViewProps> = ({
  projects,
  deposits,
  currency,
  onBack,
  onReopen,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const closed = projects
    .filter((p) => p.isClosed)
    .sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));
  const selected = closed.find((p) => p.id === openId) || null;
  const selectedDeposits = selected
    ? deposits.filter((d) => d.projectId === selected.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const totalArchived = closed.reduce((s, p) => s + p.currentAmount, 0);

  return (
    <div className="space-y-4 stagger">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-fg cursor-pointer"
          aria-label="Retour"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-fg tracking-tight">Historique</h2>
          <p className="text-[11px] text-fg-muted">Projets réalisés et archivés</p>
        </div>
      </div>

      <div className="rounded-3xl bg-surface border border-line p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Total réalisé</span>
          <p className="text-2xl font-black text-fg tabular-nums">{formatCurrency(totalArchived, currency)}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-surface-2 border border-line text-fg-2">
          {closed.length} projet{closed.length > 1 ? 's' : ''}
        </span>
      </div>

      {closed.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-dashed border-line-strong p-8 text-center">
          <Archive className="w-8 h-8 mx-auto text-fg-muted mb-2" />
          <p className="text-sm font-bold text-fg">Aucun projet archivé</p>
          <p className="text-xs text-fg-muted mt-1">
            Quand un objectif est atteint, appuyez sur « Clôturer » sur sa carte : il apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {closed.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenId(p.id)}
              className="w-full text-left rounded-2xl bg-surface border border-line p-3.5 flex items-center gap-3 cursor-pointer lift"
            >
              <span className="w-10 h-10 rounded-xl bg-success/15 text-success border border-success/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-fg truncate">{p.title}</p>
                <p className="text-[11px] text-fg-muted">
                  Clôturé le {p.closedAt ? formatDateFr(p.closedAt) : '—'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-fg tabular-nums">{formatCurrency(p.currentAmount, currency)}</p>
                <ChevronRight className="w-4 h-4 text-fg-muted ml-auto" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Synthèse du projet sélectionné (feuille du bas) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenId(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-surface-solid border border-line p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1.5 rounded-full bg-line-strong mx-auto mb-4" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success">Objectif atteint</span>
                  <h3 className="text-xl font-black text-fg leading-tight">{selected.title}</h3>
                  {selected.category && <p className="text-[11px] text-fg-muted">{selected.category}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="p-2 rounded-full bg-surface-2 text-fg-muted cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {[
                  ['Montant visé', formatCurrency(selected.targetAmount, currency)],
                  ['Montant épargné', formatCurrency(selected.currentAmount, currency)],
                  ['Créé le', formatDateFr(selected.createdAt)],
                  ['Clôturé le', selected.closedAt ? formatDateFr(selected.closedAt) : '—'],
                  [
                    'Durée',
                    selected.closedAt ? `${daysBetween(selected.createdAt, selected.closedAt)} jours` : '—',
                  ],
                  ['Versements', `${selectedDeposits.length}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-surface-2 border border-line p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">{label}</span>
                    <p className="text-sm font-black text-fg tabular-nums mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {selected.note && (
                <p className="mt-3 text-xs text-fg-2 rounded-2xl bg-surface-2 border border-line p-3">{selected.note}</p>
              )}

              <h4 className="mt-5 mb-2 text-xs font-extrabold uppercase tracking-wider text-fg-muted">Versements du projet</h4>
              {selectedDeposits.length === 0 ? (
                <p className="text-xs text-fg-muted">Aucun versement rattaché à ce projet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedDeposits.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-xl bg-surface-2 border border-line px-3 py-2"
                    >
                      <span className="text-[11px] text-fg-muted">{formatDateFr(d.date)}</span>
                      <span className="text-xs font-black text-fg tabular-nums">+{formatCurrency(d.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => {
                  onReopen(selected.id);
                  setOpenId(null);
                }}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-surface-2 border border-line-strong text-fg text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Rouvrir ce projet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
