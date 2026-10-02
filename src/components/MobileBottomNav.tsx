import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Receipt, PiggyBank, Sliders, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'dashboard' | 'expenses' | 'savings' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'expenses' | 'savings' | 'settings') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Tableau de bord',
      shortLabel: 'Accueil',
      icon: LayoutDashboard,
    },
    {
      id: 'expenses' as const,
      label: 'Dépenses',
      shortLabel: 'Dépenses',
      icon: Receipt,
    },
    {
      id: 'savings' as const,
      label: 'Épargne',
      shortLabel: 'Épargne',
      icon: PiggyBank,
    },
    {
      id: 'settings' as const,
      label: 'Paramètres',
      shortLabel: 'Réglages',
      icon: Sliders,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,10px)+8px)] pt-2 pointer-events-none">
      <nav className="pointer-events-auto max-w-sm mx-auto bg-surface [background-color:color-mix(in_srgb,var(--surface-solid)_74%,transparent)] border border-line rounded-full p-1.5 flex items-center justify-between gap-1 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className="flex-1 relative flex flex-col items-center justify-center py-2 px-1 rounded-full cursor-pointer"
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-brand shadow-[0_6px_20px_rgba(var(--brand-rgb),0.3)]"
                />
              )}
              <motion.span
                animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className={`relative z-10 ${isActive ? 'text-brand-fg' : 'text-fg-muted'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </motion.span>
              <span
                className={`relative z-10 text-[10px] mt-0.5 tracking-tight font-bold transition-colors ${
                  isActive ? 'text-brand-fg' : 'text-fg-muted'
                }`}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
