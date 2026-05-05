import { useAtom } from 'jotai';
import { isLayoutModeAtom, isRearrangeModeAtom } from './store';
import { DesignOverlay } from './ui/DesignOverlay';
import { RearrangeOverlay } from './ui/RearrangeOverlay';

/**
 * LayoutMode - 布局模式主入口
 * 根据当前模式渲染对应的浮层
 */
export function LayoutMode() {
  const [isLayoutMode] = useAtom(isLayoutModeAtom);
  const [isRearrangeMode] = useAtom(isRearrangeModeAtom);

  if (!isLayoutMode) return null;

  // 根据子模式渲染不同的 Overlay
  if (isRearrangeMode) {
    return <RearrangeOverlay />;
  }

  return <DesignOverlay />;
}

export {
  isLayoutModeAtom,
  isRearrangeModeAtom,
  isRulerModeAtom,
  designPlacementsAtom,
  activeDesignComponentAtom,
} from './store';
export { LayoutButton } from './LayoutButton';
export { ComponentPanel } from './ui/ComponentPanel';
export { RulerOverlay } from './ui/RulerOverlay';
export type { DesignPlacement, ComponentType, DetectedSection, SectionRect, SpatialContext } from './types';
