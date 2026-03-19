/**
 * Project Sessions Service
 * =========================
 * Handles Claude session operations (CRUD)
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import sessionManager from '../sessionManager';
import { loadProjectConfig } from './project-config';
import { createLogger } from '../utils/logger';
import type { Session } from '../../shared/api/sessions';

const logger = createLogger('services/project-sessions');

/**
 * Claude Code JSONL record type
 * Based on observed format from ~/.claude/projects/*.jsonl
 */
interface JsonlEntry {
  timestamp?: string;
  type?: string;
  message?: {
    role?: string;
    content?: string | Array<{ text?: string; thinking?: string }>;
  };
  sessionId?: string;
  theta?: string;
}

/**
 * Parse JSONL session file
 *
 * Note: In new Claude Code format, each .jsonl file represents ONE session.
 * The file name (without .jsonl extension) IS the sessionId.
 * We parse the file to extract metadata like timestamps and message counts.
 */
export async function parseJsonlSessions(
  filePath: string,
  projectName: string,
  limit: number | null = null,
  offset: number = 0
): Promise<Session[]> {
  const sessions: Session[] = [];

  try {
    // Use Bun's built-in JSONL parser
    const entries = await Bun.JSONL.parse(await Bun.file(filePath).text());
    const config = await loadProjectConfig();

    // Extract sessionId from filename (e.g., "abc123.jsonl" -> "abc123")
    const sessionId = path.basename(filePath, '.jsonl');
    const customNames = (config.customSessionNames || {})[projectName] || {};

    let createdAt: string | null = null;
    let lastMessage: string | null = null;
    let messageCount = 0;
    let firstMessage: string | null = null;

    for (const entry of entries as JsonlEntry[]) {
      // Track first timestamp as createdAt
      if (!createdAt && entry.timestamp) {
        createdAt = entry.timestamp;
      }

      // Track last timestamp as lastMessage
      if (entry.timestamp) {
        lastMessage = entry.timestamp;
      }

      // Count user and assistant messages
      // Handle multiple formats:
      // 1. entry.type === 'user' or 'assistant' (direct type)
      // 2. entry.type === 'message' with entry.message.role === 'user' or 'assistant'
      const isUserMessage = entry.type === 'user' || (entry.type === 'message' && entry.message?.role === 'user');
      const isAssistantMessage =
        entry.type === 'assistant' || (entry.type === 'message' && entry.message?.role === 'assistant');

      if (isUserMessage || isAssistantMessage) {
        messageCount++;
        if (!firstMessage && entry.timestamp) {
          firstMessage = entry.timestamp;
        }
      }
    }

    // Each .jsonl file is one session
    if (createdAt || messageCount > 0) {
      const session: Session = {
        id: sessionId,
        projectName: projectName,
        provider: 'claude' as const,
        createdAt,
        updatedAt: lastMessage || createdAt,
        messageCount,
        firstMessage,
        lastMessage,
      };
      // Only include customName if user has set a custom name for this session
      if (customNames[sessionId]) {
        session.customName = customNames[sessionId];
      }
      sessions.push(session);
    }
  } catch (error) {
    logger.error(`Error parsing JSONL file ${filePath}`, error as Error);
  }

  return sessions;
}

/**
 * Get sessions for a project
 */
