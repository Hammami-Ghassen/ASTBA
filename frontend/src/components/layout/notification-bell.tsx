'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUnreadNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppNotification } from '@/lib/types';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: count } = useUnreadCount();
  const { data: unread } = useUnreadNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markRead.mutateAsync(id);
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        aria-label={t('title')}
      >
        <Bell className="h-5 w-5" />
        {(count ?? 0) > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {count! > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-xl shadow-gray-200/50 dark:border-gray-700/60 dark:bg-gray-800/95 dark:shadow-gray-900/50 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{t('title')}</span>
            {(count ?? 0) > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={handleMarkAllRead}>
                <CheckCheck className="h-3.5 w-3.5 me-1" /> {t('markAllRead')}
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {!unread || unread.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('noNotifications')}
              </div>
            ) : (
              unread.map((n: AppNotification) => (
                <div
                  key={n.id}
                  className={`
                    flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50
                    ${n.read ? 'opacity-60' : 'bg-sky-50/50 dark:bg-sky-900/10'}
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                  `}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      }) : ''}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="flex-shrink-0 rounded p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                      title={t('markRead')}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
