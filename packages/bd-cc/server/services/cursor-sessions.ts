/**
 * Cursor Sessions Service
 * ========================
 * Handles Cursor IDE session discovery from ~/.cursor/chats/
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import os from 'os';
import { createLogger } from '../utils/logger';

const logger = createLogger('services/cursor-sessions');

function computeMD5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Get Cursor sessions for a project
 */
export async function getCursorSessions(projectPath: string): Promise<any[]> {
  const sessions: Session[] = [];
  const md5Hash = computeMD5(projectPath);
  const cursorChatsDir = path.join(os.homedir(), '.cursor', 'chats', md5Hash);

  try {
    await fs.access(cursorChatsDir);
  } catch {
    return sessions;
  }

  try {
    const entries = await fs.readdir(cursorChatsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const sessionDir = path.join(cursorChatsDir, entry.name);
      const dbPath = path.join(sessionDir, 'store.db');

      try {
        await fs.access(dbPath);
      } catch {
        continue;
      }

      try {
        const db: Database = await open({
          filename: dbPath,
          driver: sqlite3.Database,
        });

        interface Row {
          id: number;
          created_time: number;
          updated_time: number;
          content: string;
        }

        const rows = await db.all<Row[]>(
          'SELECT id, created_time, updated_time, content FROM items WHERE content IS NOT NULL ORDER BY updated_time DESC LIMIT 50'
        );

        for (const row of rows) {
          try {
            const content = JSON.parse(row.content);
            const title = content.title || content.name || `Session ${row.id}`;

            sessions.push({
              sessionId: `${md5Hash}:${entry.name}:${row.id}`,
              projectId: projectPath,
              displayName: title,
              createdAt: row.created_time,
              updatedAt: row.updated_time,
              messageCount: content.messages?.length || 0,
              type: 'cursor',
            });
          } catch {}
        }

        await db.close();
      } catch (error) {
        logger.error(`Error reading Cursor database ${dbPath}`, error as Error);
      }
    }
  } catch (error) {
    logger.error('Error reading Cursor chats directory', error as Error);
  }

  return sessions;
}
