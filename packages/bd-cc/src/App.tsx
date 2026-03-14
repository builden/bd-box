import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider, ProtectedRoute } from './components/auth';
import { TaskMasterProvider } from './contexts/TaskMasterContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import AppContent from './components/app/AppContent';
import GlobalNotifications from './components/app/GlobalNotifications';
import i18n from './i18n/config';

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <WebSocketProvider>
          <TaskMasterProvider>{children}</TaskMasterProvider>
        </WebSocketProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default function App() {
  return (
    <AppProviders>
      <GlobalNotifications />
      <ProtectedRoute>
        <Router basename={window.__ROUTER_BASENAME__ || ''}>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/session/:sessionId" element={<AppContent />} />
          </Routes>
        </Router>
      </ProtectedRoute>
    </AppProviders>
  );
}
