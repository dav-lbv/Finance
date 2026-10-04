import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellRing, CheckCheck, X, Sparkles, ShieldCheck, Calendar } from 'lucide-react';

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

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  const markAllAsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="w-full max-w-md max-h-[85vh] flex flex-col rounded-t-[32px] sm:rounded-[32px] bg-surface-solid border border-line shadow-2xl pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-line-strong mx-auto mt-3" />

            <div className="flex items-start justify-between gap-3 px-6 pt-4 pb-3">
              <div className="min-w-0">
                <h3 className="text-[28px] leading-tight font-light tracking-tight text-fg flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand text-brand-fg">{unreadCount} nouv.</span>
                  )}
                </h3>
                <p className="text-[12px] text-fg-muted mt-0.5">Alertes et rappels de budget</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-10 h-10 shrink-0 rounded-full bg-surface-2 border border-line flex items-center justify-center text-fg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-2">
              {notifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center">
                  <span className="w-20 h-20 rounded-full bg-surface-2 border border-line flex items-center justify-center shadow-[inset_0_1px_0_var(--glass-edge)]">
                    <BellRing className="w-8 h-8 text-fg-2" />
                  </span>
                  <p className="mt-5 text-lg font-bold text-fg">Tout est à jour</p>
                  <p className="mt-1 max-w-[17rem] text-[13px] leading-relaxed text-fg-muted">
                    Les rappels de budget et les alertes importantes apparaîtront ici.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5 pt-1">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border ${
                        notif.isRead ? 'bg-surface/40 border-line opacity-80' : 'bg-surface-2 border-line-strong'
                      }`}
                    >
                      <span className="w-9 h-9 shrink-0 rounded-full bg-surface-3 text-fg flex items-center justify-center">
                        {notif.type === 'finance' ? <Sparkles className="w-4 h-4" /> : notif.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-fg truncate">{notif.title}</span>
                          <span className="text-[10px] text-fg-muted shrink-0 font-medium">{notif.time}</span>
                        </div>
                        <p className="text-xs text-fg-2 leading-relaxed mt-0.5">{notif.message}</p>
                      </div>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-fg shrink-0 mt-3" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-6 pt-3 flex items-center gap-3">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-xs text-fg-muted font-semibold cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  Tout marquer comme lu
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`ml-auto flex-1 h-12 ${notifications.length > 0 ? 'max-w-[12rem]' : ''} rounded-full bg-fg text-app font-bold text-sm cursor-pointer active:scale-[0.98] transition`}
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
