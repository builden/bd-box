import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GlobalNotifications');

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

// 全局通知状态
let notifications: Notification[] = [];
const listeners: Set<(notifications: Notification[]) => void> = new Set();

export const notificationService = {
  add: (notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };
    notifications = [...notifications, newNotification];
    listeners.forEach((listener) => listener(notifications));

    // 自动移除
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        notificationService.remove(id);
      }, duration);
    }

    logger.info('Notification added', { type: notification.type, title: notification.title });
    return id;
  },

  remove: (id: string) => {
    notifications = notifications.filter((n) => n.id !== id);
    listeners.forEach((listener) => listener(notifications));
  },

  subscribe: (listener: (notifications: Notification[]) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // 便捷方法
  success: (title: string, message?: string) => notificationService.add({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    notificationService.add({ type: 'error', title, message, duration: 8000 }),
  warning: (title: string, message?: string) => notificationService.add({ type: 'warning', title, message }),
  info: (title: string, message?: string) => notificationService.add({ type: 'info', title, message }),
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export default function GlobalNotifications() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setItems);
    return () => {
      unsubscribe();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 max-w-sm">
      {items.map((notification) => {
        const Icon = icons[notification.type];
        return (
          <div
            key={notification.id}
            className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${styles[notification.type]}`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${iconStyles[notification.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{notification.title}</p>
              {notification.message && <p className="mt-1 text-sm opacity-80">{notification.message}</p>}
            </div>
            <button
              onClick={() => notificationService.remove(notification.id)}
              className="flex-shrink-0 opacity60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
