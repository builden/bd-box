import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { isDarkModeAtom } from '@/shared/features/SettingsPanel/store';
import { isRulerModeAtom, rulerStateAtom, type RulerState } from '../store';

const EDGE_PADDING = 16;
const MIN_RULER_LENGTH = 400;
const MIN_RANGE_LENGTH = 80;
const RULER_THICKNESS = 96;
const RANGE_THICKNESS = 32;
const HANDLE_SIZE = 18;

type DragMode = 'move' | 'outer-start' | 'outer-end' | 'range-move' | 'range-start' | 'range-end';

type ScaleMark = {
  position: number;
  height: number;
  label?: string;
  kind: 'pixel' | 'minor' | 'medium' | 'major';
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value);
}

function getViewportWidth() {
  return window.innerWidth;
}

function getViewportHeight() {
  return window.innerHeight;
}

function getDefaultLength() {
  const maxLength = Math.max(MIN_RULER_LENGTH, window.innerWidth - EDGE_PADDING * 2);
  return clamp(480, MIN_RULER_LENGTH, maxLength);
}

function normalizeRulerState(state: RulerState): RulerState {
  const length = Math.max(MIN_RULER_LENGTH, round(state.length));
  const maxRangeStart = Math.max(0, length - MIN_RANGE_LENGTH);
  const rangeStart = clamp(round(state.rangeStart), 0, maxRangeStart);
  const rangeEnd = clamp(round(state.rangeEnd), rangeStart + MIN_RANGE_LENGTH, length);

  return {
    ...state,
    x: round(state.x),
    y: round(state.y),
    length,
    rangeStart,
    rangeEnd,
  };
}

function getDefaultRulerState(): RulerState {
  const length = getDefaultLength();
  return normalizeRulerState({
    orientation: 'horizontal',
    x: clamp(
      round(window.innerWidth / 2 - length / 2),
      EDGE_PADDING,
      Math.max(EDGE_PADDING, window.innerWidth - length - EDGE_PADDING)
    ),
    y: clamp(round(window.innerHeight / 2), EDGE_PADDING, Math.max(EDGE_PADDING, window.innerHeight - EDGE_PADDING)),
    length,
    rangeStart: Math.round(length * 0.25),
    rangeEnd: Math.round(length * 0.75),
  });
}

function buildScaleMarks(length: number) {
  const safeLength = Math.max(0, Math.round(length));
  const marks: ScaleMark[] = [];

  for (let position = 0; position <= safeLength; position += 1) {
    if (position === 0 || position === safeLength) {
      marks.push({
        position,
        height: 34,
        label: String(position),
        kind: 'major',
      });
      continue;
    }

    if (position % 50 === 0) {
      marks.push({
        position,
        height: 28,
        label: String(position),
        kind: 'major',
      });
      continue;
    }

    if (position % 10 === 0) {
      marks.push({
        position,
        height: 22,
        kind: 'medium',
      });
      continue;
    }

    if (position % 5 === 0) {
      marks.push({
        position,
        height: 16,
        kind: 'minor',
      });
      continue;
    }

    marks.push({
      position,
      height: 10,
      kind: 'pixel',
    });
  }

  return marks;
}

function formatLength(length: number) {
  return `${Math.round(length)} px`;
}

function getOuterRange(state: RulerState) {
  return state.rangeEnd - state.rangeStart;
}

function getRangeBox(state: RulerState) {
  const rangeLength = getOuterRange(state);

  if (state.orientation === 'horizontal') {
    return {
      left: state.rangeStart,
      top: (RULER_THICKNESS - RANGE_THICKNESS) / 2,
      width: rangeLength,
      height: RANGE_THICKNESS,
      cursor: 'grab',
    } as const;
  }

  return {
    left: (RULER_THICKNESS - RANGE_THICKNESS) / 2,
    top: state.rangeStart,
    width: RANGE_THICKNESS,
    height: rangeLength,
    cursor: 'grab',
  } as const;
}

/**
 * RulerOverlay - 可拖动测量标尺
 * 真实尺身样式，内部带可拖动测量范围
 */
