import { memo } from 'react';
import clsx from 'clsx';
import { IconMoon, IconChevronRight } from '@/shared/components/Icons';
import { HelpTooltip } from '@/shared/components/HelpTooltip';
import { OutputDetailCycle } from './OutputDetailCycle';
import { ColorPicker } from './ColorPicker';
import { CheckboxField } from './CheckboxField';
import { Switch } from '@/shared/components/Switch';
import type { Settings } from '../store';

interface MainSettingsProps {
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onNavigateToAutomations: () => void;
  onHideToolbar: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  endpoint?: string | undefined;
}

export const MainSettings = memo(function MainSettings({
  settings,
  onSettingsChange,
  onNavigateToAutomations,
  onHideToolbar,
  connectionStatus,
  endpoint,
}: MainSettingsProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-6">
        <span className="text-white text-[13px] font-semibold tracking-tight">Aivis</span>
        <span className="text-white/40 text-[11px] ml-auto">v1.0.0</span>
        <button
          className={clsx(
            'w-[22px] h-[22px] rounded-md flex items-center justify-center',
            'text-white/40 hover:text-white/80 hover:bg-white/10',
            'transition-colors duration-150'
          )}
          title="Toggle theme"
        >
          <IconMoon size={16} />
        </button>
      </div>

      <div className="h-px bg-white/8 my-2" />

      {/* Output detail + React + Hide until restart */}
      <div>
        {/* Output detail row */}
        <div className="flex items-center justify-between h-6">
          <div className="flex items-center gap-0.5">
            <span className="text-white/50 text-[13px] tracking-tight">输出详情</span>
            <HelpTooltip content="控制复制输出中包含的详细信息量" />
          </div>
          <OutputDetailCycle
            value={settings.outputDetail}
            onChange={(value) => onSettingsChange({ outputDetail: value })}
          />
        </div>

        {/* React component row */}
        <div className="flex items-center justify-between h-6 mt-2">
          <div className="flex items-center gap-0.5">
            <span className="text-white/50 text-[13px] tracking-tight">React 组件</span>
            <HelpTooltip content="在标注中包含 React 组件名称" />
          </div>
          <Switch
            checked={settings.reactEnabled}
            onChange={(e) => onSettingsChange({ reactEnabled: e.target.checked })}
          />
        </div>

        {/* Hide until restart row */}
        <div className="flex items-center justify-between h-6 mt-2">
          <div className="flex items-center gap-0.5">
            <span className="text-white/50 text-[13px] tracking-tight">隐藏直到重启</span>
            <HelpTooltip content="隐藏工具栏直到你打开新标签页" />
          </div>
          <Switch
            checked={false}
            onChange={(e) => {
              if (e.target.checked) onHideToolbar();
            }}
          />
        </div>
      </div>

      <div className="h-px bg-white/8 my-2" />

      {/* Color picker */}
      <div>
        <div className="flex items-center gap-0.5 mb-2">
          <span className="text-white/50 text-[13px] tracking-tight">标记颜色</span>
          <HelpTooltip content="选择标注的颜色" />
        </div>
        <ColorPicker
          value={settings.annotationColorId}
          onChange={(colorId) => onSettingsChange({ annotationColorId: colorId })}
        />
      </div>

      <div className="h-px bg-white/8 my-2" />

      {/* Checkboxes */}
      <div className="space-y-2">
        <CheckboxField
          label="复制/发送后清除"
          checked={settings.autoClearAfterCopy}
          onChange={(checked) => onSettingsChange({ autoClearAfterCopy: checked })}
        />
        <CheckboxField
          label="阻止页面交互"
          checked={settings.blockInteractions}
          onChange={(checked) => onSettingsChange({ blockInteractions: checked })}
        />
      </div>

      <div className="h-px bg-white/8 my-2" />

      {/* Nav to automations */}
      <button
        onClick={onNavigateToAutomations}
        className="group w-full flex items-center justify-between transition-colors duration-150"
      >
        <span className="text-white/50 group-hover:text-white text-[13px] tracking-tight transition-colors duration-150">
          管理 MCP 和 Webhooks
        </span>
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
          <span className="text-white/50 group-hover:text-white transition-colors duration-150">
            <IconChevronRight size={14} />
          </span>
        </div>
      </button>
    </>
  );
});
