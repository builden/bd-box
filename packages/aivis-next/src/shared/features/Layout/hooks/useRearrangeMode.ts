import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { isRearrangeModeAtom, rearrangeStateAtom, selectedSectionIdsAtom, sectionsDetectedAtom } from '../store';
import { detectPageSections, captureElement } from '../utils/section-detection';
import type { DetectedSection } from '../types';
import { isTypingKeyboardEvent } from '@/shared/utils/keyboard';

/**
 * useRearrangeMode - Rearrange 模式逻辑 hook
 * 职责：区域检测和捕获、幽灵轮廓、连接线
 */
export function useRearrangeMode() {
  const [isRearrangeMode] = useAtom(isRearrangeModeAtom);
  const [rearrangeState, setRearrangeState] = useAtom(rearrangeStateAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedSectionIdsAtom);
  const [, setDetected] = useAtom(sectionsDetectedAtom);

  const isDragging = useRef(false);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
  } | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // 检测页面区域
  const detectSections = useCallback(() => {
    if (typeof window === 'undefined') return;

    const sections = detectPageSections();
    setRearrangeState({
      sections,
      originalOrder: sections.map((s) => s.id),
      detectedAt: Date.now(),
    });
    setDetected(true);
  }, [setRearrangeState, setDetected]);

  // 初始化检测
  useEffect(() => {
    if (isRearrangeMode && !rearrangeState) {
      detectSections();
    }
  }, [isRearrangeMode, rearrangeState, detectSections]);

  // 点击页面捕获区域
  const handlePageClick = useCallback(
    (e: MouseEvent) => {
      if (!isRearrangeMode) return;

      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]') || target.closest('[data-feedback-toolbar]')) {
        return;
      }

      const sectionEl = target.closest('section, div, nav, header, main, article, aside, footer, [role]');
      if (!sectionEl) return;

      const section = captureElement(sectionEl as HTMLElement);

      setRearrangeState((prev) => {
        if (!prev) {
          return {
            sections: [section],
            originalOrder: [section.id],
            detectedAt: Date.now(),
          };
        }

        const exists = prev.sections.some((s) => s.selector === section.selector);
        if (exists) return prev;

        return {
          ...prev,
          sections: [...prev.sections, section],
          originalOrder: [...prev.originalOrder, section.id],
        };
      });
    },
    [isRearrangeMode, setRearrangeState]
  );

  // 开始拖拽区域
  const handleStartDrag = useCallback(
    (id: string, e: React.MouseEvent, section: DetectedSection) => {
      e.preventDefault();
      e.stopPropagation();

      isDragging.current = true;
      dragRef.current = { id, startX: e.clientX, startY: e.clientY };
      dragOffsetRef.current = {
        dx: e.clientX - section.currentRect.x,
        dy: e.clientY - section.currentRect.y,
      };

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    },
    [setSelectedIds]
  );

  // 鼠标移动 - 拖拽区域
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !dragRef.current) return;

      const { id } = dragRef.current;
      const { dx, dy } = dragOffsetRef.current;

      const newX = e.clientX - dx;
      const newY = e.clientY - dy;

      setRearrangeState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === id ? { ...s, currentRect: { ...s.currentRect, x: newX, y: newY } } : s
          ),
        };
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setRearrangeState]);

  // 删除选中区域
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    setRearrangeState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.filter((s) => !selectedIds.has(s.id)),
        originalOrder: prev.originalOrder.filter((id) => !selectedIds.has(id)),
      };
    });
    setSelectedIds(new Set());
  }, [selectedIds, setRearrangeState, setSelectedIds]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRearrangeMode) return;
      if (isTypingKeyboardEvent(e)) return;

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Arrow keys nudge
      if (selectedIds.size > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        setRearrangeState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              selectedIds.has(s.id)
                ? { ...s, currentRect: { ...s.currentRect, x: s.currentRect.x + dx, y: s.currentRect.y + dy } }
                : s
            ),
          };
        });
      }

      // R - Redetect
      if (e.key === 'r' || e.key === 'R') {
        detectSections();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handlePageClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handlePageClick);
    };
  }, [
    isRearrangeMode,
    selectedIds,
    setRearrangeState,
    setSelectedIds,
    handlePageClick,
    handleDeleteSelected,
    detectSections,
  ]);

  return {
    isRearrangeMode,
    rearrangeState,
    selectedIds,
    handleStartDrag,
    handleDeleteSelected,
    detectSections,
  };
}
