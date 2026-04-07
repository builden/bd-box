import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  isLayoutModeAtom,
  activeDesignComponentAtom,
  designPlacementsAtom,
  selectedPlacementIdsAtom,
  snapGuidesAtom,
} from '../store';
import { DEFAULT_SIZES, type DesignPlacement, type SnapGuide } from '../types';

const SNAP_THRESHOLD = 5;

// Snap 计算函数
export function computeSnap(
  movingRect: { x: number; y: number; width: number; height: number },
  others: DesignPlacement[],
  excludeId: string | null
): { dx: number; dy: number; guides: SnapGuide[] } {
  const guides: SnapGuide[] = [];
  let dx = 0;
  let dy = 0;

  const movingCenterX = movingRect.x + movingRect.width / 2;
  const movingCenterY = movingRect.y + movingRect.height / 2;
  const movingRight = movingRect.x + movingRect.width;
  const movingBottom = movingRect.y + movingRect.height;

  for (const other of others) {
    if (other.id === excludeId) continue;

    const otherLeft = other.x;
    const otherRight = other.x + other.width;
    const otherTop = other.y;
    const otherBottom = other.y + other.height;
    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;

    // Left edge to left edge
    if (Math.abs(movingRect.x - otherLeft) < SNAP_THRESHOLD) {
      dx = otherLeft - movingRect.x;
      guides.push({ type: 'vertical', position: otherLeft, edge: 'left' });
    }
    // Right edge to right edge
    if (Math.abs(movingRight - otherRight) < SNAP_THRESHOLD) {
      dx = otherRight - movingRight;
      guides.push({ type: 'vertical', position: otherRight, edge: 'right' });
    }
    // Left edge to right edge
    if (Math.abs(movingRect.x - otherRight) < SNAP_THRESHOLD) {
      dx = otherRight - movingRect.x;
      guides.push({ type: 'vertical', position: otherRight, edge: 'left' });
    }
    // Right edge to left edge
    if (Math.abs(movingRight - otherLeft) < SNAP_THRESHOLD) {
      dx = otherLeft - movingRight;
      guides.push({ type: 'vertical', position: otherLeft, edge: 'right' });
    }
    // Center X alignment
    if (Math.abs(movingCenterX - otherCenterX) < SNAP_THRESHOLD) {
      dx = otherCenterX - movingCenterX;
      guides.push({ type: 'vertical', position: otherCenterX });
    }

    // Top edge to top edge
    if (Math.abs(movingRect.y - otherTop) < SNAP_THRESHOLD) {
      dy = otherTop - movingRect.y;
      guides.push({ type: 'horizontal', position: otherTop, edge: 'top' });
    }
    // Bottom edge to bottom edge
    if (Math.abs(movingBottom - otherBottom) < SNAP_THRESHOLD) {
      dy = otherBottom - movingBottom;
      guides.push({ type: 'horizontal', position: otherBottom, edge: 'bottom' });
    }
    // Top edge to bottom edge
    if (Math.abs(movingRect.y - otherBottom) < SNAP_THRESHOLD) {
      dy = otherBottom - movingRect.y;
      guides.push({ type: 'horizontal', position: otherBottom, edge: 'top' });
    }
    // Bottom edge to top edge
    if (Math.abs(movingBottom - otherTop) < SNAP_THRESHOLD) {
      dy = otherTop - movingBottom;
      guides.push({ type: 'horizontal', position: otherTop, edge: 'bottom' });
    }
    // Center Y alignment
    if (Math.abs(movingCenterY - otherCenterY) < SNAP_THRESHOLD) {
      dy = otherCenterY - movingCenterY;
      guides.push({ type: 'horizontal', position: otherCenterY });
    }
  }

  // Viewport edges
  if (Math.abs(movingRect.x) < SNAP_THRESHOLD) {
    dx = -movingRect.x;
    guides.push({ type: 'vertical', position: 0, edge: 'left' });
  }
  if (Math.abs(movingRect.y) < SNAP_THRESHOLD) {
    dy = -movingRect.y;
    guides.push({ type: 'horizontal', position: 0, edge: 'top' });
  }

  return { dx, dy, guides };
}

/**
 * useLayoutMode - 布局模式主逻辑 hook
 * 职责：组件放置、移动、调整大小、智能吸附
 */
