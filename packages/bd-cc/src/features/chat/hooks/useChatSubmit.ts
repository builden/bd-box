import { useCallback } from 'react';
import type { FormEvent, MouseEvent, TouchEvent, KeyboardEvent } from 'react';
import { safeLocalStorage } from '../biz/chatStorage';
import { thinkingModes } from '../biz/thinkingModes';
import { isTemporarySessionId } from '../biz/sessionId';
import type { ChatMessage, ChatImage } from '../types';
import { authenticatedFetch } from '@/utils/api';
import type { Project, ProjectSession, SessionProvider, PermissionMode } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useChatSubmit');

interface PendingViewSession {
  sessionId: string | null;
  startedAt: number;
}

interface UseChatSubmitOptions {
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  currentSessionId: string | null;
  provider: SessionProvider;
  permissionMode: PermissionMode | string;
  cursorModel: string;
  claudeModel: string;
  codexModel: string;
  geminiModel: string;
  isLoading: boolean;
  canAbortSession: boolean;
  tokenBudget: Record<string, unknown> | null;
  inputValueRef: React.MutableRefObject<string>;
  attachedImages: File[];
  slashCommands: any[];
  thinkingMode: string;
  pendingViewSessionRef: { current: PendingViewSession | null };
  scrollToBottom: () => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setSessionMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  setIsLoading: (loading: boolean) => void;
  setCanAbortSession: (canAbort: boolean) => void;
  setClaudeStatus: (status: { text: string; tokens: number; can_interrupt: boolean } | null) => void;
  setIsUserScrolledUp: (isScrolledUp: boolean) => void;
  setInput: (value: string) => void;
  setAttachedImages: React.Dispatch<React.SetStateAction<File[]>>;
  setUploadingImages: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  setImageErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  setIsTextareaExpanded: (expanded: boolean) => void;
  setThinkingMode: (mode: string) => void;
  onSessionActive?: (sessionId?: string | null) => void;
  onSessionProcessing?: (sessionId?: string | null) => void;
  resetCommandMenuState: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  sendMessage: (message: unknown) => void;
  getToolsSettings: () => {
    allowedTools: string[];
    disallowedTools: string[];
    skipPermissions: boolean;
  };
}

interface UseChatSubmitResult {
  handleSubmit: (
    event: FormEvent<HTMLFormElement> | MouseEvent | TouchEvent | KeyboardEvent<HTMLTextAreaElement>
  ) => Promise<void>;
  handleAbortSession: () => void;
}

