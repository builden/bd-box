import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'katex/dist/katex.min.css';

import { createLogger } from '@/lib/logger';

const logger = createLogger('main');

// Initialize i18n
import './i18n/config';

// Clean up stale service workers on app load to prevent caching issues after builds
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    })
    .catch((err) => {
      logger.warn('Failed to unregister service workers:', err);
    });
}

// 在渲染前初始化主题 class，避免闪烁
const savedTheme = localStorage.getItem('bd-cc:theme');

// 默认使用 Light 模式，只有明确保存为 dark 时才使用 dark
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
