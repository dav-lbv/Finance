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

/** Anneau animé : part du salaire encore disponible (trait épais, repère à la fin de l'arc). */
const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const angle = (clamped / 100) * 2 * Math.PI;
  return (
    <div className="relative w-10 h-10 shrink-0" title="Part du salaire disponible">
      <svg viewBox="0 0 48 48" className="w-10 h-10 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="color-mix(in srgb, var(--fg) 16%, transparent)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--success)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="draw-ring"
          style={{ ['--ring-len' as string]: circumference }}
        />
        {clamped > 0 && clamped < 100 && (
          <circle cx={24 + r * Math.cos(angle)} cy={24 + r * Math.sin(angle)} r="2.1" fill="var(--fg)" />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-fg tabular-nums">
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
    <div className="relative rounded-b-[34px] px-4 pb-[22px] pt-[calc(env(safe-area-inset-top,0px)+14px)] [background:var(--cal-bar)] shadow-[inset_0_-1px_0_var(--glass-edge),0_18px_40px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-11 h-11 shrink-0 rounded-full bg-fg/10 flex items-center justify-center text-fg cursor-pointer"
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
          className="flex-1 grid grid-cols-7 touch-pan-y"
        >
          {week.map((key, i) => {
            const isSelected = key === selectedDate;
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDate(key)}
                className="relative flex flex-col items-center justify-center py-2 rounded-[13px] cursor-pointer"
              >
                {isSelected && (
                  <motion.span
                    layoutId="calendar-day-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="absolute inset-0 rounded-[13px] bg-fg/12"
                  />
                )}
                <span className={`relative text-[12px] leading-none font-semibold ${isSelected ? 'text-fg' : 'text-fg-muted'}`}>{DAY_INITIALS[i]}</span>
                <span className={`relative mt-2 text-[15px] leading-none tabular-nums ${isSelected ? 'font-bold text-fg' : isToday ? 'font-semibold text-fg' : 'font-medium text-fg-2'}`}>
                  {parseInt(key.slice(8, 10), 10)}
                </span>
                {expenseDates.has(key) && <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-danger" />}
                {savingsDates.has(key) && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-success" />}
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
        className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-9 h-[5px] rounded-full bg-fg/25 cursor-pointer"
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
            <div className="pt-4 pb-2 px-1">
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
                      className={`relative h-10 w-10 mx-auto rounded-full text-xs font-bold tabular-nums cursor-pointer border ${
                        isSelected
                          ? 'bg-brand text-brand-fg border-brand'
                          : cell.dateString === today
                          ? 'border-dashed border-fg-muted text-fg'
                          : cell.isCurrentMonth
                          ? 'border-transparent text-fg-2 hover:bg-surface-2'
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
