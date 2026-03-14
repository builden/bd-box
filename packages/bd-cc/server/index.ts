#!/usr/bin/env node
// ============================================================================
// region: imports & setup
// ============================================================================
import './env.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createLogger } from './lib/logger';
import {
  VALID_PROVIDERS,
  PROVIDER_WATCH_PATHS,
  WATCHER_IGNORED_PATTERNS,
  WATCHER_DEBOUNCE_MS,
} from './constants/providers';
import {
  stripAnsiSequences,
  normalizeDetectedUrl,
  extractUrlsFromText,
  shouldAutoOpenUrlFromOutput,
} from './utils/url-parser';
import { c } from './utils/terminal-colors';
import { WebSocketWriter } from './utils/websocket-writer';
import { PTY_SESSION_TIMEOUT, SHELL_URL_PARSE_BUFFER_LIMIT } from './constants/terminal';
import { PORT, HOST, DISPLAY_HOST } from './constants/server';

const logger = createLogger('server/index');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

logger.info('PORT from env:', { PORT: process.env.PORT });

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';
import http from 'http';
import cors from 'cors';
import { promises as fsPromises } from 'fs';

import {
  getProjects,
  getSessions,
  getSessionMessages,
  renameProject,
  deleteSession,
  deleteProject,
  addProjectManually,
  extractProjectDirectory,
  clearProjectDirectoryCache,
  searchConversations,
} from './project-service.ts';
import {
  queryClaudeSDK,
  abortClaudeSDKSession,
  isClaudeSDKSessionActive,
  getActiveClaudeSDKSessions,
  resolveToolApproval,
  getPendingApprovalsForSession,
  reconnectSessionWriter,
} from './providers/claude.ts';
import { spawnCursor, abortCursorSession, isCursorSessionActive, getActiveCursorSessions } from './providers/cursor.ts';
import { queryCodex, abortCodexSession, isCodexSessionActive, getActiveCodexSessions } from './providers/codex.ts';
import { spawnGemini, abortGeminiSession, isGeminiSessionActive, getActiveGeminiSessions } from './providers/gemini.ts';
import sessionManager from './sessionManager.ts';
import gitRoutes from './routes/git.ts';
import systemRoutes from './routes/system.ts';
import inlineProjectsRoutes from './routes/inline-projects.ts';
import inlineFilesRoutes from './routes/inline-files.ts';
import mediaRoutes from './routes/media.ts';
import authRoutes from './routes/auth.ts';
import mcpRoutes from './routes/mcp.ts';
import cursorRoutes from './routes/cursor.ts';
import taskmasterRoutes from './routes/taskmasters.ts';
import mcpUtilsRoutes from './routes/mcp-utils.ts';
import commandsRoutes from './routes/commands.ts';
import settingsRoutes from './routes/settings.ts';
import agentRoutes from './routes/agent.ts';
import projectsRoutes, { WORKSPACES_ROOT, validateWorkspacePath } from './routes/projects.ts';
import cliAuthRoutes from './routes/cli-auth.ts';
import userRoutes from './routes/users.ts';
import codexRoutes from './routes/codex.ts';
import geminiRoutes from './routes/gemini.ts';
import pluginsRoutes from './routes/plugins.ts';
import skillsRoutes from './routes/skills.ts';
import { startEnabledPluginServers, stopAllPlugins } from './utils/plugins';
import { initializeDatabase, sessionNamesDb, applyCustomSessionNames } from './database/db.ts';
import { validateApiKey, authenticateToken, authenticateWebSocket } from './middleware/auth.ts';
import { requestLogger } from './middleware/request-logger.ts';
import { IS_PLATFORM } from './env.ts';

// ============================================================================
// endregion

// ============================================================================
// region: app initialization
// ============================================================================
let projectsWatchers = [];
let projectsWatcherDebounceTimer = null;
const connectedClients = new Set();
let isGetProjectsRunning = false; // Flag to prevent reentrant calls

