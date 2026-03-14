import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Info, X, XCircle } from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GlobalNotifications');

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * 扩展的通知接口，包含调试信息
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  /** 请求 URL */
  url?: string;
  /** HTTP 状态码 */
  status?: number;
  /** 时间戳 */
  timestamp?: string;
  /** 堆栈信息 */
  stack?: string;
  /** 额外上下文 */
  context?: Record<string, unknown>;
}

// 全局通知状态
let notifications: Notification[] = [];
const listeners: Set<(notifications: Notification[]) => void> = new Set();

/**
 * 格式化错误信息用于复制
 */
const formatErrorForCopy = (notification: Notification): string => {
  const lines = [
    `❌ Error: ${notification.title}`,
    notification.message ? `Message: ${notification.message}` : null,
    notification.url ? `URL: ${notification.url}` : null,
    notification.status ? `Status: ${notification.status}` : null,
    notification.timestamp ? `Time: ${notification.timestamp}` : null,
    notification.stack ? `\nStack:\n${notification.stack}` : null,
    notification.context ? `\nContext: ${JSON.stringify(notification.context, null, 2)}` : null,
  ].filter(Boolean);

  return lines.join('\n');
};

export const notificationService = {
  add: (notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    const newNotification = {
      ...notification,
      id,
      timestamp: notification.timestamp || new Date().toISOString(),
    };
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

  // 便捷方法 - 支持扩展参数
  success: (title: string, message?: string) => notificationService.add({ type: 'success', title, message }),
  error: (
    title: string,
    message?: string,
    options?: { url?: string; status?: number; stack?: string; context?: Record<string, unknown> }
  ) =>
    notificationService.add({
      type: 'error',
      title,
      message,
      url: options?.url,
      status: options?.status,
      stack: options?.stack,
      context: options?.context,
      duration: 8000,
    }),
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

function NotificationItem({ notification, onRemove }: { notification: Notification; onRemove: () => void }) {
  const [copied, setCopied] = useState(false);
  const Icon = icons[notification.type];

  const handleCopy = async () => {
    const text = formatErrorForCopy(notification);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${styles[notification.type]}`}>
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconStyles[notification.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{notification.title}</p>
        {notification.message && <p className="mt-1 text-sm opacity-80">{notification.message}</p>}
        {notification.url && (
          <p className="mt-1 text-xs opacity-60 font-mono truncate" title={notification.url}>
            {notification.url}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 gap-1">
        {notification.type === 'error' && (
          <button
            onClick={handleCopy}
            className="opacity60 hover:opacity-100 p-1 rounded hover:bg-black/5"
            title="复制错误信息"
          >
            {copied ? (
              <span className="text-xs font-medium text-green-600">✓ 已复制</span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
        <button onClick={onRemove} className="opacity60 hover:opacity-100 p-1 rounded hover:bg-black/5" title="关闭">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => notificationService.remove(notification.id)}
        />
      ))}
    </div>
  );
}
