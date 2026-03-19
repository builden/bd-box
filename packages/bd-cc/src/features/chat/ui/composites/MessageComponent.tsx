import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SessionProviderLogo from '../parts/ProviderLogos/SessionProviderLogo';
import type { Project } from '../../../../types/app';
import { ToolRenderer, shouldHideToolResult } from '../parts/tools';
import { Markdown } from './Markdown';
import MessageCopyControl from './MessageCopyControl';
import InteractivePrompt from './InteractivePrompt';
import { getClaudePermissionSuggestion } from '@/features/chat/biz/chatPermissions';
import { formatUsageLimitText } from '@/features/chat/biz/chatFormatting';
import type { ChatMessage, ClaudePermissionSuggestion, PermissionGrantResult, Provider } from '@/features/chat/types';

type DiffLine = {
  type: string;
  content: string;
  lineNum: number;
};

type MessageComponentProps = {
  message: ChatMessage;
  prevMessage: ChatMessage | null;
  messageIndex: number;
  createDiff: (oldStr: string, newStr: string) => DiffLine[];
  onFileOpen?: (filePath: string, diffInfo?: unknown) => void;
  onShowSettings?: () => void;
  onGrantToolPermission?: (suggestion: ClaudePermissionSuggestion) => PermissionGrantResult | null | undefined;
  autoExpandTools?: boolean;
  showRawParameters?: boolean;
  showThinking?: boolean;
  selectedProject?: Project | null;
  provider: Provider | string;
};

type PermissionGrantState = 'idle' | 'granted' | 'error';
const COPY_HIDDEN_TOOL_NAMES = new Set(['Bash', 'Edit', 'Write', 'ApplyPatch']);

