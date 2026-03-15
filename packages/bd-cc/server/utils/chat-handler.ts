/**
 * Chat WebSocket Handler
 * Handles /ws connections for AI chat communication
 */

import type { WebSocket } from 'ws';
import { createLogger } from '../utils/logger';
import { WebSocketHandler } from '../../shared/utils/websocket';
import {
  queryClaudeSDK,
  abortClaudeSDKSession,
  isClaudeSDKSessionActive,
  getActiveClaudeSDKSessions,
  resolveToolApproval,
  getPendingApprovalsForSession,
  reconnectSessionWriter,
} from '../providers/claude';
import { spawnCursor, abortCursorSession, isCursorSessionActive, getActiveCursorSessions } from '../providers/cursor';
import { queryCodex, abortCodexSession, isCodexSessionActive, getActiveCodexSessions } from '../providers/codex';
import { spawnGemini, abortGeminiSession, isGeminiSessionActive, getActiveGeminiSessions } from '../providers/gemini';

const logger = createLogger('utils/chat-handler');

/**
 * Handle chat WebSocket connections
 */
export function handleChatConnection(ws: WebSocket, connectedClients: Set<WebSocket>) {
  logger.info('Chat WebSocket connected');

  // Add to connected clients for project updates
  connectedClients.add(ws);

  // Use new WebSocketHandler for event-based API
  const handler = new WebSocketHandler(ws);

  // Register event handlers using event-based API
  handler.on('claude-command', async (data: any) => {
    logger.debug('User message:', { command: data.command || '[Continue/Resume]' });
    logger.debug('📁 Project:', { project: data.options?.projectPath || 'Unknown' });
    logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });
    await queryClaudeSDK(data.command, data.options, handler);
  });

  handler.on('cursor-command', async (data: any) => {
    logger.debug('Cursor message:', { command: data.command || '[Continue/Resume]' });
    logger.debug('📁 Project:', { project: data.options?.cwd || 'Unknown' });
    logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });
    logger.debug('🤖 Model:', { model: data.options?.model || 'default' });
    await spawnCursor(data.command, data.options, handler);
  });

  handler.on('codex-command', async (data: any) => {
    logger.debug('Codex message:', { command: data.command || '[Continue/Resume]' });
    logger.debug('📁 Project:', { project: data.options?.projectPath || data.options?.cwd || 'Unknown' });
    logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });
    logger.debug('🤖 Model:', { model: data.options?.model || 'default' });
    await queryCodex(data.command, data.options, handler);
  });

  handler.on('gemini-command', async (data: any) => {
    logger.debug('Gemini message:', { command: data.command || '[Continue/Resume]' });
    logger.debug('📁 Project:', { project: data.options?.projectPath || data.options?.cwd || 'Unknown' });
    logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });
    logger.debug('🤖 Model:', { model: data.options?.model || 'default' });
    await spawnGemini(data.command, data.options, handler);
  });

  handler.on('cursor-resume', async (data: any) => {
    logger.debug('Cursor resume session (compat):', { sessionId: data.sessionId });
    await spawnCursor(
      '',
      {
        sessionId: data.sessionId,
        resume: true,
        cwd: data.options?.cwd,
      },
      handler
    );
  });

  handler.on('abort-session', async (data: any) => {
    logger.debug('Abort session request:', { sessionId: data.sessionId });
    const provider = data.provider || 'claude';
    let success;

    if (provider === 'cursor') {
      success = abortCursorSession(data.sessionId);
    } else if (provider === 'codex') {
      success = abortCodexSession(data.sessionId);
    } else if (provider === 'gemini') {
      success = abortGeminiSession(data.sessionId);
    } else {
      success = await abortClaudeSDKSession(data.sessionId);
    }

    handler.send({ type: 'session-aborted', sessionId: data.sessionId, provider, success });
  });

  handler.on('claude-permission-response', (data: any) => {
    if (data.requestId) {
      resolveToolApproval(data.requestId, {
        allow: Boolean(data.allow),
        updatedInput: data.updatedInput,
        message: data.message,
        rememberEntry: data.rememberEntry,
      });
    }
  });

  handler.on('cursor-abort', (data: any) => {
    logger.debug('Abort Cursor session:', { sessionId: data.sessionId });
    const success = abortCursorSession(data.sessionId);
    handler.send({ type: 'session-aborted', sessionId: data.sessionId, provider: 'cursor', success });
  });

  handler.on('check-session-status', (data: any) => {
    const provider = data.provider || 'claude';
    const sessionId = data.sessionId;
    let isActive;

    if (provider === 'cursor') {
      isActive = isCursorSessionActive(sessionId);
    } else if (provider === 'codex') {
      isActive = isCodexSessionActive(sessionId);
    } else if (provider === 'gemini') {
      isActive = isGeminiSessionActive(sessionId);
    } else {
      isActive = isClaudeSDKSessionActive(sessionId);
      if (isActive) {
        reconnectSessionWriter(sessionId, ws);
      }
    }

    handler.send({ type: 'session-status', sessionId, provider, isProcessing: isActive });
  });

  handler.on('get-pending-permissions', (data: any) => {
    const sessionId = data.sessionId;
    if (sessionId && isClaudeSDKSessionActive(sessionId)) {
      const pending = getPendingApprovalsForSession(sessionId);
      handler.send({ type: 'pending-permissions-response', sessionId, data: pending });
    }
  });

  handler.on('get-active-sessions', () => {
    const activeSessions = {
      claude: getActiveClaudeSDKSessions(),
      cursor: getActiveCursorSessions(),
      codex: getActiveCodexSessions(),
      gemini: getActiveGeminiSessions(),
    };
    handler.send({ type: 'active-sessions', sessions: activeSessions });
  });

  handler.on('error', (error: Error) => {
    logger.error('Chat WebSocket error:', error);
    handler.send({ type: 'error', error: error.message });
  });

  handler.on('close', () => {
    logger.info('Chat client disconnected');
    connectedClients.delete(ws);
  });
}
