// Chat 功能模块导出

// Types
export * from './types';

// Biz（纯业务逻辑）
export * from './biz';

// Hooks（功能专用 hooks）
export { useChatComposerState } from './hooks/useChatComposerState';
export { useChatProviderState } from './hooks/useChatProviderState';
export { useChatRealtimeHandlers } from './hooks/useChatRealtimeHandlers';
export { useChatSessionState } from './hooks/useChatSessionState';
export { useFileMentions } from './hooks/useFileMentions';
export { useSlashCommands } from './hooks/useSlashCommands';

// UI 组件（待迁移，目前仍在 components/chat/）
// import { ChatInterface } from '../../components/chat/view/ChatInterface';
