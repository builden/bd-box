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
      const selectedText = window.getSelection()?.toString();

      // Create pending annotation for popup
      const pending: PendingAnnotationData = {
        x,
        y,
        clientY: e.clientY,
        element: elementLabel,
        elementPath: getElementPath(target),
        rect: target.getBoundingClientRect(),
        popupX: e.clientX,
        popupY: e.clientY,
        colorId: settings.annotationColorId,
        ...(selectedText ? { selectedText } : {}),
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

function getElementLabel(target: HTMLElement): string {
  if (target.getAttribute('aria-label')) {
    return target.getAttribute('aria-label')!;
  }
  const accessibleName = target.getAttribute('name') || target.getAttribute('alt') || target.getAttribute('title');
  if (accessibleName) {
    return accessibleName;
  }
  const text = target.textContent?.trim().slice(0, 50) || '';
  const tag = target.tagName.toLowerCase();
  if (text) {
    return `<${tag}> "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`;
  }
  return `<${tag}>`;
}
