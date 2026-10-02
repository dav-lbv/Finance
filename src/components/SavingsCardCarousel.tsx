import React from 'react';
import { motion, PanInfo } from 'motion/react';
import { Check, Lock, Target } from 'lucide-react';
import { SavingsProject } from '../types';
import { formatCurrency, formatDateFr } from '../utils/date';

export type CarouselItem =
  | { kind: 'total'; id: 'total'; total: number; monthTotal: number; count: number }
  | { kind: 'project'; id: string; project: SavingsProject };

interface SavingsCardCarouselProps {
  items: CarouselItem[];
  index: number;
  onIndexChange: (index: number) => void;
  currency: string;
  holder: string;
  year: string;
  /** Clôture d'un projet dont l'objectif est atteint (archivage dans l'historique) */
  onCloseProject: (projectId: string) => void;
}

/** Format d'une vraie carte bancaire (ISO/IEC 7810 ID-1 : 85,6 × 54 mm) */
const CARD_RATIO = 1.586;

/**
 * Contour de la carte, avec l'encoche arrondie sur le bord gauche de la carte de
 * référence. Coordonnées relatives (0 → 1) : la forme suit la taille de la carte.
 */
const CARD_PATH =
  'M0.05,0 H0.95 Q1,0 1,0.0795 V0.9205 Q1,1 0.95,1 H0.05 Q0,1 0,0.9205 V0.46 Q0.04,0.46 0.04,0.41 V0.23 Q0.04,0.18 0,0.18 V0.0795 Q0,0 0.05,0 Z';

const CardOutline: React.FC = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="bank-card-shape" clipPathUnits="objectBoundingBox">
        <path d={CARD_PATH} />
      </clipPath>
    </defs>
  </svg>
);

/** Puce EMV : plaque métallique segmentée. */
const EmvChip: React.FC<{ light?: boolean }> = ({ light }) => (
  <svg viewBox="0 0 48 36" className="w-full h-full" aria-hidden="true">
    <defs>
      <linearGradient id={light ? 'chip-l' : 'chip-d'} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={light ? '#c9c9d1' : '#efece4'} />
        <stop offset="1" stopColor={light ? '#8d8d97' : '#a9a698'} />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="46" height="34" rx="7" fill={`url(#${light ? 'chip-l' : 'chip-d'})`} />
    <g fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="1">
      <rect x="16" y="9" width="16" height="18" rx="3.5" />
      <path d="M1 13h15M1 23h15M32 13h15M32 23h15M24 1v8M24 27v8" />
    </g>
  </svg>
);

/**
 * Carte bancaire : format ISO, contour à encoche, dégradé mat.
 * Les tailles de texte internes suivent la hauteur de la carte (unités cqh).
 */
const BankCard: React.FC<{ tone: 'dark' | 'silver'; children: React.ReactNode }> = ({ tone, children }) => (
  <div className="relative h-full" style={{ filter: 'drop-shadow(0 22px 26px rgba(0,0,0,0.38))' }}>
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        clipPath: 'url(#bank-card-shape)',
        containerType: 'size',
        background:
          tone === 'dark'
            ? 'linear-gradient(135deg,#343d4f 0%,#1b2231 46%,#0c111b 100%)'
            : 'linear-gradient(135deg,#fdfdff 0%,#e5e5eb 52%,#c2c2cb 100%)',
        color: tone === 'dark' ? '#fff' : '#0a0a0c',
      }}
    >
      {/* Reflet doux en haut à droite */}
      <div
        className="absolute -top-1/3 -right-1/4 w-3/4 h-full rounded-full pointer-events-none"
        style={{
          background:
            tone === 'dark'
              ? 'radial-gradient(closest-side, rgba(255,255,255,0.12), transparent)'
              : 'radial-gradient(closest-side, rgba(255,255,255,0.9), transparent)',
        }}
      />
      {children}
    </div>
  </div>
);

/** Carte « total » : exactement la composition de la carte de référence. */
const TotalFace: React.FC = () => (
  <BankCard tone="dark">
    {/* Mot vertical contouré, très discret */}
    <span
      className="absolute select-none pointer-events-none"
      style={{
        left: '9%',
        top: '50%',
        writingMode: 'vertical-rl',
        transform: 'translateY(-50%) rotate(180deg)',
        fontSize: '12.5cqh',
        fontWeight: 300,
        letterSpacing: '0.2em',
        color: 'transparent',
        WebkitTextStroke: '0.7px rgba(255,255,255,0.34)',
      }}
    >
      ÉPARGNE
    </span>

    {/* Puce, à droite au milieu */}
    <div className="absolute" style={{ right: '9%', top: '50%', width: '26cqh', height: '19.5cqh', transform: 'translateY(-50%)' }}>
      <EmvChip />
    </div>

    {/* Marque en bas à droite (équivalent du logo VISA) */}
    <span
      className="absolute font-black italic leading-none"
      style={{ right: '7%', bottom: '10%', fontSize: '13cqh', letterSpacing: '-0.02em' }}
    >
      GesFin
    </span>
  </BankCard>
);

