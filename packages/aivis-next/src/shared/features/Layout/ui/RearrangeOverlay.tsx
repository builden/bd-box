import { memo, useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { isRearrangeModeAtom, rearrangeStateAtom, selectedSectionIdsAtom, sectionsDetectedAtom } from '../store';
import { detectPageSections, captureElement } from '../utils/section-detection';
import type { DetectedSection } from '../types';

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
      if (target.closest('[data-no-drag]') || target.closest('[data-feedback-toolbar]')) {
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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRearrangeMode) return;

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
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
      {sections && sections.length > 1 && <ConnectionLines sections={sections} />}

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

function ConnectionLines({ sections }: { sections: DetectedSection[] }) {
  const hasMovedSections = sections.filter(
    (s) => Math.abs(s.originalRect.x - s.currentRect.x) > 1 || Math.abs(s.originalRect.y - s.currentRect.y) > 1
  );

  if (hasMovedSections.length === 0) return null;

  return (
    <svg
      width="100vw"
      height="100vh"
      style={{ position: 'fixed', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      {hasMovedSections.map((section) => {
        const { originalRect, currentRect } = section;

        // Origin center
        const ox = originalRect.x + originalRect.width / 2;
        const oy = originalRect.y + originalRect.height / 2;

        // Current center
        const cx = currentRect.x + currentRect.width / 2;
        const cy = currentRect.y + currentRect.height / 2;

        // Control points for bezier curve
        const midX = (ox + cx) / 2;
        const offset = Math.min(30, Math.hypot(cx - ox, cy - oy) * 0.3);

        return (
          <g key={section.id}>
            {/* Bezier curve */}
            <path
              d={`M ${ox} ${oy} Q ${midX - offset} ${oy} ${cx} ${cy}`}
              stroke="var(--snap-guide-color, #7C3AED)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              fill="none"
              opacity={0.7}
            />
            {/* Origin dot */}
            <circle cx={ox} cy={oy} r={4} fill="var(--snap-guide-color, #7C3AED)" opacity={0.5} />
            {/* Current dot */}
            <circle cx={cx} cy={cy} r={4} fill="var(--snap-guide-color, #7C3AED)" opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
}
