/**
 * Shell WebSocket Handler
 * Handles PTY (pseudo-terminal) WebSocket connections for shell sessions
 */

import type { Container } from '../app/container';
import type { AppConfig } from '../app/config';
import { createLogger } from '../utils/logger';
import {
  stripAnsiSequences,
  normalizeDetectedUrl,
  extractUrlsFromText,
  shouldAutoOpenUrlFromOutput,
} from '../utils/url-parser';
import { PTY_SESSION_TIMEOUT, SHELL_URL_PARSE_BUFFER_LIMIT } from '../constants/terminal';
import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';
import os from 'os';
import path from 'path';
import fs from 'fs';

const logger = createLogger('server/ws/shell-handler');

export interface ShellSession {
  sessionKey: string;
  projectPath: string;
  provider: string;
  sessionId?: string;
  process?: Bun.Subprocess;
  buffer: string[];
  timeoutId?: NodeJS.Timeout;
  ws?: WebSocket;
}

export class ShellHandler {
  private sessions = new Map<string, ShellSession>();
  private urlDetectionBuffer = '';
  private announcedAuthUrls = new Set<string>();

  constructor(
    private container: Container,
    private config: AppConfig
  ) {}

  /**
   * Handle new WebSocket shell connection
   */
  handleConnection(ws: WebSocket, request: IncomingMessage): void {
    logger.info('Shell client connected');
    let shellProcess: Bun.Subprocess | null = null;
    let ptySessionKey: string | null = null;
    let urlDetectionBuffer = '';
    const announcedAuthUrls = new Set<string>();

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
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
            const oldSession = this.sessions.get(ptySessionKey);
            if (oldSession) {
              logger.debug('Cleaning up existing login session:', { ptySessionKey });
              if (oldSession.timeoutId) clearTimeout(oldSession.timeoutId);
              if (oldSession.process && oldSession.process.kill) oldSession.process.kill();
              this.sessions.delete(ptySessionKey);
            }
          }

          const existingSession = isLoginCommand ? null : this.sessions.get(ptySessionKey);
          if (existingSession) {
            logger.debug('Reconnecting to existing PTY session:', { ptySessionKey });
            shellProcess = existingSession.process;

            if (existingSession.timeoutId) clearTimeout(existingSession.timeoutId);

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
          logger.debug('Session info:', {
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
            let shellCommand: string;
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
              // Note: Gemini CLI session handling would go here if needed
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

            // Use Bun built-in PTY
            // Delete CLAUDECODE env var to avoid nested Claude sessions
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
                  // Bun PTY: first param is Terminal object, second is output
                  const decodedData = new TextDecoder().decode(output);
                  if (!decodedData) return;
                  const session = this.sessions.get(ptySessionKey!);
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

                    const emitAuthUrl = (detectedUrl: string, autoOpen = false) => {
                      const normalizedUrl = normalizeDetectedUrl(detectedUrl);
                      if (!normalizedUrl) return;

                      const isNewUrl = !announcedAuthUrls.has(normalizedUrl);
                      if (isNewUrl) {
                        announcedAuthUrls.add(normalizedUrl);
                        session.ws!.send(
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
                    session.ws!.send(
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

            this.sessions.set(ptySessionKey, {
              sessionKey: ptySessionKey,
              projectPath,
              provider,
              sessionId,
              process: shellProcess,
              ws: ws,
              buffer: [],
              timeoutId: undefined,
            });
          } catch (spawnError) {
            logger.error('Error spawning process:', spawnError);
            ws.send(
              JSON.stringify({
                type: 'output',
                data: `\r\n\x1b[31mError: ${(spawnError as Error).message}\x1b[0m\r\n`,
              })
            );
          }
        } else if (data.type === 'input') {
          // Send input to shell process - Bun PTY uses terminal.write
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
          // Bun PTY does not support resize, skip
        }
      } catch (error) {
        logger.error('Shell WebSocket error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'output',
              data: `\r\n\x1b[31mError: ${(error as Error).message}\x1b[0m\r\n`,
            })
          );
        }
      }
    });

    ws.on('close', () => {
      logger.info('Shell client disconnected');

      if (ptySessionKey) {
        const session = this.sessions.get(ptySessionKey);
        if (session) {
          logger.debug('PTY session kept alive, will timeout in 30 minutes:', { ptySessionKey });
          session.ws = undefined;

          session.timeoutId = setTimeout(() => {
            logger.info('PTY session timeout, killing process:', { ptySessionKey });
            if (session.process && session.process.kill) {
              session.process.kill();
            }
            this.sessions.delete(ptySessionKey);
          }, PTY_SESSION_TIMEOUT);
        }
      }
    });

    ws.on('error', (error) => {
      logger.error('Shell WebSocket error:', error);
    });
  }

  /**
   * Get all active sessions
   */
  getSessions(): Map<string, ShellSession> {
    return this.sessions;
  }

  /**
   * Close a specific session
   */
  closeSession(sessionKey: string): void {
    const session = this.sessions.get(sessionKey);
    if (session) {
      if (session.timeoutId) clearTimeout(session.timeoutId);
      if (session.process && session.process.kill) {
        session.process.kill();
      }
      this.sessions.delete(sessionKey);
    }
  }

  /**
   * Close all sessions
   */
  closeAllSessions(): void {
    for (const [sessionKey] of this.sessions) {
      this.closeSession(sessionKey);
    }
  }
}