// Broadcast progress to all connected WebSocket clients
function broadcastProgress(progress) {
  const message = JSON.stringify({
    type: 'loading_progress',
    ...progress,
  });
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Setup file system watchers for Claude, Cursor, and Codex project/session folders
async function setupProjectsWatcher() {
  const chokidar = (await import('chokidar')).default;

  if (projectsWatcherDebounceTimer) {
    clearTimeout(projectsWatcherDebounceTimer);
    projectsWatcherDebounceTimer = null;
  }

  await Promise.all(
    projectsWatchers.map(async (watcher) => {
      try {
        await watcher.close();
      } catch (error) {
        logger.warn('Failed to close watcher:', error);
      }
    })
  );
  projectsWatchers = [];

  const debouncedUpdate = (eventType, filePath, provider, rootPath) => {
    if (projectsWatcherDebounceTimer) {
      clearTimeout(projectsWatcherDebounceTimer);
    }

    projectsWatcherDebounceTimer = setTimeout(async () => {
      // Prevent reentrant calls
      if (isGetProjectsRunning) {
        return;
      }

      try {
        isGetProjectsRunning = true;

        // Clear project directory cache when files change
        clearProjectDirectoryCache();

        // Get updated projects list
        const updatedProjects = await getProjects(broadcastProgress);

        // Notify all connected clients about the project changes
        const updateMessage = JSON.stringify({
          type: 'projects_updated',
          projects: updatedProjects,
          timestamp: new Date().toISOString(),
          changeType: eventType,
          changedFile: path.relative(rootPath, filePath),
          watchProvider: provider,
        });

        connectedClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(updateMessage);
          }
        });
      } catch (error) {
        logger.error('Error handling project changes:', error);
      } finally {
        isGetProjectsRunning = false;
      }
    }, WATCHER_DEBOUNCE_MS);
  };

  for (const { provider, rootPath } of PROVIDER_WATCH_PATHS) {
    try {
      // chokidar v4 emits ENOENT via the "error" event for missing roots and will not auto-recover.
      // Ensure provider folders exist before creating the watcher so watching stays active.
      await fsPromises.mkdir(rootPath, { recursive: true });

      // Initialize chokidar watcher with optimized settings
      const watcher = chokidar.watch(rootPath, {
        ignored: WATCHER_IGNORED_PATTERNS,
        persistent: true,
        ignoreInitial: true, // Don't fire events for existing files on startup
        followSymlinks: false,
        depth: 10, // Reasonable depth limit
        awaitWriteFinish: {
          stabilityThreshold: 100, // Wait 100ms for file to stabilize
          pollInterval: 50,
        },
      });

      // Set up event listeners
      watcher
        .on('add', (filePath) => debouncedUpdate('add', filePath, provider, rootPath))
        .on('change', (filePath) => debouncedUpdate('change', filePath, provider, rootPath))
        .on('unlink', (filePath) => debouncedUpdate('unlink', filePath, provider, rootPath))
        .on('addDir', (dirPath) => debouncedUpdate('addDir', dirPath, provider, rootPath))
        .on('unlinkDir', (dirPath) => debouncedUpdate('unlinkDir', dirPath, provider, rootPath))
        .on('error', (error) => {
          logger.error(`${provider} watcher error:`, error);
        })
        .on('ready', () => {});

      projectsWatchers.push(watcher);
    } catch (error) {
      logger.error(`Failed to setup ${provider} watcher for ${rootPath}:`, error);
    }
  }

  if (projectsWatchers.length === 0) {
    logger.error('Failed to setup any provider watchers');
  }
}

const app = express();
const server = http.createServer(app);

// ============================================================================
// endregion

// ============================================================================
// region: PTY session constants
// ============================================================================
const ptySessionsMap = new Map();

