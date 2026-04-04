import { useAtom } from 'jotai';
import { memo, useEffect } from 'react';
import {
  settingsAtom,
  showSettingsAtom,
  settingsPageAtom,
  connectionStatusAtom,
  endpointAtom,
  isDarkModeAtom,
} from './store';
import { MainSettings, AutomationSettings } from './components';

export const SettingsPanel = memo(function SettingsPanel() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);
  const [settingsPage, setSettingsPage] = useAtom(settingsPageAtom);
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [endpoint] = useAtom(endpointAtom);
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);

  // 每次打开设置面板时，重置到主页面
  useEffect(() => {
    if (showSettings) {
      setSettingsPage('main');
    }
  }, [showSettings, setSettingsPage]);

  const handleSettingsChange = (patch: Partial<typeof settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleHideToolbar = () => {
    setShowSettings(false);
  };

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  if (!showSettings) return null;

  return (
    <div
      data-no-drag
      data-theme={isDarkMode ? 'dark' : 'light'}
      className={
        isDarkMode
          ? 'absolute right-[5px] bottom-[calc(100%+0.5rem)] z-10 py-3 bg-[#1a1a1a] rounded-2xl w-[253px] shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.08)] text-white/60 text-sm cursor-default'
          : 'absolute right-[5px] bottom-[calc(100%+0.5rem)] z-10 py-3 bg-white rounded-2xl w-[253px] shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] text-black/50 text-sm cursor-default'
      }
    >
      <div className="px-4">
        {settingsPage === 'main' ? (
          <MainSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onNavigateToAutomations={() => setSettingsPage('automations')}
            onHideToolbar={handleHideToolbar}
            connectionStatus={connectionStatus}
            endpoint={endpoint}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
          />
        ) : (
          <AutomationSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onNavigateToMain={() => setSettingsPage('main')}
            connectionStatus={connectionStatus}
            endpoint={endpoint}
          />
        )}
      </div>
    </div>
  );
});
