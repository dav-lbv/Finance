import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PiggyBank } from 'lucide-react';
import { Pager, usePager } from './Pager';
import { SavingsDeposit } from '../types';
import { formatCurrency, formatDateFr } from '../utils/date';

interface SavingsDayTimelineProps {
  deposits: SavingsDeposit[];
  selectedDate: string;
  currency: string;
  /** Taux d'épargne du mois (0-100) */
  savingsRate: number;
}

/** Versements du jour sélectionné dans le calendrier permanent, en timeline. */
export const SavingsDayTimeline: React.FC<SavingsDayTimelineProps> = ({
  deposits,
  selectedDate,
  currency,
  savingsRate,
}) => {
  const dayDeposits = deposits.filter((d) => d.date === selectedDate);
  const dayTotal = dayDeposits.reduce((acc, d) => acc + d.amount, 0);
  const { page, setPage, pageCount, pageItems } = usePager(dayDeposits, selectedDate);

  return (
    <div className="lg:col-span-7">
      <div className="rounded-[28px] bg-surface border border-line p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-fg capitalize">{formatDateFr(selectedDate)}</h3>
            <p className="text-[11px] text-fg-muted">
              {dayDeposits.length === 0
                ? 'Aucun versement ce jour'
                : `${dayDeposits.length} versement${dayDeposits.length > 1 ? 's' : ''} • ${formatCurrency(dayTotal, currency)}`}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-2 border border-line text-fg-2">
            Score {Math.round(savingsRate)}%
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="relative pl-7"
          >
            {/* Rail de la timeline */}
            <span className="absolute left-2.5 top-1 bottom-1 w-px bg-line-strong" />

            {dayDeposits.length === 0 ? (
              <div className="relative rounded-2xl border border-dashed border-line-strong p-4 text-xs text-fg-muted">
                <span className="absolute -left-[22px] top-4 w-2.5 h-2.5 rounded-full bg-surface-3 border border-line-strong" />
                Sélectionnez un jour avec un point vert pour voir vos versements.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pageItems.map((dep, i) => (
                  <motion.div
                    key={dep.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="relative rounded-2xl p-3.5 border border-line-strong bg-gradient-to-br from-success/20 via-surface-2 to-surface-2 sheen"
                  >
                    <span className="absolute -left-[22px] top-4 w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_10px_rgba(var(--success-rgb),0.7)]" />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-brand text-brand-fg flex items-center justify-center shrink-0">
                          <PiggyBank className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-fg tabular-nums">+{formatCurrency(dep.amount, currency)}</p>
                          <p className="text-[11px] text-fg-muted truncate">{dep.note || dep.projectName || 'Versement épargne'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <Pager page={page} pageCount={pageCount} onChange={setPage} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
