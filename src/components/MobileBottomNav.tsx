import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { House, Receipt, PiggyBank, Settings } from 'lucide-react';

type Tab = 'dashboard' | 'expenses' | 'savings' | 'settings';

interface MobileBottomNavProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
}

const TABS = [
  { id: 'dashboard' as const, label: 'Accueil', icon: House },
  { id: 'expenses' as const, label: 'Dépenses', icon: Receipt },
  { id: 'savings' as const, label: 'Épargne', icon: PiggyBank },
  { id: 'settings' as const, label: 'Réglages', icon: Settings },
];

/**
 * Barre de navigation smartphone : pilule en verre, icônes fines, bulle active qui
 * glisse d'un onglet à l'autre. Elle apparaît en montant, se range quand on fait
 * défiler vers le bas et revient dès qu'on remonte.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 10) return;
      setHidden(y > last && y > 140);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Toujours visible à l'arrivée sur un nouvel écran
  useEffect(() => setHidden(false), [currentTab]);

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: hidden ? 120 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,10px)+10px)] pt-2 pointer-events-none"
    >
      <nav
        aria-label="Navigation principale"
        className="pointer-events-auto relative mx-auto w-fit rounded-full p-1.5 flex items-center gap-1.5 border border-line-strong backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.4),inset_0_1px_0_var(--glass-edge)] [background-color:color-mix(in_srgb,var(--surface-solid)_52%,transparent)]"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              title={tab.label}
              onClick={() => setCurrentTab(tab.id)}
              whileTap={{ scale: 0.86 }}
              className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer"
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-bubble"
                  transition={{ type: 'spring', stiffness: 430, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-surface-3 border border-line-strong shadow-[inset_0_1px_0_var(--glass-edge),0_6px_18px_rgba(0,0,0,0.25)]"
                />
              )}
              {/* Halo discret qui pulse sous l'onglet actif */}
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-fg/30"
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  key={`halo-${currentTab}`}
                />
              )}
              <motion.span
                animate={
                  isActive
                    ? { scale: [1, 1.3, 1], rotate: [0, -12, 8, 0], y: 0 }
                    : { scale: 1, rotate: 0, y: 0 }
                }
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`relative z-10 ${isActive ? 'text-fg' : 'text-fg-muted'}`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 1.9 : 1.5} />
              </motion.span>
            </motion.button>
          );
        })}
      </nav>
    </motion.div>
  );
};
