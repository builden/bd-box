import { memo, useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { COMPONENT_REGISTRY, DEFAULT_SIZES, type ComponentType } from '../types';
import { activeDesignComponentAtom, designPlacementsAtom, isLayoutModeAtom } from '../store';
import { isDarkModeAtom } from '@/shared/features/SettingsPanel/store';
import { isActiveAtom } from '@/shared/features/ToggleButton/store';

const PANEL_WIDTH = 256;
const PANEL_HEIGHT = 320;
const EDGE_PADDING = 10;
const SPACING = '0.5rem';

// =============================================================================
// Rolling Count Animation (from aivis)
// =============================================================================

function RollingCount({ value, suffix }: { value: number; suffix?: string }) {
  const [prev, setPrev] = useState<number | null>(null);
  const [prevSuffix, setPrevSuffix] = useState(suffix);
  const [dir, setDir] = useState<'up' | 'down'>('up');
  const cur = useRef(value);
  const curSuffix = useRef(suffix);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const suffixChanged = prev !== null && prevSuffix !== suffix;

  useEffect(() => {
    if (value !== cur.current) {
      // Skip animation when hitting 0 — footer is about to collapse anyway
      if (value === 0) {
        cur.current = value;
        curSuffix.current = suffix;
        setPrev(null);
        return;
      }
      setDir(value > cur.current ? 'up' : 'down');
      setPrev(cur.current);
      setPrevSuffix(curSuffix.current);
      cur.current = value;
      curSuffix.current = suffix;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setPrev(null), 250);
    } else {
      curSuffix.current = suffix;
    }
  }, [value, suffix]);

  if (prev === null) {
    return (
      <span>
        {value}
        {suffix ? ` ${suffix}` : ''}
      </span>
    );
  }

  if (suffixChanged) {
    // Suffix changed — roll the whole label
    return (
      <span className="relative inline-block overflow-hidden">
        <span style={{ visibility: 'hidden' }}>
          {value} {suffix}
        </span>
        <span
          key={`o${prev}-${value}`}
          className={`absolute left-0 top-0 ${dir === 'up' ? 'animate-roll-exit-up' : 'animate-roll-exit-down'}`}
        >
          {prev} {prevSuffix}
        </span>
        <span
          key={`n${value}`}
          className={`absolute left-0 top-0 ${dir === 'up' ? 'animate-roll-enter-up' : 'animate-roll-enter-down'}`}
        >
          {value} {suffix}
        </span>
      </span>
    );
  }

  // Only number changed — roll just the number
  return (
    <span className="relative inline-block overflow-hidden">
      <span style={{ visibility: 'hidden' }}>{value}</span>
      <span
        key={`o${prev}-${value}`}
        className={`absolute left-0 top-0 ${dir === 'up' ? 'animate-roll-exit-up' : 'animate-roll-exit-down'}`}
      >
        {prev}
      </span>
      <span
        key={`n${value}`}
        className={`absolute left-0 top-0 ${dir === 'up' ? 'animate-roll-enter-up' : 'animate-roll-enter-down'}`}
      >
        {value}
      </span>
      {suffix ? ` ${suffix}` : ''}
    </span>
  );
}

// =============================================================================
// SVG Icons (from aivis palette.tsx)
// =============================================================================

