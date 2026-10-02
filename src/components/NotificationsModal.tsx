import React from 'react';
import { Bell, CheckCheck, X, Sparkles, AlertCircle, ShieldCheck, PiggyBank, Calendar } from 'lucide-react';
import { formatMonthKey } from '../utils/date';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'alert' | 'finance';
  isRead: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  totalExpenses: number;
  totalSavings: number;
  currency: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  totalExpenses,
  totalSavings,
  currency,
}) => {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-fg flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand text-brand-fg">
                    {unreadCount} nouv.
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-fg-muted">Alertes & rappels budgétaires Mon_Kanda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-line/50">
          {notifications.length === 0 && (
            <div className="py-10 text-center text-xs text-fg-muted">
              <Bell className="w-6 h-6 mx-auto mb-2 text-fg-muted" />
              Aucune notification pour le moment.
            </div>
          )}
          {notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                className={`pt-2.5 first:pt-0 flex items-start gap-3 p-2.5 rounded-2xl transition-colors ${
                  notif.isRead ? 'bg-surface/40 opacity-80' : 'bg-surface-2 border border-line-strong'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {notif.type === 'finance' ? (
                    <div className="w-7 h-7 rounded-lg bg-brand/20 text-brand flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  ) : notif.type === 'success' ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-xs sm:text-sm text-fg truncate">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-fg-muted shrink-0 font-medium">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-fg-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2 shadow-[0_0_8px_rgba(var(--brand-rgb),0.7)]"></span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-line bg-surface flex items-center justify-between">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-brand font-semibold transition-colors px-2 py-1 rounded-lg"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tout marquer comme lu</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-brand text-brand-fg font-extrabold text-xs hover:bg-brand-hover transition-colors shadow-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
