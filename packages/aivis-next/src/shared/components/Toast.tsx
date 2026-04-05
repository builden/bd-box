import { memo, useEffect, useState } from 'react';
import clsx from 'clsx';
import { isDarkModeAtom } from '@/shared/features/SettingsPanel/store';
import { useAtom } from 'jotai';
import { toastAtom } from './store';

export const Toast = memo(function Toast() {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [toast, setToast] = useAtom(toastAtom);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setToast(null), 300); // Wait for fade out
      }, toast.duration ?? 2000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div
      className={clsx(
        'fixed top-4 left-1/2 -translate-x-1/2 z-[100100] px-4 py-2 rounded-full text-[13px] font-medium shadow-lg transition-all duration-300',
        isDarkMode ? 'bg-white/90' : 'bg-black/90',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
      style={{ color: toast.color ?? (isDarkMode ? '#000' : '#fff') }}
    >
      {toast.message}
    </div>
  );
});
