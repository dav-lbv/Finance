import React from 'react';
import { motion, PanInfo } from 'motion/react';
import { Check, Lock, Target, Wifi } from 'lucide-react';
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

/** Puce de carte bancaire stylisée */
const Chip: React.FC<{ light?: boolean }> = ({ light }) => (
  <div
    className={`w-11 h-8 rounded-lg border ${light ? 'border-black/25' : 'border-white/30'}`}
    style={{
      backgroundImage: light
        ? 'linear-gradient(135deg, rgba(0,0,0,0.14), rgba(0,0,0,0.04)), repeating-linear-gradient(0deg, transparent 0 7px, rgba(0,0,0,0.22) 7px 8px)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06)), repeating-linear-gradient(0deg, transparent 0 7px, rgba(255,255,255,0.3) 7px 8px)',
    }}
  />
);

/** Puce argentée avec symbole sans contact, comme sur une carte bancaire. */
const ContactlessChip: React.FC = () => (
  <div className="relative w-12 h-9 rounded-lg border border-white/30 bg-gradient-to-br from-[#e6e6ec] via-[#a9a9b4] to-[#6f6f7a] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
    <span className="absolute inset-x-2 top-1/2 h-px bg-black/20" />
    <span className="absolute inset-y-2 left-1/2 w-px bg-black/20" />
    <Wifi className="relative w-5 h-5 rotate-90 text-[#0a0a0c]" strokeWidth={2.4} />
  </div>
);

const TotalFace: React.FC = () => (
  <div className="relative h-full rounded-[26px] overflow-hidden text-white bg-gradient-to-br from-[#262d3b] via-[#121724] to-[#070a12] border border-white/10">
    <div className="absolute -top-20 -right-14 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
    {/* Filigrane vertical : seul élément de texte, comme sur la carte de référence */}
    <span
      className="absolute left-3.5 top-1/2 text-[30px] font-black tracking-[0.1em] select-none pointer-events-none"
      style={{
        writingMode: 'vertical-rl',
        transform: 'translateY(-50%) rotate(180deg)',
        color: 'transparent',
        WebkitTextStroke: '1.2px rgba(255,255,255,0.2)',
      }}
    >
      ÉPARGNE
    </span>
    <div className="absolute right-5 top-1/2 -translate-y-1/2">
      <ContactlessChip />
    </div>
    <span className="absolute right-5 bottom-4 text-[26px] font-black italic tracking-tight leading-none">GesFin</span>
  </div>
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
    <div className="relative h-full rounded-[26px] p-5 overflow-hidden text-[#0a0a0c] bg-gradient-to-br from-[#fbfbfd] via-[#e6e6eb] to-[#c6c6ce] border border-black/10 flex flex-col justify-between">
      <div className="absolute -top-14 -left-10 w-44 h-44 rounded-full bg-white/70 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/8 border border-black/10">
            <Target className="w-3 h-3" />
            {project.category || 'Projet'}
          </span>
          <h3 className="mt-1.5 text-base font-black leading-tight truncate">{project.title}</h3>
        </div>
        <Chip light />
      </div>

      <div className="relative">
        <div className="flex items-end justify-between text-[11px] font-semibold mb-1.5">
          <span>{pct}% atteint</span>
          <span className="text-black/55">
            {reached ? 'Objectif atteint' : `Reste ${formatCurrency(remaining, currency)}`}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-black/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-[#0a0a0c]"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
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
              reached
                ? 'bg-[#0a0a0c] text-white shadow-lg cursor-pointer'
                : 'bg-black/10 text-black/40 cursor-not-allowed'
            }`}
            title={reached ? 'Clôturer : objectif atteint, le projet sera archivé' : 'Disponible quand l\'objectif est atteint'}
          >
            {reached ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Lock className="w-3 h-3" />}
            Clôturer
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Carrousel « coverflow » : la carte centrale est au premier plan, les voisines
 * sont inclinées et réduites sur les côtés. Glisser à gauche / droite pour changer.
 */
export const SavingsCardCarousel: React.FC<SavingsCardCarouselProps> = ({
  items,
  index,
  onIndexChange,
  currency,
  holder,
  year,
  onCloseProject,
}) => {
  const go = (next: number) => onIndexChange(Math.max(0, Math.min(items.length - 1, next)));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -45 || info.velocity.x < -450) go(index + 1);
    else if (info.offset.x > 45 || info.velocity.x > 450) go(index - 1);
  };

  return (
    <div className="relative">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        className="relative h-[216px] touch-pan-y select-none"
        style={{ perspective: 1100 }}
      >
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
                rotateY: offset === 0 ? 0 : offset > 0 ? -8 : 8,
                opacity: hidden ? 0 : 1 - Math.max(0, abs - 1) * 0.5,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={() => offset !== 0 && go(i)}
              className="absolute top-0 left-1/2 -ml-[39%] w-[78%] h-full"
              style={{ zIndex: 10 - abs, pointerEvents: hidden ? 'none' : 'auto', transformStyle: 'preserve-3d' }}
            >
              <div className="relative h-full shadow-[0_24px_50px_rgba(0,0,0,0.35)] rounded-[26px]">
                {item.kind === 'total' ? (
                  <TotalFace />
                ) : (
                  <ProjectFace
                    project={item.project}
                    currency={currency}
                    onClose={() => onCloseProject(item.project.id)}
                  />
                )}
                {/* Voile : les cartes voisines apparaissent estompées */}
                <motion.div
                  initial={false}
                  animate={{ opacity: abs === 0 ? 0 : 0.72 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 rounded-[26px] bg-[#0b0d12] pointer-events-none"
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Numéro masqué sous la carte, comme sur la carte de référence */}
      <p className={`mt-4 text-center text-[13px] text-fg-2 font-semibold tabular-nums ${items[index]?.kind === 'project' ? 'tracking-normal' : 'tracking-[0.3em]'}`}>
        {items[index]?.kind === 'project'
          ? `Créé le ${formatDateFr((items[index] as Extract<CarouselItem, { kind: 'project' }>).project.createdAt)}`
          : `•••• •••• •••• ${year}`}
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