function PaletteIconSvg({ type }: { type: ComponentType }) {
  const s = 'currentColor';
  const sw = '0.5';

  switch (type) {
    case 'navigation':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1" y="4" width="18" height="8" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="2.5" y="7" width="3" height="1.5" rx=".5" fill={s} opacity=".4" />
          <rect x="7" y="7" width="2.5" height="1.5" rx=".5" fill={s} opacity=".25" />
          <rect x="11" y="7" width="2.5" height="1.5" rx=".5" fill={s} opacity=".25" />
        </svg>
      );
    case 'header':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1" y="2" width="18" height="12" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="3" y="5.5" width="8" height="2" rx=".5" fill={s} opacity=".35" />
          <rect x="3" y="9" width="12" height="1" rx=".5" fill={s} opacity=".15" />
        </svg>
      );
    case 'hero':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1" y="1" width="18" height="14" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="5" y="5" width="10" height="1.5" rx=".5" fill={s} opacity=".35" />
          <rect x="7" y="8" width="6" height="1" rx=".5" fill={s} opacity=".15" />
          <rect x="7.5" y="10.5" width="5" height="2.5" rx="1" stroke={s} strokeWidth={sw} />
        </svg>
      );
    case 'section':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1" y="1" width="18" height="14" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="3" y="4" width="6" height="1" rx=".5" fill={s} opacity=".3" />
          <rect x="3" y="6.5" width="14" height="1" rx=".5" fill={s} opacity=".15" />
          <rect x="3" y="9" width="10" height="1" rx=".5" fill={s} opacity=".15" />
        </svg>
      );
    case 'sidebar':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1" y="1" width="7" height="14" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="2.5" y="4" width="4" height="1" rx=".5" fill={s} opacity=".3" />
          <rect x="2.5" y="6.5" width="3.5" height="1" rx=".5" fill={s} opacity=".15" />
          <rect x="2.5" y="9" width="4" height="1" rx=".5" fill={s} opacity=".15" />
        </svg>
      );
    case 'footer':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1" y="7" width="18" height="8" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="3" y="9.5" width="4" height="1" rx=".5" fill={s} opacity=".25" />
          <rect x="9" y="9.5" width="4" height="1" rx=".5" fill={s} opacity=".25" />
          <rect x="15" y="9.5" width="3" height="1" rx=".5" fill={s} opacity=".2" />
        </svg>
      );
    case 'modal':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="3" y="2" width="14" height="12" rx="1.5" stroke={s} strokeWidth={sw} />
          <rect x="5" y="4.5" width="7" height="1" rx=".5" fill={s} opacity=".3" />
          <rect x="5" y="7" width="10" height="1" rx=".5" fill={s} opacity=".15" />
          <rect x="11" y="11" width="5" height="2" rx=".75" stroke={s} strokeWidth={sw} />
        </svg>
      );
    case 'divider':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <line x1="2" y1="8" x2="18" y2="8" stroke={s} strokeWidth="0.5" opacity=".3" />
        </svg>
      );
    case 'card':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="2" y="1" width="16" height="14" rx="1.5" stroke={s} strokeWidth={sw} />
          <rect x="2" y="1" width="16" height="5.5" rx="1" fill={s} opacity=".04" />
          <rect x="4" y="8.5" width="8" height="1" rx=".5" fill={s} opacity=".25" />
          <rect x="4" y="11" width="11" height="1" rx=".5" fill={s} opacity=".12" />
        </svg>
      );
    case 'button':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="3" y="5" width="14" height="6" rx="2" stroke={s} strokeWidth={sw} />
          <rect x="6.5" y="7.5" width="7" height="1" rx=".5" fill={s} opacity=".25" />
        </svg>
      );
    case 'input':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="2" y="4" width="5.5" height="1" rx=".5" fill={s} opacity=".25" />
          <rect x="2" y="6.5" width="16" height="5.5" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="3.5" y="8.5" width="7" height="1" rx=".5" fill={s} opacity=".12" />
        </svg>
      );
    case 'avatar':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <circle cx="10" cy="8" r="6" stroke={s} strokeWidth={sw} />
          <circle cx="10" cy="6.5" r="2" stroke={s} strokeWidth={sw} />
          <path d="M6.5 13c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" stroke={s} strokeWidth={sw} />
        </svg>
      );
    case 'badge':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="3" y="5" width="14" height="6" rx="3" stroke={s} strokeWidth={sw} />
          <rect x="6" y="7.5" width="8" height="1" rx=".5" fill={s} opacity=".25" />
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="2" y="4" width="14" height="1.5" rx=".5" fill={s} opacity=".3" />
          <rect x="2" y="7" width="11" height="1" rx=".5" fill={s} opacity=".15" />
          <rect x="2" y="9.5" width="13" height="1" rx=".5" fill={s} opacity=".15" />
          <rect x="2" y="12" width="8" height="1" rx=".5" fill={s} opacity=".12" />
        </svg>
      );
    case 'image':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="2" y="2" width="16" height="12" rx="1" stroke={s} strokeWidth={sw} />
          <line x1="2" y1="2" x2="18" y2="14" stroke={s} strokeWidth=".3" opacity=".25" />
          <line x1="18" y1="2" x2="2" y2="14" stroke={s} strokeWidth=".3" opacity=".25" />
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1" y="2" width="18" height="12" rx="1" stroke={s} strokeWidth={sw} />
          <line x1="1" y1="5.5" x2="19" y2="5.5" stroke={s} strokeWidth=".3" opacity=".25" />
          <line x1="1" y1="9" x2="19" y2="9" stroke={s} strokeWidth=".3" opacity=".25" />
          <line x1="7" y1="2" x2="7" y2="14" stroke={s} strokeWidth=".3" opacity=".25" />
          <line x1="13" y1="2" x2="13" y2="14" stroke={s} strokeWidth=".3" opacity=".25" />
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="1.5" y="2" width="7" height="5.5" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="11.5" y="2" width="7" height="5.5" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="1.5" y="9.5" width="7" height="5.5" rx="1" stroke={s} strokeWidth={sw} />
          <rect x="11.5" y="9.5" width="7" height="5.5" rx="1" stroke={s} strokeWidth={sw} />
        </svg>
      );
    case 'list':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <circle cx="3.5" cy="4.5" r="1" stroke={s} strokeWidth={sw} />
          <rect x="6.5" y="4" width="10" height="1" rx=".5" fill={s} opacity=".2" />
          <circle cx="3.5" cy="8" r="1" stroke={s} strokeWidth={sw} />
          <rect x="6.5" y="7.5" width="8" height="1" rx=".5" fill={s} opacity=".2" />
          <circle cx="3.5" cy="11.5" r="1" stroke={s} strokeWidth={sw} />
          <rect x="6.5" y="11" width="11" height="1" rx=".5" fill={s} opacity=".2" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="3" y="9" width="2.5" height="4" rx=".5" fill={s} opacity=".2" />
          <rect x="7" y="6" width="2.5" height="7" rx=".5" fill={s} opacity=".25" />
          <rect x="11" y="3" width="2.5" height="10" rx=".5" fill={s} opacity=".3" />
          <rect x="15" y="5" width="2.5" height="8" rx=".5" fill={s} opacity=".2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
          <rect x="2" y="4" width="16" height="8" rx="1" stroke={s} strokeWidth={sw} />
        </svg>
      );
  }
}

