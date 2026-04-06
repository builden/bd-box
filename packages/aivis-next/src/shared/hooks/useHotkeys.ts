import { useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { isAnnotationModeAtom, annotationsAtom, showMarkersAtom } from '@/shared/features/Annotation/store';
import { showSettingsAtom, settingsAtom, OUTPUT_DETAIL_OPTIONS } from '@/shared/features/SettingsPanel/store';
import { generateAnnotationOutput, copyToClipboard } from '@/shared/features/Annotation';
import { isActiveAtom, copiedAtom, triggerCopyAtom } from '@/shared/features/ToggleButton/store';
import { toastAtom } from '@/shared/components/store';
import { isLayoutModeAtom, isRearrangeModeAtom } from '@/shared/features/Layout';

/**
 * useHotkeys - 全局快捷键和 Toolbar 按钮事件处理
 */
export function useHotkeys() {
  const [isAnnotationMode, setIsAnnotationMode] = useAtom(isAnnotationModeAtom);
  const [annotations, setAnnotations] = useAtom(annotationsAtom);
  const [, setShowMarkers] = useAtom(showMarkersAtom);
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);
  const [settings, setSettings] = useAtom(settingsAtom);
  const [, setIsActive] = useAtom(isActiveAtom);
  const [, setCopied] = useAtom(copiedAtom);
  const [triggerCopy] = useAtom(triggerCopyAtom);
  const [, setToast] = useAtom(toastAtom);
  const [isLayoutMode, setIsLayoutMode] = useAtom(isLayoutModeAtom);
  const [, setIsRearrangeMode] = useAtom(isRearrangeModeAtom);

  // 复制反馈
  const performCopy = useCallback(async () => {
    if (annotations.length === 0) return;
    const output = generateAnnotationOutput(annotations, settings.outputDetail);
    const success = await copyToClipboard(output);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [annotations, settings.outputDetail, setCopied]);

  // 监听 triggerCopyAtom 变化（Toolbar 按钮触发）
  useEffect(() => {
    if (triggerCopy > 0) {
      performCopy();
    }
  }, [triggerCopy, performCopy]);

  // 清除全部标注
  const handleClearAll = useCallback(() => {
    setAnnotations([]);
  }, [setAnnotations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 跳过在输入框中的按键
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd/Ctrl+Shift+F - 切换工具栏展开/收起
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsActive((prev) => !prev);
        return;
      }

      // 跳过其他快捷键如果正在输入或有修饰键
      if (isTyping || e.metaKey || e.ctrlKey) return;

      switch (e.key.toLowerCase()) {
        case 'escape':
          // 退出标注模式
          if (isAnnotationMode) {
            setIsAnnotationMode(false);
          }
          // 退出布局模式
          if (isLayoutMode) {
            setIsLayoutMode(false);
            setIsRearrangeMode(false);
          }
          if (showSettings) {
            setShowSettings(false);
          }
          break;

        case 'h':
          // 切换标记可见性
          if (annotations.length > 0) {
            e.preventDefault();
            setShowMarkers((prev) => !prev);
          }
          break;

        case 'c':
          // 复制反馈
          if (annotations.length > 0) {
            e.preventDefault();
            performCopy();
          }
          break;

        case 'x':
          // 清除全部
          if (annotations.length > 0) {
            e.preventDefault();
            handleClearAll();
          }
          break;

        case 'a':
          // 切换标注模式
          e.preventDefault();
          if (showSettings) setShowSettings(false);
          setIsAnnotationMode((prev) => !prev);
          break;

        case 'l':
          // 切换布局模式
          e.preventDefault();
          if (showSettings) setShowSettings(false);
          if (isLayoutMode) {
            setIsLayoutMode(false);
            setIsRearrangeMode(false);
          } else {
            setIsLayoutMode(true);
          }
          break;

        case 'q':
          // 切换输出格式
          {
            e.preventDefault();
            const currentIndex = OUTPUT_DETAIL_OPTIONS.findIndex((opt) => opt.value === settings.outputDetail);
            const nextIndex = (currentIndex + 1) % OUTPUT_DETAIL_OPTIONS.length;
            const nextOption = OUTPUT_DETAIL_OPTIONS[nextIndex];
            if (nextOption) {
              setSettings((prev) => ({ ...prev, outputDetail: nextOption.value }));
              setToast({
                message: `${nextOption.label}：${nextOption.description}`,
                duration: 2000,
                color: nextOption.color,
              });
            }
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isAnnotationMode,
    isLayoutMode,
    showSettings,
    annotations.length,
    setIsAnnotationMode,
    setShowSettings,
    setShowMarkers,
    setIsActive,
    performCopy,
    handleClearAll,
    setToast,
    settings.outputDetail,
    setIsLayoutMode,
    setIsRearrangeMode,
  ]);
}
