import React from 'react';
import { ArrowLeft } from 'lucide-react';

/** En-tête des sous-écrans de réglages : bouton retour rond + titre centré. */
export const SettingsSubHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="flex items-center justify-between gap-3 mb-1">
    <button
      type="button"
      onClick={onBack}
      className="w-11 h-11 shrink-0 rounded-full bg-surface border border-line flex items-center justify-center text-fg cursor-pointer"
      aria-label="Retour aux réglages"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
    <h1 className="flex-1 text-center text-[17px] font-bold text-fg truncate">{title}</h1>
    <span className="w-11 shrink-0" aria-hidden="true" />
  </div>
);
