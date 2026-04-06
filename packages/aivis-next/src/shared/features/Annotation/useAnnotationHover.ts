import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { isAnnotationModeAtom, hoverAtom, pendingAnnotationAtom, editingAnnotationAtom } from './store';
import { settingsAtom } from '@/shared/features/SettingsPanel/store';

/**
 * useAnnotationHover - 处理标注模式下的鼠标悬浮
 * 鼠标移动时显示元素信息标签和目标高亮
 * 注意：当 popup 出现时（pendingAnnotation 存在），暂停 hover 逻辑保持高亮
 */
export function useAnnotationHover() {
  const [isAnnotationMode] = useAtom(isAnnotationModeAtom);
  const [, setHover] = useAtom(hoverAtom);
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);
  const [editingAnnotation] = useAtom(editingAnnotationAtom);
  const [settings] = useAtom(settingsAtom);

  useEffect(() => {
    if (!isAnnotationMode) return;

    // When popup is showing or editing annotation, pause hover logic
    if (pendingAnnotation || editingAnnotation) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't show hover info if clicking on toolbar or annotation markers
      if (
        target.closest('[data-no-drag]') ||
        target.closest('[data-no-hover]') ||
        target.closest('[data-feedback-toolbar]')
      ) {
        setHover(null);
        return;
      }

      // Get element info
      const element = target.closest('[data-element-path]') as HTMLElement | null;
      const elementPath = element?.dataset.elementPath || getElementPath(target);
      const elementLabel = getElementLabel(target);
      const selectedText = window.getSelection()?.toString();
      const reactComponents = settings.reactEnabled ? getReactComponentInfo(target) : undefined;

      setHover({
        x: e.clientX,
        y: e.clientY,
        clientY: e.clientY,
        element: elementLabel,
        elementPath,
        rect: target.getBoundingClientRect(),
        ...(selectedText ? { selectedText } : {}),
        ...(reactComponents ? { reactComponents } : {}),
      });
    };

    const handleMouseLeave = () => {
      setHover(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isAnnotationMode, setHover, pendingAnnotation, editingAnnotation, settings.reactEnabled]);
}

/**
 * Get element path for debugging
 */
function getElementPath(target: HTMLElement): string {
  const path: string[] = [];
  let current: Element | null = target;

  while (current && current !== document.body && path.length < 5) {
    const tag = current.tagName.toLowerCase();
    const el = current as HTMLElement;
    const id = el.id ? `#${el.id}` : '';
    const className = typeof el.className === 'string' ? el.className : '';
    const classes = className ? '.' + className.split(' ').filter(Boolean).slice(0, 2).join('.') : '';
    if (id || classes) {
      path.push(`${tag}${id}${classes}`);
    }
    current = current.parentElement;
  }

  return path.join(' > ') || target.tagName.toLowerCase();
}

/**
 * Get human-readable element label
 */
function getElementLabel(target: HTMLElement): string {
  // Try to get aria-label first
  if (target.getAttribute('aria-label')) {
    return target.getAttribute('aria-label')!;
  }

  // Try to get accessible name
  const accessibleName = target.getAttribute('name') || target.getAttribute('alt') || target.getAttribute('title');
  if (accessibleName) {
    return accessibleName;
  }

  // Fall back to tag + text content preview
  const text = target.textContent?.trim().slice(0, 50) || '';
  const tag = target.tagName.toLowerCase();

  if (text) {
    return `<${tag}> "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`;
  }

  return `<${tag}>`;
}

/**
 * 获取 React 组件层级信息
 * 支持 React 18/19 的 __reactContainer$ 格式
 */
function getReactComponentInfo(target: HTMLElement): string | undefined {
  let fiberKey: string | null = null;

  for (const key in target) {
    if (
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$') ||
      key.startsWith('__reactContainer$')
    ) {
      fiberKey = key;
      break;
    }
  }

  if (!fiberKey) {
    let parent = target.parentElement;
    while (parent && !fiberKey) {
      for (const key in parent) {
        if (
          key.startsWith('__reactFiber$') ||
          key.startsWith('__reactInternalInstance$') ||
          key.startsWith('__reactContainer$')
        ) {
          fiberKey = key;
          break;
        }
      }
      parent = parent.parentElement;
    }
  }

  if (!fiberKey) return undefined;

  const fiber = (target as unknown as Record<string, unknown>)[fiberKey];
  if (!fiber) return undefined;

  const componentNames: string[] = [];
  let current: unknown = fiber;

  for (let i = 0; i < 10 && current; i++) {
    const f = current as { type?: unknown; return?: unknown; stateNode?: unknown };

    if (f.type) {
      if (typeof f.type === 'function') {
        const name = f.type.name || 'Anonymous';
        componentNames.unshift(name);
      } else if (typeof f.type === 'string') {
        componentNames.unshift(f.type);
      }
    }

    current = f.return;
  }

  if (componentNames.length === 0) return undefined;

  return [...new Set(componentNames)].join(' > ');
}
