import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
