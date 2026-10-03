import React, { useState } from 'react';
import { motion } from 'motion/react';
import { formatCurrency } from '../utils/date';
import { Amount } from './Amount';

// ------------------------------------------------------------------
// Anneau (donut) animé : segments en SVG, sans dépendance
// ------------------------------------------------------------------
export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  /** Couleur CSS (variable de thème ou color-mix) */
  color: string;
}

const SIZE = 168;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 3; // espace visuel entre segments

const Donut: React.FC<{ segments: DonutSegment[]; center: React.ReactNode }> = ({ segments, center }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--surface-3)" strokeWidth={STROKE} />
        {total > 0 &&
          segments
            .filter((seg) => seg.value > 0)
            .map((seg, i) => {
              const length = (seg.value / total) * CIRC;
              const visible = Math.max(0, length - (segments.length > 1 ? GAP : 0));
              const start = offset;
              offset += length;
              return (
                <motion.circle
                  key={seg.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                  style={{ stroke: seg.color }}
                  strokeDashoffset={-start}
                  initial={{ strokeDasharray: `0 ${CIRC}` }}
                  animate={{ strokeDasharray: `${visible} ${CIRC - visible}` }}
                  transition={{ duration: 0.9, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">{center}</div>
    </div>
  );
};

const Legend: React.FC<{ segments: DonutSegment[]; total: number; currency: string }> = ({ segments, total, currency }) => (
  <ul className="flex-1 min-w-0 w-full space-y-2.5">
    {segments.map((seg) => (
      <li key={seg.key} className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
          <span className="font-semibold text-fg-2 truncate">{seg.label}</span>
        </span>
        <span className="flex items-baseline gap-2 shrink-0 tabular-nums">
          <span className="font-black text-fg">{formatCurrency(seg.value, currency)}</span>
          <span className="text-fg-muted w-9 text-right">{total > 0 ? Math.round((seg.value / total) * 100) : 0}%</span>
        </span>
      </li>
    ))}
  </ul>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-10 text-center text-xs text-fg-muted">{text}</div>
);

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="rounded-3xl bg-surface border border-line p-5">
    <div className="flex items-baseline justify-between gap-3 mb-4">
      <h3 className="text-base font-extrabold text-fg tracking-tight">{title}</h3>
      {subtitle && <span className="text-[11px] font-semibold text-fg-muted truncate">{subtitle}</span>}
    </div>
    {children}
  </div>
);

// ------------------------------------------------------------------
// 1. Répartition du salaire : dépenses / épargne / reste
// ------------------------------------------------------------------
export const SalaryDonutCard: React.FC<{
  salary: number;
  expenses: number;
  savings: number;
  currency: string;
  monthLabel: string;
}> = ({ salary, expenses, savings, currency, monthLabel }) => {
  const used = expenses + savings;
  const rest = Math.max(0, salary - used);
  const base = Math.max(salary, used);
  const pct = base > 0 ? Math.round((used / base) * 100) : 0;
  const over = salary > 0 && used > salary;

  const segments: DonutSegment[] = [
    { key: 'exp', label: 'Dépenses', value: expenses, color: 'var(--fg)' },
    { key: 'sav', label: 'Épargne', value: savings, color: 'var(--success)' },
    { key: 'rest', label: 'Reste', value: rest, color: 'color-mix(in srgb, var(--fg) 24%, transparent)' },
  ];

  return (
    <Card title="Répartition du salaire" subtitle={monthLabel}>
      {base === 0 ? (
        <Empty text="Renseignez votre salaire et vos dépenses pour voir la répartition." />
      ) : (
        <div className="flex flex-col items-center gap-5">
          <Donut
            segments={segments}
            center={
              <>
                <span className={`text-4xl num-light tabular-nums leading-none ${over ? 'text-danger' : 'text-fg'}`}>{pct}%</span>
                <span className="text-[10px] font-semibold text-fg-muted mt-1">{over ? 'du salaire (dépassé)' : 'du salaire utilisé'}</span>
              </>
            }
          />
          <Legend segments={segments} total={base} currency={currency} />
        </div>
      )}
    </Card>
  );
};

// ------------------------------------------------------------------
// 2. Dépenses par catégorie
// ------------------------------------------------------------------
const SHADES = [100, 78, 58, 44, 32, 22];

export const CategoryDonutCard: React.FC<{
  totals: [string, number][];
  currency: string;
  monthLabel: string;
}> = ({ totals, currency, monthLabel }) => {
  const total = totals.reduce((s, [, v]) => s + v, 0);

  // 5 premières catégories + « Autres »
  const top = totals.slice(0, 5);
  const others = totals.slice(5).reduce((s, [, v]) => s + v, 0);
  const rows: [string, number][] = others > 0 ? [...top, ['Autres', others]] : top;

  const segments: DonutSegment[] = rows.map(([label, value], i) => ({
    key: label,
    label,
    value,
    color: `color-mix(in srgb, var(--fg) ${SHADES[i]}%, transparent)`,
  }));

  return (
    <Card title="Dépenses par catégorie" subtitle={monthLabel}>
      {total === 0 ? (
        <Empty text={`Aucune dépense enregistrée en ${monthLabel}.`} />
      ) : (
        <div className="flex flex-col items-center gap-5">
          <Donut
            segments={segments}
            center={
              <>
                <span className="text-[10px] font-semibold text-fg-muted">Total</span>
                <span className="text-xl text-fg leading-tight break-words">
                  <Amount value={total} currency={currency} />
                </span>
              </>
            }
          />
          <Legend segments={segments} total={total} currency={currency} />
        </div>
      )}
    </Card>
  );
};

// ------------------------------------------------------------------
// 3. Évolution sur 6 mois : dépenses vs épargne
// ------------------------------------------------------------------
export interface TrendPoint {
  monthKey: string;
  label: string;
  expenses: number;
  savings: number;
}

export const TrendBarsCard: React.FC<{
  points: TrendPoint[];
  selectedMonth: string;
  currency: string;
}> = ({ points, selectedMonth, currency }) => {
  const [active, setActive] = useState<string | null>(null);
  const activeKey = active ?? selectedMonth;
  const current = points.find((p) => p.monthKey === activeKey) ?? points[points.length - 1];
  const max = Math.max(1, ...points.flatMap((p) => [p.expenses, p.savings]));
  const hasData = points.some((p) => p.expenses > 0 || p.savings > 0);

  return (
    <Card title="Évolution sur 6 mois" subtitle="Dépenses et épargne">
      {!hasData ? (
        <Empty text="Les mois précédents apparaîtront ici dès que vous aurez enregistré des opérations." />
      ) : (
        <>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">{current.label}</span>
              <p className="text-xl font-black text-fg tabular-nums leading-tight">{formatCurrency(current.expenses, currency)}</p>
              <p className="text-[11px] text-fg-muted">dépensés</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-success tabular-nums leading-tight">{formatCurrency(current.savings, currency)}</p>
              <p className="text-[11px] text-fg-muted">épargnés</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-36">
            {points.map((p, i) => {
              const isActive = p.monthKey === activeKey;
              const he = p.expenses > 0 ? Math.max(6, (p.expenses / max) * 100) : 3;
              const hs = p.savings > 0 ? Math.max(6, (p.savings / max) * 100) : 3;
              return (
                <button
                  key={p.monthKey}
                  type="button"
                  onClick={() => setActive(p.monthKey)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 cursor-pointer min-w-0"
                  aria-label={`${p.label} : ${formatCurrency(p.expenses, currency)} dépensés, ${formatCurrency(p.savings, currency)} épargnés`}
                >
                  <div className="w-full flex-1 flex items-end justify-center gap-1">
                    <div
                      className={`grow-up w-full max-w-[16px] rounded-t-lg border ${
                        isActive ? 'bg-brand border-brand' : 'hatch bg-surface-2 border-line-strong'
                      }`}
                      style={{ height: `${he}%`, animationDelay: `${i * 70}ms` }}
                    />
                    <div
                      className={`grow-up w-full max-w-[16px] rounded-t-lg border border-success/50 ${
                        isActive ? 'bg-success' : 'bg-success/35'
                      }`}
                      style={{ height: `${hs}%`, animationDelay: `${i * 70 + 40}ms` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-fg' : 'text-fg-muted'}`}>{p.label.slice(0, 4)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-line flex items-center gap-4 text-[11px] text-fg-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand" /> Dépenses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-success" /> Épargne
            </span>
            <span className="ml-auto">Touchez une barre pour le détail</span>
          </div>
        </>
      )}
    </Card>
  );
};
