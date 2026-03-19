import { useCallback } from 'react';
import type { ChatMessage } from '../types';
import { escapeRegExp } from '../biz/chatFormatting';
import type { SlashCommand } from './useSlashCommands';
import { authenticatedFetch } from '@/utils/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useChatCommands');

interface CommandExecutionResult {
  type: 'builtin' | 'custom';
  action?: string;
  data?: Record<string, unknown>;
  content?: string;
  hasBashCommands?: boolean;
  hasFileIncludes?: boolean;
}

interface UseChatCommandsOptions {
  selectedProject: { fullPath?: string; path?: string; name: string } | null;
  currentSessionId: string | null;
  provider: string;
  cursorModel: string;
  claudeModel: string;
  codexModel: string;
  geminiModel: string;
  tokenBudget: Record<string, unknown> | null;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setSessionMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  onFileOpen?: (filePath: string, diffInfo?: unknown) => void;
  onShowSettings?: () => void;
}

interface UseChatCommandsResult {
  executeCommand: (command: SlashCommand, rawInput?: string) => Promise<void>;
  handleBuiltInCommand: (result: CommandExecutionResult) => void;
  handleCustomCommand: (result: CommandExecutionResult) => Promise<void>;
}

export function useChatCommands({
  selectedProject,
  currentSessionId,
  provider,
  cursorModel,
  claudeModel,
  codexModel,
  geminiModel,
  tokenBudget,
  setChatMessages,
  setSessionMessages,
  onFileOpen,
  onShowSettings,
}: UseChatCommandsOptions): UseChatCommandsResult {
  const handleBuiltInCommand = useCallback(
    (result: CommandExecutionResult) => {
      const { action, data } = result;
      if (!data) {
        logger.warn('handleBuiltInCommand received no data', { action });
        return;
      }
      switch (action) {
        case 'clear':
          setChatMessages([]);
          setSessionMessages?.([]);
          break;

        case 'help':
          setChatMessages((previous) => [
            ...previous,
            {
              type: 'assistant',
              content: String(data.content ?? ''),
              timestamp: Date.now(),
            },
          ]);
          break;

        case 'model': {
          const modelData = data as {
            current?: { model?: string };
            available?: { claude?: string[]; cursor?: string[] };
          };
          setChatMessages((previous) => [
            ...previous,
            {
              type: 'assistant',
              content: `**Current Model**: ${modelData.current?.model ?? 'unknown'}\n\n**Available Models**:\n\nClaude: ${modelData.available?.claude?.join(', ') ?? 'none'}\n\nCursor: ${modelData.available?.cursor?.join(', ') ?? 'none'}`,
              timestamp: Date.now(),
            },
          ]);
          break;
        }

        case 'cost': {
          const costData = data as {
            tokenUsage?: { used?: number; total?: number; percentage?: number };
            cost?: { input?: number; output?: number; total?: number };
            model?: string;
          };
          const costMessage = `**Token Usage**: ${costData.tokenUsage?.used?.toLocaleString() ?? 0} / ${costData.tokenUsage?.total?.toLocaleString() ?? 0} (${costData.tokenUsage?.percentage ?? 0}%)\n\n**Estimated Cost**:\n- Input: $${costData.cost?.input ?? 0}\n- Output: $${costData.cost?.output ?? 0}\n- **Total**: $${costData.cost?.total ?? 0}\n\n**Model**: ${costData.model ?? 'unknown'}`;
          setChatMessages((previous) => [
            ...previous,
            { type: 'assistant', content: costMessage, timestamp: Date.now() },
          ]);
          break;
        }

        case 'status': {
          const statusData = data as {
            version?: string;
            uptime?: string;
            model?: string;
            provider?: string;
            nodeVersion?: string;
            platform?: string;
          };
          const statusMessage = `**System Status**\n\n- Version: ${statusData.version ?? 'unknown'}\n- Uptime: ${statusData.uptime ?? 'unknown'}\n- Model: ${statusData.model ?? 'unknown'}\n- Provider: ${statusData.provider ?? 'unknown'}\n- Node.js: ${statusData.nodeVersion ?? 'unknown'}\n- Platform: ${statusData.platform ?? 'unknown'}`;
          setChatMessages((previous) => [
            ...previous,
            { type: 'assistant', content: statusMessage, timestamp: Date.now() },
          ]);
          break;
        }

        case 'memory': {
          const memoryData = data as { error?: boolean; message?: string; path?: string; exists?: boolean };
          if (memoryData.error) {
            setChatMessages((previous) => [
              ...previous,
              {
                type: 'assistant',
                content: `⚠️ ${memoryData.message ?? 'Unknown error'}`,
                timestamp: Date.now(),
              },
            ]);
          } else {
            setChatMessages((previous) => [
              ...previous,
              {
                type: 'assistant',
                content: `📝 ${memoryData.message ?? 'Done'}\n\nPath: \`${memoryData.path ?? ''}\``,
                timestamp: Date.now(),
              },
            ]);
            if (memoryData.exists && onFileOpen && memoryData.path) {
              onFileOpen(memoryData.path);
            }
          }
          break;
        }

        case 'config':
          onShowSettings?.();
          break;

        case 'rewind': {
          const rewindData = data as { error?: boolean; message?: string; steps?: number };
          if (rewindData.error) {
            setChatMessages((previous) => [
              ...previous,
              {
                type: 'assistant',
                content: `⚠️ ${rewindData.message ?? 'Unknown error'}`,
                timestamp: Date.now(),
              },
            ]);
          } else {
            setChatMessages((previous) => previous.slice(0, -((rewindData.steps ?? 1) * 2)));
            setChatMessages((previous) => [
              ...previous,
              {
                type: 'assistant',
                content: `⏪ ${rewindData.message ?? 'Rewound'}`,
                timestamp: Date.now(),
              },
            ]);
          }
          break;
        }

        default:
          logger.warn('Unknown built-in command action', { action });
      }
    },
    [onFileOpen, onShowSettings, setChatMessages, setSessionMessages]
  );

  const handleCustomCommand = useCallback(
    async (result: CommandExecutionResult) => {
      const { content, hasBashCommands } = result;

      if (hasBashCommands) {
        const confirmed = window.confirm(
          'This command contains bash commands that will be executed. Do you want to proceed?'
        );
        if (!confirmed) {
          setChatMessages((previous) => [
            ...previous,
            {
              type: 'assistant',
              content: '❌ Command execution cancelled',
              timestamp: Date.now(),
            },
          ]);
          return;
        }
      }

      const commandContent = content || '';

      // Defer submit to next tick so the command text is reflected in UI before dispatching.
      setTimeout(() => {
        const fakeEvent = new Event('fake-submit') as any;
        fakeEvent.preventDefault = () => {};
        window.dispatchEvent(new CustomEvent('chat-command-submit', { detail: { input: commandContent } }));
      }, 0);
    },
    [setChatMessages]
  );

  const executeCommand = useCallback(
    async (command: SlashCommand, rawInput?: string) => {
      if (!command || !selectedProject) {
        return;
      }

      try {
        const effectiveInput = rawInput ?? '';
        const commandMatch = effectiveInput.match(new RegExp(`${escapeRegExp(command.name)}\\s*(.*)`));
        const args = commandMatch && commandMatch[1] ? commandMatch[1].trim().split(/\s+/) : [];

        const context = {
          projectPath: selectedProject.fullPath || selectedProject.path,
          projectName: selectedProject.name,
          sessionId: currentSessionId,
          provider,
          model:
            provider === 'cursor'
              ? cursorModel
              : provider === 'codex'
                ? codexModel
                : provider === 'gemini'
                  ? geminiModel
                  : claudeModel,
          tokenUsage: tokenBudget,
        };

        const response = await authenticatedFetch('/api/commands/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commandName: command.name,
            commandPath: command.path,
            args,
            context,
          }),
        });

        if (!response.ok) {
          let errorMessage = `Failed to execute command (${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorData?.error || errorMessage;
          } catch {
            // Ignore JSON parse failures and use fallback message.
          }
          throw new Error(errorMessage);
        }

        const result = (await response.json()) as CommandExecutionResult;
        if (result.type === 'builtin') {
          handleBuiltInCommand(result);
        } else if (result.type === 'custom') {
          await handleCustomCommand(result);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error executing command', error);
        setChatMessages((previous) => [
          ...previous,
          {
            type: 'assistant',
            content: `Error executing command: ${message}`,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [
      claudeModel,
      codexModel,
      currentSessionId,
      cursorModel,
      geminiModel,
      handleBuiltInCommand,
      handleCustomCommand,
      provider,
      selectedProject,
      setChatMessages,
      tokenBudget,
    ]
  );

  return {
    executeCommand,
    handleBuiltInCommand,
    handleCustomCommand,
  };
}
