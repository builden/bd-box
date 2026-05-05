import { useRef, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import clsx from 'clsx';
import {
  IconRuler,
  IconEyeAnimated,
  IconCopyAnimated,
  IconSendArrow,
  IconTrashAlt,
  IconGear,
} from '@/shared/components/Icons';
import { useToolbarState } from '@/shared/hooks/useToolbarState';
import { useToggleButton } from '@/shared/features/ToggleButton/useToggleButton';
import { PauseButton } from '@/shared/features/PauseButton';
import { ToggleButton } from '@/shared/features/ToggleButton';
import { ToolbarButton } from '@/shared/components/ToolbarButton';
import { Toast } from '@/shared/components/Toast';
import { AnnotationButton, useAnnotations } from '@/shared/features/Annotation';
import {
  LayoutMode,
  LayoutButton,
  RulerOverlay,
  isLayoutModeAtom,
  isRearrangeModeAtom,
  isRulerModeAtom,
  ComponentPanel,
} from '@/shared/features/Layout';
import { TOOLBAR_WIDTH, DRAG_CONFIG } from '@/shared/hooks/types';
import { SettingsPanel } from '@/shared/features/SettingsPanel';
import { showSettingsAtom, isDarkModeAtom } from '@/shared/features/SettingsPanel/store';
import { isAnnotationModeAtom } from '@/shared/features/Annotation';
import { copiedAtom, triggerCopyAtom } from '@/shared/features/ToggleButton/store';

const TOOLBAR_EXPANDED_WIDTH = TOOLBAR_WIDTH;

export function Toolbar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDragging, toolbarPosition, handleMouseDown, handleClick } = useToolbarState(containerRef);
  const { isActive } = useToggleButton(handleClick);
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const setIsAnnotationMode = useSetAtom(isAnnotationModeAtom);
  const [_isLayoutMode, setIsLayoutMode] = useAtom(isLayoutModeAtom);
  const [isRulerMode, setIsRulerMode] = useAtom(isRulerModeAtom);
  const [, setIsRearrangeMode] = useAtom(isRearrangeModeAtom);
  const { clearAllAnnotations, annotations, showMarkers, toggleShowMarkers } = useAnnotations();
  const [copied] = useAtom(copiedAtom);
  const [, setTriggerCopy] = useAtom(triggerCopyAtom);

  // 关闭 toolbar 时也关闭设置面板、标注模式和布局模式
  useEffect(() => {
    if (!isActive) {
      setShowSettings(false);
      setIsAnnotationMode(false);
      setIsLayoutMode(false);
      setIsRulerMode(false);
      setIsRearrangeMode(false);
    }
  }, [isActive, setShowSettings, setIsAnnotationMode, setIsLayoutMode, setIsRulerMode, setIsRearrangeMode]);

  useEffect(() => {
    if (isRulerMode) {
      setShowSettings(false);
      setIsAnnotationMode(false);
      setIsLayoutMode(false);
      setIsRearrangeMode(false);
    }
  }, [isRulerMode, setShowSettings, setIsAnnotationMode, setIsLayoutMode, setIsRearrangeMode]);

  // 复制反馈 - 触发事件让 useHotkeys 统一处理
  const handleCopyFeedback = () => {
    if (annotations.length === 0) return;
    setTriggerCopy((n) => n + 1);
  };

  // 定位：right 固定
  const style: React.CSSProperties = {
    position: 'fixed',
    right: toolbarPosition ? toolbarPosition.right : -9999,
    top: toolbarPosition ? toolbarPosition.top : -9999,
    width: isActive ? TOOLBAR_EXPANDED_WIDTH : DRAG_CONFIG.SIZE,
    height: DRAG_CONFIG.SIZE,
    transition: 'width 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
    borderRadius: 22,
    backgroundColor: 'var(--toolbar-bg)',
    boxShadow: 'var(--toolbar-shadow)',
  };

  return (
    <>
      <Toast />
      <LayoutMode />
      <RulerOverlay />
      <div
        ref={containerRef}
        data-feedback-toolbar
        data-aivis-next-ui
        data-theme={isDarkMode ? 'dark' : 'light'}
        data-no-hover
        className={clsx(
          'flex items-center',
          'pointer-events-auto',
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* SettingsPanel inside toolbar - uses absolute positioning */}
        <SettingsPanel toolbarRef={containerRef} />
        {/* ComponentPanel for layout mode - uses absolute positioning above toolbar */}
        <ComponentPanel toolbarRef={containerRef} />
        {/* 左侧工具栏按钮 - 仅 expanded */}
        {isActive && (
          <>
            <div className="flex items-center gap-1.5">
              <PauseButton />
              <LayoutButton />
              <ToolbarButton
                icon={<IconRuler size={21} />}
                title="标尺"
                onClick={() => setIsRulerMode((prev) => !prev)}
                isActive={isRulerMode}
                activeColor="var(--toolbar-icon-active)"
              />
              <AnnotationButton />
            </div>

            <div className="w-px h-6 bg-[var(--toolbar-divider)] mx-1" />

            <div className="flex items-center gap-1.5">
              <ToolbarButton
                icon={<IconEyeAnimated size={24} isOpen={showMarkers} />}
                onClick={toggleShowMarkers}
                disabled={annotations.length === 0}
                title="显示/隐藏标记 (H)"
                {...(annotations.length > 0 && { badge: annotations.length })}
              />
              <ToolbarButton
                icon={<IconCopyAnimated size={24} copied={copied} />}
                onClick={handleCopyFeedback}
                disabled={annotations.length === 0}
                title="复制反馈 (C)"
              />
              <ToolbarButton icon={<IconSendArrow size={24} />} disabled title="发送标注 (S)" />
              <ToolbarButton
                icon={<IconTrashAlt size={24} />}
                onClick={clearAllAnnotations}
                disabled={annotations.length === 0}
                title="清除全部 (X)"
              />
              <ToolbarButton
                icon={<IconGear size={24} />}
                title="设置"
                onClick={() => setShowSettings(!showSettings)}
                isActive={showSettings}
                activeColor="var(--toolbar-icon-active)"
              />
            </div>

            <div className="w-px h-6 bg-[var(--toolbar-divider)] mx-1" />
          </>
        )}

        {/* 右侧展开/关闭按钮 */}
        <ToggleButton
          handleClick={handleClick}
          {...(!isActive && annotations.length > 0 && { badge: annotations.length })}
        />
      </div>
    </>
  );
}