// =============================================================================
// Component Item
// =============================================================================

const ComponentItem = memo(function ComponentItem({
  type,
  label,
  isActive,
  isDarkMode,
  onSelect,
  onDragStart,
}: {
  type: ComponentType;
  label: string;
  isActive: boolean;
  isDarkMode: boolean;
  onSelect: () => void;
  onDragStart?: (type: ComponentType, e: React.MouseEvent) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onClick={onSelect}
      onMouseDown={(e) => {
        if (e.button === 0 && onDragStart) {
          onDragStart(type, e);
          // 拖动时变成grabbing
          if (buttonRef.current) {
            buttonRef.current.style.cursor = 'grabbing';
          }
        }
      }}
      onMouseUp={() => {
        if (buttonRef.current) {
          buttonRef.current.style.cursor = '';
        }
      }}
      onMouseLeave={() => {
        if (buttonRef.current) {
          buttonRef.current.style.cursor = '';
        }
      }}
      className="flex items-center gap-3 px-2 py-1 rounded-md cursor-grab transition-all duration-150 border border-transparent min-h-6"
      style={{
        background: isActive ? '#3c82f6' : 'transparent',
      }}
    >
      {/* Icon */}
      <div
        className="w-5 h-4 rounded flex items-center justify-center shrink-0 overflow-hidden"
        style={{
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: isActive ? 'rgba(255,255,255,0.3)' : isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          color: isActive ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
        }}
      >
        <PaletteIconSvg type={type} />
      </div>
      {/* Label */}
      <span
        className="text-[13px] leading-tight truncate"
        style={{
          fontWeight: isActive ? 600 : 500,
          color: isActive ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
          letterSpacing: '-0.0094em',
        }}
      >
        {label}
      </span>
    </button>
  );
});

// =============================================================================
// Scroll Fade Helper
// =============================================================================

function scrollFadeClass(el: HTMLDivElement | null) {
  if (!el) return '';
  const top = el.scrollTop > 2;
  const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
  return `${top ? 'fadeTop' : ''} ${bottom ? 'fadeBottom' : ''}`;
}

// =============================================================================
// Main Component Panel
// =============================================================================