export function useChatSubmit({
  selectedProject,
  selectedSession,
  currentSessionId,
  provider,
  permissionMode,
  cursorModel,
  claudeModel,
  codexModel,
  geminiModel,
  isLoading,
  tokenBudget,
  inputValueRef,
  attachedImages,
  slashCommands,
  thinkingMode,
  pendingViewSessionRef,
  scrollToBottom,
  setChatMessages,
  setSessionMessages,
  setIsLoading,
  setCanAbortSession,
  setClaudeStatus,
  setIsUserScrolledUp,
  setInput,
  setAttachedImages,
  setUploadingImages,
  setImageErrors,
  setIsTextareaExpanded,
  setThinkingMode,
  onSessionActive,
  onSessionProcessing,
  resetCommandMenuState,
  textareaRef,
  sendMessage,
  getToolsSettings,
}: UseChatSubmitOptions): UseChatSubmitResult {
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement> | MouseEvent | TouchEvent | KeyboardEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      const currentInput = inputValueRef.current;
      if (!currentInput.trim() || isLoading || !selectedProject) {
        return;
      }

      // Intercept slash commands: if input starts with /commandName, execute as command with args
      const trimmedInput = currentInput.trim();
      if (trimmedInput.startsWith('/')) {
        const firstSpace = trimmedInput.indexOf(' ');
        const commandName = firstSpace > 0 ? trimmedInput.slice(0, firstSpace) : trimmedInput;
        const matchedCommand = slashCommands.find((cmd: any) => cmd.name === commandName);
        if (matchedCommand) {
          window.dispatchEvent(
            new CustomEvent('chat-command-execute', {
              detail: { command: matchedCommand, input: trimmedInput },
            })
          );
          setInput('');
          inputValueRef.current = '';
          setAttachedImages([]);
          setUploadingImages(new Map());
          setImageErrors(new Map());
          resetCommandMenuState();
          setIsTextareaExpanded(false);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
          return;
        }
      }

      let messageContent = currentInput;
      const selectedThinkingMode = thinkingModes.find(
        (mode: { id: string; prefix?: string }) => mode.id === thinkingMode
      );
      if (selectedThinkingMode && selectedThinkingMode.prefix) {
        messageContent = `${selectedThinkingMode.prefix}: ${currentInput}`;
      }

      let uploadedImages: unknown[] = [];
      if (attachedImages.length > 0) {
        const formData = new FormData();
        attachedImages.forEach((file) => {
          formData.append('images', file);
        });

        try {
          const response = await authenticatedFetch(`/api/projects/${selectedProject.name}/upload-images`, {
            method: 'POST',
            headers: {},
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload images');
          }

          const result = await response.json();
          uploadedImages = (result.images || []) as string[];
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Image upload failed', error);
          setChatMessages((previous) => [
            ...previous,
            {
              type: 'error',
              content: `Failed to upload images: ${message}`,
              timestamp: new Date(),
            },
          ]);
          return;
        }
      }

      // 将字符串数组转换为 ChatImage[] 格式
      const chatImages: ChatImage[] = (uploadedImages as string[]).map((data, index) => ({
        data,
        name: `image-${index}`,
      }));

      const userMessage: ChatMessage = {
        type: 'user',
        content: currentInput,
        images: chatImages,
        timestamp: new Date(),
      };

      setChatMessages((previous) => [...previous, userMessage]);
      setIsLoading(true);
      setCanAbortSession(true);
      setClaudeStatus({
        text: 'Processing',
        tokens: 0,
        can_interrupt: true,
      });

      setIsUserScrolledUp(false);
      setTimeout(() => scrollToBottom(), 100);

      const effectiveSessionId = currentSessionId || selectedSession?.id || sessionStorage.getItem('cursorSessionId');
      const sessionToActivate = effectiveSessionId || `new-session-${Date.now()}`;

      if (!effectiveSessionId && !selectedSession?.id) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingSessionId');
        }
        pendingViewSessionRef.current = { sessionId: null, startedAt: Date.now() };
      }
      onSessionActive?.(sessionToActivate);
      if (effectiveSessionId && !isTemporarySessionId(effectiveSessionId)) {
        onSessionProcessing?.(effectiveSessionId);
      }

      const toolsSettings = getToolsSettings();
      const resolvedProjectPath = selectedProject.fullPath || selectedProject.path || '';

      if (provider === 'cursor') {
        sendMessage({
          type: 'cursor-command',
          command: messageContent,
          sessionId: effectiveSessionId,
          options: {
            cwd: resolvedProjectPath,
            projectPath: resolvedProjectPath,
            sessionId: effectiveSessionId,
            resume: Boolean(effectiveSessionId),
            model: cursorModel,
            skipPermissions: toolsSettings?.skipPermissions || false,
            toolsSettings,
          },
        });
      } else if (provider === 'codex') {
        sendMessage({
          type: 'codex-command',
          command: messageContent,
          sessionId: effectiveSessionId,
          options: {
            cwd: resolvedProjectPath,
            projectPath: resolvedProjectPath,
            sessionId: effectiveSessionId,
            resume: Boolean(effectiveSessionId),
            model: codexModel,
            permissionMode: permissionMode === 'plan' ? 'default' : permissionMode,
          },
        });
      } else if (provider === 'gemini') {
        sendMessage({
          type: 'gemini-command',
          command: messageContent,
          sessionId: effectiveSessionId,
          options: {
            cwd: resolvedProjectPath,
            projectPath: resolvedProjectPath,
            sessionId: effectiveSessionId,
            resume: Boolean(effectiveSessionId),
            model: geminiModel,
            permissionMode,
            toolsSettings,
          },
        });
      } else {
        sendMessage({
          type: 'claude-command',
          command: messageContent,
          options: {
            projectPath: resolvedProjectPath,
            cwd: resolvedProjectPath,
            sessionId: effectiveSessionId,
            resume: Boolean(effectiveSessionId),
            toolsSettings,
            permissionMode,
            model: claudeModel,
            images: uploadedImages,
          },
        });
      }

      setInput('');
      inputValueRef.current = '';
      resetCommandMenuState();
      setAttachedImages([]);
      setUploadingImages(new Map());
      setImageErrors(new Map());
      setIsTextareaExpanded(false);
      setThinkingMode('none');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      safeLocalStorage.removeItem(`draft_input_${selectedProject.name}`);
    },
    [
      attachedImages,
      claudeModel,
      codexModel,
      currentSessionId,
      cursorModel,
      geminiModel,
      isLoading,
      onSessionActive,
      onSessionProcessing,
      pendingViewSessionRef,
      permissionMode,
      provider,
      resetCommandMenuState,
      scrollToBottom,
      selectedProject,
      selectedSession?.id,
      sendMessage,
      setCanAbortSession,
      setChatMessages,
      setClaudeStatus,
      setIsLoading,
      setIsUserScrolledUp,
      slashCommands,
      thinkingMode,
      textareaRef,
      inputValueRef,
      getToolsSettings,
      setInput,
      setAttachedImages,
      setUploadingImages,
      setImageErrors,
      setIsTextareaExpanded,
      setThinkingMode,
    ]
  );

  const handleAbortSession = useCallback(() => {
    if (!isLoading) {
      return;
    }

    const pendingSessionId = typeof window !== 'undefined' ? sessionStorage.getItem('pendingSessionId') : null;
    const cursorSessionId = typeof window !== 'undefined' ? sessionStorage.getItem('cursorSessionId') : null;

    const candidateSessionIds = [
      currentSessionId,
      pendingViewSessionRef.current?.sessionId || null,
      pendingSessionId,
      provider === 'cursor' ? cursorSessionId : null,
      selectedSession?.id || null,
    ];

    const targetSessionId =
      candidateSessionIds.find((sessionId) => Boolean(sessionId) && !isTemporarySessionId(sessionId)) || null;

    if (!targetSessionId) {
      logger.warn('Abort requested but no concrete session ID is available yet');
      return;
    }

    sendMessage({
      type: 'abort-session',
      sessionId: targetSessionId,
      provider,
    });
  }, [isLoading, currentSessionId, pendingViewSessionRef, provider, selectedSession?.id, sendMessage]);

  return {
    handleSubmit,
    handleAbortSession,
  };
}
