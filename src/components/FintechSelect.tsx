import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface FintechSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
}

export const FintechSelect: React.FC<FintechSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner une option',
  label,
  className = '',
  triggerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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
        <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1 tracking-wider">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-full bg-[#18201a] border text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
          isOpen
            ? 'border-[#ccff00] ring-2 ring-[#ccff00]/25 bg-[#1b251e]'
            : 'border-[#28362b] hover:border-[#384c3d] hover:bg-[#1c261e]'
        } ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${selectedOption ? 'text-white font-medium' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#ccff00]' : ''
          }`}
        />
      </button>

      {/* Popover Content */}
      {isOpen && (
        <div 
          className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-[#121713] border border-[#26372a] shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-fadeIn max-h-64 overflow-y-auto no-scrollbar"
          role="listbox"
        >
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#1a261c] text-[#ccff00] font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-[#172019] hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 shrink-0">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <p className="text-[10px] text-slate-400 truncate">{opt.description}</p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#ccff00] shrink-0 stroke-[2.5]" />
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
