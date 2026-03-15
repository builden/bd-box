/**
 * Gemini CLI Sessions Service
 * ===========================
 * Handles Gemini CLI session discovery
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { createLogger } from '../utils/logger';

const logger = createLogger('services/gemini-sessions');

/**
 * Find Gemini session files
 */
async function findGeminiSessionFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findGeminiSessionFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.jsonl')) {
        files.push(fullPath);
      }
    }
  } catch {}

  return files;
}

/**
 * Get Gemini CLI sessions
 */
export async function getGeminiCliSessions(projectPath: string): Promise<any[]> {
  const sessions: Session[] = [];
  const configDir = path.join(os.homedir(), '.gemini', 'cli', 'sessions');

  try {
    await fs.access(configDir);
  } catch {
    return sessions;
  }

  try {
    const files = await findGeminiSessionFiles(configDir);

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');

        let currentSession: Session | null = null;

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const entry = JSON.parse(line);

            if (entry.type === 'session') {
              if (currentSession) {
                sessions.push(currentSession);
              }

              currentSession = {
                sessionId: entry.sessionId || path.basename(filePath, '.jsonl'),
                projectPath,
                displayName: entry.displayName || entry.sessionId || `Session ${sessions.length + 1}`,
                createdAt: entry.timestamp || null,
                updatedAt: entry.timestamp || null,
                messageCount: 0,
              };
            }

            if (currentSession && entry.type === 'message') {
              currentSession.messageCount = (currentSession.messageCount || 0) + 1;
              currentSession.updatedAt = entry.timestamp;
            }
          } catch {}
        }

        if (currentSession) {
          sessions.push(currentSession);
        }
      } catch (error) {
        logger.error(`Error parsing Gemini session file ${filePath}`, error as Error);
      }
    }
  } catch (error) {
    logger.error('Error reading Gemini sessions directory', error as Error);
  }

  return sessions;
}

/**
 * Get Gemini CLI session messages
 */
export async function getGeminiCliSessionMessages(
  sessionId: string,
  limit: number | null = null,
  offset: number = 0
): Promise<any[]> {
  const messages: MessageContentBlock[] = [];
  const configDir = path.join(os.homedir(), '.gemini', 'cli', 'sessions');

  try {
    await fs.access(configDir);
  } catch {
    return messages;
  }

  try {
    const files = await findGeminiSessionFiles(configDir);

    for (const filePath of files) {
      if (!filePath.includes(sessionId)) continue;

      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n');

      let inTargetSession = false;

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const entry = JSON.parse(line);

          if (entry.type === 'session') {
            inTargetSession = entry.sessionId === sessionId || filePath.includes(sessionId);
            continue;
          }

          if (inTargetSession && entry.type === 'message') {
            const role =
              entry.type === 'user'
                ? 'user'
                : entry.type === 'gemini' || entry.type === 'assistant'
                  ? 'assistant'
                  : entry.type;

            let content = '';
            if (typeof entry.content === 'string') {
              content = entry.content;
            } else if (Array.isArray(entry.content)) {
              content = entry.content
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

    return messages.slice(offset, limit ? offset + limit : undefined);
  } catch (error) {
    logger.error('Error getting Gemini session messages', error as Error);
    return [];
  }
}
