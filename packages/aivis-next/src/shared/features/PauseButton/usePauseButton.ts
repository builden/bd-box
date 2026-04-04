import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { isFrozenAtom } from './store';
import { freeze, unfreeze } from './freeze-animations';

/**
 * usePauseButton - Manages pause animation state and actions
 */
export function usePauseButton() {
  const [isFrozen, setIsFrozen] = useAtom(isFrozenAtom);

  const handleToggleFreeze = useCallback(() => {
    if (isFrozen) {
      unfreeze();
    } else {
      freeze();
    }
    setIsFrozen(!isFrozen);
  }, [isFrozen, setIsFrozen]);

  return {
    isFrozen,
    handleToggleFreeze,
  };
}
