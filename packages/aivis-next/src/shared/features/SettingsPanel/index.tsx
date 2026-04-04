import { useAtom } from 'jotai';
import { memo } from 'react';
import { settingsAtom, showSettingsAtom, settingsPageAtom, connectionStatusAtom, endpointAtom } from './store';
import { MainSettings, AutomationSettings } from './components';

export const SettingsPanel = memo(function SettingsPanel() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);
  const [settingsPage, setSettingsPage] = useAtom(settingsPageAtom);
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [endpoint] = useAtom(endpointAtom);

  const handleSettingsChange = (patch: Partial<typeof settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleHideToolbar = () => {
    setShowSettings(false);
  };

  if (!showSettings) return null;

  return (
    <div className="absolute right-[5px] bottom-[calc(100%+0.5rem)] z-10 py-3 bg-[#1a1a1a] rounded-2xl w-[253px] shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.08)] text-white/60 text-sm">
      <div className="px-4">
        {settingsPage === 'main' ? (
          <MainSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onNavigateToAutomations={() => setSettingsPage('automations')}
            onHideToolbar={handleHideToolbar}
            connectionStatus={connectionStatus}
            endpoint={endpoint}
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
