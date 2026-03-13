import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider, ProtectedRoute } from './components/auth';
import { TaskMasterProvider } from './contexts/TaskMasterContext';
import { TasksSettingsProvider } from './contexts/TasksSettingsContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import AppContent from './components/app/AppContent';
import i18n from './i18n/config';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <WebSocketProvider>
          <TasksSettingsProvider>
            <TaskMasterProvider>
              <ProtectedRoute>
                <Router basename={window.__ROUTER_BASENAME__ || ''}>
                  <Routes>
                    <Route path="/" element={<AppContent />} />
                    <Route path="/session/:sessionId" element={<AppContent />} />
                  </Routes>
                </Router>
              </ProtectedRoute>
            </TaskMasterProvider>
          </TasksSettingsProvider>
        </WebSocketProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