// Single WebSocket server that handles both paths
const wss = new WebSocketServer({
  server,
  verifyClient: (info) => {
    logger.debug('WebSocket connection attempt to:', { url: info.req.url });

    // Platform mode: always allow connection
    if (IS_PLATFORM) {
      const user = authenticateWebSocket(null); // Will return first user
      if (!user) {
        logger.warn('Platform mode: No user found in database');
        return false;
      }
      info.req.user = user;
      logger.info('Platform mode WebSocket authenticated for user:', { username: user.username });
      return true;
    }

    // Normal mode: verify token
    // Extract token from query parameters or headers
    const url = new URL(info.req.url, 'http://localhost');
    const token = url.searchParams.get('token') || info.req.headers.authorization?.split(' ')[1];

    // Verify token
    const user = authenticateWebSocket(token);
    if (!user) {
      logger.warn('WebSocket authentication failed');
      return false;
    }

    // Store user info in the request for later use
    info.req.user = user;
    logger.info('WebSocket authenticated for user:', { username: user.username });
    return true;
  },
});

// Make WebSocket server available to routes
app.locals.wss = wss;

app.use(cors({ exposedHeaders: ['X-Refreshed-Token'] }));

// ============================================================================
// endregion

// ============================================================================
// region: middleware
// ============================================================================
app.use(requestLogger);

app.use(
  express.json({
    limit: '50mb',
    type: (req) => {
      // Skip multipart/form-data requests (for file uploads like images)
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        return false;
      }
      return contentType.includes('json');
    },
  })
);
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// endregion

// ============================================================================
// region: routes registration
// ============================================================================
// Public health check endpoint (no authentication required)
// System routes (health, update)
app.use('/', systemRoutes);

// Inline projects routes (extracted from index.ts)
app.use('/', authenticateToken, inlineProjectsRoutes);
app.use('/', authenticateToken, inlineFilesRoutes);
app.use('/', authenticateToken, mediaRoutes);

// Optional API key validation (if configured)
app.use('/api', validateApiKey);

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Projects API Routes (protected)
app.use('/api/projects', authenticateToken, projectsRoutes);

// Git API Routes (protected)
app.use('/api/git', authenticateToken, gitRoutes);

// MCP API Routes (protected)
app.use('/api/mcp', authenticateToken, mcpRoutes);

// Cursor API Routes (protected)
app.use('/api/cursor', authenticateToken, cursorRoutes);

// TaskMaster API Routes (protected)
app.use('/api/taskmasters', authenticateToken, taskmasterRoutes);

// MCP utilities
app.use('/api/mcp-utils', authenticateToken, mcpUtilsRoutes);

// Commands API Routes (protected)
app.use('/api/commands', authenticateToken, commandsRoutes);

// Settings API Routes (protected)
app.use('/api/settings', authenticateToken, settingsRoutes);

// CLI Authentication API Routes (protected)
app.use('/api/cli', authenticateToken, cliAuthRoutes);

// User API Routes (protected)
app.use('/api/users', authenticateToken, userRoutes);

// Codex API Routes (protected)
app.use('/api/codex', authenticateToken, codexRoutes);

// Gemini API Routes (protected)
app.use('/api/gemini', authenticateToken, geminiRoutes);

// Plugins API Routes (protected)
app.use('/api/plugins', authenticateToken, pluginsRoutes);
app.use('/api/skills', authenticateToken, skillsRoutes);

// Agent API Routes (uses API key authentication)
app.use('/api/agent', agentRoutes);

// Serve public files (like api-docs.html)
app.use(express.static(path.join(__dirname, '../public')));

