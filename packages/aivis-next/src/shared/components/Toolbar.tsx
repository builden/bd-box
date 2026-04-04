import { useRef, useMemo, useCallback } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import {
  IconPausePlayAnimated,
  IconLayout,
  IconEdit,
  IconChatEllipsis,
  IconEyeAnimated,
  IconCopyAnimated,
  IconSendArrow,
  IconTrashAlt,
  IconGear,
  IconXmarkLarge,
} from './Icons';
import { isActiveAtom, isDraggingToolbarAtom, isCollapsingAtom } from '../store/toolbarAtoms';
import { useDragPosition, useDragEvents } from '../hooks';
import { ToolbarButton } from './ToolbarButton';
import { TOOLBAR_WIDTH, DRAG_CONFIG } from '../hooks/types';

const BUTTON_GAP = 'gap-1.5'; // 6px = 0.375rem

export function Toolbar() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [, setIsActive] = useAtom(isActiveAtom);
  const [isDragging] = useAtom(isDraggingToolbarAtom);
  const [isCollapsing, setIsCollapsing] = useAtom(isCollapsingAtom);

  const { toolbarPosition, setToolbarPosition } = useDragPosition();
  const { handleMouseDown } = useDragEvents(outerRef, setToolbarPosition, {
    width: TOOLBAR_WIDTH,
    height: DRAG_CONFIG.SIZE,
  });

  const handleClose = useCallback(() => {
    setIsCollapsing(true);
  }, [setIsCollapsing]);

  const handleAnimationEnd = useCallback(() => {
    if (isCollapsing) {
      setIsCollapsing(false);
      setIsActive(false);
    }
  }, [isCollapsing, setIsCollapsing, setIsActive]);

  const outerStyle = useMemo(() => {
    if (toolbarPosition) {
      // toolbarPosition 是 bottom-right
      // Toolbar 右边界对齐 bottom-right，left = x - width
      return {
        left: toolbarPosition.x - TOOLBAR_WIDTH,
        top: toolbarPosition.y - DRAG_CONFIG.SIZE,
      };
    }
    return {
      left: -9999,
      top: -9999,
    };
  }, [toolbarPosition]);

  return (
    <div
      ref={outerRef}
      className={clsx(
        'fixed h-[44px]',
        'cursor-grab select-none',
        'focus:outline-none',
        isDragging && 'cursor-grabbing',
        'z-[100000]'
      )}
      style={{ ...outerStyle, width: TOOLBAR_WIDTH }}
      onMouseDown={handleMouseDown}
    >
      {/* Toolbar 容器 - 从右向左展开/收缩 */}
      <div
        className={clsx(
          'w-full h-full',
          'flex items-center',
          'rounded-full',
          'bg-neutral-900',
          'shadow-[0_4px_12px_rgba(0,0,0,0.25),0_8px_24px_rgba(0,0,0,0.15)]',
          isCollapsing ? 'animate-toolbar-collapse' : 'animate-toolbar-expand'
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* 组1: 主要功能按钮 */}
        <div className={clsx('flex items-center', BUTTON_GAP, 'px-2')}>
          <ToolbarButton icon={<IconPausePlayAnimated size={24} />} title="暂停/播放 (P)" />
          <ToolbarButton icon={<IconLayout size={21} />} title="布局模式 (L)" />
          <ToolbarButton icon={<IconEdit size={21} />} title="样式编辑 (S)" />
          <ToolbarButton icon={<IconChatEllipsis size={21} />} title="标注模式 (A)" />
        </div>

        {/* 分隔符1 */}
        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* 组2: 次要功能按钮 */}
        <div className={clsx('flex items-center', BUTTON_GAP, 'px-1')}>
          <ToolbarButton icon={<IconEyeAnimated size={24} />} disabled title="显示/隐藏标记 (H)" />
          <ToolbarButton icon={<IconCopyAnimated size={24} />} disabled title="复制反馈 (C)" />
          <ToolbarButton icon={<IconSendArrow size={24} />} disabled title="发送标注 (S)" />
          <ToolbarButton icon={<IconTrashAlt size={24} />} disabled title="清除全部 (X)" />
          <ToolbarButton icon={<IconGear size={24} />} title="设置" />
        </div>

        {/* 分隔符2 */}
        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* 组3: 关闭按钮 */}
        <div className={clsx('flex items-center', BUTTON_GAP, 'pr-2')}>
          <ToolbarButton icon={<IconXmarkLarge size={24} />} onClick={handleClose} title="关闭 (Esc)" />
        </div>
      </div>
    </div>
  );
}
