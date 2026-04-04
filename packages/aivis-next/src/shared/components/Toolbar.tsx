import { useRef, useCallback } from 'react';
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
  IconListSparkle,
} from './Icons';
import { isActiveAtom, isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { useDragPosition, useDragEvents } from '../hooks';
import { ToolbarButton } from './ToolbarButton';
import { TOOLBAR_WIDTH, DRAG_CONFIG } from '../hooks/types';

const TOOLBAR_EXPANDED_WIDTH = TOOLBAR_WIDTH; // 432

export function Toolbar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useAtom(isActiveAtom);
  const [isDragging] = useAtom(isDraggingToolbarAtom);

  const { toolbarPosition, setToolbarPosition } = useDragPosition();
  const { handleMouseDown, handleClick } = useDragEvents(containerRef, setToolbarPosition);

  const handleToggle = useCallback(() => {
    if (!handleClick()) return;
    setIsActive(!isActive);
  }, [handleClick, isActive, setIsActive]);

  // 定位：right 固定
  const style: React.CSSProperties = {
    position: 'fixed',
    right: toolbarPosition ? toolbarPosition.right : -9999,
    top: toolbarPosition ? toolbarPosition.top : -9999,
    width: isActive ? TOOLBAR_EXPANDED_WIDTH : DRAG_CONFIG.SIZE,
    height: DRAG_CONFIG.SIZE,
    transition: 'width 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#171717',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)',
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'flex items-center',
        isActive ? 'justify-between px-2' : 'justify-center',
        'cursor-grab select-none',
        'focus:outline-none',
        isDragging && 'cursor-grabbing',
        isDragging && 'scale-95',
        'animate-toolbar-enter',
        'z-[100000]'
      )}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {/* 左侧工具栏按钮 - 仅 expanded */}
      {isActive && (
        <>
          <div className="flex items-center gap-1.5">
            <ToolbarButton icon={<IconPausePlayAnimated size={24} />} title="暂停/播放 (P)" stopPropagation />
            <ToolbarButton icon={<IconLayout size={21} />} title="布局模式 (L)" stopPropagation />
            <ToolbarButton icon={<IconEdit size={21} />} title="样式编辑 (S)" stopPropagation />
            <ToolbarButton icon={<IconChatEllipsis size={21} />} title="标注模式 (A)" stopPropagation />
          </div>

          <div className="w-px h-6 bg-white/20 mx-1" />

          <div className="flex items-center gap-1.5">
            <ToolbarButton icon={<IconEyeAnimated size={24} />} disabled title="显示/隐藏标记 (H)" stopPropagation />
            <ToolbarButton icon={<IconCopyAnimated size={24} />} disabled title="复制反馈 (C)" stopPropagation />
            <ToolbarButton icon={<IconSendArrow size={24} />} disabled title="发送标注 (S)" stopPropagation />
            <ToolbarButton icon={<IconTrashAlt size={24} />} disabled title="清除全部 (X)" stopPropagation />
            <ToolbarButton icon={<IconGear size={24} />} title="设置" stopPropagation />
          </div>
        </>
      )}

      {/* 右侧展开/关闭按钮 */}
      <ToolbarButton
        icon={isActive ? <IconXmarkLarge size={24} /> : <IconListSparkle size={24} />}
        onClick={handleToggle}
        title={isActive ? '关闭' : '展开'}
        className={clsx(!isActive && 'mx-auto')}
      />
    </div>
  );
}
