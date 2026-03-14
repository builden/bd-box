/**
 * CLI Auth Route Utilities
 * Helper functions for checking provider authentication status
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Checks Claude authentication credentials using two methods with priority order:
 *
 * Priority 1: ANTHROPIC_API_KEY environment variable
 * Priority 2: ~/.claude/.credentials.json OAuth tokens
 */
export async function checkClaudeCredentials() {
  // Priority 1: Check for ANTHROPIC_API_KEY environment variable
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) {
    return {
      authenticated: true,
      email: 'API Key Auth',
      method: 'api_key',
    };
  }

  // Priority 1.5: Check for ANTHROPIC_AUTH_TOKEN (e.g., from MiniMax)
  if (process.env.ANTHROPIC_AUTH_TOKEN && process.env.ANTHROPIC_AUTH_TOKEN.trim()) {
    return {
      authenticated: true,
      email: 'Auth Token',
      method: 'auth_token',
    };
  }

  // Priority 2: Check ~/.claude/settings.json for embedded env vars
  try {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    const settingsContent = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsContent);

    if (settings.env) {
      if (settings.env.ANTHROPIC_API_KEY && settings.env.ANTHROPIC_API_KEY.trim()) {
        return {
          authenticated: true,
          email: 'API Key (from settings.json)',
          method: 'api_key',
        };
      }
      if (settings.env.ANTHROPIC_AUTH_TOKEN && settings.env.ANTHROPIC_AUTH_TOKEN.trim()) {
        return {
          authenticated: true,
          email: 'Auth Token (from settings.json)',
          method: 'auth_token',
        };
      }
    }
  } catch (error) {
    // settings.json doesn't exist or can't be read, continue to next check
  }

  // Priority 3: Check ~/.claude/.credentials.json for OAuth tokens
  try {
    const credPath = path.join(os.homedir(), '.claude', '.credentials.json');
    const content = await fs.readFile(credPath, 'utf8');
    const creds = JSON.parse(content);

    const oauth = creds.claudeAiOauth;
    if (oauth && oauth.accessToken) {
      const isExpired = oauth.expiresAt && Date.now() >= oauth.expiresAt;

      if (!isExpired) {
        return {
          authenticated: true,
          email: creds.email || creds.user || null,
          method: 'credentials_file',
        };
      }
    }

    return {
      authenticated: false,
      email: null,
      method: null,
    };
  } catch (error) {
    return {
      authenticated: false,
      email: null,
      method: null,
    };
  }
}

/**
 * Check Cursor CLI authentication status
 */
export function checkCursorStatus(): Promise<{
  authenticated: boolean;
  email: string | null;
  error?: string;
  output?: string;
}> {
  return new Promise((resolve) => {
    let processCompleted = false;

    const timeout = setTimeout(() => {
      if (!processCompleted) {
        processCompleted = true;
        if (childProcess) {
          childProcess.kill();
        }
        resolve({
          authenticated: false,
          email: null,
          error: 'Command timeout',
        });
      }
    }, 5000);

    let childProcess;
    try {
      childProcess = spawn('cursor-agent', ['status']);
    } catch (err) {
      clearTimeout(timeout);
      processCompleted = true;
      resolve({
        authenticated: false,
        email: null,
        error: 'Cursor CLI not found or not installed',
      });
      return;
    }

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      if (processCompleted) return;
      processCompleted = true;
      clearTimeout(timeout);

      if (code === 0) {
        const emailMatch = stdout.match(/Logged in as ([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

        if (emailMatch) {
          resolve({
            authenticated: true,
            email: emailMatch[1],
            output: stdout,
          });
        } else if (stdout.includes('Logged in')) {
          resolve({
            authenticated: true,
            email: 'Logged in',
            output: stdout,
          });
        } else {
          resolve({
            authenticated: false,
            email: null,
            error: 'Not logged in',
          });
        }
      } else {
        resolve({
          authenticated: false,
          email: null,
          error: stderr || 'Not logged in',
        });
      }
    });

    childProcess.on('error', (err) => {
      if (processCompleted) return;
      processCompleted = true;
      clearTimeout(timeout);

      resolve({
        authenticated: false,
        email: null,
        error: 'Cursor CLI not found or not installed',
      });
    });
  });
}

/**
 * Check Codex CLI authentication status
 */
export async function checkCodexCredentials(): Promise<{
  authenticated: boolean;
  email: string | null;
  error?: string;
}> {
  try {
    const authPath = path.join(os.homedir(), '.codex', 'auth.json');
    const content = await fs.readFile(authPath, 'utf8');
    const auth = JSON.parse(content);

    const tokens = auth.tokens || {};

    if (tokens.id_token || tokens.access_token) {
      let email = 'Authenticated';
      if (tokens.id_token) {
        try {
          const parts = tokens.id_token.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            email = payload.email || payload.user || 'Authenticated';
          }
        } catch {
          email = 'Authenticated';
        }
      }

      return {
        authenticated: true,
        email,
      };
    }

    if (auth.OPENAI_API_KEY) {
      return {
        authenticated: true,
        email: 'API Key Auth',
      };
    }

    return {
      authenticated: false,
      email: null,
      error: 'No valid tokens found',
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        authenticated: false,
        email: null,
        error: 'Codex not configured',
      };
    }
    return {
      authenticated: false,
      email: null,
      error: error.message,
    };
  }
}

/**
 * Check Gemini CLI authentication status
 */
export async function checkGeminiCredentials(): Promise<{
  authenticated: boolean;
  email: string | null;
  error?: string;
}> {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return {
      authenticated: true,
      email: 'API Key Auth',
    };
  }

  try {
    const credsPath = path.join(os.homedir(), '.gemini', 'oauth_creds.json');
    const content = await fs.readFile(credsPath, 'utf8');
    const creds = JSON.parse(content);

    if (creds.access_token) {
      let email = 'OAuth Session';

      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${creds.access_token}`);
        if (tokenRes.ok) {
          const tokenInfo = await tokenRes.json();
          if (tokenInfo.email) {
            email = tokenInfo.email;
          }
        } else if (!creds.refresh_token) {
          return {
            authenticated: false,
            email: null,
            error: 'Access token invalid and no refresh token found',
          };
        } else {
          try {
            const accPath = path.join(os.homedir(), '.gemini', 'google_accounts.json');
            const accContent = await fs.readFile(accPath, 'utf8');
            const accounts = JSON.parse(accContent);
            if (accounts.active) {
              email = accounts.active;
            }
          } catch (e) {}
        }
      } catch (e) {
        try {
          const accPath = path.join(os.homedir(), '.gemini', 'google_accounts.json');
          const accContent = await fs.readFile(accPath, 'utf8');
          const accounts = JSON.parse(accContent);
          if (accounts.active) {
            email = accounts.active;
          }
        } catch (err) {}
      }

      return {
        authenticated: true,
        email,
      };
    }

    return {
      authenticated: false,
      email: null,
      error: 'No valid tokens found in oauth_creds',
    };
  } catch (error: any) {
    return {
      authenticated: false,
      email: null,
      error: 'Gemini CLI not configured',
    };
  }
}
