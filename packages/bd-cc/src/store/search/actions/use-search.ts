import { useAtom } from 'jotai';
import { sidebarSearchAtoms, fileTreeSearchAtoms } from '../primitives/search-atom';

/**
 * 侧边栏搜索 Hook - 使用 atomWithDebounce 自动防抖
 */
export function useSidebarSearch() {
  const [currentValue, setCurrentValue] = useAtom(sidebarSearchAtoms.currentValueAtom);
  const [debouncedValue] = useAtom(sidebarSearchAtoms.debouncedValueAtom);

  return {
    searchQuery: currentValue,
    setSearchQuery: setCurrentValue,
    debouncedSearchQuery: debouncedValue,
  };
}

/**
 * 文件树搜索 Hook - 使用 atomWithDebounce 自动防抖
 */
export function useFileTreeSearch() {
  const [currentValue, setCurrentValue] = useAtom(fileTreeSearchAtoms.currentValueAtom);
  const [debouncedValue] = useAtom(fileTreeSearchAtoms.debouncedValueAtom);

  return {
    searchQuery: currentValue,
    setSearchQuery: setCurrentValue,
    debouncedSearchQuery: debouncedValue,
  };
}
