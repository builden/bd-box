import { memo, useEffect, useRef, useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import {
  isLayoutModeAtom,
  activeDesignComponentAtom,
  designPlacementsAtom,
  selectedPlacementIdAtom,
  snapGuidesAtom,
  draggingFromPaletteAtom,
} from '../store';
import { PlacementMarker } from './PlacementMarker';
import { SnapGuides } from './SnapGuides';
import { DEFAULT_SIZES } from '../types';
import type { DesignPlacement, SnapGuide } from '../types';

const SNAP_THRESHOLD = 5;
const MIN_SIZE = 24;

// Snap 计算函数
function computeSnap(
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
 * DesignOverlay - Design Mode 主 UI
 * 负责: 组件放置、拖拽移动、调整大小、吸附计算
 */
export const DesignOverlay = memo(function DesignOverlay() {
  const [isLayoutMode] = useAtom(isLayoutModeAtom);
  const [activeComponent] = useAtom(activeDesignComponentAtom);
  const [placements, setPlacements] = useAtom(designPlacementsAtom);
  const [selectedId, setSelectedId] = useAtom(selectedPlacementIdAtom);
  const [snapGuides, setSnapGuides] = useAtom(snapGuidesAtom);
  const [draggingFromPalette, setDraggingFromPalette] = useAtom(draggingFromPaletteAtom);

  const isDragging = useRef(false);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
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
  const [sizeIndicator, setSizeIndicator] = useState<{ x: number; y: number; text: string } | null>(null);

  // 拖动预览状态（从 palette 拖动时的透明预览框）
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Draw Box 状态（拖动绘制自定义尺寸）
  const [drawBox, setDrawBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // 正在退出的组件 ID（用于删除动画）
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // 使用ref追踪palette拖动（避免闭包问题）
  const paletteDragRef = useRef(draggingFromPalette);
  paletteDragRef.current = draggingFromPalette;

  // 点击页面放置组件 - 支持拖动绘制尺寸
  const handlePageMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!isLayoutMode) return;
      if (!activeComponent) return;
      if (e.button !== 0) return;

      // Don't place if clicking on toolbar or existing placement
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]') || target.closest('[data-feedback-toolbar]')) {
        return;
      }

      // Check if clicking on an existing placement marker
      if (target.closest('[data-placement-marker]')) return;

      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      let isDrag = false;

      const onMove = (ev: MouseEvent) => {
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if (dx > 5 || dy > 5) {
          isDrag = true;
          const x = Math.min(startX, ev.clientX);
          const y = Math.min(startY, ev.clientY);
          const w = Math.abs(ev.clientX - startX);
          const h = Math.abs(ev.clientY - startY);
          setDrawBox({ x, y, w, h });
          setSizeIndicator({
            x: ev.clientX + 12,
            y: ev.clientY + 12,
            text: `${Math.round(w)} × ${Math.round(h)}`,
          });
        }
      };

      const onUp = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        setDrawBox(null);
        setSizeIndicator(null);

        const def = DEFAULT_SIZES[activeComponent];
        let x: number, y: number, w: number, h: number;

        if (isDrag) {
          // 拖动绘制了尺寸
          x = Math.min(startX, ev.clientX);
          y = Math.min(startY, ev.clientY);
          w = Math.max(MIN_SIZE, Math.abs(ev.clientX - startX));
          h = Math.max(MIN_SIZE, Math.abs(ev.clientY - startY));
        } else {
          // 点击直接放置
          w = def.width ?? 200;
          h = def.height ?? 100;
          x = ev.clientX - w / 2;
          y = ev.clientY - h / 2;
        }

        x = Math.max(0, x);
        y = Math.max(0, y);

        const newPlacement: DesignPlacement = {
          id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: activeComponent,
          x,
          y,
          width: w,
          height: h,
          scrollY: window.scrollY,
          timestamp: Date.now(),
        };

        setPlacements((prev) => [...prev, newPlacement]);
        setSelectedId(newPlacement.id);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [isLayoutMode, activeComponent, setPlacements, setSelectedId]
  );

  // 选择已有组件
  const handleSelect = useCallback(
    (id: string, shiftKey: boolean) => {
      if (shiftKey) {
        // Multi-select: toggle selection (暂不支持)
        setSelectedId(id);
      } else {
        setSelectedId(id);
      }
    },
    [setSelectedId]
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

      setSelectedId(id);
    },
    [placements, setSelectedId]
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
      setSelectedId(id);
    },
    [placements, setSelectedId]
  );

  // 鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const movingRect = {
          x: origX + dx,
          y: origY + dy,
          width: 0,
          height: 0,
        };

        const { dx: snapDx, dy: snapDy, guides } = computeSnap(movingRect, placements, id);
        const newX = origX + dx + snapDx;
        const newY = origY + dy + snapDy;

        setSnapGuides(guides);
        setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, x: newX, y: newY } : p)));
      }

      // 处理从palette拖动预览
      const paletteDrag = paletteDragRef.current;
      if (paletteDrag) {
        const defaultSize = DEFAULT_SIZES[paletteDrag.type];
        const width = defaultSize?.width ?? 200;
        const height = defaultSize?.height ?? 100;
        setDragPreview({
          x: e.clientX - width / 2,
          y: e.clientY - height / 2,
          width,
          height,
        });
      }

      if (isResizing.current && resizeRef.current) {
        const { id, handle, startX, startY, origX, origY, origW, origH } = resizeRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newX = origX;
        let newY = origY;
        let newW = origW;
        let newH = origH;

        // Apply resize based on handle
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

        setSizeIndicator({
          x: e.clientX + 12,
          y: e.clientY + 12,
          text: `${Math.round(newW)} × ${Math.round(newH)}`,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDragging.current = false;
      dragRef.current = null;
      isResizing.current = false;
      resizeRef.current = null;
      setSnapGuides([]);
      setSizeIndicator(null);

      // 处理从palette拖动放置
      if (draggingFromPalette) {
        // 使用鼠标释放时的位置
        const releaseX = e.clientX;
        const releaseY = e.clientY;
        // 检查是否释放在有效区域（不在toolbar或panel上）
        const target = document.elementFromPoint(releaseX, releaseY) as HTMLElement;
        if (target && !target.closest('[data-no-drag]') && !target.closest('[data-feedback-toolbar]')) {
          // 创建placement
          const defaultSize = DEFAULT_SIZES[draggingFromPalette.type];
          const width = defaultSize?.width ?? 200;
          const height = defaultSize?.height ?? 100;
          const newPlacement: DesignPlacement = {
            id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: draggingFromPalette.type,
            x: releaseX - width / 2,
            y: releaseY - height / 2,
            width,
            height,
            scrollY: window.scrollY,
            timestamp: Date.now(),
          };
          setPlacements((prev) => [...prev, newPlacement]);
          setSelectedId(newPlacement.id);
        }
        setDraggingFromPalette(null);
        setDragPreview(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handlePageMouseDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handlePageMouseDown);
    };
  }, [placements, setPlacements, setSnapGuides, handlePageMouseDown]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLayoutMode) return;

      if (e.key === 'Escape') {
        setSelectedId(null);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        // 淡出动画删除
        setExitingIds((prev) => new Set(prev).add(selectedId));
        setSelectedId(null);
        setTimeout(() => {
          setPlacements((prev) => prev.filter((p) => p.id !== selectedId));
          setExitingIds((prev) => {
            const next = new Set(prev);
            next.delete(selectedId);
            return next;
          });
        }, 180);
      }

      // Arrow keys for nudging selected placement
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setPlacements((prev) => prev.map((p) => (p.id === selectedId ? { ...p, x: p.x + dx, y: p.y + dy } : p)));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLayoutMode, selectedId, setPlacements, setSelectedId]);

  if (!isLayoutMode) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 99995, cursor: draggingFromPalette ? 'crosshair' : 'crosshair' }}
      data-feedback-toolbar
    >
      {/* Snap guides */}
      <SnapGuides guides={snapGuides} />

      {/* Placement markers */}
      {placements.map((placement) => (
        <PlacementMarker
          key={placement.id}
          placement={placement}
          isSelected={selectedId === placement.id}
          isExiting={exitingIds.has(placement.id)}
          onSelect={handleSelect}
          onStartDrag={handleStartDrag}
          onStartResize={handleStartResize}
          onDelete={(id) => {
            setExitingIds((prev) => new Set(prev).add(id));
            setTimeout(() => {
              setPlacements((prev) => prev.filter((p) => p.id !== id));
              setExitingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }, 180);
          }}
        />
      ))}

      {/* Drag preview */}
      {dragPreview && (
        <div
          className="fixed pointer-events-none z-[100010] border-2 border-dashed border-blue-500 rounded-md bg-blue-500/10"
          style={{
            left: dragPreview.x,
            top: dragPreview.y,
            width: dragPreview.width,
            height: dragPreview.height,
          }}
        />
      )}

      {/* Draw Box - 拖动绘制自定义尺寸 */}
      {drawBox && (
        <div
          className="fixed pointer-events-none z-[100010] border-2 border-dashed border-blue-500 rounded-md bg-blue-500/10"
          style={{
            left: drawBox.x,
            top: drawBox.y,
            width: drawBox.w,
            height: drawBox.h,
          }}
          data-feedback-toolbar
        />
      )}

      {/* Size indicator */}
      {sizeIndicator && (
        <div
          className="fixed pointer-events-none z-[100010]"
          style={{
            left: sizeIndicator.x,
            top: sizeIndicator.y,
            fontSize: 10,
            color: '#fff',
            background: '#3c82f6',
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
          data-feedback-toolbar
        >
          {sizeIndicator.text}
        </div>
      )}
    </div>
  );
});
