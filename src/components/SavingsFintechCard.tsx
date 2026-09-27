import React, { useState } from 'react';
import { Plus, Eye, EyeOff, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../utils/date';

interface SavingsFintechCardProps {
  totalSavings: number;
  monthTotalSavings: number;
  currency: string;
  selectedMonth: string;
  userName?: string;
  savingsCount: number;
  onOpenAddModal: () => void;
}

export const SavingsFintechCard: React.FC<SavingsFintechCardProps> = ({
  totalSavings,
  monthTotalSavings,
  currency,
  selectedMonth,
  userName,
  savingsCount,
  onOpenAddModal,
}) => {
  const [showBalance, setShowBalance] = useState<boolean>(true);

  return (
    <div 
      data-preserve-dark="true"
      className="relative rounded-3xl p-5 sm:p-6 text-white overflow-hidden bg-gradient-to-br from-[#1a251d] via-[#121914] to-[#0a0e0b] border border-[#2d4231] shadow-[0_15px_35px_rgba(0,0,0,0.6)] select-none"
    >
      {/* Lueur et textures d'arrière-plan de la carte */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#ccff00]/15 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#16331a]/40 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

      {/* Rangée Supérieure : Titre Épargne épuré & Badge FinTech (Sans puce ni logo sans-contact) */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ccff00] text-black flex items-center justify-center font-bold shadow-[0_0_12px_rgba(204,255,0,0.3)]">
            <PiggyBank className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Compte d'épargne
            </span>
            <span className="text-xs font-extrabold text-white block">
              {userName || 'Mon Épargne'}
            </span>
          </div>
        </div>

        {/* Étoile et Marque de la carte */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-[#2a3c2c] backdrop-blur-sm">
          {/* Étoile néon à 4 branches */}
          <svg className="w-4 h-4 text-[#ccff00]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
          <span className="text-[11px] font-black tracking-wider text-slate-200 uppercase">
            ÉPARGNE
          </span>
        </div>
      </div>

      {/* Rangée Centrale : Total déjà épargné (Card Balance) */}
      <div className="relative z-10 mt-6 sm:mt-7">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <span>Total déjà épargné</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#202f23] text-[#ccff00] font-bold">
              Cumulé
            </span>
          </span>

          {/* Bouton pour afficher/masquer le solde */}
          <button
            type="button"
            onClick={() => setShowBalance(!showBalance)}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-black/20 transition-colors"
            title={showBalance ? 'Masquer le montant' : 'Afficher le montant'}
          >
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Montant Géant du Solde Total */}
        <div className="mt-1 flex items-baseline gap-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {showBalance ? formatCurrency(totalSavings, currency) : '••••••••'}
          </h2>
        </div>

        {/* Sous-titre ou progrès mensuel */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#ccff00] bg-[#162618] px-2.5 py-0.5 rounded-full border border-[#28422b]">
            +{formatCurrency(monthTotalSavings, currency)} ce mois
          </span>
          <span className="text-[10px] text-slate-400">
            • {savingsCount} versement{savingsCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Rangée Inférieure : Titulaire, Carte & LE BOUTON (+) HERO */}
      <div className="relative z-10 mt-6 pt-4 border-t border-[#233326] flex items-end justify-between">
        <div>
          {/* Numéro de carte masqué */}
          <div className="font-mono text-xs text-slate-300 tracking-[0.2em] font-semibold mb-1">
            •••• •••• •••• 2026
          </div>

          <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-slate-400">
            <div>
              <span className="block text-[8px] text-slate-500">Titulaire</span>
              <span className="text-slate-200 truncate max-w-[130px] block">
                {userName || 'COMPTE ÉPARGNE'}
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-500">Mois</span>
              <span className="text-[#ccff00] font-black">{selectedMonth}</span>
            </div>
          </div>
        </div>

        {/* BOUTON (+) HÉROS POUR AJOUTER UNE ÉPARGNE EN 1 CLIC */}
        <div className="relative group">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#ccff00] hover:bg-[#d9ff33] text-black flex items-center justify-center font-black shadow-[0_0_25px_rgba(204,255,0,0.6)] hover:shadow-[0_0_35px_rgba(204,255,0,0.85)] hover:scale-105 active:scale-90 transition-all duration-150 cursor-pointer"
            title="Ajouter une épargne"
          >
            <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
          </button>
          
          {/* Tooltip indicateur propre */}
          <span className="absolute -top-7 right-0 text-[10px] font-black bg-black text-[#ccff00] px-2 py-0.5 rounded-md border border-[#ccff00]/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Ajouter une épargne
          </span>
        </div>
      </div>
    </div>
  );
};
