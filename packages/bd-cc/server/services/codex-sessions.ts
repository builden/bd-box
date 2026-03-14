/**
 * Codex Sessions Service
 * ======================
 * Handles Codex CLI session discovery
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { isVisibleCodexUserMessage } from '../utils/project-utils';
import { createLogger } from '../lib/logger';

const logger = createLogger('services/codex-sessions');

let codexSessionsIndex: Map<string, any[]> | null = null;

/**
 * Find Codex JSONL files in a directory
 */
async function findCodexJsonlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findCodexJsonlFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.jsonl') && entry.name.includes('codex')) {
        files.push(fullPath);
      }
    }
  } catch {}

  return files;
}

/**
 * Build Codex sessions index
 */
export async function buildCodexSessionsIndex(): Promise<Map<string, any[]>> {
  const index = new Map<string, any[]>();
  const configDir = path.join(os.homedir(), '.codex');

  try {
    await fs.access(configDir);
  } catch {
    return index;
  }

  try {
    const files = await findCodexJsonlFiles(configDir);

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const entry = JSON.parse(line);

            if (entry.sessionId) {
              const projectPath = entry.cwd || path.dirname(filePath);
              const existing = index.get(projectPath) || [];

              const existingSession = existing.find((s) => s.sessionId === entry.sessionId);
              if (!existingSession) {
                existing.push({
                  sessionId: entry.sessionId,
                  projectPath,
                  createdAt: entry.timestamp,
                  updatedAt: entry.timestamp,
                });
              }

              index.set(projectPath, existing);
            }
          } catch {}
        }
      } catch {}
    }
  } catch (error) {
    logger.error('Error building Codex sessions index', error as Error);
  }

  return index;
}

/**
 * Get Codex sessions for a project
 */
export async function getCodexSessions(projectPath: string, options: { forceRefresh?: boolean } = {}): Promise<any[]> {
  if (!codexSessionsIndex || options.forceRefresh) {
    codexSessionsIndex = await buildCodexSessionsIndex();
  }

  const sessions = codexSessionsIndex?.get(projectPath) || [];
  return sessions;
}

/**
 * Parse a Codex session file
 */
export async function parseCodexSessionFile(filePath: string, projectPath: string): Promise<any[]> {
  const sessions: Session[] = [];

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n');

    let currentSession: Session | null = null;

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);

        if (entry.sessionId && entry.type === 'session') {
          if (currentSession) {
            sessions.push(currentSession);
          }

          currentSession = {
            sessionId: entry.sessionId,
            projectPath,
            createdAt: entry.timestamp,
            updatedAt: entry.timestamp,
            messageCount: 0,
          };
        }

        if (currentSession && entry.type === 'message' && isVisibleCodexUserMessage(entry)) {
          currentSession.messageCount = (currentSession.messageCount || 0) + 1;
          currentSession.updatedAt = entry.timestamp;
        }
      } catch {}
    }

    if (currentSession) {
      sessions.push(currentSession);
    }
  } catch (error) {
    logger.error(`Error parsing Codex session file ${filePath}`, error as Error);
  }

  return sessions;
}

/**
 * Get Codex session messages
 */
export async function getCodexSessionMessages(
  sessionId: string,
  limit: number | null = null,
  offset: number = 0
): Promise<any[]> {
  if (!codexSessionsIndex) {
    codexSessionsIndex = await buildCodexSessionsIndex();
  }

  const messages: MessageContentBlock[] = [];

  for (const [, sessions] of codexSessionsIndex) {
    for (const session of sessions) {
      if (session.sessionId !== sessionId) continue;

      const projectPath = session.projectPath;
      const configDir = path.join(os.homedir(), '.codex');

      try {
        const files = await findCodexJsonlFiles(configDir);

        for (const filePath of files) {
          if (!filePath.includes(sessionId)) continue;

          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.trim().split('\n');

          let inTargetSession = false;

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const entry = JSON.parse(line);

              if (entry.sessionId && entry.type === 'session') {
                inTargetSession = entry.sessionId === sessionId;
                continue;
              }

              if (inTargetSession && entry.type === 'message' && isVisibleCodexUserMessage(entry)) {
                const role = entry.role === 'user' ? 'user' : 'assistant';

                let content = '';
                if (typeof entry.payload?.content === 'string') {
                  content = entry.payload.content;
                } else if (Array.isArray(entry.payload?.content)) {
                  content = entry.payload.content
                    .filter((p: MessageContentBlock) => p.text)
                    .map((p: MessageContentBlock) => p.text)
                    .join('\n');
                }

                messages.push({
                  type: 'message',
                  message: { role, content },
                  timestamp: entry.timestamp || null,
                });
              }
            } catch {}
          }
        }
      } catch (error) {
        logger.error('Error getting Codex session messages', error as Error);
      }

      return messages.slice(offset, limit ? offset + limit : undefined);
    }
  }

  return [];
}

/**
 * Delete a Codex session
 */
export async function deleteCodexSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  if (!codexSessionsIndex) {
    codexSessionsIndex = await buildCodexSessionsIndex();
  }

  const configDir = path.join(os.homedir(), '.codex');

  try {
    const files = await findCodexJsonlFiles(configDir);

    for (const filePath of files) {
      if (!filePath.includes(sessionId)) continue;

      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n');
      const newLines: string[] = [];
      let inTargetSession = false;

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const entry = JSON.parse(line);

          if (entry.sessionId && entry.type === 'session') {
            if (inTargetSession) {
              // End of target session reached
            } else if (entry.sessionId === sessionId) {
              inTargetSession = true;
              continue;
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

      await fs.writeFile(filePath, newLines.join('\n'), 'utf8');
    }

    codexSessionsIndex = null; // Clear cache
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
