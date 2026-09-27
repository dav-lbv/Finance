import React from 'react';
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom,10px)+6px)] pt-2 pointer-events-none">
      <nav className="pointer-events-auto max-w-sm mx-auto bg-[#0d120f]/95 backdrop-blur-2xl border border-[#233126] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.75)] p-1.5 flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 relative flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
                isActive
                  ? 'bg-[#ccff00] text-black font-black shadow-[0_0_18px_rgba(204,255,0,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#161f18]'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-105 stroke-[2.8]' : 'stroke-[1.8]'
                }`} 
              />
              <span className={`text-[10px] mt-0.5 tracking-tight font-extrabold ${
                isActive ? 'text-black' : 'text-slate-400'
              }`}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
