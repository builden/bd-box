/**
 * Chat WebSocket Handler
 * Handles chat WebSocket connections for AI provider interactions
 */

import type { Container } from '../app/container';
import type { AppConfig } from '../app/config';
import { createLogger } from '../utils/logger';
import { WebSocketWriter } from '../utils/websocket-writer';
import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';

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

const logger = createLogger('server/ws/chat-handler');

export interface ChatSession {
  provider: string;
  sessionId: string;
}

export class ChatHandler {
  constructor(
    private container: Container,
    private config: AppConfig
  ) {}

  /**
   * Handle new Chat WebSocket connection
   */
  handleConnection(ws: WebSocket, request: IncomingMessage): void {
    logger.info('Chat WebSocket connected');

    // Wrap WebSocket with writer for consistent interface with SSEStreamWriter
    const writer = new WebSocketWriter(ws);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'claude-command') {
          logger.debug('User message:', { command: data.command || '[Continue/Resume]' });
          logger.debug('📁 Project:', { project: data.options?.projectPath || 'Unknown' });
          logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });

          // Use Claude Agents SDK
          await queryClaudeSDK(data.command, data.options, writer);
        } else if (data.type === 'cursor-command') {
          logger.debug('Cursor message:', { command: data.command || '[Continue/Resume]' });
          logger.debug('📁 Project:', { project: data.options?.cwd || 'Unknown' });
          logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });
          logger.debug('🤖 Model:', { model: data.options?.model || 'default' });
          await spawnCursor(data.command, data.options, writer);
        } else if (data.type === 'codex-command') {
          logger.debug('Codex message:', { command: data.command || '[Continue/Resume]' });
          logger.debug('📁 Project:', { project: data.options?.projectPath || data.options?.cwd || 'Unknown' });
          logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });
          logger.debug('🤖 Model:', { model: data.options?.model || 'default' });
          await queryCodex(data.command, data.options, writer);
        } else if (data.type === 'gemini-command') {
          logger.debug('Gemini message:', { command: data.command || '[Continue/Resume]' });
          logger.debug('📁 Project:', { project: data.options?.projectPath || data.options?.cwd || 'Unknown' });
          logger.debug('🔄 Session:', { session: data.options?.sessionId ? 'Resume' : 'New' });
          logger.debug('🤖 Model:', { model: data.options?.model || 'default' });
          await spawnGemini(data.command, data.options, writer);
        } else if (data.type === 'cursor-resume') {
          // Backward compatibility: treat as cursor-command with resume and no prompt
          logger.debug('Cursor resume session (compat):', { sessionId: data.sessionId });
          await spawnCursor(
            '',
            {
              sessionId: data.sessionId,
              resume: true,
              cwd: data.options?.cwd,
            },
            writer
          );
        } else if (data.type === 'abort-session') {
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
            // Use Claude Agents SDK
            success = await abortClaudeSDKSession(data.sessionId);
          }

          writer.send({
            type: 'session-aborted',
            sessionId: data.sessionId,
            provider,
            success,
          });
        } else if (data.type === 'claude-permission-response') {
          // Relay UI approval decisions back into the SDK control flow.
          // This does not persist permissions; it only resolves the in-flight request,
          // introduced so the SDK can resume once the user clicks Allow/Deny.
          if (data.requestId) {
            resolveToolApproval(data.requestId, {
              allow: Boolean(data.allow),
              updatedInput: data.updatedInput,
              message: data.message,
              rememberEntry: data.rememberEntry,
            });
          }
        } else if (data.type === 'cursor-abort') {
          logger.debug('Abort Cursor session:', { sessionId: data.sessionId });
          const success = abortCursorSession(data.sessionId);
          writer.send({
            type: 'session-aborted',
            sessionId: data.sessionId,
            provider: 'cursor',
            success,
          });
        } else if (data.type === 'check-session-status') {
          // Check if a specific session is currently processing
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
            // Use Claude Agents SDK
            isActive = isClaudeSDKSessionActive(sessionId);
            if (isActive) {
              // Reconnect the session's writer to the new WebSocket so
              // subsequent SDK output flows to the refreshed client.
              reconnectSessionWriter(sessionId, ws);
            }
          }

          writer.send({
            type: 'session-status',
            sessionId,
            provider,
            isProcessing: isActive,
          });
        } else if (data.type === 'get-pending-permissions') {
          // Return pending permission requests for a session
          const sessionId = data.sessionId;
          if (sessionId && isClaudeSDKSessionActive(sessionId)) {
            const pending = getPendingApprovalsForSession(sessionId);
            writer.send({
              type: 'pending-permissions-response',
              sessionId,
              data: pending,
            });
          }
        } else if (data.type === 'get-active-sessions') {
          // Get all currently active sessions
          const activeSessions = {
            claude: getActiveClaudeSDKSessions(),
            cursor: getActiveCursorSessions(),
            codex: getActiveCodexSessions(),
            gemini: getActiveGeminiSessions(),
          };
          writer.send({
            type: 'active-sessions',
            sessions: activeSessions,
          });
        }
      } catch (error) {
        logger.error('Chat WebSocket error:', error);
        writer.send({
          type: 'error',
          error: (error as Error).message,
        });
      }
    });

    ws.on('close', () => {
      logger.info('Chat client disconnected');
    });
  }
}
