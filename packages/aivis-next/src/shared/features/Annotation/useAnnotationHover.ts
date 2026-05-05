import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { isAnnotationModeAtom, hoverAtom, pendingAnnotationAtom, editingAnnotationAtom } from './store';
import { settingsAtom } from '@/shared/features/SettingsPanel/store';
import { isExtensionUiElement } from '@/shared/utils/extension-ui';
import { formatSourceLocation, mapPositionWithSourceMap } from '@/shared/utils/source-location';
import { formatReactComponentPath } from '@/shared/utils/react-component-path';
import { requestReactProbe } from '@/shared/utils/react-probe';
import { buildAnnotationTargetContext } from './annotation-target-context';

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
  const hoverRequestSeq = useRef(0);

  useEffect(() => {
    if (!isAnnotationMode) return;

    // When popup is showing or editing annotation, pause hover logic
    if (pendingAnnotation || editingAnnotation) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't show hover info if clicking on toolbar or annotation markers
      if (target.closest('[data-no-drag]') || target.closest('[data-no-hover]') || isExtensionUiElement(target)) {
        setHover(null);
        return;
      }

      const selectedText = window.getSelection()?.toString();
      const targetContext = buildAnnotationTargetContext(target, selectedText || undefined, {
        includeForensic: false,
        labelVariant: 'hover',
        preferAnnotatedElementPath: true,
      });
      const baseHover = {
        x: e.clientX,
        y: e.clientY,
        clientY: e.clientY,
        element: targetContext.element,
        elementPath: targetContext.elementPath,
        rect: targetContext.rect,
        ...(targetContext.selectedText ? { selectedText: targetContext.selectedText } : {}),
      };

      setHover(baseHover);

      if (!settings.reactEnabled) return;

      const currentRequest = ++hoverRequestSeq.current;
      void (async () => {
        const probe = await requestReactProbe(e.clientX, e.clientY);
        if (currentRequest !== hoverRequestSeq.current) return;

        const reactComponents = probe?.reactComponents || getReactComponentInfo(target);
        const probeSource = probe?.source
          ? await mapPositionWithSourceMap(probe.source.fileName, probe.source.lineNumber, probe.source.columnNumber)
          : undefined;
        const sourceFile = probeSource ? formatSourceLocation(probeSource, 'path') : undefined;
        const vscodeUrl = probeSource ? formatSourceLocation(probeSource, 'vscode') : undefined;

        if (!reactComponents && !sourceFile && !vscodeUrl) {
          return;
        }

        setHover({
          ...baseHover,
          ...(reactComponents ? { reactComponents } : {}),
          ...(sourceFile ? { sourceFile } : {}),
          ...(vscodeUrl ? { vscodeUrl } : {}),
          ...(probe?.propsChain ? { propsChain: probe.propsChain } : {}),
        });
      })();
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
 * 获取 React 组件层级信息
 * 支持 React 18/19 的 __reactContainer$ 格式
 */
function getReactComponentInfo(target: HTMLElement): string | undefined {
  let fiberKey: string | null = null;

  let elementCursor: HTMLElement | null = target;
  while (elementCursor && !fiberKey) {
    for (const key in elementCursor) {
      if (
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$') ||
        key.startsWith('__reactContainer$')
      ) {
        fiberKey = key;
        break;
      }
    }
    elementCursor = elementCursor.parentElement;
  }

  if (!fiberKey) {
    return undefined;
  }

  let fiberTarget: HTMLElement | null = target;
  let fiber: unknown = undefined;
  while (fiberTarget && !fiber) {
    fiber = (fiberTarget as unknown as Record<string, unknown>)[fiberKey];
    fiberTarget = fiberTarget.parentElement;
  }

  if (!fiber) {
    return undefined;
  }

  const componentNames: string[] = [];
  let currentFiber: unknown = fiber;

  for (let i = 0; i < 10 && currentFiber; i++) {
    const f = currentFiber as { type?: unknown; return?: unknown; stateNode?: unknown };

    if (f.type) {
      if (typeof f.type === 'function') {
        const name = f.type.name || 'Anonymous';
        componentNames.unshift(name);
      } else if (typeof f.type === 'string') {
        componentNames.unshift(f.type);
      }
    }

    currentFiber = f.return;
  }

  if (componentNames.length === 0) return undefined;

  return formatReactComponentPath(componentNames);
}
