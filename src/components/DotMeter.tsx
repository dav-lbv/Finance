import React from 'react';
import { motion } from 'motion/react';

/** Jauge en pastilles (10 = 100 %), comme le compteur de tâches de la maquette. */
export const DotMeter: React.FC<{ percent: number; columns?: number; total?: number; size?: number }> = ({
  percent,
  columns = 5,
  total = 10,
  size = 22,
}) => {
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * total);
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, ${size}px)` }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.05 * i }}
          className={`rounded-full ${i < filled ? 'bg-success' : 'bg-surface-3'}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
};