// Static files served after API routes
// Add cache control: HTML files should not be cached, but assets can be cached
app.use(
  express.static(path.join(__dirname, '../dist'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // Prevent HTML caching to avoid service worker issues after builds
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
        // Cache static assets for 1 year (they have hashed names)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

// ============================================================================
// endregion

// ============================================================================
// region: inline API routes
// ============================================================================
// API Routes (protected)
// /api/config endpoint removed - no longer needed
// Frontend now uses window.location for WebSocket URLs
// WebSocket connection handler that routes based on URL path
wss.on('connection', (ws, request) => {
  const url = request.url;
  logger.info('Client connected to:', { url });

  // Parse URL to get pathname without query parameters
  const urlObj = new URL(url, 'http://localhost');
  const pathname = urlObj.pathname;

  if (pathname === '/shell') {
    handleShellConnection(ws);
  } else if (pathname === '/ws') {
    handleChatConnection(ws);
  } else {
    logger.warn('Unknown WebSocket path:', pathname);
    ws.close();
  }
});

/**
 * WebSocket Writer - Wrapper for WebSocket to match SSEStreamWriter interface
 */
// Handle chat WebSocket connections
function handleChatConnection(ws) {
  logger.info('Chat WebSocket connected');

  // Add to connected clients for project updates
  connectedClients.add(ws);

  // Wrap WebSocket with writer for consistent interface with SSEStreamWriter
  const writer = new WebSocketWriter(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

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
        error: error.message,
      });
    }
  });

  ws.on('close', () => {
    logger.info('Chat client disconnected');
    // Remove from connected clients
    connectedClients.delete(ws);
  });
}

