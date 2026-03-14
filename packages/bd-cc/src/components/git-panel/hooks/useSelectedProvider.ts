import { useAtom } from 'jotai';
import { selectedProviderAtom } from '@/store/projects';

/**
 * Git 面板提供商选择 Hook - 使用 atomWithStorage 自动持久化
 */
export function useSelectedProvider() {
  const [provider] = useAtom(selectedProviderAtom);
  return provider;
}
