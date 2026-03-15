/**
 * AI Provider Interface Definitions
 *
 * This module defines the abstract interface that all AI providers
 * (Claude, Cursor, Codex, Gemini) must implement.
 */

export interface ChatOptions {
  projectPath: string;
  sessionId?: string;
  model?: string;
  resume?: boolean;
  initialCommand?: string;
  cwd?: string;
  images?: Array<{ data: string }>;
  toolsSettings?: {
    allowedTools: string[];
    disallowedTools: string[];
    skipPermissions: boolean;
  };
  permissionMode?: string;
}

export interface ProviderCapability {
  supportsStreaming: boolean;
  supportsPermissions: boolean;
  supportsResume: boolean;
}

export interface StreamEvent {
  type: string;
  [key: string]: unknown;
}

export interface IStreamWriter {
  send(event: StreamEvent): void;
}

export interface IAiProvider {
  readonly name: string;
  readonly capabilities: ProviderCapability;

  chat(command: string, options: ChatOptions, writer: IStreamWriter): Promise<void>;
  abort(sessionId: string): boolean;
  isActive(sessionId: string): boolean;
  getActiveSessions(): string[];
}

export type ProviderType = 'claude' | 'cursor' | 'codex' | 'gemini';