// Handle shell WebSocket connections
function handleShellConnection(ws) {
  logger.info('Shell client connected');
  let shellProcess = null;
  let ptySessionKey = null;
  let urlDetectionBuffer = '';
  const announcedAuthUrls = new Set();

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      logger.debug('Shell message received:', { type: data.type });

      if (data.type === 'init') {
        const projectPath = data.projectPath || process.cwd();
        const sessionId = data.sessionId;
        const hasSession = data.hasSession;
        const provider = data.provider || 'claude';
        const initialCommand = data.initialCommand;
        const isPlainShell = data.isPlainShell || (!!initialCommand && !hasSession) || provider === 'plain-shell';
        urlDetectionBuffer = '';
        announcedAuthUrls.clear();

        // Login commands (Claude/Cursor auth) should never reuse cached sessions
        const isLoginCommand =
          initialCommand &&
          (initialCommand.includes('setup-token') ||
            initialCommand.includes('cursor-agent login') ||
            initialCommand.includes('auth login'));

        // Include command hash in session key so different commands get separate sessions
        const commandSuffix =
          isPlainShell && initialCommand ? `_cmd_${Buffer.from(initialCommand).toString('base64').slice(0, 16)}` : '';
        ptySessionKey = `${projectPath}_${sessionId || 'default'}${commandSuffix}`;

        // Kill any existing login session before starting fresh
        if (isLoginCommand) {
          const oldSession = ptySessionsMap.get(ptySessionKey);
          if (oldSession) {
            logger.debug('Cleaning up existing login session:', { ptySessionKey });
            if (oldSession.timeoutId) clearTimeout(oldSession.timeoutId);
            if (oldSession.pty && oldSession.pty.kill) oldSession.pty.kill();
            ptySessionsMap.delete(ptySessionKey);
          }
        }

        const existingSession = isLoginCommand ? null : ptySessionsMap.get(ptySessionKey);
        if (existingSession) {
          logger.debug('Reconnecting to existing PTY session:', { ptySessionKey });
          shellProcess = existingSession.pty;

          clearTimeout(existingSession.timeoutId);

          ws.send(
            JSON.stringify({
              type: 'output',
              data: `\x1b[36m[Reconnected to existing session]\x1b[0m\r\n`,
            })
          );

          if (existingSession.buffer && existingSession.buffer.length > 0) {
            logger.debug(`Sending ${existingSession.buffer.length} buffered messages`);
            existingSession.buffer.forEach((bufferedData) => {
              ws.send(
                JSON.stringify({
                  type: 'output',
                  data: bufferedData,
                })
              );
            });
          }

          existingSession.ws = ws;

          return;
        }

        logger.info('Starting shell in:', { projectPath });
        logger.debug('📋 Session info:', {
          info: hasSession ? `Resume session ${sessionId}` : isPlainShell ? 'Plain shell mode' : 'New session',
        });
        logger.debug('Provider:', { provider: isPlainShell ? 'plain-shell' : provider });
        if (initialCommand) {
          logger.debug('Initial command:', { initialCommand });
        }

        // First send a welcome message
        let welcomeMsg;
        if (isPlainShell) {
          welcomeMsg = `\x1b[36mStarting terminal in: ${projectPath}\x1b[0m\r\n`;
        } else {
          const providerName =
            provider === 'cursor'
              ? 'Cursor'
              : provider === 'codex'
                ? 'Codex'
                : provider === 'gemini'
                  ? 'Gemini'
                  : 'Claude';
          welcomeMsg = hasSession
            ? `\x1b[36mResuming ${providerName} session ${sessionId} in: ${projectPath}\x1b[0m\r\n`
            : `\x1b[36mStarting new ${providerName} session in: ${projectPath}\x1b[0m\r\n`;
        }

        ws.send(
          JSON.stringify({
            type: 'output',
            data: welcomeMsg,
          })
        );

        try {
          // Validate projectPath — resolve to absolute and verify it exists
          const resolvedProjectPath = path.resolve(projectPath);
          try {
            const stats = fs.statSync(resolvedProjectPath);
            if (!stats.isDirectory()) {
              throw new Error('Not a directory');
            }
          } catch (pathErr) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid project path' }));
            return;
          }

          // Validate sessionId — only allow safe characters
          const safeSessionIdPattern = /^[a-zA-Z0-9_.\-:]+$/;
          if (sessionId && !safeSessionIdPattern.test(sessionId)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid session ID' }));
            return;
          }

          // Build shell command — use cwd for project path (never interpolate into shell string)
          let shellCommand;
          if (isPlainShell) {
            // Plain shell mode - run the initial command in the project directory
            shellCommand = initialCommand;
          } else if (provider === 'cursor') {
            if (hasSession && sessionId) {
              shellCommand = `cursor-agent --resume="${sessionId}"`;
            } else {
              shellCommand = 'cursor-agent';
            }
          } else if (provider === 'codex') {
            // Use codex command; attempt to resume and fall back to a new session when the resume fails.
            if (hasSession && sessionId) {
              if (os.platform() === 'win32') {
                // PowerShell syntax for fallback
                shellCommand = `codex resume "${sessionId}"; if ($LASTEXITCODE -ne 0) { codex }`;
              } else {
                shellCommand = `codex resume "${sessionId}" || codex`;
              }
            } else {
              shellCommand = 'codex';
            }
          } else if (provider === 'gemini') {
            const command = initialCommand || 'gemini';
            let resumeId = sessionId;
            if (hasSession && sessionId) {
              try {
                // Gemini CLI enforces its own native session IDs, unlike other agents that accept arbitrary string names.
                // The UI only knows about its internal generated `sessionId` (e.g. gemini_1234).
                // We must fetch the mapping from the backend session manager to pass the native `cliSessionId` to the shell.
                const sess = sessionManager.getSession(sessionId);
                if (sess && sess.cliSessionId) {
                  resumeId = sess.cliSessionId;
                  // Validate the looked-up CLI session ID too
                  if (!safeSessionIdPattern.test(resumeId)) {
                    resumeId = null;
                  }
                }
              } catch (err) {
                logger.error('Failed to get Gemini CLI session ID:', err);
              }
            }

            if (hasSession && resumeId) {
              shellCommand = `${command} --resume "${resumeId}"`;
            } else {
              shellCommand = command;
            }
          } else {
            // Claude (default provider)
            const command = initialCommand || 'claude';
            if (hasSession && sessionId) {
              if (os.platform() === 'win32') {
                shellCommand = `claude --resume "${sessionId}"; if ($LASTEXITCODE -ne 0) { claude }`;
              } else {
                shellCommand = `claude --resume "${sessionId}" || claude`;
              }
            } else {
              shellCommand = command;
            }
          }

          logger.debug('Executing shell command:', { shellCommand });

          // Use appropriate shell based on platform
          const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
          const shellArgs = os.platform() === 'win32' ? ['-Command', shellCommand] : ['-c', shellCommand];

          // Use terminal dimensions from client if provided, otherwise use defaults
          const termCols = data.cols || 80;
          const termRows = data.rows || 24;
          logger.debug('Using terminal dimensions:', { cols: termCols, rows: termRows });

          // 使用 Bun 内置 PTY
          // 删除 CLAUDECODE 环境变量，避免嵌套 Claude 会话
          const { CLAUDECODE, ...cleanEnv } = process.env;
          shellProcess = Bun.spawn([shell, ...shellArgs], {
            cwd: resolvedProjectPath,
            env: {
              ...cleanEnv,
              TERM: 'xterm-256color',
              COLORTERM: 'truecolor',
              FORCE_COLOR: '3',
            },
            terminal: {
              cols: termCols,
              rows: termRows,
              data: (terminal, output) => {
                // Bun PTY: 第一个参数是 Terminal 对象，第二个是输出
                const decodedData = new TextDecoder().decode(output);
                if (!decodedData) return;
                const session = ptySessionsMap.get(ptySessionKey);
                if (!session) return;

                if (session.buffer.length < 5000) {
                  session.buffer.push(decodedData);
                } else {
                  session.buffer.shift();
                  session.buffer.push(decodedData);
                }

                if (session.ws && session.ws.readyState === WebSocket.OPEN) {
                  let outputData = decodedData;

                  const cleanChunk = stripAnsiSequences(decodedData);
                  urlDetectionBuffer = `${urlDetectionBuffer}${cleanChunk}`.slice(-SHELL_URL_PARSE_BUFFER_LIMIT);

                  outputData = outputData.replace(
                    /OPEN_URL:\s*(https?:\/\/[^\s\x1b\x07]+)/g,
                    '[INFO] Opening in browser: $1'
                  );

                  const emitAuthUrl = (detectedUrl, autoOpen = false) => {
                    const normalizedUrl = normalizeDetectedUrl(detectedUrl);
                    if (!normalizedUrl) return;

                    const isNewUrl = !announcedAuthUrls.has(normalizedUrl);
                    if (isNewUrl) {
                      announcedAuthUrls.add(normalizedUrl);
                      session.ws.send(
                        JSON.stringify({
                          type: 'auth_url',
                          url: normalizedUrl,
                          autoOpen,
                        })
                      );
                    }
                  };

                  const normalizedDetectedUrls = extractUrlsFromText(urlDetectionBuffer)
                    .map((url) => normalizeDetectedUrl(url))
                    .filter(Boolean);

                  // Prefer the most complete URL if shorter prefix variants are also present.
                  const dedupedDetectedUrls = Array.from(new Set(normalizedDetectedUrls)).filter(
                    (url, _, urls) => !urls.some((otherUrl) => otherUrl !== url && otherUrl.startsWith(url))
                  );

                  dedupedDetectedUrls.forEach((url) => emitAuthUrl(url, false));

                  if (shouldAutoOpenUrlFromOutput(cleanChunk) && dedupedDetectedUrls.length > 0) {
                    const bestUrl = dedupedDetectedUrls.reduce((longest, current) =>
                      current.length > longest.length ? current : longest
                    );
                    emitAuthUrl(bestUrl, true);
                  }

                  // Send regular output
                  session.ws.send(
                    JSON.stringify({
                      type: 'output',
                      data: outputData,
                    })
                  );
                }
              },
            },
          });

          logger.info('Shell process started with Bun PTY');

          ptySessionsMap.set(ptySessionKey, {
            pty: shellProcess,
            ws: ws,
            buffer: [],
            timeoutId: null,
            projectPath,
            sessionId,
          });
        } catch (spawnError) {
          logger.error('Error spawning process:', spawnError);
          ws.send(
            JSON.stringify({
              type: 'output',
              data: `\r\n\x1b[31mError: ${spawnError.message}\x1b[0m\r\n`,
            })
          );
        }
      } else if (data.type === 'input') {
        // Send input to shell process - Bun PTY 使用 terminal.write
        if (shellProcess && shellProcess.terminal) {
          try {
            shellProcess.terminal.write(data.data);
          } catch (error) {
            logger.error('Error writing to shell:', error);
          }
        } else {
          logger.warn('No active shell process to send input to');
        }
      } else if (data.type === 'resize') {
        // Bun PTY 不支持 resize，跳过
      }
    } catch (error) {
      logger.error('Shell WebSocket error:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'output',
            data: `\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n`,
          })
        );
      }
    }
  });

  ws.on('close', () => {
    logger.info('Shell client disconnected');

    if (ptySessionKey) {
      const session = ptySessionsMap.get(ptySessionKey);
      if (session) {
        logger.debug('PTY session kept alive, will timeout in 30 minutes:', { ptySessionKey });
        session.ws = null;

        session.timeoutId = setTimeout(() => {
          logger.info('PTY session timeout, killing process:', { ptySessionKey });
          if (session.pty && session.pty.kill) {
            session.pty.kill();
          }
          ptySessionsMap.delete(ptySessionKey);
        }, PTY_SESSION_TIMEOUT);
      }
    }
  });

  ws.on('error', (error) => {
    logger.error('Shell WebSocket error:', error);
  });
}
// ============================================================================
// endregion