export function useLayoutMode() {
  const [isLayoutMode] = useAtom(isLayoutModeAtom);
  const [activeComponent] = useAtom(activeDesignComponentAtom);
  const [placements, setPlacements] = useAtom(designPlacementsAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedPlacementIdsAtom);
  const [snapGuides, setSnapGuides] = useAtom(snapGuidesAtom);

  const isDragging = useRef(false);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const isResizing = useRef(false);
  const resizeRef = useRef<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  // 点击页面放置组件
  const handlePageClick = useCallback(
    (e: MouseEvent) => {
      if (!isLayoutMode) return;
      if (!activeComponent) return;

      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]') || target.closest('[data-feedback-toolbar]')) {
        return;
      }

      const defaultSize = DEFAULT_SIZES[activeComponent];
      const width = defaultSize?.width ?? 200;
      const height = defaultSize?.height ?? 100;

      const newPlacement: DesignPlacement = {
        id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: activeComponent,
        x: e.clientX - width / 2,
        y: e.clientY - height / 2,
        width,
        height,
        scrollY: window.scrollY,
        timestamp: Date.now(),
      };

      setPlacements((prev) => [...prev, newPlacement]);
      setSelectedIds(new Set([newPlacement.id]));
    },
    [isLayoutMode, activeComponent, setPlacements, setSelectedIds]
  );

  // 选择已有组件
  const handleSelect = useCallback(
    (id: string, shiftKey: boolean) => {
      if (shiftKey) {
        // Shift 点击：切换选中状态
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      } else {
        // 普通点击：单选
        setSelectedIds(new Set([id]));
      }
    },
    [setSelectedIds]
  );

  // 开始拖拽
  const handleStartDrag = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const placement = placements.find((p) => p.id === id);
      if (!placement) return;

      isDragging.current = true;
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: placement.x,
        origY: placement.y,
      };

      setSelectedIds(new Set([id]));
    },
    [placements, setSelectedIds]
  );

  // 开始调整大小
  const handleStartResize = useCallback(
    (id: string, handle: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const placement = placements.find((p) => p.id === id);
      if (!placement) return;
      isResizing.current = true;
      resizeRef.current = {
        id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origX: placement.x,
        origY: placement.y,
        origW: placement.width,
        origH: placement.height,
      };
      setSelectedIds(new Set([id]));
    },
    [placements, setSelectedIds]
  );

  // 删除选中组件
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setPlacements((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  }, [selectedIds, setPlacements, setSelectedIds]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLayoutMode) return;

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Arrow keys nudge - multiple selected items
      if (selectedIds.size > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setPlacements((prev) =>
          prev.map((p) => (selectedIds.has(p.id) ? { ...p, x: Math.max(0, p.x + dx), y: Math.max(0, p.y + dy) } : p))
        );
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLayoutMode, selectedIds, setPlacements, setSelectedIds, handleDeleteSelected]);

  // 鼠标移动/松开事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const movingRect = { x: origX + dx, y: origY + dy, width: 0, height: 0 };
        const { dx: snapDx, dy: snapDy, guides } = computeSnap(movingRect, placements, id);
        const newX = origX + dx + snapDx;
        const newY = origY + dy + snapDy;

        setSnapGuides(guides);
        setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, x: newX, y: newY } : p)));
      }

      if (isResizing.current && resizeRef.current) {
        const { id, handle, startX, startY, origX, origY, origW, origH } = resizeRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newX = origX;
        let newY = origY;
        let newW = origW;
        let newH = origH;

        if (handle.includes('e')) newW = Math.max(50, origW + dx);
        if (handle.includes('s')) newH = Math.max(30, origH + dy);
        if (handle.includes('w')) {
          newW = Math.max(50, origW - dx);
          newX = origX + origW - newW;
        }
        if (handle.includes('n')) {
          newH = Math.max(30, origH - dy);
          newY = origY + origH - newH;
        }

        const movingRect = { x: newX, y: newY, width: newW, height: newH };
        const { guides } = computeSnap(movingRect, placements, id);

        setSnapGuides(guides);
        setPlacements((prev) =>
          prev.map((p) => (p.id === id ? { ...p, x: newX, y: newY, width: newW, height: newH } : p))
        );
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      dragRef.current = null;
      isResizing.current = false;
      resizeRef.current = null;
      setSnapGuides([]);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handlePageClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handlePageClick);
    };
  }, [placements, setPlacements, setSnapGuides, handlePageClick]);

  return {
    isLayoutMode,
    placements,
    selectedIds,
    snapGuides,
    handleSelect,
    handleStartDrag,
    handleStartResize,
    handleDeleteSelected,
  };
}
