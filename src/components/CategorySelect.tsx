import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Check, 
  Home, 
  Utensils, 
  FileText, 
  Car, 
  HeartPulse, 
  Sparkles, 
  ShoppingBag, 
  Tag 
} from 'lucide-react';
import { ExpenseCategory } from '../types';

export const CATEGORY_CONFIG: Record<
  ExpenseCategory, 
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  'Logement': {
    label: 'Logement',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/30',
    icon: Home,
  },
  'Alimentation': {
    label: 'Alimentation',
    color: 'text-brand',
    bg: 'bg-brand/10 border-brand/30',
    icon: Utensils,
  },
  'Factures & Abonnements': {
    label: 'Factures & Abonnements',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/30',
    icon: FileText,
  },
  'Transport': {
    label: 'Transport',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10 border-sky-400/30',
    icon: Car,
  },
  'Santé': {
    label: 'Santé',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10 border-rose-400/30',
    icon: HeartPulse,
  },
  'Loisirs & Sorties': {
    label: 'Loisirs & Sorties',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/30',
    icon: Sparkles,
  },
  'Shopping & Divers': {
    label: 'Shopping & Divers',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10 border-orange-400/30',
    icon: ShoppingBag,
  },
  'Autre': {
    label: 'Autre',
    color: 'text-fg-muted',
    bg: 'bg-fg-muted/10 border-line-strong',
    icon: Tag,
  },
};

interface CategorySelectProps {
  value: ExpenseCategory;
  onChange: (value: ExpenseCategory) => void;
  categories?: ExpenseCategory[];
  label?: string;
  className?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  categories = Object.keys(CATEGORY_CONFIG) as ExpenseCategory[],
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedConfig = CATEGORY_CONFIG[value] || {
    label: value,
    color: 'text-fg-2',
    bg: 'bg-surface-3 border-line-strong',
    icon: Tag,
  };
  const SelectedIcon = selectedConfig.icon;

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold uppercase text-fg-2 mb-1 tracking-wider">
          {label}
        </label>
      )}

      {/* Trigger style shadcn/ui */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-full bg-surface-2 border text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
          isOpen
            ? 'border-brand ring-2 ring-brand/25 bg-surface-2'
            : 'border-line-strong hover:border-line-strong hover:bg-surface-2'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selectedConfig.bg} border`}>
            <SelectedIcon className={`w-3 h-3 ${selectedConfig.color}`} />
          </div>
          <span className="text-fg truncate font-medium">{selectedConfig.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-fg-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand' : ''
          }`}
        />
      </button>

      {/* Menu déroulant style shadcn/ui Popover */}
      {isOpen && (
        <div 
          className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-surface border border-line-strong shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-fadeIn max-h-64 overflow-y-auto no-scrollbar"
          role="listbox"
        >
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat] || {
                label: cat,
                color: 'text-fg-2',
                bg: 'bg-surface-3 border-line-strong',
                icon: Tag,
              };
              const ItemIcon = config.icon;
              const isSelected = cat === value;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onChange(cat);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-surface-2 text-brand font-bold shadow-sm'
                      : 'text-fg-2 hover:bg-surface-2 hover:text-fg font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${config.bg} border`}>
                      <ItemIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <span className="truncate">{config.label}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-brand shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
