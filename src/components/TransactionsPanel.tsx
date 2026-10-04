import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Receipt } from 'lucide-react';
import { formatDateFr, getTodayDateString } from '../utils/date';
import { Amount } from './Amount';
import { Pager, usePager } from './Pager';
import { TransactionItem } from './TransactionSheet';

type Filter = 'all' | 'expense' | 'savings';

interface TransactionsPanelProps {
  items: TransactionItem[];
  currency: string;
  monthLabel: string;
  onSelect: (item: TransactionItem) => void;
  onSeeAll: () => void;
  onAddFirst: () => void;
}

function dayLabel(date: string): string {
  const today = getTodayDateString();
  if (date === today) return "Aujourd'hui";
  const y = new Date(`${today}T12:00:00`);
  y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  return date === yesterday ? 'Hier' : formatDateFr(date);
}


/** Opérations du mois : filtres en pastilles, groupes par jour repliables, liseré de couleur. */
export const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
  items,
  currency,
  monthLabel,
  onSelect,
  onSeeAll,
  onAddFirst,
}) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const counts = {
    all: items.length,
    expense: items.filter((i) => i.type === 'expense').length,
    savings: items.filter((i) => i.type === 'savings').length,
  };

  const visibleItems = useMemo(
    () => items.filter((i) => filter === 'all' || i.type === filter).sort((a, b) => b.date.localeCompare(a.date)),
    [items, filter],
  );
  const { page, setPage, pageCount, pageItems } = usePager(visibleItems, filter);

  // Les 5 opérations de la page, regroupées par jour
  const groups = useMemo(() => {
    const map = new Map<string, TransactionItem[]>();
    pageItems.forEach((i) => map.set(i.date, [...(map.get(i.date) || []), i]));
    return [...map.entries()];
  }, [pageItems]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'expense', label: 'Dépenses' },
    { id: 'savings', label: 'Épargne' },
  ];

  return (
    <div className="rounded-[30px] bg-surface border border-line p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-lg font-extrabold text-fg tracking-tight leading-tight">Opérations</h3>
          <p className="text-[11px] text-fg-muted capitalize">{monthLabel}</p>
        </div>
        <button type="button" onClick={onSeeAll} className="text-[11px] font-semibold text-fg-muted hover:text-fg cursor-pointer py-2">
          Voir tout
        </button>
      </div>

      {/* Pastilles de filtre */}
      <div className="flex items-center gap-2 mb-3">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="relative px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
            >
              {active && (
                <motion.span
                  layoutId="tx-filter-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-brand"
                />
              )}
              <span className={`relative flex items-center gap-1.5 ${active ? 'text-brand-fg' : 'text-fg-2'}`}>
                {f.label}
                {counts[f.id] > 0 && (
                  <span className={`text-[10px] font-black ${active ? 'text-brand-fg/70' : 'text-fg-muted'}`}>{counts[f.id]}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-fg-muted text-xs">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Aucune opération pour le moment.</p>
          <button onClick={onAddFirst} className="mt-3 px-4 py-2 rounded-full bg-brand text-brand-fg text-xs font-extrabold cursor-pointer">
            + Ajouter une dépense
          </button>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-center py-6 text-xs text-fg-muted">Aucune opération dans ce filtre.</p>
      ) : (
        <div className="space-y-3">
          {groups.map(([date, list]) => {
            const isClosed = !!collapsed[date];
            return (
              <div key={date}>
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [date]: !c[date] }))}
                  className="w-full flex items-center justify-between rounded-2xl bg-surface-2 border border-line px-3.5 py-2.5 cursor-pointer"
                >
                  <span className="text-[13px] font-bold text-fg">{dayLabel(date)}</span>
                  <span className="flex items-center gap-2 text-[11px] text-fg-muted">
                    {list.length} opération{list.length > 1 ? 's' : ''}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isClosed ? '-rotate-90' : ''}`} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {!isClosed && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
                      className="overflow-hidden"
                    >
                      {list.map((tx) => {
                        const isExpense = tx.type === 'expense';
                        return (
                          <li key={tx.id} className="pt-2">
                            <button
                              type="button"
                              onClick={() => onSelect(tx)}
                              className="w-full flex items-stretch gap-3 rounded-2xl bg-surface-2/60 hover:bg-surface-2 border border-line p-3 text-left cursor-pointer"
                            >
                              <span className={`w-1 rounded-full shrink-0 ${isExpense ? 'bg-danger' : 'bg-success'}`} />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-fg truncate">{tx.title}</span>
                                <span className="block text-[11px] text-fg-muted truncate">
                                  {isExpense ? tx.category : tx.projectName || 'Épargne'}
                                  {tx.isRecurring ? ' • récurrente' : ''}
                                </span>
                              </span>
                              <span className="text-right shrink-0 flex flex-col justify-center">
                                <span className={`text-[17px] leading-tight ${isExpense ? 'text-fg' : 'text-success'}`}>
                                  <span className="num-light">{isExpense ? '−' : '+'}</span>
                                  <Amount value={tx.amount} currency={currency} className="!text-[17px]" />
                                </span>
                                <span className="text-[10px] text-fg-muted">
                                  {isExpense ? (tx.isPaid ? 'Validée' : 'En cours') : 'Versement'}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <Pager page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}
    </div>
  );
};
