/**
 * Project Search Service
 * ======================
 * Cross-provider conversation search
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { getCodexSessions, getCodexSessionMessages } from './codex-sessions';
import { getGeminiCliSessions, getGeminiCliSessionMessages } from './gemini-sessions';
import { createLogger } from '../lib/logger';

const logger = createLogger('services/project-search');

/**
 * Search conversations across all providers
 */
export async function searchConversations(
  query: string,
  limit: number = 50,
  onProjectResult: ((result: any) => void) | null = null,
  signal: AbortSignal | null = null
): Promise<any[]> {
  const results: any[] = [];
  const queryLower = query.toLowerCase();
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');

  // Search Claude sessions
  try {
    await fs.access(claudeProjectsDir);
  } catch {
    // No Claude projects
  }

  try {
    const projectEntries = await fs.readdir(claudeProjectsDir, { withFileTypes: true });

    for (const entry of projectEntries) {
      if (signal?.aborted) break;
      if (!entry.isDirectory()) continue;

      const projectDir = path.join(claudeProjectsDir, entry.name);

      try {
        const files = await fs.readdir(projectDir);

        for (const file of files) {
          if (signal?.aborted) break;
          if (!file.endsWith('.jsonl')) continue;

          const filePath = path.join(projectDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.trim().split('\n');

          let inSession = false;
          let currentSessionId = '';
          let currentProjectId = entry.name;

          for (const line of lines) {
            if (signal?.aborted) break;
            if (!line.trim()) continue;

            try {
              const entryData = JSON.parse(line);

              if (entryData.type === 'session' || (entryData.type === 'system' && entryData.theta)) {
                inSession = true;
                currentSessionId = entryData.sessionId || entryData.theta;
                continue;
              }

              if (inSession && entryData.type === 'message') {
                let contentText = '';
                if (typeof entryData.content === 'string') {
                  contentText = entryData.content;
                } else if (Array.isArray(entryData.content)) {
                  contentText = entryData.content
                    .filter((p: any) => p.text)
                    .map((p: any) => p.text)
                    .join('\n');
                }

                if (contentText.toLowerCase().includes(queryLower)) {
                  const existingResult = results.find(
                    (r) => r.projectId === currentProjectId && r.sessionId === currentSessionId
                  );

                  if (!existingResult) {
                    results.push({
                      projectId: currentProjectId,
                      sessionId: currentSessionId,
                      type: 'claude',
                      matchedContent: contentText.substring(0, 200),
                      timestamp: entryData.timestamp,
                    });

                    if (onProjectResult) {
                      onProjectResult({
                        projectId: currentProjectId,
                        sessionId: currentSessionId,
                        type: 'claude',
                      });
                    }

                    if (results.length >= limit) {
                      return results;
                    }
                  }
                }
              }
            } catch {}
          }
        }
      } catch (error) {
        logger.error(`Error searching project ${entry.name}`, error as Error);
      }
    }
  } catch (error) {
    logger.error('Error searching Claude sessions', error as Error);
  }

  // Search Codex sessions
  try {
    const codexResults = await searchCodexSessionsForProject(query, limit - results.length, signal);
    results.push(...codexResults);
  } catch (error) {
    logger.error('Error searching Codex sessions', error as Error);
  }

  // Search Gemini sessions
  try {
    const geminiResults = await searchGeminiSessionsForProject(query, limit - results.length, signal);
    results.push(...geminiResults);
  } catch (error) {
    logger.error('Error searching Gemini sessions', error as Error);
  }

  return results;
}

/**
 * Search Codex sessions
 */
async function searchCodexSessionsForProject(
  query: string,
  limit: number = 50,
  signal: AbortSignal | null = null
): Promise<any[]> {
  const results: any[] = [];
  const queryLower = query.toLowerCase();
  const configDir = path.join(os.homedir(), '.codex');

  try {
    await fs.access(configDir);
  } catch {
    return results;
  }

  try {
    const sessions = await getCodexSessions('', { forceRefresh: true });

    for (const session of sessions) {
      if (signal?.aborted) break;
      if (results.length >= limit) break;

      const messages = await getCodexSessionMessages(session.sessionId);

      for (const msg of messages) {
        if (signal?.aborted) break;
        if (typeof msg.message?.content === 'string' && msg.message.content.toLowerCase().includes(queryLower)) {
          results.push({
            projectId: session.projectPath,
            sessionId: session.sessionId,
            type: 'codex',
            matchedContent: msg.message.content.substring(0, 200),
            timestamp: msg.timestamp,
          });

          if (results.length >= limit) break;
        }
      }
    }
  } catch (error) {
    logger.error('Error searching Codex sessions', error as Error);
  }

  return results;
}

/**
 * Search Gemini sessions
 */
async function searchGeminiSessionsForProject(
  query: string,
  limit: number = 50,
  signal: AbortSignal | null = null
): Promise<any[]> {
  const results: any[] = [];
  const queryLower = query.toLowerCase();
  const configDir = path.join(os.homedir(), '.gemini', 'cli', 'sessions');

  try {
    await fs.access(configDir);
  } catch {
    return results;
  }

  try {
    const entries = await fs.readdir(configDir, { withFileTypes: true });

    for (const entry of entries) {
      if (signal?.aborted) break;
      if (results.length >= limit) break;
      if (!entry.isDirectory()) continue;

      const projectPath = entry.name;
      const sessions = await getGeminiCliSessions(projectPath);

      for (const session of sessions) {
        if (signal?.aborted) break;
        if (results.length >= limit) break;

        const messages = await getGeminiCliSessionMessages(session.sessionId);

        for (const msg of messages) {
          if (signal?.aborted) break;
          if (typeof msg.message?.content === 'string' && msg.message.content.toLowerCase().includes(queryLower)) {
            results.push({
              projectId: projectPath,
              sessionId: session.sessionId,
              type: 'gemini',
              matchedContent: msg.message.content.substring(0, 200),
              timestamp: msg.timestamp,
            });

            if (results.length >= limit) break;
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error searching Gemini sessions', error as Error);
  }

  return results;
}
