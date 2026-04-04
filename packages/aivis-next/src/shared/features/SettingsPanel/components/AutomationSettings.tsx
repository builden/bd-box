import { memo } from 'react';
import clsx from 'clsx';
import { IconChevronLeft } from '@/shared/components/Icons';
import { CheckboxField } from './CheckboxField';
import type { Settings, ConnectionStatus } from '../store';

interface AutomationSettingsProps {
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onNavigateToMain: () => void;
  connectionStatus: ConnectionStatus;
  endpoint?: string | undefined;
}

export const AutomationSettings = memo(function AutomationSettings({
  settings,
  onSettingsChange,
  onNavigateToMain,
  connectionStatus,
  endpoint,
}: AutomationSettingsProps) {
  return (
    <>
      {/* Back button */}
      <button
        onClick={onNavigateToMain}
        className={clsx(
          'w-full flex items-center gap-2 px-4 py-3',
          'hover:bg-white/5 transition-colors duration-150',
          'text-white/60 hover:text-white'
        )}
      >
        <IconChevronLeft size={16} />
        <span>管理 MCP 和 Webhooks</span>
      </button>

      <div className="h-px bg-white/10 mx-4" />

      {/* MCP section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-medium">MCP 连接</span>
          {endpoint && (
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                connectionStatus === 'connected' && 'bg-green-500',
                connectionStatus === 'connecting' && 'bg-yellow-500 animate-pulse',
                connectionStatus === 'disconnected' && 'bg-red-500'
              )}
              title={
                connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '已断开'
              }
            />
          )}
        </div>
        <p className="text-white/40 text-xs">MCP 连接允许代理接收并操作标注</p>
      </div>

      <div className="h-px bg-white/10 mx-4" />

      {/* Webhooks section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-medium">Webhooks</span>
          <CheckboxField
            label="自动发送"
            checked={settings.webhooksEnabled}
            onChange={(checked) => onSettingsChange({ webhooksEnabled: checked })}
            disabled={!settings.webhookUrl}
          />
        </div>
        <p className="text-white/40 text-xs mb-2">Webhook URL 将接收实时标注变更和标注数据</p>
        <textarea
          value={settings.webhookUrl}
          onChange={(e) => onSettingsChange({ webhookUrl: e.target.value })}
          placeholder="Webhook URL"
          className={clsx(
            'w-full px-3 py-2 rounded-lg resize-none',
            'bg-white/5 border border-white/10',
            'text-white text-sm placeholder:text-white/30',
            'focus:outline-none focus:border-white/30',
            'transition-colors duration-150'
          )}
          rows={2}
        />
      </div>
    </>
  );
});