export async function getSessions(projectName: string, limit: number = 5, offset: number = 0): Promise<Session[]> {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projectDir = path.join(claudeProjectsDir, projectName);

  try {
    await fs.access(projectDir);
  } catch {
    return [];
  }

  const allSessions: Session[] = [];

  try {
    const files = await fs.readdir(projectDir);

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;

      const filePath = path.join(projectDir, file);
      const sessions = await parseJsonlSessions(filePath, projectName);

      allSessions.push(...sessions);
    }

    // Sort by last message timestamp (newest first)
    allSessions.sort((a, b) => {
      const aTime = new Date(a.lastMessage || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessage || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return allSessions.slice(offset, offset + limit);
  } catch (error) {
    logger.error('Error getting sessions', error as Error);
    return [];
  }
}

/**
 * Session messages response with pagination metadata
 */
export interface SessionMessagesResult {
  messages: SessionMessage[];
  meta: {
    total: number;
    hasMore: boolean;
    offset: number;
  };
}

/**
 * Get session messages
 */
export async function getSessionMessages(
  projectName: string,
  sessionId: string,
  limit: number | null = null,
  offset: number = 0
): Promise<SessionMessagesResult> {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projectDir = path.join(claudeProjectsDir, projectName);

  try {
    await fs.access(projectDir);
  } catch {
    return { messages: [], meta: { total: 0, hasMore: false, offset: 0 } };
  }

  const messages: SessionMessage[] = [];

  try {
    const files = await fs.readdir(projectDir);

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;

      // New format: filename IS the sessionId
      const fileSessionId = file.replace('.jsonl', '');
      if (fileSessionId !== sessionId) continue;

      const filePath = path.join(projectDir, file);
      const entries = await Bun.JSONL.parse(await Bun.file(filePath).text());

      for (const entry of entries as JsonlEntry[]) {
        // Handle different message formats:
        // 1. entry.type === 'message' with entry.message.role
        // 2. entry.type === 'user' or 'assistant' directly
        if (entry.type === 'message' || entry.type === 'user' || entry.type === 'assistant') {
          let role: string;
          if (entry.type === 'message' && entry.message?.role) {
            role = entry.message.role;
          } else if (entry.type === 'user') {
            role = 'user';
          } else if (entry.type === 'assistant') {
            role = 'assistant';
          } else {
            continue; // Skip unknown message types
          }

          // Extract content from message - handle both text and thinking types
          if (entry.message?.content) {
            const msgContent = entry.message.content;
            if (typeof msgContent === 'string') {
              // Simple string content
              messages.push({
                type: 'message',
                message: { role, content: msgContent },
                timestamp: entry.timestamp || null,
              });
            } else if (Array.isArray(msgContent)) {
              // Array content - may have both thinking and text parts
              for (const part of msgContent) {
                if (part.thinking) {
                  messages.push({
                    type: 'thinking',
                    message: { role: 'assistant', content: part.thinking },
                    timestamp: entry.timestamp || null,
                  });
                }
                if (part.text) {
                  messages.push({
                    type: 'message',
                    message: { role: 'assistant', content: part.text },
                    timestamp: entry.timestamp || null,
                  });
                }
              }
            }
          }
        }
      }
    }

    const total = messages.length;
    const hasMore = limit !== null ? offset + (limit || 0) < total : false;
    const paginatedMessages = messages.slice(offset, limit ? offset + limit : undefined);

    return {
      messages: paginatedMessages,
      meta: { total, hasMore, offset },
    };
  } catch (error) {
    logger.error('Error getting session messages', error as Error);
    return { messages: [], meta: { total: 0, hasMore: false, offset: 0 } };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(
  projectName: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projectDir = path.join(claudeProjectsDir, projectName);

  try {
    await fs.access(projectDir);
  } catch {
    return { success: false, error: 'Project not found' };
  }

  try {
    const files = await fs.readdir(projectDir);
    const config = await loadProjectConfig();

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;

      const filePath = path.join(projectDir, file);
      const fileContent = await Bun.file(filePath).text();
      const lines = fileContent.trim().split('\n');
      const newLines: string[] = [];
      let inTargetSession = false;
      let sessionFound = false;

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const entry = JSON.parse(line);

          if (entry.type === 'session' || (entry.type === 'system' && entry.theta)) {
            if (inTargetSession && sessionFound) {
              // Don't include this session start
            } else if (entry.sessionId === sessionId || entry.theta === sessionId) {
              inTargetSession = true;
              sessionFound = true;
              continue;
            } else {
              inTargetSession = false;
            }
          }

          if (inTargetSession) {
            continue;
          }

          newLines.push(line);
        } catch {
          newLines.push(line);
        }
      }

      if (sessionFound) {
        await Bun.write(filePath, newLines.join('\n'));
      }
    }

    // Also remove from sessionManager
    try {
      await sessionManager.deleteSession(sessionId);
    } catch {}

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
