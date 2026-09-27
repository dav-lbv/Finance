import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Settings, 
  Lock, 
  Calendar as CalendarIcon,
  ShieldCheck, 
  User, 
  Sparkles, 
  Sun, 
  Moon, 
  Laptop,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sliders
} from 'lucide-react';
import { formatMonthKey, formatMonthKeyShort, getNextMonthKey, getPreviousMonthKey, getCurrentMonthKey } from '../utils/date';
import { UserProfile, SecuritySettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../hooks/useTheme';
import { NotificationsModal } from './NotificationsModal';
import { DEFAULT_AVATAR } from '../utils/avatars';

interface NavbarProps {
  currentTab: 'dashboard' | 'expenses' | 'savings' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'expenses' | 'savings' | 'settings') => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  user: UserProfile;
  security: SecuritySettings;
  onLockApp: () => void;
  onOpenOnboarding?: () => void;
  totalExpenses?: number;
  totalSavings?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedMonth,
  setSelectedMonth,
  user,
  security,
  onLockApp,
  onOpenOnboarding,
  totalExpenses = 0,
  totalSavings = 0,
}) => {
  const { themeMode, resolvedTheme, cycleTheme } = useTheme();
  const isCurrentActualMonth = selectedMonth === getCurrentMonthKey();
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handlePrevMonth = () => {
    setSelectedMonth(getPreviousMonthKey(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonthKey(selectedMonth));
  };

  const handleJumpToCurrentMonth = () => {
    setSelectedMonth(getCurrentMonthKey());
  };

  const fallbackAvatar = DEFAULT_AVATAR;
  const avatarImage = user.avatarUrl || fallbackAvatar;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#090b09]/95 backdrop-blur-md border-b border-[#1c241e] text-white shadow-lg pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* 1. Brand Logo GesFin : Logo à gauche */}
            <div 
              onClick={() => setCurrentTab('dashboard')} 
              className="flex items-center gap-2 shrink-0 cursor-pointer group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-[#ccff00] to-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.35)] shrink-0 transition-transform group-hover:scale-105">
                <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-black stroke-[2.8]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-[#f4f7f4] to-[#ccff00] bg-clip-text text-transparent">
                  GesFin
                </span>
                <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.2 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 hidden xs:inline-block">
                  PRO
                </span>
              </div>
            </div>

            {/* 2. FORME CONNECTÉE DU HEADER (Inspirée de la dernière image demandée par l'utilisateur) :
                "la forme qui lie la photo de profil a l'icone des notif et de la bare de recherche : que tu vas remplace par la période comme présentement sur l'app"
            */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Le Widget Capsule Connecté Unifié */}
              <div className="flex items-center bg-[#131914] hover:bg-[#161d17] border border-[#233126] rounded-full p-0.5 sm:p-1 shadow-[0_2px_10px_rgba(0,0,0,0.4)] transition-all">
                
                {/* A. Icône des Notifications */}
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-[#ccff00] hover:bg-[#1a231b] transition-colors active:scale-95 shrink-0"
                  title="Voir les notifications & alertes"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {/* Pastille / Badge de notifications non lues */}
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#ccff00] text-black text-[9px] font-black flex items-center justify-center shadow-[0_0_6px_#ccff00]">
                    2
                  </span>
                </button>

                {/* Séparateur subtil vertical */}
                <div className="w-px h-4 sm:h-5 bg-[#233126] mx-0.5 sm:mx-1"></div>

                {/* B. Sélecteur de période (remplace la barre de recherche) */}
                <div className="flex items-center gap-0.5 sm:gap-1 px-0.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Mois précédent"
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#1a231b] transition-colors active:scale-90"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 px-1 sm:px-2 text-center select-none">
                    <CalendarIcon className="w-3 h-3 text-[#ccff00] shrink-0 hidden sm:inline" />
                    <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap tracking-tight">
                      <span className="sm:hidden">{formatMonthKeyShort(selectedMonth)}</span>
                      <span className="hidden sm:inline">{formatMonthKey(selectedMonth)}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Mois suivant"
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#1a231b] transition-colors active:scale-90"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {!isCurrentActualMonth && (
                    <button
                      onClick={handleJumpToCurrentMonth}
                      title="Revenir au mois en cours"
                      className="hidden lg:inline-flex ml-1 text-[10px] px-2 py-0.5 rounded-full bg-[#ccff00]/20 text-[#ccff00] hover:bg-[#ccff00]/30 font-black transition-colors"
                    >
                      Aujourd'hui
                    </button>
                  )}
                </div>

                {/* Séparateur subtil vertical */}
                <div className="w-px h-4 sm:h-5 bg-[#233126] mx-0.5 sm:mx-1"></div>

                {/* C. Photo de profil de l'utilisateur liée à la forme */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="relative flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#ccff00]/50 transition-all active:scale-95"
                    title={`Profil : ${user.fullName}`}
                  >
                    <img
                      src={avatarImage}
                      alt={user.fullName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#ccff00]/60 shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#131914]"></span>
                  </button>

                  {/* Dropdown Menu profil rapide */}
                  {isProfileMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsProfileMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-[#121813] border border-[#233126] rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn text-left">
                        <div className="px-4 py-2 border-b border-[#1b261d]">
                          <p className="text-xs font-black text-white truncate">{user.fullName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[9px] font-black text-[#ccff00] bg-[#ccff00]/15 px-2 py-0.2 rounded-full border border-[#ccff00]/30">
                            Compte vérifié
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setCurrentTab('settings');
                          }}
                          className="w-full px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a231b] flex items-center justify-between transition-colors"
                        >
                          <span>Gérer mon profil</span>
                          <span className="text-[10px] text-slate-500">→</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setCurrentTab('settings');
                          }}
                          className="w-full px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a231b] flex items-center justify-between transition-colors"
                        >
                          <span>Tous les paramètres</span>
                          <span className="text-[10px] text-slate-500">→</span>
                        </button>

                        {onOpenOnboarding && (
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onOpenOnboarding();
                            }}
                            className="w-full px-4 py-2.5 text-xs text-[#ccff00] hover:bg-[#1a231b] flex items-center justify-between transition-colors font-bold"
                          >
                            <span>Reconfigurer le compte (Setup)</span>
                            <span className="text-[10px] text-[#ccff00]/60">→</span>
                          </button>
                        )}

                        {security.isLockEnabled && (
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onLockApp();
                            }}
                            className="w-full px-4 py-2.5 text-xs text-rose-400 hover:bg-[#1a231b] flex items-center justify-between transition-colors border-t border-[#1b261d]"
                          >
                            <span>Verrouiller l'accès</span>
                            <span className="text-[10px] text-rose-400/60">→</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* 3. Boutons d'action auxiliaires : Thème & Verrou */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={cycleTheme}
                  className="flex items-center gap-1 p-2 rounded-full bg-[#131914] hover:bg-[#1b231a] text-slate-300 hover:text-[#ccff00] border border-[#233126] text-xs font-semibold transition-all active:scale-95"
                  title={`Thème : ${themeMode === 'system' ? 'Système' : themeMode === 'dark' ? 'Sombre' : 'Clair'}`}
                >
                  {themeMode === 'system' ? (
                    <Laptop className="w-3.5 h-3.5 text-[#ccff00]" />
                  ) : resolvedTheme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-[#ccff00]" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>

                <PWAInstallButton variant="compact" />

                {security.isLockEnabled && (
                  <button
                    onClick={onLockApp}
                    title="Verrouiller GesFin"
                    className="p-2 rounded-full bg-[#131914] hover:bg-[#1b231a] text-[#ccff00] border border-[#ccff00]/30 transition-all active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* Navigation Bureau / Tablette en pilules élégantes */}
          <nav className="hidden md:flex space-x-1.5 py-2.5 border-t border-[#1c241e] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#141915]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tableau de bord</span>
            </button>

            <button
              onClick={() => setCurrentTab('expenses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === 'expenses'
                  ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#141915]'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Dépenses</span>
            </button>

            <button
              onClick={() => setCurrentTab('savings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === 'savings'
                  ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#141915]'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
              <span>Épargne</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#141915]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        selectedMonth={selectedMonth}
        totalExpenses={totalExpenses}
        totalSavings={totalSavings}
        currency={user.currency || 'FCFA'}
      />
    </>
  );
};