const MessageComponent = memo(
  ({
    message,
    prevMessage,
    messageIndex,
    createDiff,
    onFileOpen,
    onShowSettings,
    onGrantToolPermission,
    autoExpandTools,
    showRawParameters,
    showThinking,
    selectedProject,
    provider,
  }: MessageComponentProps) => {
    const { t } = useTranslation('chat');
    const isGrouped =
      prevMessage &&
      prevMessage.type === message.type &&
      (prevMessage.type === 'assistant' ||
        prevMessage.type === 'user' ||
        prevMessage.type === 'tool' ||
        prevMessage.type === 'error');
    const messageRef = useRef<HTMLDivElement | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const permissionSuggestion = getClaudePermissionSuggestion(message, provider);
    const [permissionGrantState, setPermissionGrantState] = useState<PermissionGrantState>('idle');
    const userCopyContent = String(message.content || '');
    const formattedMessageContent = useMemo(
      () => formatUsageLimitText(String(message.content || '')),
      [message.content]
    );
    const assistantCopyContent = message.isToolUse
      ? String(message.displayText || message.content || '')
      : formattedMessageContent;
    const isCommandOrFileEditToolResponse = Boolean(
      message.isToolUse && COPY_HIDDEN_TOOL_NAMES.has(String(message.toolName || ''))
    );
    const shouldShowUserCopyControl = message.type === 'user' && userCopyContent.trim().length > 0;
    const shouldShowAssistantCopyControl =
      message.type === 'assistant' && assistantCopyContent.trim().length > 0 && !isCommandOrFileEditToolResponse;

    useEffect(() => {
      setPermissionGrantState('idle');
    }, [permissionSuggestion?.entry, message.toolId]);

    useEffect(() => {
      const node = messageRef.current;
      if (!autoExpandTools || !node || !message.isToolUse) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isExpanded) {
              setIsExpanded(true);
              const details = node.querySelectorAll<HTMLDetailsElement>('details');
              details.forEach((detail) => {
                detail.open = true;
              });
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(node);

      return () => {
        observer.unobserve(node);
      };
    }, [autoExpandTools, isExpanded, message.isToolUse]);

    const formattedTime = useMemo(() => new Date(message.timestamp).toLocaleTimeString(), [message.timestamp]);
    // Hide thinking messages only if:
    // 1. showThinking is false AND
    // 2. The message is NOT marked as hidden (isHidden)
    // This allows hidden thinking messages to be shown when "show hidden messages" is enabled
    const shouldHideThinkingMessage = Boolean(message.isThinking && !showThinking && !message.isHidden);

    if (shouldHideThinkingMessage) {
      return null;
    }

    return (
      <div
        ref={messageRef}
        data-message-timestamp={message.timestamp || undefined}
        className={`chat-message ${message.type} ${isGrouped ? 'grouped' : ''} ${message.type === 'user' ? 'flex justify-end px-3 sm:px-0' : 'px-3 sm:px-0'} ${message.isHidden ? 'rounded-lg bg-gray-100/60 dark:bg-gray-800/40' : ''}`}
      >
        {message.type === 'user' ? (
          /* User message bubble on the right */
          <div className="flex w-full items-end space-x-0 sm:w-auto sm:max-w-[85%] sm:space-x-3 md:max-w-md lg:max-w-lg xl:max-w-xl">
            <div className="group flex-1 rounded-2xl rounded-br-md bg-blue-600 px-3 py-2 text-white shadow-sm sm:flex-initial sm:px-4">
              <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
              {message.images && message.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {message.images.map((img, idx) => (
                    <img
                      key={img.name || idx}
                      src={img.data}
                      alt={img.name}
                      className="h-auto max-w-full cursor-pointer rounded-lg transition-opacity hover:opacity-90"
                      onClick={() => window.open(img.data, '_blank')}
                    />
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center justify-end gap-2 text-xs text-blue-100">
                {shouldShowUserCopyControl && <MessageCopyControl content={userCopyContent} messageType="user" />}
                <span className="text-blue-200">#{messageIndex + 1}</span>
                <span>{formattedTime}</span>
              </div>
            </div>
            {!isGrouped && (
              <div className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm text-white sm:flex">
                U
              </div>
            )}
          </div>
        ) : message.isTaskNotification ? (
          /* Compact task notification on the left */
          <div className="w-full">
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${message.taskStatus === 'completed' ? 'bg-green-400 dark:bg-green-500' : 'bg-amber-400 dark:bg-amber-500'}`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{message.content}</span>
            </div>
          </div>
        ) : (
          /* Claude/Error/Tool messages on the left */
          <div className="w-full">
            {!isGrouped && (
              <div className="mb-2 flex items-center space-x-3">
                {message.type === 'error' ? (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-sm text-white">
                    !
                  </div>
                ) : message.type === 'tool' ? (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-600 text-sm text-white dark:bg-gray-700">
                    🔧
                  </div>
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full p-1 text-sm text-white">
                    <SessionProviderLogo provider={provider} className="h-full w-full" />
                  </div>
                )}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {message.type === 'error'
                    ? t('messageTypes.error')
                    : message.type === 'tool'
                      ? t('messageTypes.tool')
                      : provider === 'cursor'
                        ? t('messageTypes.cursor')
                        : provider === 'codex'
                          ? t('messageTypes.codex')
                          : provider === 'gemini'
                            ? t('messageTypes.gemini')
                            : t('messageTypes.claude')}
                </div>
              </div>
            )}

            <div className="w-full">
              {message.isToolUse ? (
                <>
                  <div className="flex flex-col">
                    <div className="flex flex-col">
                      <Markdown className="prose prose-sm max-w-none dark:prose-invert">
                        {String(message.displayText || '')}
                      </Markdown>
                    </div>
                  </div>

                  {message.toolInput && (
                    <ToolRenderer
                      toolName={message.toolName || 'UnknownTool'}
                      toolInput={message.toolInput}
                      toolResult={message.toolResult}
                      toolId={message.toolId}
                      mode="input"
                      onFileOpen={onFileOpen}
                      createDiff={createDiff}
                      selectedProject={selectedProject}
                      autoExpandTools={autoExpandTools}
                      showRawParameters={showRawParameters}
                      rawToolInput={typeof message.toolInput === 'string' ? message.toolInput : undefined}
                      isSubagentContainer={message.isSubagentContainer}
                      subagentState={message.subagentState}
                    />
                  )}

                  {/* Tool Result Section */}
                  {message.toolResult &&
                    !shouldHideToolResult(message.toolName || 'UnknownTool', message.toolResult) &&
                    (message.toolResult.isError ? (
                      // Error results - red error box with content
                      <div
                        id={`tool-result-${message.toolId}`}
                        className="relative mt-2 scroll-mt-4 rounded border border-red-200/60 bg-red-50/50 p-3 dark:border-red-800/40 dark:bg-red-950/10"
                      >
                        <div className="relative mb-2 flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 text-red-500 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="text-xs font-medium text-red-700 dark:text-red-300">
                            {t('messageTypes.error')}
                          </span>
                        </div>
                        <div className="relative text-sm text-red-900 dark:text-red-100">
                          <Markdown className="prose prose-sm prose-red max-w-none dark:prose-invert">
                            {String(message.toolResult.content || '')}
                          </Markdown>
                          {permissionSuggestion && (
                            <div className="mt-4 border-t border-red-200/60 pt-3 dark:border-red-800/60">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!onGrantToolPermission) return;
                                    const result = onGrantToolPermission(permissionSuggestion);
                                    if (result?.success) {
                                      setPermissionGrantState('granted');
                                    } else {
                                      setPermissionGrantState('error');
                                    }
                                  }}
                                  disabled={permissionSuggestion.isAllowed || permissionGrantState === 'granted'}
                                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    permissionSuggestion.isAllowed || permissionGrantState === 'granted'
                                      ? 'cursor-default border-green-300/70 bg-green-100 text-green-800 dark:border-green-800/60 dark:bg-green-900/30 dark:text-green-200'
                                      : 'border-red-300/70 bg-white/80 text-red-700 hover:bg-white dark:border-red-800/60 dark:bg-gray-900/40 dark:text-red-200 dark:hover:bg-gray-900/70'
                                  }`}
                                >
                                  {permissionSuggestion.isAllowed || permissionGrantState === 'granted'
                                    ? t('permissions.added')
                                    : t('permissions.grant', { tool: permissionSuggestion.toolName })}
                                </button>
                                {onShowSettings && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onShowSettings();
                                    }}
                                    className="text-xs text-red-700 underline hover:text-red-800 dark:text-red-200 dark:hover:text-red-100"
                                  >
                                    {t('permissions.openSettings')}
                                  </button>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-red-700/90 dark:text-red-200/80">
                                {t('permissions.addTo', { entry: permissionSuggestion.entry })}
                              </div>
                              {permissionGrantState === 'error' && (
                                <div className="mt-2 text-xs text-red-700 dark:text-red-200">
                                  {t('permissions.error')}
                                </div>
                              )}
                              {(permissionSuggestion.isAllowed || permissionGrantState === 'granted') && (
                                <div className="mt-2 text-xs text-green-700 dark:text-green-200">
                                  {t('permissions.retry')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Non-error results - route through ToolRenderer (single source of truth)
                      <div id={`tool-result-${message.toolId}`} className="scroll-mt-4">
                        <ToolRenderer
                          toolName={message.toolName || 'UnknownTool'}
                          toolInput={message.toolInput}
                          toolResult={message.toolResult}
                          toolId={message.toolId}
                          mode="result"
                          onFileOpen={onFileOpen}
                          createDiff={createDiff}
                          selectedProject={selectedProject}
                          autoExpandTools={autoExpandTools}
                        />
                      </div>
                    ))}
                </>
              ) : message.isInteractivePrompt ? (
                <InteractivePrompt content={message.content || ''} />
              ) : message.isThinking ? (
                /* Thinking messages - collapsible by default */
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center gap-2 font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      <svg
                        className="h-3 w-3 transition-transform group-open:rotate-90"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span>{t('thinking.emoji')}</span>
                    </summary>
                    <div className="mt-2 border-l-2 border-gray-300 pl-4 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-400">
                      <Markdown className="prose prose-sm prose-gray max-w-none dark:prose-invert">
                        {message.content}
                      </Markdown>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {/* Thinking accordion for reasoning */}
                  {showThinking && message.reasoning && (
                    <details className="mb-3">
                      <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                        {t('thinking.emoji')}
                      </summary>
                      <div className="mt-2 border-l-2 border-gray-300 pl-4 text-sm italic text-gray-600 dark:border-gray-600 dark:text-gray-400">
                        <div className="whitespace-pre-wrap">{message.reasoning}</div>
                      </div>
                    </details>
                  )}

                  {(() => {
                    const content = formattedMessageContent;

                    // Detect if content is pure JSON (starts with { or [)
                    const trimmedContent = content.trim();
                    if (
                      (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) &&
                      (trimmedContent.endsWith('}') || trimmedContent.endsWith(']'))
                    ) {
                      try {
                        const parsed = JSON.parse(trimmedContent);
                        const formatted = JSON.stringify(parsed, null, 2);

                        return (
                          <div className="my-2">
                            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="font-medium">{t('json.response')}</span>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-gray-600/30 bg-gray-800 dark:border-gray-700 dark:bg-gray-900">
                              <pre className="overflow-x-auto p-4">
                                <code className="block whitespace-pre font-mono text-sm text-gray-100 dark:text-gray-200">
                                  {formatted}
                                </code>
                              </pre>
                            </div>
                          </div>
                        );
                      } catch {
                        // Not valid JSON, fall through to normal rendering
                      }
                    }

                    // Normal rendering for non-JSON content
                    return message.type === 'assistant' ? (
                      <Markdown className="prose prose-sm prose-gray max-w-none dark:prose-invert">{content}</Markdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{content}</div>
                    );
                  })()}
                </div>
              )}

              {(shouldShowAssistantCopyControl || !isGrouped) && (
                <div className="mt-1 flex w-full items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                  {shouldShowAssistantCopyControl && (
                    <MessageCopyControl content={assistantCopyContent} messageType="assistant" />
                  )}
                  {!isGrouped && (
                    <>
                      <span className="text-gray-500">#{messageIndex + 1}</span>
                      <span>{formattedTime}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default MessageComponent;
