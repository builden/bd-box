/**
 * Shell WebSocket Handler
 * Handles /shell connections for terminal emulation
 */

import type { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createLogger } from '../utils/logger';
import { WebSocketHandler } from '../../shared/utils/websocket';
import { PTY_SESSION_TIMEOUT, SHELL_URL_PARSE_BUFFER_LIMIT } from '../constants/terminal';
import {
  stripAnsiSequences,
  normalizeDetectedUrl,
  extractUrlsFromText,
  shouldAutoOpenUrlFromOutput,
} from './url-parser';

const logger = createLogger('utils/shell-handler');

interface PtySession {
  pty: any;
  ws: WebSocket | null;
  buffer: string[];
  timeoutId: Timer | null;
  projectPath: string;
  sessionId: string | null;
}

type Timer = ReturnType<typeof setTimeout>;

export interface ShellHandlerOptions {
  ptySessionsMap: Map<string, PtySession>;
  connectedClients: Set<WebSocket>;
}

export function createShellHandler(ws: WebSocket, options: ShellHandlerOptions) {
  const { ptySessionsMap } = options;

  logger.info('Shell client connected');

  let shellProcess: any = null;
  let ptySessionKey: string | null = null;
  let urlDetectionBuffer = '';
  const announcedAuthUrls = new Set();

  const handler = new WebSocketHandler(ws);

  // Handle init message
  handler.on('init', async (data: any) => {
    const projectPath = data.projectPath || process.cwd();
    const sessionId = data.sessionId;
    const hasSession = data.hasSession;
    const provider = data.provider || 'claude';
    const initialCommand = data.initialCommand;
    const isPlainShell = data.isPlainShell || (!!initialCommand && !hasSession) || provider === 'plain-shell';
    urlDetectionBuffer = '';
    announcedAuthUrls.clear();

    // Login commands should not reuse cached sessions
    const isLoginCommand =
      initialCommand &&
      (initialCommand.includes('setup-token') ||
        initialCommand.includes('cursor-agent login') ||
        initialCommand.includes('auth login'));

    const commandSuffix =
      isPlainShell && initialCommand ? `_cmd_${Buffer.from(initialCommand).toString('base64').slice(0, 16)}` : '';
    ptySessionKey = `${projectPath}_${sessionId || 'default'}${commandSuffix}`;

    // Kill existing login session
    if (isLoginCommand) {
      const oldSession = ptySessionsMap.get(ptySessionKey);
      if (oldSession) {
        logger.debug('Cleaning up existing login session:', { ptySessionKey });
        if (oldSession.timeoutId) clearTimeout(oldSession.timeoutId);
        if (oldSession.pty?.kill) oldSession.pty.kill();
        ptySessionsMap.delete(ptySessionKey);
      }
    }

    const existingSession = isLoginCommand ? null : ptySessionsMap.get(ptySessionKey);
    if (existingSession) {
      logger.debug('Reconnecting to existing PTY session:', { ptySessionKey });
      shellProcess = existingSession.pty;
      clearTimeout(existingSession.timeoutId);

      handler.send({ type: 'output', data: '\x1b[36m[Reconnected to existing session]\x1b[0m\r\n' });

      if (existingSession.buffer?.length > 0) {
        logger.debug(`Sending ${existingSession.buffer.length} buffered messages`);
        existingSession.buffer.forEach((bufferedData) => {
          handler.send({ type: 'output', data: bufferedData });
        });
      }

      existingSession.ws = ws;
      return;
    }

    logger.info('Starting shell in:', { projectPath });

    // Send welcome message
    let welcomeMsg;
    if (isPlainShell) {
      welcomeMsg = `\x1b[36mStarting terminal in: ${projectPath}\x1b[0m\r\n`;
    } else {
      const providerName =
        provider === 'cursor' ? 'Cursor' : provider === 'codex' ? 'Codex' : provider === 'gemini' ? 'Gemini' : 'Claude';
      welcomeMsg = hasSession
        ? `\x1b[36mResuming ${providerName} session ${sessionId} in: ${projectPath}\x1b[0m\r\n`
        : `\x1b[36mStarting new ${providerName} session in: ${projectPath}\x1b[0m\r\n`;
    }

    handler.send({ type: 'output', data: welcomeMsg });

    try {
      const resolvedProjectPath = path.resolve(projectPath);
      try {
        const stats = fs.statSync(resolvedProjectPath);
        if (!stats.isDirectory()) throw new Error('Not a directory');
      } catch (pathErr) {
        handler.send({ type: 'error', message: 'Invalid project path' });
        return;
      }

      // Build shell command
      let shellCommand: string;
      if (isPlainShell) {
        shellCommand = initialCommand;
      } else if (provider === 'cursor') {
        shellCommand = hasSession && sessionId ? `cursor-agent --resume="${sessionId}"` : 'cursor-agent';
      } else if (provider === 'codex') {
        shellCommand =
          hasSession && sessionId
            ? os.platform() === 'win32'
              ? `codex resume "${sessionId}"; if ($LASTEXITCODE -ne 0) { codex }`
              : `codex resume "${sessionId}" || codex`
            : 'codex';
      } else if (provider === 'gemini') {
        const command = initialCommand || 'gemini';
        shellCommand = hasSession && sessionId ? `${command} --resume "${sessionId}"` : command;
      } else {
        const command = initialCommand || 'claude';
        shellCommand =
          hasSession && sessionId
            ? os.platform() === 'win32'
              ? `claude --resume "${sessionId}"; if ($LASTEXITCODE -ne 0) { claude }`
              : `claude --resume "${sessionId}" || claude`
            : command;
      }

      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      const shellArgs = os.platform() === 'win32' ? ['-Command', shellCommand] : ['-c', shellCommand];

      const termCols = data.cols || 80;
      const termRows = data.rows || 24;

      // Clean environment
      const { CLAUDECODE, ...cleanEnv } = process.env;

      // Start Bun PTY
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
          data: (_terminal: any, output: Uint8Array) => {
            const decodedData = new TextDecoder().decode(output);
            if (!decodedData) return;

            const session = ptySessionsMap.get(ptySessionKey!);
            if (!session) return;

            // Buffer management
            if (session.buffer.length < 5000) {
              session.buffer.push(decodedData);
            } else {
              session.buffer.shift();
              session.buffer.push(decodedData);
            }

            if (session.ws && session.ws.readyState === 1) {
              let outputData = decodedData;

              const cleanChunk = stripAnsiSequences(decodedData);
              urlDetectionBuffer = `${urlDetectionBuffer}${cleanChunk}`.slice(-SHELL_URL_PARSE_BUFFER_LIMIT);

              outputData = outputData.replace(
                /OPEN_URL:\s*(https?:\/\/[^\s\x1b\x07]+)/g,
                '[INFO] Opening in browser: $1'
              );

              // URL detection
              const normalizedDetectedUrls = extractUrlsFromText(urlDetectionBuffer)
                .map((url) => normalizeDetectedUrl(url))
                .filter(Boolean);

              const dedupedDetectedUrls = Array.from(new Set(normalizedDetectedUrls)).filter(
                (url, _, urls) => !urls.some((otherUrl) => otherUrl !== url && otherUrl.startsWith(url))
              );

              dedupedDetectedUrls.forEach((url) => {
                if (!announcedAuthUrls.has(url)) {
                  announcedAuthUrls.add(url);
                  session.ws?.send(JSON.stringify({ type: 'auth_url', url, autoOpen: false }));
                }
              });

              if (shouldAutoOpenUrlFromOutput(cleanChunk) && dedupedDetectedUrls.length > 0) {
                const bestUrl = dedupedDetectedUrls.reduce((longest, current) =>
                  current.length > longest.length ? current : longest
                );
                if (!announcedAuthUrls.has(bestUrl)) {
                  announcedAuthUrls.add(bestUrl);
                  session.ws?.send(JSON.stringify({ type: 'auth_url', url: bestUrl, autoOpen: true }));
                }
              }

              session.ws?.send(JSON.stringify({ type: 'output', data: outputData }));
            }
          },
        },
      });

      logger.info('Shell process started with Bun PTY');

      ptySessionsMap.set(ptySessionKey, {
        pty: shellProcess,
        ws,
        buffer: [],
        timeoutId: null,
        projectPath,
        sessionId,
      });
    } catch (spawnError: Error) {
      logger.error('Error spawning process:', spawnError);
      handler.send({ type: 'output', data: `\r\n\x1b[31mError: ${spawnError.message}\x1b[0m\r\n` });
    }
  });

  // Handle input message
  handler.on('input', (data: any) => {
    if (shellProcess?.terminal) {
      try {
        shellProcess.terminal.write(data.data);
      } catch (error) {
        logger.error('Error writing to shell:', error);
      }
    }
  });

  // Handle resize message (Bun PTY 不支持 resize)
  handler.on('resize', () => {
    // Bun PTY 不支持 resize，跳过
  });

  // Handle errors
  handler.on('error', (error: Error) => {
    logger.error('Shell WebSocket error:', error);
    handler.send({ type: 'output', data: `\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n` });
  });

  // Handle close
  handler.on('close', () => {
    logger.info('Shell client disconnected');

    if (ptySessionKey) {
      const session = ptySessionsMap.get(ptySessionKey);
      if (session) {
        logger.debug('PTY session kept alive, will timeout in 30 minutes:', { ptySessionKey });
        session.ws = null;

        session.timeoutId = setTimeout(() => {
          logger.info('PTY session timeout, killing process:', { ptySessionKey });
          if (session.pty?.kill) {
            session.pty.kill();
          }
          ptySessionsMap.delete(ptySessionKey!);
        }, PTY_SESSION_TIMEOUT);
      }
    }
  });

  return handler;
}
