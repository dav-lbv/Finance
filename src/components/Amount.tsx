import React from 'react';
import { formatCurrency } from '../utils/date';

interface AmountProps {
  value: number;
  currency: string;
  className?: string;
  /** Taille max (px) : le montant se réduit pour tenir dans la largeur de son conteneur */
  fitMax?: number;
}

/**
 * Montant en chiffres légers et grands, devise en petit à côté
 * (hiérarchie typographique des maquettes : le chiffre prime, l'unité s'efface).
 */
export const Amount: React.FC<AmountProps> = ({ value, currency, className = '', fitMax }) => {
  const text = formatCurrency(value, currency);
  const cut = text.lastIndexOf(' ');
  const number = cut > 0 ? text.slice(0, cut) : text;
  const unit = cut > 0 ? text.slice(cut + 1) : '';
  if (fitMax) {
    // largeur estimée en « em » : chiffres larges, espaces étroits, puis l'unité
    const digits = (number.match(/\d/g) || []).length;
    const em = digits * 0.7 + (number.length - digits) * 0.3 + (unit ? 1.2 : 0.2);
    return (
      <span className="block [container-type:inline-size]">
        <span
          className={`block whitespace-nowrap num-light tabular-nums ${className}`}
          style={{ fontSize: `min(${fitMax}px, calc(100cqw / ${em.toFixed(2)}))` }}
        >
          {number}
          {unit && <span className="ml-[0.28em] text-[0.36em] font-semibold tracking-normal text-fg-muted align-baseline">{unit}</span>}
        </span>
      </span>
    );
  }
  return (
    <span className={`num-light tabular-nums ${className}`}>
      {number}
      {unit && <span className="ml-[0.28em] text-[0.36em] font-semibold tracking-normal text-fg-muted align-baseline">{unit}</span>}
    </span>
  );
};
