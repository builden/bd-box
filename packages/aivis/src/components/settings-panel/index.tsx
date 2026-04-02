import { COLOR_OPTIONS, ToolbarSettings } from '../page-toolbar-css';
import { OUTPUT_DETAIL_OPTIONS } from '../../utils/generate-output';
import { HelpTooltip } from '../help-tooltip';
import { IconChevronLeft, IconMoon, IconSun } from '../icons';
import { Switch } from '../switch';
import { CheckboxField } from './checkbox-field';
import styles from './styles.module.scss';

// Build-time version replacement
declare const __VERSION__: string;
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '1.0.0';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type SettingsPanelProps = {
  settings: ToolbarSettings;
  onSettingsChange: (patch: Partial<ToolbarSettings>) => void;

  isDarkMode: boolean;
  onToggleTheme: () => void;

  isDevMode: boolean;

  connectionStatus: ConnectionStatus;
  endpoint?: string;

  /** Whether the panel is mounted (controls enter/exit class) */
  isVisible: boolean;

  /** Position override: show panel above toolbar when toolbar is near bottom */
  toolbarNearBottom: boolean;

  settingsPage: 'main' | 'automations';
  onSettingsPageChange: (page: 'main' | 'automations') => void;

  onHideToolbar: () => void;
};

export function SettingsPanel({
  settings,
  onSettingsChange,
  isDarkMode,
  onToggleTheme,
  isDevMode,
  connectionStatus,
  endpoint,
  isVisible,
  toolbarNearBottom,
  settingsPage,
  onSettingsPageChange,
  onHideToolbar,
}: SettingsPanelProps) {
  return (
    <div
      className={`${styles.settingsPanel} ${isVisible ? styles.enter : styles.exit}`}
      style={toolbarNearBottom ? { bottom: 'auto', top: 'calc(100% + 0.5rem)' } : undefined}
      data-agentation-settings-panel
    >
      <div className={styles.settingsPanelContainer}>
        {/* ── Main page ── */}
        <div className={`${styles.settingsPage} ${settingsPage === 'automations' ? styles.slideLeft : ''}`}>
          <div className={styles.settingsHeader}>
            <span className={styles.settingsBrand}>Aivis</span>
            <p className={styles.settingsVersion}>v{VERSION}</p>
            <button
              className={styles.themeToggle}
              onClick={onToggleTheme}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className={styles.themeIconWrapper}>
                <span key={isDarkMode ? 'sun' : 'moon'} className={styles.themeIcon}>
                  {isDarkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
                </span>
              </span>
            </button>
          </div>

          <div className={styles.divider}></div>

          {/* Output detail + React toggle */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsRow}>
              <div className={styles.settingsLabel}>
                输出详情
                <HelpTooltip content="控制复制输出中包含的详细信息量" />
              </div>
              <button
                className={styles.cycleButton}
                onClick={() => {
                  const currentIndex = OUTPUT_DETAIL_OPTIONS.findIndex((opt) => opt.value === settings.outputDetail);
                  const nextIndex = (currentIndex + 1) % OUTPUT_DETAIL_OPTIONS.length;
                  onSettingsChange({
                    outputDetail: OUTPUT_DETAIL_OPTIONS[nextIndex].value,
                  });
                }}
              >
                <span key={settings.outputDetail} className={styles.cycleButtonText}>
                  {OUTPUT_DETAIL_OPTIONS.find((opt) => opt.value === settings.outputDetail)?.label}
                </span>
                <span className={styles.cycleDots}>
                  {OUTPUT_DETAIL_OPTIONS.map((option) => (
                    <span
                      key={option.value}
                      className={`${styles.cycleDot} ${settings.outputDetail === option.value ? styles.active : ''}`}
                    />
                  ))}
                </span>
              </button>
            </div>

            <div
              className={`${styles.settingsRow} ${styles.settingsRowMarginTop} ${!isDevMode ? styles.settingsRowDisabled : ''}`}
            >
              <div className={styles.settingsLabel}>
                React 组件
                <HelpTooltip
                  content={
                    !isDevMode
                      ? '已禁用 — 生产构建会压缩组件名称，导致检测不可靠。请在开发模式下使用。'
                      : '在标注中包含 React 组件名称'
                  }
                />
              </div>
              <Switch
                checked={isDevMode && settings.reactEnabled}
                onChange={(e) => onSettingsChange({ reactEnabled: e.target.checked })}
                disabled={!isDevMode}
              />
            </div>

            <div className={`${styles.settingsRow} ${styles.settingsRowMarginTop}`}>
              <div className={styles.settingsLabel}>
                隐藏直到重启
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

          <div className={styles.divider}></div>

          {/* Color picker */}
          <div className={styles.settingsSection}>
            <div className={`${styles.settingsLabel} ${styles.settingsLabelMarker}`}>标记颜色</div>
            <div className={styles.colorOptions}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  className={`${styles.colorOption} ${settings.annotationColorId === color.id ? styles.selected : ''}`}
                  style={
                    {
                      '--swatch': color.srgb,
                      '--swatch-p3': color.p3,
                    } as React.CSSProperties
                  }
                  onClick={() => onSettingsChange({ annotationColorId: color.id })}
                  title={color.label}
                  type="button"
                  key={color.id}
                ></button>
              ))}
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Checkboxes */}
          <div className={styles.settingsSection}>
            <CheckboxField
              className="checkbox-field"
              label="复制/发送后清除"
              checked={settings.autoClearAfterCopy}
              onChange={(e) => onSettingsChange({ autoClearAfterCopy: e.target.checked })}
              tooltip="复制后自动清除标注"
            />
            <CheckboxField
              className={styles.checkboxField}
              label="阻止页面交互"
              checked={settings.blockInteractions}
              onChange={(e) => onSettingsChange({ blockInteractions: e.target.checked })}
            />
          </div>

          <div className={styles.divider} />

          {/* Nav to automations */}
          <button className={styles.settingsNavLink} onClick={() => onSettingsPageChange('automations')}>
            <span>管理 MCP 和 Webhooks</span>
            <span className={styles.settingsNavLinkRight}>
              {endpoint && connectionStatus !== 'disconnected' && (
                <span className={`${styles.mcpNavIndicator} ${styles[connectionStatus]}`} />
              )}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.5 12.5L12 8L7.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {/* ── Automations page ── */}
        <div
          className={`${styles.settingsPage} ${styles.automationsPage} ${settingsPage === 'automations' ? styles.slideIn : ''}`}
        >
          <button className={styles.settingsBackButton} onClick={() => onSettingsPageChange('main')}>
            <IconChevronLeft size={16} />
            <span>管理 MCP 和 Webhooks</span>
          </button>

          <div className={styles.divider}></div>

          {/* MCP section */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsRow}>
              <span className={styles.automationHeader}>
                MCP 连接
                <HelpTooltip content="通过 Model Context Protocol 连接，让 AI 代理（如 Claude Code）实时接收标注。" />
              </span>
              {endpoint && (
                <div
                  className={`${styles.mcpStatusDot} ${styles[connectionStatus]}`}
                  title={
                    connectionStatus === 'connected'
                      ? '已连接'
                      : connectionStatus === 'connecting'
                        ? '连接中...'
                        : '已断开'
                  }
                />
              )}
            </div>
            <p className={styles.automationDescription} style={{ paddingBottom: 6 }}>
              MCP 连接允许代理接收并操作标注。
            </p>
          </div>

          <div className={styles.divider}></div>

          {/* Webhooks section */}
          <div className={`${styles.settingsSection} ${styles.settingsSectionGrow}`}>
            <div className={styles.settingsRow}>
              <span className={styles.automationHeader}>
                Webhooks
                <HelpTooltip content="当标注变更时将标注数据发送到任何 URL 端点。适用于自定义集成。" />
              </span>
              <div className={styles.autoSendContainer}>
                <label
                  htmlFor="agentation-auto-send"
                  className={`${styles.autoSendLabel} ${settings.webhooksEnabled ? styles.active : ''} ${!settings.webhookUrl ? styles.disabled : ''}`}
                >
                  自动发送
                </label>
                <Switch
                  id="agentation-auto-send"
                  checked={settings.webhooksEnabled}
                  onChange={(e) =>
                    onSettingsChange({
                      webhooksEnabled: e.target.checked,
                    })
                  }
                  disabled={!settings.webhookUrl}
                />
              </div>
            </div>
            <p className={styles.automationDescription}>Webhook URL 将接收实时标注变更和标注数据。</p>
            <textarea
              className={styles.webhookUrlInput}
              placeholder="Webhook URL"
              value={settings.webhookUrl}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => onSettingsChange({ webhookUrl: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
