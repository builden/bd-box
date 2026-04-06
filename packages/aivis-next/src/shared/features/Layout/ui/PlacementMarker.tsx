import { memo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import clsx from 'clsx';
import { designPlacementsAtom, selectedPlacementIdAtom, activeDesignComponentAtom } from '../store';
import { isDarkModeAtom } from '@/shared/features/SettingsPanel/store';
import type { DesignPlacement } from '../types';

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface PlacementMarkerProps {
  placement: DesignPlacement;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onStartDrag: (id: string, e: React.MouseEvent) => void;
  onStartResize?: (id: string, dir: HandleDir, e: React.MouseEvent) => void;
  wireframe?: boolean;
}

export const PlacementMarker = memo(function PlacementMarker({
  placement,
  isSelected,
  onSelect,
  onStartDrag,
  onStartResize,
  wireframe = false,
}: PlacementMarkerProps) {
  const setPlacements = useSetAtom(designPlacementsAtom);
  const setSelectedId = useSetAtom(selectedPlacementIdAtom);
  const [activeComponent] = useAtom(activeDesignComponentAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlacements((prev) => prev.filter((p) => p.id !== placement.id));
    setSelectedId(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(placement.id, e.shiftKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: text editing
  };

  const handleHandleMouseDown = (dir: HandleDir, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onStartResize?.(placement.id, dir, e);
  };

  const blue = '#3c82f7';
  const blueDim = 'rgba(59, 130, 246, 0.15)';
  const orangeDim = 'rgba(249, 115, 22, 0.15)';
  const activeColor = wireframe ? blue : blue;
  const activeDim = wireframe ? orangeDim : blueDim;

  return (
    <div
      className={clsx(
        'group absolute select-none',
        'rounded-md cursor-grab',
        'transition-all duration-150',
        // Default state
        !isSelected &&
          !wireframe &&
          'border border-dashed border-blue-400/40 bg-blue-500/5 hover:border-blue-400/50 hover:bg-blue-500/10',
        !isSelected &&
          wireframe &&
          'border border-dashed border-orange-400/40 bg-orange-500/5 hover:border-orange-400/50 hover:bg-orange-500/10',
        // Selected state
        isSelected && !wireframe && 'border-2 border-solid border-blue-500 bg-blue-500/10 shadow-blue-500/20',
        isSelected && wireframe && 'border-2 border-solid border-orange-500 bg-orange-500/10 shadow-orange-500/20'
      )}
      style={{
        left: placement.x,
        top: placement.y,
        width: placement.width,
        height: placement.height,
        zIndex: isSelected ? 100004 : 100003,
        boxShadow: isSelected
          ? `0 0 0 2px ${activeDim}, 0 2px 8px ${activeColor === blue ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)'}`
          : '0 1px 4px rgba(0,0,0,0.08)',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={(e) => {
        if (activeComponent) return;
        e.stopPropagation();
        onStartDrag(placement.id, e);
      }}
    >
      {/* Label - above the box */}
      <div
        className={clsx(
          'absolute text-[10px] font-semibold whitespace-nowrap select-none pointer-events-none',
          !wireframe && 'text-blue-500/70',
          wireframe && 'text-orange-500/70'
        )}
        style={{
          top: -18,
          left: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textShadow: '0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.5)',
        }}
      >
        {placement.type}
      </div>

      {/* Annotation text - below the label */}
      {placement.text && (
        <div
          className={clsx(
            'absolute text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis select-none pointer-events-none'
          )}
          style={{
            top: -2,
            left: 0,
            right: 0,
            color: 'rgba(0,0,0,0.5)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textShadow: '0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.6)',
          }}
        >
          {placement.text}
        </div>
      )}

      {/* Size indicator - bottom right */}
      <div
        className={clsx('absolute text-[9px] font-medium whitespace-nowrap select-none pointer-events-none')}
        style={{
          bottom: 4,
          right: 4,
          color: 'rgba(255,255,255,0.7)',
          background: 'rgba(0,0,0,0.5)',
          padding: '1px 5px',
          borderRadius: 3,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {Math.round(placement.width)}×{Math.round(placement.height)}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className={clsx(
          'absolute rounded-full flex items-center justify-center',
          'font-bold leading-none',
          'transition-all duration-150',
          // Hidden by default, shown on hover/selected
          'opacity-0 scale-80',
          'hover:opacity-100 hover:scale-110',
          'group-hover:opacity-100 group-hover:scale-100',
          isSelected && 'opacity-100 scale-100'
        )}
        style={{
          top: -8,
          right: -8,
          width: 18,
          height: 18,
          background: isDarkMode ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          color: 'rgba(0,0,0,0.35)',
          fontSize: 10,
          zIndex: 15,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        ×
      </button>

      {/* Resize handles */}
      <ResizeHandles
        placement={placement}
        onHandleMouseDown={handleHandleMouseDown}
        isSelected={isSelected}
        wireframe={wireframe}
      />
    </div>
  );
});

interface ResizeHandlesProps {
  placement: DesignPlacement;
  onHandleMouseDown: (dir: HandleDir, e: React.MouseEvent) => void;
  isSelected: boolean;
  wireframe: boolean;
}

function ResizeHandles({ placement, onHandleMouseDown, isSelected, wireframe }: ResizeHandlesProps) {
  const blue = '#3c82f7';
  const orange = '#f97316';
  const handleColor = wireframe ? orange : blue;

  const cornerHandles: HandleDir[] = ['nw', 'ne', 'se', 'sw'];

  // Edge bars with arrow indicators
  const edgeBars: { dir: HandleDir; cls: string }[] = [
    { dir: 'n', cls: 'top-0 left-3 right-3' },
    { dir: 's', cls: 'bottom-0 left-3 right-3' },
    { dir: 'e', cls: 'right-0 top-3 bottom-3' },
    { dir: 'w', cls: 'left-0 top-3 bottom-3' },
  ];

  return (
    <>
      {/* Corner handles - 8x8px, border-radius 2px, hidden by default */}
      {cornerHandles.map((h) => {
        const style = getCornerHandleStyle(h, placement);
        return (
          <div
            key={h}
            className={clsx(
              'absolute bg-white border rounded-sm transition-all duration-200',
              // Hidden by default, shown on parent hover/selected
              'opacity-0 scale-75',
              isSelected && 'opacity-100 scale-100'
            )}
            style={{
              width: 8,
              height: 8,
              borderColor: handleColor,
              borderWidth: 1.5,
              cursor: getCursor(h),
              zIndex: 12,
              boxShadow: '0 0 0 0.5px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.12)',
              transformOrigin: 'center',
              transition: 'opacity 0.2s ease-out, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              ...style,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHandleMouseDown(h, e);
            }}
          />
        );
      })}

      {/* Edge resize bars - pill shaped, shown on hover */}
      {edgeBars.map(({ dir, cls }) => {
        const isH = dir === 'n' || dir === 's';
        return (
          <div
            key={dir}
            className={clsx(
              'absolute flex items-center justify-center transition-all duration-150',
              'opacity-0 scale-90',
              isSelected && 'opacity-100 scale-100',
              'group-hover:opacity-100 group-hover:scale-100',
              cls
            )}
            style={{
              width: isH ? undefined : 12,
              height: isH ? 12 : undefined,
              cursor: getCursor(dir),
              zIndex: 11,
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHandleMouseDown(dir, e);
            }}
          >
            {/* Pill indicator */}
            <div
              className={clsx('absolute rounded transition-all duration-100', isH ? 'w-6 h-1' : 'w-1 h-6')}
              style={{
                background: handleColor,
                opacity: isSelected ? 0.85 : 0,
                transform: isSelected ? 'scale(1)' : 'scale(0.8)',
              }}
            />
            {/* Arrow */}
            <svg
              width={isH ? 8 : 6}
              height={isH ? 6 : 8}
              viewBox={isH ? '0 0 8 6' : '0 0 6 8'}
              fill="none"
              className="absolute transition-opacity duration-100"
              style={{ opacity: isSelected ? 1 : 0 }}
            >
              {isH ? (
                <path d={dir === 'n' ? 'M4 0.5L1 4.5h6z' : 'M4 5.5L1 1.5h6z'} fill={handleColor} />
              ) : (
                <path d={dir === 'e' ? 'M5.5 4L1.5 1v6z' : 'M0.5 4L4.5 1v6z'} fill={handleColor} />
              )}
            </svg>
          </div>
        );
      })}
    </>
  );
}

function getCornerHandleStyle(handle: HandleDir, _placement: DesignPlacement): React.CSSProperties {
  const offset = -4; // 8px handle, centered at -4px

  switch (handle) {
    case 'nw':
      return { left: offset, top: offset };
    case 'ne':
      return { right: offset, top: offset };
    case 'se':
      return { right: offset, bottom: offset };
    case 'sw':
      return { left: offset, bottom: offset };
    default:
      return {};
  }
}

function getCursor(dir: HandleDir): string {
  const map: Record<HandleDir, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
  };
  return map[dir];
}
