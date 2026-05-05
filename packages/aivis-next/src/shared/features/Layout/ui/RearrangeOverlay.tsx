import { memo, useEffect, useRef, useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { isRearrangeModeAtom, rearrangeStateAtom, selectedSectionIdsAtom, sectionsDetectedAtom } from '../store';
import { detectPageSections, captureElement } from '../utils/section-detection';
import type { DetectedSection } from '../types';
import { isTypingKeyboardEvent } from '@/shared/utils/keyboard';
import { isExtensionUiElement } from '@/shared/utils/extension-ui';

// 退出动画的连接线
interface ExitingConnector {
  id: string;
  orig: { x: number; y: number; width: number; height: number };
  target: { x: number; y: number; width: number; height: number };
}

/**
 * RearrangeOverlay - Rearrange Mode
 * 负责: 区域捕获、幽灵轮廓显示、连接线指示移动方向
 */
export const RearrangeOverlay = memo(function RearrangeOverlay() {
  const [isRearrangeMode] = useAtom(isRearrangeModeAtom);
  const [rearrangeState, setRearrangeState] = useAtom(rearrangeStateAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedSectionIdsAtom);
  const [, setDetected] = useAtom(sectionsDetectedAtom);

  const isDragging = useRef(false);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // 上一次变化的位置记录（用于检测退出动画）
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // 退出动画的连接线
  const [exitingConnectors, setExitingConnectors] = useState<ExitingConnector[]>([]);

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
      if (target.closest('[data-no-drag]') || isExtensionUiElement(target)) {
        return;
      }

      // Find closest section element
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

        // Check if already exists
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
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: section.currentRect.x,
        origY: section.currentRect.y,
      };

      // Calculate offset from click point to section origin
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

        // 记录当前位置用于检测退出动画
        for (const s of prev.sections) {
          if (s.id === id) {
            prevPositionsRef.current.set(id, { x: newX, y: newY });
            break;
          }
        }

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

      // 检测是否有 section 回弹到原位，触发退出动画
      if (rearrangeState) {
        const exiting: ExitingConnector[] = [];

        for (const section of rearrangeState.sections) {
          // 检查是否从移动状态回到原位
          const prevPos = prevPositionsRef.current.get(section.id);
          if (prevPos) {
            const wasMoved =
              Math.abs(prevPos.x - section.originalRect.x) > 1 || Math.abs(prevPos.y - section.originalRect.y) > 1;
            const isNowAtOriginal =
              Math.abs(section.currentRect.x - section.originalRect.x) <= 1 &&
              Math.abs(section.currentRect.y - section.originalRect.y) <= 1;

            if (wasMoved && isNowAtOriginal) {
              exiting.push({
                id: section.id,
                orig: section.originalRect,
                target: section.currentRect,
              });
            }
          }
        }

        if (exiting.length > 0) {
          setExitingConnectors((prev) => [...prev, ...exiting]);
          // 250ms 后清除退出动画
          setTimeout(() => {
            setExitingConnectors((prev) => prev.filter((c) => !exiting.some((e) => e.id === c.id)));
          }, 250);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setRearrangeState]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRearrangeMode) return;
      if (isTypingKeyboardEvent(e)) return;

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault();

        setRearrangeState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.filter((s) => !selectedIds.has(s.id)),
            originalOrder: prev.originalOrder.filter((id) => !selectedIds.has(id)),
          };
        });
        setSelectedIds(new Set());
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
  }, [isRearrangeMode, selectedIds, setRearrangeState, setSelectedIds, handlePageClick, detectSections]);

  if (!isRearrangeMode) return null;

  const { sections } = rearrangeState || {};

  return (
    <div className="pointer-events-none z-[100003]" style={{ position: 'fixed', inset: 0 }}>
      {/* Ghost outlines */}
      {sections?.map((section) => (
        <GhostOutline
          key={section.id}
          section={section}
          isSelected={selectedIds.has(section.id)}
          onStartDrag={(e) => handleStartDrag(section.id, e, section)}
        />
      ))}

      {/* Connection lines SVG */}
      {sections && sections.length > 1 && <ConnectionLines sections={sections} exitingConnectors={exitingConnectors} />}

      {/* Instructions */}
      <div
        className={clsx(
          'absolute top-4 left-1/2 -translate-x-1/2',
          'px-4 py-2 rounded-full',
          'bg-black/70 text-white text-xs',
          'pointer-events-none'
        )}
      >
        Click page elements to capture regions · R to redetect · Del to remove
      </div>
    </div>
  );
});

