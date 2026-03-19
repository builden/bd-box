/**
 * Settings 工具函数
 *
 * 从 useSettingsController 提取的通用函数
 */
import { DEFAULT_CODE_EDITOR_SETTINGS, DEFAULT_CURSOR_PERMISSIONS } from '../constants/constants';
import type {
  CodexPermissionMode,
  CodeEditorSettingsState,
  McpServer,
  SettingsProject, ClaudePermissionsState, CursorPermissionsState 
} from '@/components/settings/types/types';

/**
 * 获取错误消息
 */
export const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Unknown error');

/**
 * 解析 JSON 字符串，失败时返回默认值
 */
export const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

/**
 * 转换 Codex 权限模式
 */
export const toCodexPermissionMode = (value: unknown): CodexPermissionMode => {
  if (value === 'acceptEdits' || value === 'bypassPermissions') {
    return value;
  }

  return 'default';
};

/**
 * 读取编辑器设置
 */
export const readCodeEditorSettings = (): CodeEditorSettingsState => ({
  theme: localStorage.getItem('codeEditorTheme') === 'light' ? 'light' : 'dark',
  wordWrap: localStorage.getItem('codeEditorWordWrap') === 'true',
  showMinimap: localStorage.getItem('codeEditorShowMinimap') !== 'false',
  lineNumbers: localStorage.getItem('codeEditorLineNumbers') !== 'false',
  fontSize: localStorage.getItem('codeEditorFontSize') ?? DEFAULT_CODE_EDITOR_SETTINGS.fontSize,
});

/**
 * 映射 CLI 服务器到 MCP 服务器
 */
export const mapCliServersToMcpServers = (servers: McpCliServer[] = []): McpServer[] =>
  servers.map((server) => ({
    id: server.name,
    name: server.name,
    type: server.type || 'stdio',
    scope: 'user',
    config: {
      command: server.command || '',
      args: server.args || [],
      env: server.env || {},
      url: server.url || '',
      headers: server.headers || {},
      timeout: 30000,
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }));

export type McpCliServer = {
  name: string;
  type?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
};

/**
 * 获取默认项目
 */
export const getDefaultProject = (projects: SettingsProject[]): SettingsProject => {
  if (projects.length > 0) {
    return projects[0];
  }

  const cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '';
  return {
    name: 'default',
    displayName: 'default',
    fullPath: cwd,
    path: cwd,
  };
};

/**
 * 响应 JSON 转换
 */
export const toResponseJson = async <T>(response: Response): Promise<T> => response.json() as Promise<T>;

/**
 * 创建空 Claude 权限
 */
export const createEmptyClaudePermissions = (): ClaudePermissionsState => ({
  allowedTools: [],
  disallowedTools: [],
  skipPermissions: false,
});

/**
 * 创建空 Cursor 权限
 */
export const createEmptyCursorPermissions = (): CursorPermissionsState => ({
  ...DEFAULT_CURSOR_PERMISSIONS,
});
