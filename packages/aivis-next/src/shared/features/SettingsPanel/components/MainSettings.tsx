import { memo } from 'react';
import clsx from 'clsx';
import { IconMoon, IconChevronRight } from '@/shared/components/Icons';
import { OutputDetailCycle } from './OutputDetailCycle';
import { ColorPicker } from './ColorPicker';
import { CheckboxField } from './CheckboxField';
import type { Settings } from '../store';

interface MainSettingsProps {
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onNavigateToAutomations: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  endpoint?: string | undefined;
}

export const MainSettings = memo(function MainSettings({
  settings,
  onSettingsChange,
  onNavigateToAutomations,
  connectionStatus,
  endpoint,
}: MainSettingsProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <div className="text-white font-medium">Aivis</div>
          <div className="text-white/40 text-xs">v1.0.0</div>
        </div>
        <button
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'hover:bg-white/10 transition-colors duration-150'
          )}
          title="Toggle theme"
        >
          <span className="text-white/60">
            <IconMoon size={20} />
          </span>
        </button>
      </div>

      <div className="h-px bg-white/10 mx-4" />

      {/* Output detail */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white/60">输出详情</span>
          <OutputDetailCycle
            value={settings.outputDetail}
            onChange={(value) => onSettingsChange({ outputDetail: value })}
          />
        </div>
      </div>

      <div className="h-px bg-white/10 mx-4" />

      {/* Color picker */}
      <div className="px-4 py-3">
        <div className="text-white/60 mb-2">标记颜色</div>
        <ColorPicker
          value={settings.annotationColorId}
          onChange={(colorId) => onSettingsChange({ annotationColorId: colorId })}
        />
      </div>

      <div className="h-px bg-white/10 mx-4" />

      {/* Checkboxes */}
      <div className="px-4 py-3 space-y-3">
        <CheckboxField
          label="启用 React"
          checked={settings.reactEnabled}
          onChange={(checked) => onSettingsChange({ reactEnabled: checked })}
        />
        <CheckboxField
          label="复制后清除"
          checked={settings.autoClearAfterCopy}
          onChange={(checked) => onSettingsChange({ autoClearAfterCopy: checked })}
        />
        <CheckboxField
          label="阻止页面交互"
          checked={settings.blockInteractions}
          onChange={(checked) => onSettingsChange({ blockInteractions: checked })}
        />
      </div>

      <div className="h-px bg-white/10 mx-4" />

      {/* Nav to automations */}
      <button
        onClick={onNavigateToAutomations}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3',
          'hover:bg-white/5 transition-colors duration-150',
          'text-white/60 hover:text-white'
        )}
      >
        <span>管理 MCP 和 Webhooks</span>
        <div className="flex items-center gap-2">
          {endpoint && connectionStatus !== 'disconnected' && (
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                connectionStatus === 'connected' && 'bg-green-500',
                connectionStatus === 'connecting' && 'bg-yellow-500 animate-pulse'
              )}
            />
          )}
          <IconChevronRight size={16} />
        </div>
      </button>
    </>
  );
});
