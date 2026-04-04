import { useAtom } from 'jotai';
import { memo } from 'react';
import clsx from 'clsx';
import { settingsAtom, showSettingsAtom, settingsPageAtom, connectionStatusAtom, endpointAtom } from './store';
import { MainSettings, AutomationSettings } from './components';

export const SettingsPanel = memo(function SettingsPanel() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [showSettings] = useAtom(showSettingsAtom);
  const [settingsPage, setSettingsPage] = useAtom(settingsPageAtom);
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [endpoint] = useAtom(endpointAtom);

  const handleSettingsChange = (patch: Partial<typeof settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  if (!showSettings) return null;

  return (
    <div
      className={clsx(
        'absolute right-[5px] bottom-[calc(100%+0.5rem)]',
        'z-10 overflow-hidden',
        'bg-[#1a1a1a] rounded-2xl',
        'w-[253px]',
        'shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.08)]',
        'text-white/60 text-sm'
      )}
    >
      <div className="relative overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#1a1a1a] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#1a1a1a] to-transparent pointer-events-none z-10" />

        {/* Main page */}
        <div className={clsx(settingsPage === 'automations' && 'hidden')}>
          <MainSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onNavigateToAutomations={() => setSettingsPage('automations')}
            connectionStatus={connectionStatus}
            endpoint={endpoint}
          />
        </div>

        {/* Automations page */}
        <div className={clsx(settingsPage !== 'automations' && 'hidden')}>
          <AutomationSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onNavigateToMain={() => setSettingsPage('main')}
            connectionStatus={connectionStatus}
            endpoint={endpoint}
          />
        </div>
      </div>
    </div>
  );
});
