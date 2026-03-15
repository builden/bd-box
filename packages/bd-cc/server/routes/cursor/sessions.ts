/**
 * Cursor Sessions Routes
 * Endpoints for Cursor session management
 */

import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { applyCustomSessionNames } from '../../database/index.ts';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('cursor-sessions');

// GET /api/cursor/sessions
router.get('/sessions', async (req, res) => {
  try {
    const { projectPath } = req.query;
    const cwdId = crypto
      .createHash('md5')
      .update(projectPath || process.cwd())
      .digest('hex');
    const cursorChatsPath = path.join(os.homedir(), '.cursor', 'chats', cwdId);

    try {
      await fs.access(cursorChatsPath);
    } catch {
      return res.json({ success: true, sessions: [], cwdId, path: cursorChatsPath });
    }

    const sessionDirs = await fs.readdir(cursorChatsPath);
    const sessions = [];

    for (const sessionId of sessionDirs) {
      const sessionPath = path.join(cursorChatsPath, sessionId);
      const storeDbPath = path.join(sessionPath, 'store.db');
      let dbStatMtimeMs = null;

      try {
        await fs.access(storeDbPath);
        try {
          const stat = await fs.stat(storeDbPath);
          dbStatMtimeMs = stat.mtimeMs;
        } catch {}

        const db = await open({ filename: storeDbPath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
        const metaRows = await db.all('SELECT key, value FROM meta');

        let sessionData: any = {
          id: sessionId,
          name: 'Untitled Session',
          createdAt: null,
          mode: null,
          projectPath,
          lastMessage: null,
          messageCount: 0,
        };

        for (const row of metaRows) {
          if (row.value) {
            try {
              const hexMatch = row.value.toString().match(/^[0-9a-fA-F]+$/);
              if (hexMatch) {
                const jsonStr = Buffer.from(row.value, 'hex').toString('utf8');
                const data = JSON.parse(jsonStr);
                if (row.key === 'agent') {
                  sessionData.name = data.name || sessionData.name;
                  let createdAt = data.createdAt;
                  if (typeof createdAt === 'number') {
                    createdAt = createdAt < 1e12 ? createdAt * 1000 : createdAt;
                    sessionData.createdAt = new Date(createdAt).toISOString();
                  } else if (typeof createdAt === 'string') {
                    const n = Number(createdAt);
                    sessionData.createdAt = !Number.isNaN(n)
                      ? new Date(n < 1e12 ? n * 1000 : n).toISOString()
                      : new Date(createdAt).toISOString();
                  }
                  sessionData.mode = data.mode;
                  sessionData.agentId = data.agentId;
                  sessionData.latestRootBlobId = data.latestRootBlobId;
                } else if (row.key === 'name') {
                  sessionData.name = row.value.toString();
                }
              }
            } catch {}
          }
        }

        try {
          const blobCount = await db.get("SELECT COUNT(*) as count FROM blobs WHERE substr(data, 1, 1) = X'7B'");
          sessionData.messageCount = blobCount.count;
        } catch {}

        await db.close();
        if (!sessionData.createdAt && dbStatMtimeMs) sessionData.createdAt = new Date(dbStatMtimeMs).toISOString();
        sessions.push(sessionData);
      } catch (error) {
        logger.warn(`Could not read session ${sessionId}:`, error.message);
      }
    }

    for (const s of sessions) {
      if (!s.createdAt) {
        try {
          const st = await fs.stat(path.join(cursorChatsPath, s.id));
          s.createdAt = new Date(st.mtimeMs).toISOString();
        } catch {
          s.createdAt = new Date().toISOString();
        }
      }
    }

    sessions.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    applyCustomSessionNames(sessions, 'cursor');

    res.json({ success: true, sessions, cwdId, path: cursorChatsPath });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read Cursor sessions', details: error.message });
  }
});

// GET /api/cursor/sessions/:sessionId
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { projectPath } = req.query;
    const cwdId = crypto
      .createHash('md5')
      .update(projectPath || process.cwd())
      .digest('hex');
    const storeDbPath = path.join(os.homedir(), '.cursor', 'chats', cwdId, sessionId, 'store.db');

    const db = await open({ filename: storeDbPath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
    const allBlobs = await db.all('SELECT rowid, id, data FROM blobs');

    const blobMap = new Map();
    const parentRefs = new Map();
    const jsonBlobs: any[] = [];

    for (const blob of allBlobs) {
      blobMap.set(blob.id, blob);
      if (blob.data && blob.data[0] === 0x7b) {
        try {
          jsonBlobs.push({ ...blob, parsed: JSON.parse(blob.data.toString('utf8')) });
        } catch {}
      } else if (blob.data) {
        const parents: string[] = [];
        let i = 0;
        while (i < blob.data.length - 33) {
          if (blob.data[i] === 0x0a && blob.data[i + 1] === 0x20) {
            const parentHash = blob.data.slice(i + 2, i + 34).toString('hex');
            if (blobMap.has(parentHash)) parents.push(parentHash);
            i += 34;
          } else i++;
        }
        if (parents.length > 0) parentRefs.set(blob.id, parents);
      }
    }

    const visited = new Set();
    const sorted: any[] = [];
    function visit(nodeId: string) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const parents = parentRefs.get(nodeId) || [];
      for (const parentId of parents) visit(parentId);
      const blob = blobMap.get(nodeId);
      if (blob) sorted.push(blob);
    }
    for (const blob of allBlobs) if (!parentRefs.has(blob.id)) visit(blob.id);
    for (const blob of allBlobs) visit(blob.id);

    const metaRows = await db.all('SELECT key, value FROM meta');
    const metadata: any = {};
    for (const row of metaRows) {
      if (row.value) {
        try {
          const hexMatch = row.value.toString().match(/^[0-9a-fA-F]+$/);
          if (hexMatch) metadata[row.key] = JSON.parse(Buffer.from(row.value, 'hex').toString('utf8'));
          else metadata[row.key] = row.value.toString();
        } catch {
          metadata[row.key] = row.value.toString();
        }
      }
    }

    const messages: any[] = [];
    for (const blob of sorted) {
      try {
        const parsed = blob.parsed;
        if (parsed) {
          const role = parsed?.role || parsed?.message?.role;
          if (role !== 'system') messages.push({ id: blob.id, content: parsed });
        }
      } catch {}
    }

    await db.close();
    res.json({ success: true, session: { id: sessionId, projectPath, messages, metadata, cwdId } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read Cursor session', details: error.message });
  }
});

export default router;
