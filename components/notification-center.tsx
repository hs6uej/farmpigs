'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ListTodo,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th, enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TASK';
  category: string | null;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationCenterProps {
  locale?: string;
}

export default function NotificationCenter({ locale = 'th' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
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

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });
      
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAllRead = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/notifications?clearRead=true', {
        method: 'DELETE',
      });
      
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'WARNING':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'ERROR':
        return <XCircle size={16} className="text-red-500" />;
      case 'TASK':
        return <ListTodo size={16} className="text-blue-500" />;
      default:
        return <Info size={16} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'WARNING':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'ERROR':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'TASK':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: locale === 'th' ? th : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  const translations = {
    th: {
      notifications: 'การแจ้งเตือน',
      markAllRead: 'อ่านทั้งหมด',
      clearRead: 'ลบที่อ่านแล้ว',
      noNotifications: 'ไม่มีการแจ้งเตือน',
      allCaughtUp: 'คุณดูการแจ้งเตือนทั้งหมดแล้ว',
      remove: 'ลบ',
      view: 'ดู',
    },
    en: {
      notifications: 'Notifications',
      markAllRead: 'Mark all read',
      clearRead: 'Clear read',
      noNotifications: 'No notifications',
      allCaughtUp: 'You\'re all caught up!',
      remove: 'Remove',
      view: 'View',
    },
  };

  const t = locale === 'th' ? translations.th : translations.en;

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel - Azure Style */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 max-h-[80vh] bg-white dark:bg-[#1f1d2e] rounded-lg shadow-xl border border-gray-200 dark:border-[#8B8D98]/20 overflow-hidden z-50">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-[#1f1d2e] border-b border-gray-200 dark:border-[#8B8D98]/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-[#7800A3]" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{t.notifications}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium text-white bg-[#7800A3] rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="cursor-pointer p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#7800A3]/50 transition-colors disabled:opacity-50"
                  title={t.markAllRead}
                >
                  <CheckCheck size={16} className="text-gray-500 dark:text-gray-400" />
                </button>
              )}
              {notifications.some((n) => n.isRead) && (
                <button
                  onClick={clearAllRead}
                  disabled={isLoading}
                  className="cursor-pointer p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors disabled:opacity-50"
                  title={t.clearRead}
                >
                  <Trash2 size={16} className="text-gray-500 dark:text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors"
              >
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">{t.noNotifications}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t.allCaughtUp}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#8B8D98]/10">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                    className={`relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#7800A3]/20 transition-colors cursor-pointer group ${
                      !notification.isRead ? 'bg-[#7800A3]/2 dark:bg-[#7800A3]/5' : ''
                    }`}
                  >
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#7800A3]" />
                    )}

                    <div className="flex gap-3">
                      {/* Type Icon */}
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${getTypeBgColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium truncate ${
                            !notification.isRead 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="cursor-pointer shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-[#7800A3]/20 transition-all"
                            title={t.remove}
                          >
                            <X size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.link && (
                            <a
                              href={notification.link}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-[#7800A3] hover:text-[#9B30B5] transition-colors"
                            >
                              <span>{t.view}</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Read indicator */}
                    {notification.isRead && (
                      <div className="absolute right-4 bottom-3">
                        <Check size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
