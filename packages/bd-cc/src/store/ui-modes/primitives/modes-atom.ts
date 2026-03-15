import { atomWithStorage } from 'jotai/utils';
import { STORAGE_KEYS } from '../../constants';
import type { WhisperMode } from '@/components/quick-settings-panel/types';
import type { FileTreeViewMode } from '@/features/file-tree/types/types';

/**
 * Whisper 模式 atom - 使用 atomWithStorage 自动持久化
 */
export const whisperModeAtom = atomWithStorage<WhisperMode>(STORAGE_KEYS.WHISPER_MODE, 'default');

/**
 * 文件树视图模式 atom - 使用 atomWithStorage 自动持久化
 */
export const fileTreeViewModeAtom = atomWithStorage<FileTreeViewMode>(STORAGE_KEYS.FILE_TREE_VIEW_MODE, 'detailed');
