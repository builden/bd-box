import type { ChatMessage } from '../types';
import type { ProjectSession } from '@/types';
import { safeLocalStorage } from './chatStorage';

/**
 * 消息类型常量
 */
export const GLOBAL_MESSAGE_TYPES = [
  'projects_updated',
  'taskmaster-project-updated',
  'session-created',
  'websocket-reconnected',
] as const;

export const LIFECYCLE_MESSAGE_TYPES = new Set([
  'claude-complete',
  'codex-complete',
  'cursor-result',
  'session-aborted',
  'claude-error',
  'cursor-error',
  'codex-error',
  'gemini-error',
  'error',
]);

export type GlobalMessageType = (typeof GLOBAL_MESSAGE_TYPES)[number];

/**
 * 解析消息数据
 */
export interface ParsedMessageData {
  messageData: any;
  structuredMessageData: Record<string, any> | null;
  rawStructuredData: Record<string, any> | null;
  messageType: string;
}

export function parseMessageData(latestMessage: any): ParsedMessageData {
  const messageData = latestMessage?.data?.message || latestMessage?.data;
  const structuredMessageData =
    messageData && typeof messageData === 'object' ? (messageData as Record<string, any>) : null;
  const rawStructuredData =
    latestMessage?.data && typeof latestMessage.data === 'object' ? (latestMessage.data as Record<string, any>) : null;
  const messageType = String(latestMessage?.type || '');

  return { messageData, structuredMessageData, rawStructuredData, messageType };
}

/**
 * 判断消息类型
 */
export function isGlobalMessage(messageType: string): boolean {
  return GLOBAL_MESSAGE_TYPES.includes(messageType as GlobalMessageType);
}

export function isLifecycleMessage(messageType: string): boolean {
  return LIFECYCLE_MESSAGE_TYPES.has(messageType);
}

/**
 * 检查是否是 Claude 系统初始化消息
 */
export function isClaudeSystemInit(messageType: string, structuredMessageData: Record<string, any> | null): boolean {
  return Boolean(
    messageType === 'claude-response' &&
    structuredMessageData &&
    structuredMessageData.type === 'system' &&
    structuredMessageData.subtype === 'init'
  );
}

/**
 * 检查是否是 Cursor 系统初始化消息
 */
export function isCursorSystemInit(messageType: string, rawStructuredData: Record<string, any> | null): boolean {
  return Boolean(
    messageType === 'cursor-system' &&
    rawStructuredData &&
    rawStructuredData.type === 'system' &&
    rawStructuredData.subtype === 'init'
  );
}

/**
 * 提取系统初始化会话 ID
 */
export function extractSystemInitSessionId(
  messageType: string,
  structuredMessageData: Record<string, any> | null,
  rawStructuredData: Record<string, any> | null
): string | null {
  if (isClaudeSystemInit(messageType, structuredMessageData)) {
    return structuredMessageData?.session_id || null;
  }
  if (isCursorSystemInit(messageType, rawStructuredData)) {
    return rawStructuredData?.session_id || null;
  }
  return null;
}

/**
 * 获取活跃视图会话 ID
 */
export function getActiveViewSessionId(
  selectedSession: ProjectSession | null,
  currentSessionId: string | null,
  pendingSession: { sessionId: string | null } | null
): string | null {
  return selectedSession?.id || currentSessionId || pendingSession?.sessionId || null;
}

/**
 * 检查是否有待绑定的会话
 */
export function hasPendingUnboundSession(pendingSession: { sessionId: string | null } | null): boolean {
  return Boolean(pendingSession) && !pendingSession?.sessionId;
}

/**
 * 检查是否是系统初始化会话
 */
export function isSystemInitForView(systemInitSessionId: string | null, activeViewSessionId: string | null): boolean {
  return Boolean(systemInitSessionId) && (!activeViewSessionId || systemInitSessionId === activeViewSessionId);
}

/**
 * 检查是否应绕过会话过滤
 */
export function shouldBypassSessionFilter(messageType: string, isSystemInitForViewValue: boolean): boolean {
  return isGlobalMessage(messageType) || Boolean(isSystemInitForViewValue);
}

/**
 * 检查是否是无范围错误
 */
export function isUnscopedError(latestMessage: any, pendingSession: { sessionId: string | null } | null): boolean {
  return Boolean(
    !latestMessage?.sessionId &&
    pendingSession &&
    !pendingSession.sessionId &&
    ['claude-error', 'cursor-error', 'codex-error', 'gemini-error'].includes(String(latestMessage?.type || ''))
  );
}

/**
 * 收集会话 ID，去重
 */
export function collectSessionIds(...sessionIds: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      sessionIds.filter((sessionId): sessionId is string => typeof sessionId === 'string' && sessionId.length > 0)
    )
  );
}

/**
 * 清理本地存储中的聊天消息
 */
export function clearChatMessages(projectName: string): void {
  safeLocalStorage.removeItem(`chat_messages_${projectName}`);
}

/**
 * 获取 sessionStorage 中的待处理会话 ID
 */
export function getPendingSessionId(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('pendingSessionId');
  }
  return null;
}

/**
 * 设置待处理会话 ID 到 sessionStorage
 */
export function setPendingSessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pendingSessionId', sessionId);
  }
}

/**
 * 清除待处理会话 ID
 */
export function clearPendingSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pendingSessionId');
  }
}

/**
 * 创建错误消息
 */
export function createErrorMessage(error: string, prefix: string = 'Error'): ChatMessage {
  return {
    type: 'error',
    content: `${prefix}: ${error}`,
    timestamp: new Date(),
  };
}

/**
 * 创建 assistant 消息
 */
export function createAssistantMessage(
  content: string,
  options?: {
    isToolUse?: boolean;
    toolName?: string;
    toolInput?: string;
    toolId?: string;
    isStreaming?: boolean;
    isThinking?: boolean;
    isInteractivePrompt?: boolean;
  }
): ChatMessage {
  return {
    type: 'assistant',
    content,
    timestamp: new Date(),
    isToolUse: options?.isToolUse,
    toolName: options?.toolName,
    toolInput: options?.toolInput,
    toolId: options?.toolId,
    isStreaming: options?.isStreaming,
    isThinking: options?.isThinking,
    isInteractivePrompt: options?.isInteractivePrompt,
  };
}

/**
 * 清理 ANSI 转义序列（用于终端输出）
 */
export function cleanAnsiOutput(raw: string): string {
  return raw
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}