// ============================================================================
// region: fallback
// ============================================================================
// Serve React app for all other routes (excluding static files)
app.get('{*splat}', (req, res) => {
  // Skip requests for static assets (files with extensions)
  if (path.extname(req.path)) {
    return res.status(404).send('Not found');
  }

  // Only serve index.html for HTML routes, not for static assets
  // Static assets should already be handled by express.static middleware above
  const indexPath = path.join(__dirname, '../dist/index.html');

  // Check if dist/index.html exists (production build available)
  if (fs.existsSync(indexPath)) {
    // Set no-cache headers for HTML to prevent service worker issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  } else {
    // In development, redirect to Vite dev server only if dist doesn't exist
    res.redirect(`http://localhost:${process.env.VITE_PORT || 5173}`);
  }
});

// ============================================================================
// endregion

// ============================================================================
// region: server startup
// ============================================================================
// Initialize database and start server
async function startServer() {
  try {
    // Initialize authentication database
    await initializeDatabase();

    // Check if running in production mode (dist folder exists)
    const distIndexPath = path.join(__dirname, '../dist/index.html');
    const isProduction = fs.existsSync(distIndexPath);

    // Log Claude implementation mode
    console.log(`${c.info('[INFO]')} Using Claude Agents SDK for Claude integration`);
    console.log(`${c.info('[INFO]')} Running in ${c.bright(isProduction ? 'PRODUCTION' : 'DEVELOPMENT')} mode`);

    if (!isProduction) {
      console.log(
        `${c.warn('[WARN]')} Note: Requests will be proxied to Vite dev server at ${c.dim('http://localhost:' + (process.env.VITE_PORT || 5173))}`
      );
    }

    server.listen(PORT, HOST, async () => {
      const appInstallPath = path.join(__dirname, '..');

      console.log('');
      console.log(c.dim('═'.repeat(63)));
      console.log(`  ${c.bright('Claude Code UI Server - Ready')}`);
      console.log(c.dim('═'.repeat(63)));
      console.log('');
      console.log(`${c.info('[INFO]')} Server URL:  ${c.bright('http://' + DISPLAY_HOST + ':' + PORT)}`);
      console.log(`${c.info('[INFO]')} Installed at: ${c.dim(appInstallPath)}`);
      console.log(`${c.tip('[TIP]')}  Run "cloudcli status" for full configuration details`);
      console.log('');

      // Start watching the projects folder for changes
      await setupProjectsWatcher();

      // Start server-side plugin processes for enabled plugins
      startEnabledPluginServers().catch((err) => {
        logger.error('Error during startup:', err);
      });
    });

    // Clean up plugin processes on shutdown
    const shutdownPlugins = async () => {
      await stopAllPlugins();
      process.exit(0);
    };
    process.on('SIGTERM', () => void shutdownPlugins());
    process.on('SIGINT', () => void shutdownPlugins());
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// ============================================================================
// endregion
// ============================================================================
