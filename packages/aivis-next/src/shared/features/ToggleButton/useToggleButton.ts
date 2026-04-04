import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { isActiveAtom } from './store';

/**
 * useToggleButton - Manages toolbar expand/collapse state
 */
export function useToggleButton(handleClick: () => boolean) {
  const [isActive, setIsActive] = useAtom(isActiveAtom);

  const handleToggle = useCallback(() => {
    if (!handleClick()) return;
    setIsActive(!isActive);
  }, [handleClick, isActive, setIsActive]);

  return {
    isActive,
    handleToggle,
  };
}
