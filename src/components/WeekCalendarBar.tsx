import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Equal } from 'lucide-react';
import { FRENCH_DAYS_SHORT, formatMonthKey, getCalendarGrid, getTodayDateString } from '../utils/date';

interface WeekCalendarBarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** Dates (YYYY-MM-DD) comportant au moins une dépense */
  expenseDates: Set<string>;
  /** Dates (YYYY-MM-DD) comportant au moins un versement d'épargne */
  savingsDates: Set<string>;
  /** Part du salaire encore disponible (0-100), affichée dans l'anneau */
  ringValue: number;
}

const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fromKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}
function weekOf(key: string): string[] {
  const d = fromKey(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
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

/** Anneau animé : part du salaire encore disponible. */
const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative w-12 h-12 shrink-0" title="Part du salaire disponible">
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

/**
 * Calendrier permanent (bandeau semaine glissable + vue mois dépliable).
 * Remplace l'en-tête sur tous les écrans hors tableau de bord.
 */
export const WeekCalendarBar: React.FC<WeekCalendarBarProps> = ({
  selectedDate,
  onSelectDate,
  expenseDates,
  savingsDates,
  ringValue,
}) => {
  const today = getTodayDateString();
  const [expanded, setExpanded] = useState(false);
  const [direction, setDirection] = useState(0);

  const week = useMemo(() => weekOf(selectedDate), [selectedDate]);
  const selectedMonth = selectedDate.slice(0, 7);
  const monthGrid = useMemo(() => getCalendarGrid(selectedMonth), [selectedMonth]);

  const moveWeek = (dir: 1 | -1) => {
    setDirection(dir);
    onSelectDate(shiftDays(selectedDate, dir * 7));
  };

  return (
    <div className="rounded-[28px] bg-surface border border-line p-2.5 sm:p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-11 h-11 shrink-0 rounded-full bg-surface-3 border border-line-strong flex items-center justify-center text-fg cursor-pointer"
          title={expanded ? 'Replier le calendrier' : 'Afficher le mois'}
        >
          <Equal className="w-5 h-5 stroke-[2.6]" />
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
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDate(key)}
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
                {expenseDates.has(key) && <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-danger" />}
                {savingsDates.has(key) && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-success" />}
                {isToday && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-fg" />}
              </button>
            );
          })}
        </motion.div>

        <ProgressRing value={ringValue} />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="block mx-auto mt-2 w-10 h-1.5 rounded-full bg-line-strong cursor-pointer"
        aria-label="Déplier le calendrier"
      />

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
                  const isSelected = cell.dateString === selectedDate;
                  return (
                    <button
                      key={cell.dateString}
                      type="button"
                      disabled={!cell.isCurrentMonth}
                      onClick={() => onSelectDate(cell.dateString)}
                      className={`relative h-9 rounded-xl text-xs font-bold tabular-nums cursor-pointer border ${
                        isSelected
                          ? 'bg-brand text-brand-fg border-brand'
                          : cell.isCurrentMonth
                          ? 'bg-surface-2 border-line text-fg-2 hover:border-line-strong'
                          : 'border-transparent text-fg-muted opacity-25'
                      }`}
                    >
                      {cell.dayNumber}
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {expenseDates.has(cell.dateString) && <span className="w-1 h-1 rounded-full bg-danger" />}
                        {savingsDates.has(cell.dateString) && <span className="w-1 h-1 rounded-full bg-success" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
