import { useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { whisperModeAtom, fileTreeViewModeAtom } from '../primitives/modes-atom';
import { VIBE_MODE_ALIASES } from '@/features/quick-settings/biz/constants';
import type { WhisperMode, WhisperOptionValue } from '@/features/quick-settings/types/types';
import type { FileTreeViewMode } from '@/features/file-tree/types/types';

/**
 * Whisper 模式管理 Hook
 */
export function useWhisperMode() {
  const [whisperMode] = useAtom(whisperModeAtom);
  const setWhisperMode = useSetAtom(whisperModeAtom);

  const isOptionSelected = useCallback(
    (value: WhisperOptionValue) => {
      if (value === 'vibe') {
        return VIBE_MODE_ALIASES.includes(whisperMode);
      }
      return whisperMode === value;
    },
    [whisperMode]
  );

  return {
    whisperMode,
    setWhisperMode: useCallback(
      (value: WhisperOptionValue) => {
        setWhisperMode(value as WhisperMode);
      },
      [setWhisperMode]
    ),
    isOptionSelected,
  };
}

/**
 * 文件树视图模式管理 Hook
 */
export function useFileTreeViewMode() {
  const [viewMode] = useAtom(fileTreeViewModeAtom);
  const setViewMode = useSetAtom(fileTreeViewModeAtom);

  const changeViewMode = useCallback(
    (mode: FileTreeViewMode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  return {
    viewMode,
    changeViewMode,
  };
}
