import type { ChatMessage } from '../types';
import type { Project, ProjectSession, SessionProvider } from '@/types';
import { safeLocalStorage } from './chatStorage';

/**
 * 消息处理辅助函数
 * 从 useChatRealtimeHandlers 提取的公共逻辑
 */

export interface PendingViewSession {
  sessionId: string | null;
  startedAt: number;
}

export interface MessageContext {
  latestMessage: any;
  provider: SessionProvider;
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  currentSessionId: string | null;
  pendingViewSessionRef: { current: PendingViewSession | null };
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
 * 获取活跃视图会话 ID
 */
export function getActiveViewSessionId(
  selectedSession: ProjectSession | null,
  currentSessionId: string | null,
  pendingViewSessionRef: { current: PendingViewSession | null }
): string | null {
  return selectedSession?.id || currentSessionId || pendingViewSessionRef.current?.sessionId || null;
}

/**
 * 检查是否有待绑定的会话
 */
export function hasPendingUnboundSession(pendingViewSessionRef: { current: PendingViewSession | null }): boolean {
  return Boolean(pendingViewSessionRef.current) && !pendingViewSessionRef.current?.sessionId;
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
export function shouldBypassSessionFilter(latestMessage: any, isSystemInitForView: boolean): boolean {
  const globalMessageTypes = [
    'projects_updated',
    'taskmaster-project-updated',
    'session-created',
    'websocket-reconnected',
  ];
  const messageType = String(latestMessage?.type || '');
  const isGlobalMessage = globalMessageTypes.includes(messageType);
  return isGlobalMessage || Boolean(isSystemInitForView);
}

/**
 * 检查是否是生命周期消息
 */
export function isLifecycleMessage(latestMessage: any): boolean {
  const lifecycleMessageTypes = new Set([
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
  return lifecycleMessageTypes.has(String(latestMessage?.type || ''));
}

/**
 * 检查是否是无范围错误
 */
export function isUnscopedError(
  latestMessage: any,
  pendingViewSessionRef: { current: PendingViewSession | null }
): boolean {
  return (
    !latestMessage?.sessionId &&
    pendingViewSessionRef.current &&
    !pendingViewSessionRef.current.sessionId &&
    ['claude-error', 'cursor-error', 'codex-error', 'gemini-error'].includes(String(latestMessage?.type || ''))
  );
}

/**
 * 提取系统初始化会话 ID
 */
export function extractSystemInitSessionId(latestMessage: any): string | null {
  const messageType = String(latestMessage?.type || '');

  if (messageType === 'claude-response') {
    const messageData = latestMessage?.data?.message || latestMessage?.data;
    if (messageData?.type === 'system' && messageData?.subtype === 'init') {
      return messageData?.session_id || null;
    }
  }

  if (messageType === 'cursor-system') {
    const rawData = latestMessage?.data;
    if (rawData?.type === 'system' && rawData?.subtype === 'init') {
      return rawData?.session_id || null;
    }
  }

  return null;
}

/**
 * 清理本地存储中的聊天消息
 */
export function clearChatMessages(projectName: string): void {
  safeLocalStorage.removeItem(`chat_messages_${projectName}`);
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
 * 获取待处理会话 ID
 */
export function getPendingSessionId(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('pendingSessionId');
  }
  return null;
}

/**
 * 清除待处理会话 ID
 */
export function clearPendingSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pendingSessionId');
  }
}
