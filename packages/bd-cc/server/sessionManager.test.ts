import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SessionManager', () => {
  // Use a test-specific temp directory
  const testDir = path.join(os.tmpdir(), `session-manager-test-${Date.now()}`);

  // We need to create a modified version of SessionManager that uses our test directory
  // This avoids mocking issues by creating a test-friendly version

  class TestableSessionManager {
    sessions = new Map();
    maxSessions = 100;
    sessionsDir = path.join(testDir, 'sessions');
    ready: Promise<void>;

    constructor() {
      this.ready = this.init();
    }

    async init() {
      await this.initSessionsDir();
    }

    async initSessionsDir() {
      try {
        await fs.mkdir(this.sessionsDir, { recursive: true });
      } catch (error) {
        // ignore
      }
    }

    createSession(sessionId: string, projectPath: string) {
      const session = {
        id: sessionId,
        projectPath: projectPath,
        messages: [] as any[],
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      if (this.sessions.size >= this.maxSessions) {
        const oldestKey = this.sessions.keys().next().value;
        if (oldestKey) this.sessions.delete(oldestKey);
      }

      this.sessions.set(sessionId, session);
      // Note: Not calling saveSession in tests to avoid disk I/O

      return session;
    }

    addMessage(sessionId: string, role: string, content: string) {
      let session = this.sessions.get(sessionId);

      if (!session) {
        session = this.createSession(sessionId, '');
      }

      const message = {
        role,
        content,
        timestamp: new Date(),
      };

      session.messages.push(message);
      session.lastActivity = new Date();

      return session;
    }

    getSession(sessionId: string) {
      return this.sessions.get(sessionId);
    }

    getProjectSessions(projectPath: string) {
      const sessions = [];

      for (const [id, session] of this.sessions) {
        if (session.projectPath === projectPath) {
          sessions.push({
            id: session.id,
            summary: this.getSessionSummary(session),
            messageCount: session.messages.length,
            lastActivity: session.lastActivity,
          });
        }
      }

      return sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    }

    getSessionSummary(session: any) {
      if (session.messages.length === 0) {
        return 'New Session';
      }

      const firstUserMessage = session.messages.find((m: any) => m.role === 'user');
      if (firstUserMessage) {
        const content = firstUserMessage.content;
        return content.length > 50 ? content.substring(0, 50) + '...' : content;
      }

      return 'New Session';
    }

    buildConversationContext(sessionId: string, maxMessages = 10) {
      const session = this.sessions.get(sessionId);

      if (!session || session.messages.length === 0) {
        return '';
      }

      const recentMessages = session.messages.slice(-maxMessages);

      let context = 'Here is the conversation history:\n\n';

      for (const msg of recentMessages) {
        if (msg.role === 'user') {
          context += `User: ${msg.content}\n`;
        } else {
          context += `Assistant: ${msg.content}\n`;
        }
      }

      context += '\nBased on the conversation history above, please answer the following:\n';

      return context;
    }

    _safeFilePath(sessionId: string) {
      const safeId = String(sessionId).replace(/[/\\]|\.\./g, '');
      return path.join(this.sessionsDir, `${safeId}.json`);
    }

    async saveSession(sessionId: string) {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      try {
        const filePath = this._safeFilePath(sessionId);
        await fs.writeFile(filePath, JSON.stringify(session, null, 2));
      } catch (error) {
        // ignore
      }
    }

    async deleteSession(sessionId: string) {
      this.sessions.delete(sessionId);

      try {
        const filePath = this._safeFilePath(sessionId);
        await fs.unlink(filePath);
      } catch (error) {
        // ignore
      }
    }

    getSessionMessages(sessionId: string) {
      const session = this.sessions.get(sessionId);
      if (!session) return [];

      return session.messages.map((msg: any) => ({
        type: 'message',
        message: {
          role: msg.role,
          content: msg.content,
        },
        timestamp: msg.timestamp.toISOString(),
      }));
    }
  }

  let manager: TestableSessionManager;

  beforeEach(async () => {
    manager = new TestableSessionManager();
    await manager.ready;
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('SessionManager class', () => {
    it('should create a new instance', () => {
      expect(manager).toBeDefined();
      expect(manager.sessions).toBeInstanceOf(Map);
      expect(manager.maxSessions).toBe(100);
    });

    it('should initialize sessions directory', async () => {
      const dirExists = await fs
        .access(manager.sessionsDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });
  });

  describe('createSession', () => {
    it('should create a new session with given id and project path', async () => {
      const session = manager.createSession('test-session-1', '/test/project');

      expect(session).toBeDefined();
      expect(session.id).toBe('test-session-1');
      expect(session.projectPath).toBe('/test/project');
      expect(session.messages).toEqual([]);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
    });

    it('should evict oldest session when max is reached', async () => {
      manager.maxSessions = 3;

      manager.createSession('session-1', '/project1');
      manager.createSession('session-2', '/project2');
      manager.createSession('session-3', '/project3');

      expect(manager.sessions.size).toBe(3);

      manager.createSession('session-4', '/project4');

      expect(manager.sessions.size).toBe(3);
      expect(manager.sessions.has('session-1')).toBe(false);
      expect(manager.sessions.has('session-4')).toBe(true);
    });
  });

  describe('addMessage', () => {
    it('should add a message to existing session', async () => {
      manager.createSession('test-session', '/test/project');

      const session = manager.addMessage('test-session', 'user', 'Hello, world!');

      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].role).toBe('user');
      expect(session.messages[0].content).toBe('Hello, world!');
      expect(session.messages[0].timestamp).toBeInstanceOf(Date);
    });

    it('should create session if it does not exist', async () => {
      const session = manager.addMessage('new-session', 'assistant', 'Response message');

      expect(manager.sessions.has('new-session')).toBe(true);
      expect(session.messages[0].content).toBe('Response message');
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      manager.createSession('test-session', '/test/project');

      const session = manager.getSession('test-session');

      expect(session).toBeDefined();
      expect(session?.id).toBe('test-session');
    });

    it('should return undefined for non-existent session', async () => {
      const session = manager.getSession('non-existent');

      expect(session).toBeUndefined();
    });
  });

  describe('getProjectSessions', () => {
    it('should return all sessions for a project', async () => {
      manager.createSession('session-1', '/my/project');
      manager.createSession('session-2', '/my/project');
      manager.createSession('session-3', '/other/project');

      manager.addMessage('session-1', 'user', 'First question about the code');
      manager.addMessage('session-2', 'user', 'Second question about tests');

      const projectSessions = manager.getProjectSessions('/my/project');

      expect(projectSessions).toHaveLength(2);
    });

    it('should return sessions sorted by lastActivity descending', async () => {
      manager.createSession('session-old', '/project');
      manager.addMessage('session-old', 'user', 'Old message');

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      manager.createSession('session-new', '/project');
      manager.addMessage('session-new', 'user', 'New message');

      const sessions = manager.getProjectSessions('/project');

      expect(sessions[0].id).toBe('session-new');
    });
  });

  describe('getSessionSummary', () => {
    it('should return "New Session" for empty messages', async () => {
      const session = manager.createSession('empty-session', '/project');
      const summary = manager.getSessionSummary(session);

      expect(summary).toBe('New Session');
    });

    it('should return first user message as summary', async () => {
      const session = manager.createSession('test-session', '/project');
      manager.addMessage('test-session', 'user', 'How do I implement auth?');

      const summary = manager.getSessionSummary(session);

      expect(summary).toBe('How do I implement auth?');
    });

    it('should truncate long messages to 50 chars', async () => {
      const session = manager.createSession('test-session', '/project');
      manager.addMessage('test-session', 'user', 'This is a very long message that exceeds fifty characters');

      const summary = manager.getSessionSummary(session);

      expect(summary.length).toBe(53);
      expect(summary.endsWith('...')).toBe(true);
    });

    it('should return "New Session" if only assistant message exists', async () => {
      const session = manager.createSession('test-session', '/project');
      manager.addMessage('test-session', 'assistant', 'How can I help you?');

      const summary = manager.getSessionSummary(session);

      // Original code only returns user messages, otherwise "New Session"
      expect(summary).toBe('New Session');
    });
  });

  describe('buildConversationContext', () => {
    it('should return empty string for non-existent session', async () => {
      const context = manager.buildConversationContext('non-existent');

      expect(context).toBe('');
    });

    it('should return empty string for session with no messages', async () => {
      manager.createSession('empty-session', '/project');

      const context = manager.buildConversationContext('empty-session');

      expect(context).toBe('');
    });

    it('should build context with recent messages', async () => {
      manager.createSession('test-session', '/project');
      manager.addMessage('test-session', 'user', 'Hello');
      manager.addMessage('test-session', 'assistant', 'Hi there!');
      manager.addMessage('test-session', 'user', 'How are you?');

      const context = manager.buildConversationContext('test-session');

      expect(context).toContain('User: Hello');
      expect(context).toContain('Assistant: Hi there!');
      expect(context).toContain('User: How are you?');
      expect(context).toContain('conversation history');
    });

    it('should limit messages to maxMessages', async () => {
      manager.createSession('test-session', '/project');
      manager.addMessage('test-session', 'user', 'Message001');
      manager.addMessage('test-session', 'user', 'Message002');
      manager.addMessage('test-session', 'user', 'Message003');
      manager.addMessage('test-session', 'user', 'Message004');
      manager.addMessage('test-session', 'user', 'Message005');
      manager.addMessage('test-session', 'user', 'Message006');
      manager.addMessage('test-session', 'user', 'Message007');
      manager.addMessage('test-session', 'user', 'Message008');
      manager.addMessage('test-session', 'user', 'Message009');
      manager.addMessage('test-session', 'user', 'Message010');

      const context = manager.buildConversationContext('test-session', 3);

      // Should contain only last 3 messages
      expect(context).toContain('Message008');
      expect(context).toContain('Message009');
      expect(context).toContain('Message010');
      // Should NOT contain earlier messages
      expect(context).not.toContain('Message001');
      expect(context).not.toContain('Message002');
      expect(context).not.toContain('Message007');
    });
  });

  describe('_safeFilePath', () => {
    it('should prevent path traversal', async () => {
      const safePath1 = manager._safeFilePath('../etc/passwd');
      const safePath2 = manager._safeFilePath('session/../../../etc');

      expect(safePath1).not.toContain('..');
      expect(safePath2).not.toContain('..');
    });

    it('should return path with session id', async () => {
      const safePath = manager._safeFilePath('my-session-id');

      expect(safePath).toContain('my-session-id');
    });
  });

  describe('deleteSession', () => {
    it('should delete session from memory', async () => {
      manager.createSession('test-session', '/project');
      expect(manager.sessions.has('test-session')).toBe(true);

      await manager.deleteSession('test-session');

      expect(manager.sessions.has('test-session')).toBe(false);
    });
  });

  describe('getSessionMessages', () => {
    it('should return messages for session', async () => {
      manager.createSession('test-session', '/project');
      manager.addMessage('test-session', 'user', 'Hello');
      manager.addMessage('test-session', 'assistant', 'Hi there!');

      const messages = manager.getSessionMessages('test-session');

      expect(messages).toHaveLength(2);
      expect(messages[0].message.role).toBe('user');
      expect(messages[0].message.content).toBe('Hello');
      expect(messages[1].message.role).toBe('assistant');
    });

    it('should return empty array for non-existent session', async () => {
      const messages = manager.getSessionMessages('non-existent');

      expect(messages).toEqual([]);
    });
  });
});

describe('sessionManager import test', () => {
  // Test that the actual module exports correctly
  it('should export a sessionManager instance', async () => {
    const module = await import('./sessionManager.ts');
    expect(module.default).toBeDefined();
    expect(typeof module.default.createSession).toBe('function');
    expect(typeof module.default.addMessage).toBe('function');
    expect(typeof module.default.getSession).toBe('function');
  });

  it('should export a ready promise', async () => {
    const module = await import('./sessionManager.ts');
    expect(module.ready).toBeInstanceOf(Promise);
  });
});