export function RulerOverlay() {
  const [isRulerMode] = useAtom(isRulerModeAtom);
  const [rulerState, setRulerState] = useAtom(rulerStateAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    origin: RulerState;
  } | null>(null);

  useEffect(() => {
    if (isRulerMode && !rulerState) {
      setRulerState(getDefaultRulerState());
      return;
    }

    if (rulerState) {
      const normalized = normalizeRulerState(rulerState);
      if (
        normalized.x !== rulerState.x ||
        normalized.y !== rulerState.y ||
        normalized.length !== rulerState.length ||
        normalized.rangeStart !== rulerState.rangeStart ||
        normalized.rangeEnd !== rulerState.rangeEnd
      ) {
        setRulerState(normalized);
      }
    }
  }, [isRulerMode, rulerState, setRulerState]);

  useEffect(() => {
    if (!isRulerMode) {
      dragRef.current = null;
    }
  }, [isRulerMode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const { mode, startX, startY, origin } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const isHorizontal = origin.orientation === 'horizontal';

      setRulerState(() => {
        const next = { ...origin };

        if (isHorizontal) {
          const outerRight = origin.x + origin.length;

          if (mode === 'move') {
            const maxX = Math.max(EDGE_PADDING, getViewportWidth() - origin.length - EDGE_PADDING);
            next.x = clamp(origin.x + dx, EDGE_PADDING, maxX);
            next.y = clamp(origin.y + dy, EDGE_PADDING, Math.max(EDGE_PADDING, getViewportHeight() - EDGE_PADDING));
            return normalizeRulerState(next);
          }

          if (mode === 'outer-start') {
            const nextX = clamp(origin.x + dx, EDGE_PADDING, outerRight - MIN_RULER_LENGTH);
            next.x = nextX;
            next.length = outerRight - nextX;
            const shift = nextX - origin.x;
            next.rangeStart = clamp(origin.rangeStart - shift, 0, Math.max(0, next.length - MIN_RANGE_LENGTH));
            next.rangeEnd = clamp(origin.rangeEnd - shift, next.rangeStart + MIN_RANGE_LENGTH, next.length);
            return normalizeRulerState(next);
          }

          if (mode === 'outer-end') {
            const nextRight = clamp(outerRight + dx, origin.x + MIN_RULER_LENGTH, getViewportWidth() - EDGE_PADDING);
            next.length = nextRight - origin.x;
            return normalizeRulerState(next);
          }

          if (mode === 'range-move') {
            const rangeLength = getOuterRange(origin);
            const nextStart = clamp(origin.rangeStart + dx, 0, origin.length - rangeLength);
            next.rangeStart = nextStart;
            next.rangeEnd = nextStart + rangeLength;
            return normalizeRulerState(next);
          }

          if (mode === 'range-start') {
            const nextStart = clamp(origin.rangeStart + dx, 0, origin.rangeEnd - MIN_RANGE_LENGTH);
            next.rangeStart = nextStart;
            return normalizeRulerState(next);
          }

          const nextEnd = clamp(origin.rangeEnd + dx, origin.rangeStart + MIN_RANGE_LENGTH, origin.length);
          next.rangeEnd = nextEnd;
          return normalizeRulerState(next);
        }

        const outerBottom = origin.y + origin.length;

        if (mode === 'move') {
          next.x = clamp(origin.x + dx, EDGE_PADDING, Math.max(EDGE_PADDING, getViewportWidth() - EDGE_PADDING));
          const maxY = Math.max(EDGE_PADDING, getViewportHeight() - origin.length - EDGE_PADDING);
          next.y = clamp(origin.y + dy, EDGE_PADDING, maxY);
          return normalizeRulerState(next);
        }

        if (mode === 'outer-start') {
          const nextY = clamp(origin.y + dy, EDGE_PADDING, outerBottom - MIN_RULER_LENGTH);
          next.y = nextY;
          next.length = outerBottom - nextY;
          const shift = nextY - origin.y;
          next.rangeStart = clamp(origin.rangeStart - shift, 0, Math.max(0, next.length - MIN_RANGE_LENGTH));
          next.rangeEnd = clamp(origin.rangeEnd - shift, next.rangeStart + MIN_RANGE_LENGTH, next.length);
          return normalizeRulerState(next);
        }

        if (mode === 'outer-end') {
          const nextBottom = clamp(outerBottom + dy, origin.y + MIN_RULER_LENGTH, getViewportHeight() - EDGE_PADDING);
          next.length = nextBottom - origin.y;
          return normalizeRulerState(next);
        }

        if (mode === 'range-move') {
          const rangeLength = getOuterRange(origin);
          const nextStart = clamp(origin.rangeStart + dy, 0, origin.length - rangeLength);
          next.rangeStart = nextStart;
          next.rangeEnd = nextStart + rangeLength;
          return normalizeRulerState(next);
        }

        if (mode === 'range-start') {
          const nextStart = clamp(origin.rangeStart + dy, 0, origin.rangeEnd - MIN_RANGE_LENGTH);
          next.rangeStart = nextStart;
          return normalizeRulerState(next);
        }

        const nextEnd = clamp(origin.rangeEnd + dy, origin.rangeStart + MIN_RANGE_LENGTH, origin.length);
        next.rangeEnd = nextEnd;
        return normalizeRulerState(next);
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setRulerState]);

  const handleToggleOrientation = () => {
    setRulerState((current) => {
      if (!current) return current;

      if (current.orientation === 'horizontal') {
        const centerX = current.x + current.length / 2;
        const centerY = current.y;
        return normalizeRulerState({
          orientation: 'vertical',
          x: clamp(centerX, EDGE_PADDING, window.innerWidth - EDGE_PADDING),
          y: clamp(
            round(centerY - current.length / 2),
            EDGE_PADDING,
            Math.max(EDGE_PADDING, window.innerHeight - current.length - EDGE_PADDING)
          ),
          length: current.length,
          rangeStart: current.rangeStart,
          rangeEnd: current.rangeEnd,
        });
      }

      const centerX = current.x;
      const centerY = current.y + current.length / 2;
      return normalizeRulerState({
        orientation: 'horizontal',
        x: clamp(
          round(centerX - current.length / 2),
          EDGE_PADDING,
          Math.max(EDGE_PADDING, window.innerWidth - current.length - EDGE_PADDING)
        ),
        y: clamp(centerY, EDGE_PADDING, Math.max(EDGE_PADDING, window.innerHeight - EDGE_PADDING)),
        length: current.length,
        rangeStart: current.rangeStart,
        rangeEnd: current.rangeEnd,
      });
    });
  };

  const rulerBox = useMemo(() => {
    if (!rulerState) return null;

    if (rulerState.orientation === 'horizontal') {
      return {
        left: rulerState.x,
        top: rulerState.y,
        width: rulerState.length,
        height: RULER_THICKNESS,
        cursor: 'move',
      } as const;
    }

    return {
      left: rulerState.x,
      top: rulerState.y,
      width: RULER_THICKNESS,
      height: rulerState.length,
      cursor: 'move',
    } as const;
  }, [rulerState]);

  const scaleMarks = useMemo(() => {
    if (!rulerState) return [];
    return buildScaleMarks(rulerState.length);
  }, [rulerState]);

  const rangeBox = useMemo(() => {
    if (!rulerState) return null;
    return getRangeBox(rulerState);
  }, [rulerState]);

  if (!isRulerMode || !rulerState || !rulerBox || !rangeBox) return null;

  const isHorizontal = rulerState.orientation === 'horizontal';
  const shellBg = isDarkMode ? '#25202b' : '#f3e6cf';
  const shellEdge = isDarkMode ? '#8c7a94' : '#8b6a3d';
  const shellShadow = isDarkMode ? '0 18px 40px rgba(0, 0, 0, 0.42)' : '0 18px 40px rgba(94, 62, 21, 0.20)';
  const measureLine = isDarkMode ? 'rgba(250, 244, 255, 0.88)' : 'rgba(58, 40, 16, 0.88)';
  const minorTick = isDarkMode ? 'rgba(250, 244, 255, 0.58)' : 'rgba(58, 40, 16, 0.58)';
  const mediumTick = isDarkMode ? 'rgba(250, 244, 255, 0.76)' : 'rgba(58, 40, 16, 0.78)';
  const majorTick = isDarkMode ? 'rgba(147, 197, 253, 1)' : 'rgba(146, 90, 8, 1)';
  const rangeFill = isDarkMode ? 'rgba(96, 165, 250, 0.24)' : 'rgba(37, 99, 235, 0.14)';
  const rangeStroke = isDarkMode ? 'rgba(96, 165, 250, 0.88)' : 'rgba(37, 99, 235, 0.88)';
  const labelBg = isDarkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 252, 245, 0.96)';
  const labelText = isDarkMode ? '#e5eefc' : '#1f2937';

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100120 }} data-ruler-overlay>
      <div
        className={clsx('absolute pointer-events-auto select-none overflow-visible')}
        style={{
          left: rulerBox.left,
          top: rulerBox.top,
          width: rulerBox.width,
          height: rulerBox.height,
          cursor: rulerBox.cursor,
          background: shellBg,
          border: `1px solid ${shellEdge}`,
          boxShadow: shellShadow,
          borderRadius: 0,
        }}
        data-ruler-shell
        data-ruler-handle="move"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          dragRef.current = {
            mode: 'move',
            startX: e.clientX,
            startY: e.clientY,
            origin: rulerState,
          };
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDarkMode
              ? 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.70), rgba(242,229,204,0.92))',
          }}
        />

        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: isHorizontal ? 0 : '50%',
            top: isHorizontal ? '50%' : 0,
            width: isHorizontal ? '100%' : 1,
            height: isHorizontal ? 1 : '100%',
            transform: isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)',
            background: `linear-gradient(${isHorizontal ? '90deg' : '180deg'}, transparent 0%, ${measureLine} 16%, ${measureLine} 84%, transparent 100%)`,
          }}
        />

        {scaleMarks.map((mark) => {
          if (isHorizontal) {
            const tickColor = mark.kind === 'major' ? majorTick : mark.kind === 'medium' ? mediumTick : minorTick;
            return (
              <Fragment key={`h-${mark.position}`}>
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: mark.position,
                    top: 0,
                    width: 1,
                    height: mark.height,
                    backgroundColor: tickColor,
                    boxShadow: `0 0 0 1px ${isDarkMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)'}`,
                  }}
                  data-ruler-tick={mark.position}
                  data-ruler-edge={
                    mark.position === 0 ? 'start' : mark.position === rulerState.length ? 'end' : undefined
                  }
                  data-ruler-side="top"
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: mark.position,
                    bottom: 0,
                    width: 1,
                    height: mark.height,
                    backgroundColor: tickColor,
                    boxShadow: `0 0 0 1px ${isDarkMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)'}`,
                  }}
                  data-ruler-tick={mark.position}
                  data-ruler-edge={
                    mark.position === 0 ? 'start' : mark.position === rulerState.length ? 'end' : undefined
                  }
                  data-ruler-side="bottom"
                />
              </Fragment>
            );
          }

          const tickTop = mark.position;
          const tickColor = mark.kind === 'major' ? majorTick : mark.kind === 'medium' ? mediumTick : minorTick;
          return (
            <Fragment key={`v-${mark.position}`}>
              <div
                className="absolute pointer-events-none"
                style={{
                  top: tickTop,
                  left: 0,
                  height: 1,
                  width: mark.height,
                  backgroundColor: tickColor,
                  boxShadow: `0 0 0 1px ${isDarkMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)'}`,
                }}
                data-ruler-tick={mark.position}
                data-ruler-edge={
                  mark.position === 0 ? 'start' : mark.position === rulerState.length ? 'end' : undefined
                }
                data-ruler-side="left"
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  top: tickTop,
                  right: 0,
                  height: 1,
                  width: mark.height,
                  backgroundColor: tickColor,
                  boxShadow: `0 0 0 1px ${isDarkMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)'}`,
                }}
                data-ruler-tick={mark.position}
                data-ruler-edge={
                  mark.position === 0 ? 'start' : mark.position === rulerState.length ? 'end' : undefined
                }
                data-ruler-side="right"
              />
            </Fragment>
          );
        })}

        {scaleMarks
          .filter((mark) => mark.label)
          .map((mark) =>
            isHorizontal ? (
              <div
                key={`hl-${mark.position}`}
                className="absolute pointer-events-none"
                style={{
                  left: mark.position,
                  top: 44,
                  transform:
                    mark.position === 0
                      ? 'translateX(0)'
                      : mark.position === rulerState.length
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)',
                  color: labelText,
                  fontSize: 10,
                  lineHeight: '12px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 2,
                  background: labelBg,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(31, 41, 55, 0.08)'}`,
                  boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.30)' : '0 2px 6px rgba(94,62,21,0.10)',
                }}
                data-ruler-label={`mark-${mark.position}`}
              >
                {mark.label}
              </div>
            ) : (
              <div
                key={`vl-${mark.position}`}
                className="absolute pointer-events-none"
                style={{
                  top: mark.position,
                  left: 44,
                  transform:
                    mark.position === 0
                      ? 'translateY(0)'
                      : mark.position === rulerState.length
                        ? 'translateY(-100%)'
                        : 'translateY(-50%)',
                  color: labelText,
                  fontSize: 10,
                  lineHeight: '12px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 2,
                  background: labelBg,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(31, 41, 55, 0.08)'}`,
                  boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.30)' : '0 2px 6px rgba(94,62,21,0.10)',
                }}
                data-ruler-label={`mark-${mark.position}`}
              >
                {mark.label}
              </div>
            )
          )}

        <button
          type="button"
          className="absolute pointer-events-auto"
          title="切换垂直/水平"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleOrientation();
          }}
          style={{
            right: 10,
            top: 8,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(31,41,55,0.10)'}`,
            background: labelBg,
            color: labelText,
            borderRadius: 2,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 700,
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.12)',
            cursor: 'pointer',
          }}
        >
          {isHorizontal ? '↕' : '↔'}
        </button>

        <div
          className="absolute pointer-events-none"
          style={{
            right: 56,
            top: 8,
            padding: '2px 8px',
            borderRadius: 2,
            background: labelBg,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(31,41,55,0.08)'}`,
            color: labelText,
            fontSize: 11,
            fontWeight: 700,
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.10)',
          }}
          data-ruler-label="outer-length"
        >
          {formatLength(rulerState.length)}
        </div>

        <div
          className="absolute pointer-events-auto"
          style={{
            left: rangeBox.left,
            top: rangeBox.top,
            width: rangeBox.width,
            height: rangeBox.height,
            cursor: rangeBox.cursor,
          }}
          data-ruler-range="selection"
          data-ruler-handle="range-move"
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            dragRef.current = {
              mode: 'range-move',
              startX: e.clientX,
              startY: e.clientY,
              origin: rulerState,
            };
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: rangeFill,
              border: `1px solid ${rangeStroke}`,
              boxShadow: isDarkMode
                ? 'inset 0 0 0 1px rgba(255,255,255,0.04)'
                : 'inset 0 0 0 1px rgba(255,255,255,0.30)',
              borderRadius: 0,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: isDarkMode
                ? 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))',
              borderRadius: 0,
            }}
          />

          {isHorizontal ? (
            <>
              <button
                type="button"
                title="拖动范围起点"
                className="absolute pointer-events-auto"
                style={{
                  left: -2,
                  top: '50%',
                  transform: 'translate(-100%, -50%)',
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: 0,
                  border: `1px solid ${rangeStroke}`,
                  background: labelBg,
                  cursor: 'ew-resize',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.12)',
                }}
                data-ruler-range-handle="start"
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  e.stopPropagation();
                  dragRef.current = {
                    mode: 'range-start',
                    startX: e.clientX,
                    startY: e.clientY,
                    origin: rulerState,
                  };
                }}
              />
              <button
                type="button"
                title="拖动范围终点"
                className="absolute pointer-events-auto"
                style={{
                  right: -2,
                  top: '50%',
                  transform: 'translate(100%, -50%)',
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: 0,
                  border: `1px solid ${rangeStroke}`,
                  background: labelBg,
                  cursor: 'ew-resize',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.12)',
                }}
                data-ruler-range-handle="end"
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  e.stopPropagation();
                  dragRef.current = {
                    mode: 'range-end',
                    startX: e.clientX,
                    startY: e.clientY,
                    origin: rulerState,
                  };
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: -22,
                  transform: 'translateX(-50%)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: labelBg,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(31,41,55,0.08)'}`,
                  color: labelText,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.10)',
                }}
                data-ruler-label="range"
              >
                {formatLength(getOuterRange(rulerState))}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                title="拖动范围起点"
                className="absolute pointer-events-auto"
                style={{
                  left: '50%',
                  top: -2,
                  transform: 'translate(-50%, -100%)',
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: 0,
                  border: `1px solid ${rangeStroke}`,
                  background: labelBg,
                  cursor: 'ns-resize',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.12)',
                }}
                data-ruler-range-handle="start"
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  e.stopPropagation();
                  dragRef.current = {
                    mode: 'range-start',
                    startX: e.clientX,
                    startY: e.clientY,
                    origin: rulerState,
                  };
                }}
              />
              <button
                type="button"
                title="拖动范围终点"
                className="absolute pointer-events-auto"
                style={{
                  left: '50%',
                  bottom: -2,
                  transform: 'translate(-50%, 100%)',
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: 0,
                  border: `1px solid ${rangeStroke}`,
                  background: labelBg,
                  cursor: 'ns-resize',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.12)',
                }}
                data-ruler-range-handle="end"
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  e.stopPropagation();
                  dragRef.current = {
                    mode: 'range-end',
                    startX: e.clientX,
                    startY: e.clientY,
                    origin: rulerState,
                  };
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  left: -22,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: labelBg,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(31,41,55,0.08)'}`,
                  color: labelText,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.24)' : '0 2px 8px rgba(94,62,21,0.10)',
                }}
                data-ruler-label="range"
              >
                {formatLength(getOuterRange(rulerState))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          className="absolute pointer-events-auto"
          title="调整外尺起点"
          style={{
            left: isHorizontal ? 0 : '50%',
            top: isHorizontal ? '50%' : 0,
            transform: isHorizontal ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)',
            width: isHorizontal ? 12 : 28,
            height: isHorizontal ? 30 : 12,
            borderRadius: 0,
            border: `1px solid ${shellEdge}`,
            background: isDarkMode ? '#22180f' : '#efe2c6',
            cursor: isHorizontal ? 'ew-resize' : 'ns-resize',
            boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.34)' : '0 2px 6px rgba(94,62,21,0.14)',
          }}
          data-ruler-handle="outer-start"
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            dragRef.current = {
              mode: 'outer-start',
              startX: e.clientX,
              startY: e.clientY,
              origin: rulerState,
            };
          }}
        />

        <button
          type="button"
          className="absolute pointer-events-auto"
          title="调整外尺终点"
          style={{
            right: isHorizontal ? 0 : '50%',
            bottom: isHorizontal ? '50%' : 0,
            transform: isHorizontal ? 'translate(50%, 50%)' : 'translate(50%, 50%)',
            width: isHorizontal ? 12 : 28,
            height: isHorizontal ? 30 : 12,
            borderRadius: 0,
            border: `1px solid ${shellEdge}`,
            background: isDarkMode ? '#22180f' : '#efe2c6',
            cursor: isHorizontal ? 'ew-resize' : 'ns-resize',
            boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.34)' : '0 2px 6px rgba(94,62,21,0.14)',
          }}
          data-ruler-handle="outer-end"
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            dragRef.current = {
              mode: 'outer-end',
              startX: e.clientX,
              startY: e.clientY,
              origin: rulerState,
            };
          }}
        />
      </div>
    </div>
  );
}
