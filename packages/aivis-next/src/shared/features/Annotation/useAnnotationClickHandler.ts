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
import {
  getSourceLocationAsync,
  mapPositionWithSourceMap,
  formatSourceLocation,
  getPropsPropagationPath,
  withSourceMapDebugContext,
} from '@/shared/utils/source-location';
import { isExtensionUiElement } from '@/shared/utils/extension-ui';
import { formatReactComponentPath } from '@/shared/utils/react-component-path';
import { requestReactProbe } from '@/shared/utils/react-probe';
import { buildAnnotationTargetContext } from './annotation-target-context';

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

    const handleClick = async (e: MouseEvent) => {
      try {
        // Don't create annotation if clicking on toolbar or settings
        const target = e.target as HTMLElement;

        if (target.closest('[data-no-drag]') || isExtensionUiElement(target)) {
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

        const x = e.clientX; // pixels from left
        const y = e.clientY; // pixels from top

        const selectedText = window.getSelection()?.toString();
        const targetContext = buildAnnotationTargetContext(target, selectedText, {
          includeForensic: true,
          labelVariant: 'click',
        });

        // Get React component info if enabled
        let reactProbe = null;
        let reactComponents: string | undefined;
        let sourceFile: string | undefined;
        let vscodeUrl: string | undefined;
        let propsChain: string | undefined;

        if (settings.reactEnabled) {
          try {
            reactProbe = await requestReactProbe(e.clientX, e.clientY, 250, 'click');
          } catch {
            reactProbe = null;
          }

          reactComponents = reactProbe?.reactComponents || getReactComponentInfo(target);

          try {
            if (reactProbe?.source) {
              const mappedSource = await mapPositionWithSourceMap(
                reactProbe.source.fileName,
                reactProbe.source.lineNumber,
                reactProbe.source.columnNumber
              );
              sourceFile = formatSourceLocation(mappedSource, 'path');
              vscodeUrl = formatSourceLocation(mappedSource, 'vscode');
            } else {
              const sourceInfo = await getSourceInfo(target);
              sourceFile = sourceInfo.sourceFile;
              vscodeUrl = sourceInfo.vscodeUrl;
            }
          } catch {
            sourceFile = undefined;
            vscodeUrl = undefined;
          }

          propsChain = reactProbe?.propsChain || getPropsChain(target);
        }

        // Create pending annotation for popup
        const pending: PendingAnnotationData = {
          x,
          y,
          clientY: e.clientY,
          element: targetContext.element,
          elementPath: targetContext.elementPath,
          fullPath: targetContext.fullPath,
          rect: targetContext.rect,
          popupX: e.clientX,
          popupY: e.clientY,
          colorId: settings.annotationColorId,
          ...(targetContext.selectedText ? { selectedText: targetContext.selectedText } : {}),
          ...(targetContext.cssClasses ? { cssClasses: targetContext.cssClasses } : {}),
          ...(targetContext.boundingBox ? { boundingBox: targetContext.boundingBox } : {}),
          ...(targetContext.nearbyText ? { nearbyText: targetContext.nearbyText } : {}),
          ...(targetContext.computedStyles ? { computedStyles: targetContext.computedStyles } : {}),
          ...(reactComponents ? { reactComponents } : {}),
          ...(sourceFile ? { sourceFile } : {}),
          ...(vscodeUrl ? { vscodeUrl } : {}),
          ...(propsChain ? { propsChain } : {}),
        };

        setPendingAnnotation(pending);

        // Keep hover highlight at click position
        setHover({
          x: e.clientX,
          y: e.clientY,
          clientY: e.clientY,
          element: targetContext.element,
          elementPath: targetContext.elementPath,
          rect: targetContext.rect,
          ...(targetContext.selectedText ? { selectedText: targetContext.selectedText } : {}),
          ...(reactComponents ? { reactComponents } : {}),
          ...(sourceFile ? { sourceFile } : {}),
        });
      } catch {
        // Fallback: do not block annotation panel creation on probe/source failures.
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
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

/**
 * 获取 React 组件层级信息
 * 支持 React 18/19 的 __reactContainer$ 格式
 */
function getReactComponentInfo(target: HTMLElement): string | undefined {
  // 尝试查找 React Fiber 对象
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
    // 尝试从父元素查找
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

  // 收集组件名称层级
  const componentNames: string[] = [];
  let current: unknown = fiber;

  // 向上遍历 fiber 树，最多 10 层
  for (let i = 0; i < 10 && current; i++) {
    const f = current as { type?: unknown; return?: unknown; stateNode?: unknown };

    if (f.type) {
      if (typeof f.type === 'function') {
        // 函数组件或类组件 - 使用组件名称
        const name = f.type.name || 'Anonymous';
        componentNames.unshift(name);
      } else if (typeof f.type === 'string') {
        // HTML 元素 - 使用简短标签名
        componentNames.unshift(f.type);
      }
    }

    current = f.return;
  }

  if (componentNames.length === 0) return undefined;

  // 去重并返回（不带括号）
  return formatReactComponentPath(componentNames);
}

/**
 * 获取 React 组件的源文件位置信息
 * 使用 getSourceLocationAsync 从 fiber 节点提取源文件信息，并通过 source map 映射回原始位置
 *
 * 注意：此功能依赖 React 的 _debugSource 信息
 * - 部分 bundler（如 Next.js + SWC）会剥离此信息
 * - 仅在开发模式下可用
 * - Vite 开发服务器返回编译后的位置，会通过 source map 映射回原始源文件
 */
async function getSourceInfo(target: HTMLElement): Promise<{ sourceFile?: string; vscodeUrl?: string }> {
  const result = await withSourceMapDebugContext('click', () => getSourceLocationAsync(target));
  if (result.found && result.source) {
    return {
      sourceFile: formatSourceLocation(result.source, 'path'),
      vscodeUrl: formatSourceLocation(result.source, 'vscode'),
    };
  }
  return {};
}

/**
 * 获取 React 组件的 Props 传播链路
 * 从目标组件向上遍历 fiber 树，收集 props 传递信息
 */
function getPropsChain(target: HTMLElement) {
  const result = getPropsPropagationPath(target);
  if (!result || result.chain.length === 0) return undefined;

  // Format as a simple string for storage
  return result.chain
    .map((item) => {
      const props = Object.entries(item.relevantProps)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(', ');
      const location = item.sourceLocation ? `:${item.sourceLocation.fileName}:${item.sourceLocation.lineNumber}` : '';
      return `${item.componentName}${location}${props ? ` (${props})` : ''}`;
    })
    .join(' > ');
}
