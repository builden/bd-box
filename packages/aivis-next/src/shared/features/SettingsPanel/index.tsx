import { useAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  settingsAtom,
  showSettingsAtom,
  settingsPageAtom,
  connectionStatusAtom,
  endpointAtom,
  isDarkModeAtom,
} from './store';
import { MainSettings, AutomationSettings } from './components';

const PANEL_WIDTH = 253;
const EDGE_PADDING = 10;
const SPACING = '0.5rem';

export const SettingsPanel = memo(function SettingsPanel() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);
  const [settingsPage, setSettingsPage] = useAtom(settingsPageAtom);
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [endpoint] = useAtom(endpointAtom);
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);

  // 智能位置状态
  const [showOnLeft, setShowOnLeft] = useState(false);

  // 每次打开设置面板时，计算位置
  useEffect(() => {
    if (showSettings) {
      setSettingsPage('main');
      // 检查右侧是否足够空间
      setShowOnLeft(window.innerWidth < PANEL_WIDTH + EDGE_PADDING * 2 + 10);
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

  // 获取面板高度（使用估算值）
  const PANEL_HEIGHT = 320;

  // 动态计算样式
  const getPositionStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      position: 'absolute',
      zIndex: 10,
      paddingTop: 12,
      paddingBottom: 12,
      width: PANEL_WIDTH,
      borderRadius: '1rem',
    };

    // 水平位置
    if (showOnLeft) {
      style.left = EDGE_PADDING;
    } else {
      style.right = 5;
    }

    // 检测工具栏位置，判断面板放在上方是否会超出屏幕
    // SettingsPanel 的父容器就是工具栏
    const toolbarRect = (
      document.querySelector('[data-no-drag]') as HTMLElement
    )?.parentElement?.getBoundingClientRect();
    const toolbarTop = toolbarRect?.top ?? window.innerHeight;

    // 面板放在上方时的顶部位置：工具栏顶部 - 面板高度 - 间距
    const panelTopIfAbove = toolbarTop - PANEL_HEIGHT - 16;

    // 如果上方位置会超出屏幕顶部，则放在下方
    if (panelTopIfAbove < EDGE_PADDING) {
      style.top = `calc(100% + ${SPACING})`;
    } else {
      style.bottom = `calc(100% + ${SPACING})`;
    }

    return style;
  };

  return (
    <div
      data-no-drag
      data-no-hover
      className={clsx(
        'text-sm cursor-default',
        isDarkMode
          ? 'bg-[#1a1a1a] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.08)] text-white/60'
          : 'bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] text-black/50'
      )}
      style={getPositionStyle()}
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
