import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  isAnnotationModeAtom,
  pendingAnnotationAtom,
  editingAnnotationAtom,
  hoverAtom,
  popupShakeAtom,
  type PendingAnnotationData,
} from './store';
import { settingsAtom } from '@/shared/features/SettingsPanel/store';

/**
 * useAnnotationClickHandler - 处理标注模式下的页面点击
 * 在标注模式下，点击页面会创建待确认的标注
 * 编辑模式下点击其他地方会 shake
 */
export function useAnnotationClickHandler() {
  const [isAnnotationMode] = useAtom(isAnnotationModeAtom);
  const setPendingAnnotation = useSetAtom(pendingAnnotationAtom);
  const setHover = useSetAtom(hoverAtom);
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);
  const [editingAnnotation] = useAtom(editingAnnotationAtom);
  const [, setPopupShake] = useAtom(popupShakeAtom);
  const [settings] = useAtom(settingsAtom);

  useEffect(() => {
    if (!isAnnotationMode) return;

    const handleClick = (e: MouseEvent) => {
      // Don't create annotation if clicking on toolbar or settings
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]') || target.closest('[data-feedback-toolbar]')) {
        return;
      }

      // If editing annotation exists, shake edit popup and return
      if (editingAnnotation) {
        setPopupShake((prev) => prev + 1);
        return;
      }

      // If pending annotation exists, shake popup and return
      if (pendingAnnotation) {
        setPopupShake((prev) => prev + 1);
        return;
      }

      // Calculate position - use pixels for both x and y for consistency
      const x = e.clientX; // pixels from left
      const y = e.clientY; // pixels from top

      // Get element info
      const elementLabel = getElementLabel(target);
      const elementPath = getElementPath(target);
      const fullPath = getFullPath(target);
      const selectedText = window.getSelection()?.toString();
      const rect = target.getBoundingClientRect();

      // Get nearby text (text content around the element)
      const nearbyText = getNearbyText(target);

      // Get key computed styles
      const computedStyles = getKeyComputedStyles(target);

      // Create pending annotation for popup
      const pending: PendingAnnotationData = {
        x,
        y,
        clientY: e.clientY,
        element: elementLabel,
        elementPath,
        fullPath,
        rect,
        popupX: e.clientX,
        popupY: e.clientY,
        colorId: settings.annotationColorId,
        ...(selectedText ? { selectedText } : {}),
        ...(target.className ? { cssClasses: target.className } : {}),
        ...(rect
          ? {
              boundingBox: {
                x: rect.left,
                y: rect.top + window.scrollY, // 使用文档绝对位置
                width: rect.width,
                height: rect.height,
              },
            }
          : {}),
        ...(nearbyText ? { nearbyText } : {}),
        ...(computedStyles ? { computedStyles } : {}),
      };

      setPendingAnnotation(pending);

      // Keep hover highlight at click position
      setHover({
        x: e.clientX,
        y: e.clientY,
        clientY: e.clientY,
        element: elementLabel,
        elementPath: getElementPath(target),
        rect: target.getBoundingClientRect(),
        ...(selectedText ? { selectedText } : {}),
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [
    isAnnotationMode,
    setPendingAnnotation,
    setHover,
    setPopupShake,
    pendingAnnotation,
    editingAnnotation,
    settings.annotationColorId,
  ]);
}

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

// 获取完整的 DOM 路径
function getFullPath(target: HTMLElement): string {
  const path: string[] = [];
  let current: Element | null = target;

  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const el = current as HTMLElement;
    let selector = tag;

    if (el.id) {
      selector = `${tag}#${el.id}`;
      path.unshift(selector);
      break;
    }

    const className = typeof el.className === 'string' ? el.className : '';
    if (className) {
      const classes = className.split(' ').filter(Boolean);
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 3).join('.');
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

// 获取元素附近的文本（用于上下文）
function getNearbyText(target: HTMLElement): string {
  // 获取元素的直接文本内容
  const directText = target.textContent?.trim() || '';

  // 如果直接文本太长，获取父元素的文本作为上下文
  if (directText.length > 100) {
    const parent = target.parentElement;
    if (parent) {
      return parent.textContent?.trim().slice(0, 150) || '';
    }
  }

  return directText.slice(0, 100);
}

// 获取关键计算样式（用于调试布局问题）
function getKeyComputedStyles(target: HTMLElement): string {
  const el = target as HTMLElement;
  const styles = window.getComputedStyle(el);

  const keyProperties = [
    'display',
    'flex-direction',
    'justify-content',
    'align-items',
    'gap',
    'position',
    'top',
    'left',
    'width',
    'height',
    'margin',
    'padding',
    'border',
    'grid-template-columns',
    'grid-template-rows',
    'font-size',
    'color',
    'background-color',
  ];

  const result: string[] = [];

  for (const prop of keyProperties) {
    const value = styles.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
      result.push(`${prop}: ${value}`);
    }
  }

  return result.slice(0, 10).join('; ');
}

function getElementLabel(target: HTMLElement): string {
  const tag = target.tagName.toLowerCase();

  // For element label, use aria-label or name if available
  if (target.getAttribute('aria-label')) {
    return `<${tag}> [${target.getAttribute('aria-label')}]`;
  }
  const accessibleName = target.getAttribute('name') || target.getAttribute('alt') || target.getAttribute('title');
  if (accessibleName) {
    return `<${tag}> "${accessibleName.slice(0, 30)}"`;
  }

  // Return just the tag name without text content
  // Text content should be captured separately as selectedText if user selects it
  return `<${tag}>`;
}
