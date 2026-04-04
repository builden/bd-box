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
      <button onClick={onNavigateToMain} className="group w-full flex items-center gap-1 py-3">
        <span className="opacity-40 group-hover:opacity-100 transition-opacity duration-150">
          <IconChevronLeft size={14} />
        </span>
        <span className="text-white text-[13px] tracking-tight">管理 MCP 和 Webhooks</span>
      </button>

      <div className="h-px bg-white/8 my-2" />

      {/* MCP section */}
      <div>
        <div className="flex items-center justify-between min-h-6">
          <span className="text-white text-[13px] font-medium tracking-tight">MCP 连接</span>
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
        <p className="text-white/40 text-xs pt-1.5 pb-2">MCP 连接允许代理接收并操作标注</p>
      </div>

      <div className="h-px bg-white/8 my-2" />

      {/* Webhooks section */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between min-h-6">
          <span className="text-white text-[13px] font-medium tracking-tight">Webhooks</span>
          <CheckboxField
            label="自动发送"
            checked={settings.webhooksEnabled}
            onChange={(checked) => onSettingsChange({ webhooksEnabled: checked })}
            disabled={!settings.webhookUrl}
          />
        </div>
        <p className="text-white/40 text-xs pt-1.5">Webhook URL 将接收实时标注变更和标注数据</p>
        <textarea
          value={settings.webhookUrl}
          onChange={(e) => onSettingsChange({ webhookUrl: e.target.value })}
          placeholder="Webhook URL"
          className={clsx(
            'w-full mt-[11px] py-2 px-[10px] rounded-md resize-none',
            'bg-white/[0.03] border border-white/10',
            'text-white text-[12px] placeholder:text-white/30',
            'focus:outline-none focus:border-white/30',
            'transition-colors duration-150'
          )}
          style={{ minHeight: '60px' }}
        />
      </div>
    </>
  );
});