const ProjectFace: React.FC<{
  project: SavingsProject;
  currency: string;
  onClose: () => void;
}> = ({ project, currency, onClose }) => {
  const pct = project.targetAmount > 0 ? Math.min(100, Math.round((project.currentAmount / project.targetAmount) * 100)) : 0;
  const reached = project.currentAmount >= project.targetAmount && project.targetAmount > 0;
  const remaining = Math.max(0, project.targetAmount - project.currentAmount);

  return (
    <BankCard tone="silver">
      <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: '6% 6% 5% 8%' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/8 border border-black/10">
              <Target className="w-3 h-3" />
              {project.category || 'Projet'}
            </span>
            <h3 className="mt-1 text-[15px] font-black leading-tight truncate">{project.title}</h3>
          </div>
          <div className="w-10 h-[30px] shrink-0">
            <EmvChip light />
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between text-[11px] font-semibold mb-1">
            <span>{pct}% atteint</span>
            <span className="text-black/55">{reached ? 'Objectif atteint' : `Reste ${formatCurrency(remaining, currency)}`}</span>
          </div>
          <div className="h-2 rounded-full bg-black/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-[#0a0a0c]"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="min-w-0 text-[10px] text-black/55 leading-tight">
              <span className="block truncate">Objectif {formatCurrency(project.targetAmount, currency)}</span>
              {project.targetDate && <span className="block truncate">Avant le {formatDateFr(project.targetDate)}</span>}
            </div>
            <button
              type="button"
              disabled={!reached}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black ${
                reached ? 'bg-[#0a0a0c] text-white shadow-lg cursor-pointer' : 'bg-black/10 text-black/40 cursor-not-allowed'
              }`}
              title={reached ? 'Clôturer : objectif atteint, le projet sera archivé' : "Disponible quand l'objectif est atteint"}
            >
              {reached ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Lock className="w-3 h-3" />}
              Clôturer
            </button>
          </div>
        </div>
      </div>
    </BankCard>
  );
};

/**
 * Carrousel « coverflow » : la carte centrale est au premier plan, les voisines
 * (plus petites, estompées) dépassent sur les côtés. Glisser pour changer de carte.
 */
export const SavingsCardCarousel: React.FC<SavingsCardCarouselProps> = ({
  items,
  index,
  onIndexChange,
  currency,
  year,
  onCloseProject,
}) => {
  const go = (next: number) => onIndexChange(Math.max(0, Math.min(items.length - 1, next)));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -45 || info.velocity.x < -450) go(index + 1);
    else if (info.offset.x > 45 || info.velocity.x > 450) go(index - 1);
  };

  const current = items[index];

  return (
    <div className="relative">
      <CardOutline />
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        className="relative touch-pan-y select-none"
        style={{ perspective: 1100 }}
      >
        {/* Réserve la hauteur exacte d'une carte (le contenu est en position absolue) */}
        <div className="mx-auto w-[78%] invisible" style={{ aspectRatio: String(CARD_RATIO) }} />

        {items.map((item, i) => {
          const offset = i - index;
          const abs = Math.abs(offset);
          const hidden = abs > 2;
          return (
            <motion.div
              key={item.id}
              initial={false}
              animate={{
                x: `${offset * 84}%`,
                scale: 1 - Math.min(abs, 2) * 0.12,
                opacity: hidden ? 0 : 1 - Math.max(0, abs - 1) * 0.5,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={() => offset !== 0 && go(i)}
              className="absolute top-0 left-1/2 -ml-[39%] w-[78%] h-full"
              style={{ zIndex: 10 - abs, pointerEvents: hidden ? 'none' : 'auto' }}
            >
              <div className="relative h-full">
                {item.kind === 'total' ? (
                  <TotalFace />
                ) : (
                  <ProjectFace project={item.project} currency={currency} onClose={() => onCloseProject(item.project.id)} />
                )}
                {/* Voile : les cartes voisines apparaissent estompées */}
                <motion.div
                  initial={false}
                  animate={{ opacity: abs === 0 ? 0 : 0.6 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: '#0b0d12', clipPath: 'url(#bank-card-shape)' }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Numéro masqué sous la carte, comme sur la carte de référence */}
      <p
        className={`mt-4 text-center text-[13px] text-fg-2 font-semibold tabular-nums ${
          current?.kind === 'project' ? 'tracking-normal' : 'tracking-[0.3em]'
        }`}
      >
        {current?.kind === 'project' ? `Créé le ${formatDateFr(current.project.createdAt)}` : `•••• •••• •••• ${year}`}
      </p>

      {/* Indicateurs de position */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Carte ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === index ? 'w-6 bg-fg' : 'w-1.5 bg-line-strong'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
