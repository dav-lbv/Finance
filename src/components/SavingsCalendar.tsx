import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, LayoutGrid, PiggyBank, Rows3, Trash2 } from 'lucide-react';
import { SavingsDeposit } from '../types';
import {
  FRENCH_DAYS_SHORT,
  formatCurrency,
  formatDateFr,
  formatMonthKey,
  getCalendarGrid,
  getTodayDateString,
} from '../utils/date';

interface SavingsCalendarProps {
  deposits: SavingsDeposit[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  currency: string;
  /** Taux d'épargne du mois (0-100) affiché dans l'anneau */
  savingsRate: number;
  onDelete: (id: string) => void;
}

const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

/** Les 7 dates (lundi → dimanche) de la semaine contenant `key`. */
function weekOf(key: string): string[] {
  const d = fromKey(key);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return toKey(day);
  });
}

function shiftDays(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** Anneau de progression animé (score d'épargne du mois). */
const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--success)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="draw-ring"
          style={{ ['--ring-len' as string]: circumference }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-fg tabular-nums">
        {Math.round(clamped)}
      </span>
    </div>
  );
};

export const SavingsCalendar: React.FC<SavingsCalendarProps> = ({
  deposits,
  selectedMonth,
  setSelectedMonth,
  currency,
  savingsRate,
  onDelete,
}) => {
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`
  );
  const [expanded, setExpanded] = useState(false);
  const [direction, setDirection] = useState(0);

  const depositsByDate = useMemo(() => {
    const map: Record<string, SavingsDeposit[]> = {};
    deposits.forEach((d) => {
      (map[d.date] ||= []).push(d);
    });
    return map;
  }, [deposits]);

  const week = weekOf(selectedDate);
  const dayDeposits = depositsByDate[selectedDate] || [];
  const dayTotal = dayDeposits.reduce((acc, d) => acc + d.amount, 0);

  const selectDate = (key: string) => {
    setSelectedDate(key);
    const monthKey = key.slice(0, 7);
    if (monthKey !== selectedMonth) setSelectedMonth(monthKey);
  };

  const moveWeek = (dir: 1 | -1) => {
    setDirection(dir);
    selectDate(shiftDays(selectedDate, dir * 7));
  };

  const monthGrid = getCalendarGrid(selectedMonth);

  return (
    <div className="lg:col-span-7 space-y-3">
      {/* ======= BANDEAU SEMAINE (pilule en verre) ======= */}
      <div className="rounded-[28px] bg-surface border border-line p-2.5 sm:p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-11 h-11 shrink-0 rounded-full bg-surface-3 border border-line-strong flex items-center justify-center text-fg cursor-pointer"
            title={expanded ? 'Vue semaine' : 'Vue mois'}
          >
            {expanded ? <Rows3 className="w-4.5 h-4.5" /> : <LayoutGrid className="w-4.5 h-4.5" />}
          </button>

          <motion.div
            key={week[0]}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) moveWeek(1);
              else if (info.offset.x > 50) moveWeek(-1);
            }}
            className="flex-1 grid grid-cols-7 gap-0.5 touch-pan-y"
          >
            {week.map((key, i) => {
              const isSelected = key === selectedDate;
              const has = (depositsByDate[key] || []).length > 0;
              const isToday = key === today;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDate(key)}
                  className="relative flex flex-col items-center py-1.5 rounded-2xl cursor-pointer"
                >
                  {isSelected && (
                    <motion.span
                      layoutId="calendar-day-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-2xl bg-surface-3 border border-line-strong"
                    />
                  )}
                  <span className="relative text-[11px] font-semibold text-fg-muted">{DAY_INITIALS[i]}</span>
                  <span className={`relative text-[15px] font-bold tabular-nums ${isSelected || isToday ? 'text-fg' : 'text-fg-2'}`}>
                    {parseInt(key.slice(8, 10), 10)}
                  </span>
                  {has && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-success pulse-dot" />}
                  {isToday && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-fg" />}
                </button>
              );
            })}
          </motion.div>

          <ProgressRing value={savingsRate} />
        </div>

        {/* Poignée : bascule semaine / mois */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="block mx-auto mt-2 w-10 h-1.5 rounded-full bg-line-strong cursor-pointer"
          aria-label="Déplier le calendrier"
        />

        {/* ======= VUE MOIS DÉPLIABLE ======= */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 34 }}
              className="overflow-hidden"
            >
              <div className="pt-3 px-1">
                <div className="flex items-center justify-between mb-2">
                  <button type="button" onClick={() => moveWeek(-1)} className="p-1.5 rounded-full text-fg-muted hover:text-fg cursor-pointer" aria-label="Semaine précédente">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-fg capitalize">{formatMonthKey(selectedMonth)}</span>
                  <button type="button" onClick={() => moveWeek(1)} className="p-1.5 rounded-full text-fg-muted hover:text-fg cursor-pointer" aria-label="Semaine suivante">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-fg-muted pb-1">
                  {FRENCH_DAYS_SHORT.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthGrid.map((cell) => {
                    const has = (depositsByDate[cell.dateString] || []).length > 0;
                    const isSelected = cell.dateString === selectedDate;
                    return (
                      <button
                        key={cell.dateString}
                        type="button"
                        disabled={!cell.isCurrentMonth}
                        onClick={() => selectDate(cell.dateString)}
                        className={`relative h-9 rounded-xl text-xs font-bold tabular-nums cursor-pointer border ${
                          isSelected
                            ? 'bg-brand text-brand-fg border-brand'
                            : cell.isCurrentMonth
                            ? 'bg-surface-2 border-line text-fg-2 hover:border-line-strong'
                            : 'border-transparent text-fg-muted opacity-25'
                        }`}
                      >
                        {cell.dayNumber}
                        {has && (
                          <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-brand-fg' : 'bg-success'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ======= JOURNÉE SÉLECTIONNÉE : timeline ======= */}
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
                {dayDeposits.map((dep, i) => (
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
                      <button
                        type="button"
                        onClick={() => onDelete(dep.id)}
                        className="p-1.5 text-fg-muted hover:text-rose-400 cursor-pointer"
                        title="Supprimer ce versement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
