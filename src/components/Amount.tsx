import React from 'react';
import { formatCurrency } from '../utils/date';

interface AmountProps {
  value: number;
  currency: string;
  className?: string;
}

/**
 * Montant en chiffres légers et grands, devise en petit à côté
 * (hiérarchie typographique des maquettes : le chiffre prime, l'unité s'efface).
 */
export const Amount: React.FC<AmountProps> = ({ value, currency, className = '' }) => {
  const text = formatCurrency(value, currency);
  const cut = text.lastIndexOf(' ');
  const number = cut > 0 ? text.slice(0, cut) : text;
  const unit = cut > 0 ? text.slice(cut + 1) : '';
  return (
    <span className={`num-light tabular-nums ${className}`}>
      {number}
      {unit && <span className="ml-[0.28em] text-[0.36em] font-semibold tracking-normal text-fg-muted align-baseline">{unit}</span>}
    </span>
  );
};