export const ComponentPanel = memo(function ComponentPanel() {
  const [activeComponent, setActiveComponent] = useAtom(activeDesignComponentAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [isActive] = useAtom(isActiveAtom);
  const [isLayoutMode] = useAtom(isLayoutModeAtom);
  const [placements, setPlacements] = useAtom(designPlacementsAtom);

  // Wireframe state
  const [blankCanvas, setBlankCanvas] = useState(false);
  const [wireframePurpose, setWireframePurpose] = useState('');

  // Scroll fade state - must be before any conditional return (Rules of Hooks)
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeClass, setFadeClass] = useState('');

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setFadeClass(scrollFadeClass(el));
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, []);

  // Only show when toolbar is expanded AND layout mode is active
  if (!isActive || !isLayoutMode) return null;

  const handleClearAll = () => {
    setPlacements([]);
    setActiveComponent(null);
  };

  const handleDragStart = (type: ComponentType, e: React.MouseEvent) => {
    e.preventDefault();
    const def = DEFAULT_SIZES[type];
    let preview: HTMLDivElement | null = null;
    let didDrag = false;
    const startX = e.clientX;
    const startY = e.clientY;

    // Find toolbar bottom for distance-based scaling
    const toolbar = (e.target as HTMLElement).closest('[data-feedback-toolbar]');
    const toolbarTop = toolbar?.getBoundingClientRect().top ?? window.innerHeight;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (!didDrag && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        didDrag = true;
        preview = document.createElement('div');
        // 线框图模式用橙色，普通模式用蓝色
        const isWireframe = blankCanvas;
        preview.className =
          'fixed pointer-events-none z-[100002] border border-dashed rounded flex items-center justify-center uppercase font-semibold';
        preview.style.borderColor = isWireframe ? '#f97316' : '#3c82f6';
        preview.style.color = isWireframe ? '#f97316' : '#3c82f6';
        preview.style.background = isWireframe ? 'rgba(249, 115, 22, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        preview.style.boxShadow = isWireframe
          ? '0 4px 16px rgba(249, 115, 22, 0.15)'
          : '0 4px 16px rgba(59, 130, 246, 0.15)';
        preview.style.width = '28px';
        preview.style.height = '20px';
        preview.style.fontSize = '9px';
        preview.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        preview.style.letterSpacing = '0.04em';
        preview.style.backdropFilter = 'blur(8px)';
        preview.style.opacity = '0.5';
        document.body.appendChild(preview);
      }

      if (!preview) return;

      // Scale up as cursor moves away from toolbar
      const dist = Math.max(0, toolbarTop - ev.clientY);
      const progress = Math.min(1, dist / 180);
      const eased = 1 - Math.pow(1 - progress, 2); // ease-out

      const minW = 28;
      const minH = 20;
      const maxW = Math.min(140, def.width * 0.18);
      const maxH = Math.min(90, def.height * 0.18);
      const w = minW + (maxW - minW) * eased;
      const h = minH + (maxH - minH) * eased;

      preview.style.width = `${w}px`;
      preview.style.height = `${h}px`;
      preview.style.left = `${ev.clientX - w / 2}px`;
      preview.style.top = `${ev.clientY - h / 2}px`;
      preview.style.opacity = `${0.5 + 0.5 * eased}`;
      preview.textContent = eased > 0.25 ? type : '';
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (preview) {
        document.body.removeChild(preview);
      }

      if (didDrag) {
        const w = def.width;
        const h = def.height;
        const scrollY = window.scrollY;
        const x = Math.max(0, ev.clientX - w / 2);
        const y = Math.max(0, ev.clientY - h / 2);
        const placement = {
          id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          x,
          y,
          width: w,
          height: h,
          scrollY,
          timestamp: Date.now(),
        };
        setPlacements((prev) => [...prev, placement]);
        setActiveComponent(null);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 智能位置
  const toolbarRect = (document.querySelector('[data-no-drag]') as HTMLElement)?.parentElement?.getBoundingClientRect();
  const toolbarTop = toolbarRect?.top ?? window.innerHeight;
  const panelTopIfAbove = toolbarTop - PANEL_HEIGHT - 16;
  const showAbove = panelTopIfAbove >= EDGE_PADDING;

  return (
    <div
      className="absolute z-[100001] flex flex-col cursor-default"
      style={{
        right: 5,
        ...(showAbove ? { bottom: `calc(100% + ${SPACING})` } : { top: `calc(100% + ${SPACING})` }),
        width: PANEL_WIDTH,
        maxHeight: 402,
        background: isDarkMode ? '#1c1c1c' : '#fff',
        borderRadius: '1rem',
        padding: '13px 0 16px',
        overflow: 'hidden',
        boxShadow: isDarkMode
          ? '0 1px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)'
          : '0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
      data-no-drag
      data-no-hover
      data-feedback-toolbar
    >
      {/* Header */}
      <div className="px-4 pb-1">
        <div
          className="text-[13px] font-medium"
          style={{
            color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
            letterSpacing: '-0.0094em',
          }}
        >
          布局模式
        </div>
        <div
          className="text-[11px] font-light mt-0.5 leading-tight"
          style={{
            color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
          }}
        >
          重新排列和调整现有元素、添加新组件、探索布局想法。
        </div>
      </div>

      {/* Wireframe Toggle */}
      <button
        onClick={() => setBlankCanvas(!blankCanvas)}
        className="flex items-center justify-center gap-2 mx-4 my-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150"
        style={{
          background: blankCanvas ? '#f97316' : 'transparent',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ color: blankCanvas ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)' }}>
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1" />
            <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="7" cy="4.5" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="9.5" cy="4.5" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="4.5" cy="7" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="7" cy="7" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="9.5" cy="7" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="4.5" cy="9.5" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="7" cy="9.5" r="0.8" fill="currentColor" opacity=".6" />
            <circle cx="9.5" cy="9.5" r="0.8" fill="currentColor" opacity=".6" />
          </svg>
        </span>
        <span
          className="text-[13px]"
          style={{
            color: blankCanvas ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
            letterSpacing: '-0.0094em',
          }}
        >
          线框图新页面
        </span>
      </button>

      {/* Wireframe Purpose Textarea */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: blankCanvas ? '100px' : '0',
          opacity: blankCanvas ? 1 : 0,
          transition: 'max-height 0.2s ease, opacity 0.15s ease',
        }}
      >
        <textarea
          className="w-full resize-none outline-none text-[13px] px-4 py-1"
          style={{
            color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
            background: 'transparent',
            letterSpacing: '-0.0094em',
          }}
          placeholder="描述此页面以为 AI 代理提供额外上下文。"
          value={wireframePurpose}
          onChange={(e) => setWireframePurpose(e.target.value)}
          rows={2}
        />
      </div>

      {/* Component sections */}
      <div
        ref={scrollRef}
        className="overflow-y-auto px-4"
        style={{
          maxHeight: 240,
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? 'rgba(255,255,255,0.12) transparent' : 'rgba(0,0,0,0.1) transparent',
          ...(fadeClass.includes('fadeTop') && {
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 32px)',
            maskImage: 'linear-gradient(to bottom, transparent 0, black 32px)',
          }),
          ...(fadeClass.includes('fadeBottom') && {
            WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 32px), transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black calc(100% - 32px), transparent 100%)',
          }),
          ...(fadeClass.includes('fadeTop') &&
            fadeClass.includes('fadeBottom') && {
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
            }),
        }}
      >
        {COMPONENT_REGISTRY.map((section, sectionIdx) => (
          <div key={section.section}>
            {sectionIdx > 0 && (
              <div
                className="my-2 border-t"
                style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
              />
            )}
            <div
              className="text-[11px] font-medium pb-1"
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                letterSpacing: '-0.0094em',
                paddingLeft: 3,
              }}
            >
              {section.section}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <ComponentItem
                  key={item.type}
                  type={item.type}
                  label={item.label}
                  isActive={activeComponent === item.type}
                  isDarkMode={isDarkMode}
                  onSelect={() => setActiveComponent(activeComponent === item.type ? null : item.type)}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 mt-2 pt-2 min-h-6"
        style={{
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        }}
      >
        <span
          className="text-[13px]"
          style={{
            color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            letterSpacing: '-0.0094em',
          }}
        >
          {placements.length > 0 ? (
            <RollingCount value={placements.length} suffix={placements.length === 1 ? 'Change' : 'Changes'} />
          ) : (
            '选择组件'
          )}
        </span>
        <button
          onClick={handleClearAll}
          className="text-[13px] transition-colors"
          style={{
            color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            letterSpacing: '-0.0094em',
          }}
        >
          清除
        </button>
      </div>
    </div>
  );
});