function GhostOutline({
  section,
  isSelected,
  onStartDrag,
}: {
  section: DetectedSection;
  isSelected: boolean;
  onStartDrag: (e: React.MouseEvent) => void;
}) {
  const { originalRect, currentRect, label } = section;

  const isMoved = Math.abs(originalRect.x - currentRect.x) > 1 || Math.abs(originalRect.y - currentRect.y) > 1;

  return (
    <div
      className={clsx(
        'absolute transition-none',
        'border-2 rounded-lg',
        isSelected ? 'border-violet-500 cursor-move' : 'border-dashed border-white/60 cursor-grab',
        'pointer-events-auto'
      )}
      style={{
        left: currentRect.x,
        top: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
      }}
      onMouseDown={onStartDrag}
    >
      {/* Label */}
      <div
        className={clsx(
          'absolute top-0 left-0',
          'px-1.5 py-0.5 rounded-br-lg',
          'text-[10px] font-medium whitespace-nowrap',
          'bg-violet-500 text-white'
        )}
      >
        {label}
      </div>

      {/* Original position ghost (dashed) */}
      {isMoved && (
        <div
          className={clsx('absolute border border-dashed rounded-lg pointer-events-none', 'border-white/40 bg-white/5')}
          style={{
            left: -(currentRect.x - originalRect.x),
            top: -(currentRect.y - originalRect.y),
            width: originalRect.width,
            height: originalRect.height,
          }}
        />
      )}

      {/* Size indicator */}
      <div
        className={clsx(
          'absolute bottom-0 right-0',
          'px-1 py-0.5 rounded-tl-lg',
          'text-[9px] text-violet-300 bg-violet-900/50'
        )}
      >
        {Math.round(currentRect.width)}×{Math.round(currentRect.height)}
      </div>
    </div>
  );
}

function ConnectionLines({
  sections,
  exitingConnectors,
}: {
  sections: DetectedSection[];
  exitingConnectors: ExitingConnector[];
}) {
  // 当前正在移动的 section
  const movedSections = sections.filter(
    (s) => Math.abs(s.originalRect.x - s.currentRect.x) > 1 || Math.abs(s.originalRect.y - s.currentRect.y) > 1
  );

  // 合并当前移动和退出动画的连接线
  const allConnectors: Array<{
    id: string;
    orig: { x: number; y: number; width: number; height: number };
    target: { x: number; y: number; width: number; height: number };
    isExiting?: boolean;
  }> = [
    ...movedSections.map((s) => ({ id: s.id, orig: s.originalRect, target: s.currentRect })),
    ...exitingConnectors.map((c) => ({ ...c, isExiting: true })),
  ];

  if (allConnectors.length === 0) return null;

  return (
    <svg
      width="100vw"
      height="100vh"
      style={{ position: 'fixed', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      {allConnectors.map((connector) => {
        const { orig, target } = connector;

        // Origin center
        const ox = orig.x + orig.width / 2;
        const oy = orig.y + orig.height / 2;

        // Current center
        const cx = target.x + target.width / 2;
        const cy = target.y + target.height / 2;

        // 计算距离
        const dist = Math.hypot(cx - ox, cy - oy);

        // 垂直于移动方向的 control point 偏移
        const ddx = cx - ox;
        const ddy = cy - oy;
        const perpOffset = Math.min(dist * 0.3, 60);
        const nx = dist > 0 ? -ddy / dist : 0;
        const ny = dist > 0 ? ddx / dist : 0;

        // Control point
        const cpx = (ox + cx) / 2 + nx * perpOffset;
        const cpy = (oy + cy) / 2 + ny * perpOffset;

        // 透明度随距离缩放
        const proximityScale = Math.min(1, dist / 40);
        const baseOpacity = connector.isExiting ? 0.45 : 0.7;

        return (
          <g key={connector.id}>
            {/* 贝塞尔曲线 */}
            <path
              d={`M ${ox} ${oy} Q ${cpx} ${cpy} ${cx} ${cy}`}
              stroke="var(--snap-guide-color, #7C3AED)"
              strokeWidth={1.5}
              strokeDasharray={connector.isExiting ? '6 4' : 'none'}
              fill="none"
              opacity={baseOpacity * proximityScale}
            />
            {/* 起点圆点 */}
            <circle
              cx={ox}
              cy={oy}
              r={4 * proximityScale}
              fill="var(--snap-guide-color, #7C3AED)"
              opacity={0.5 * proximityScale}
            />
            {/* 终点圆点 */}
            <circle
              cx={cx}
              cy={cy}
              r={4 * proximityScale}
              fill="var(--snap-guide-color, #7C3AED)"
              opacity={0.9 * proximityScale}
            />
          </g>
        );
      })}
    </svg>
  );
}
