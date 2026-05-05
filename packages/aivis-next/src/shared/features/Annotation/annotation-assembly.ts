import type { Annotation, PendingAnnotationData } from './store';

export function buildAnnotationFromPending(
  pending: PendingAnnotationData,
  comment: string,
  timestamp = Date.now()
): Annotation {
  return {
    id: `annotation-${timestamp}`,
    x: pending.x,
    y: pending.y,
    element: pending.element,
    elementPath: pending.elementPath,
    comment,
    timestamp,
    ...(pending.colorId && { colorId: pending.colorId }),
    ...(pending.popupX !== undefined && { popupX: pending.popupX }),
    ...(pending.popupY !== undefined && { popupY: pending.popupY }),
    ...(pending.selectedText ? { selectedText: pending.selectedText } : {}),
    ...(pending.fullPath && { fullPath: pending.fullPath }),
    ...(pending.cssClasses && { cssClasses: pending.cssClasses }),
    ...(pending.boundingBox && { boundingBox: pending.boundingBox }),
    ...(pending.nearbyText && { nearbyText: pending.nearbyText }),
    ...(pending.computedStyles && { computedStyles: pending.computedStyles }),
    ...(pending.accessibility && { accessibility: pending.accessibility }),
    ...(pending.nearbyElements && { nearbyElements: pending.nearbyElements }),
    ...(pending.sourceFile && { sourceFile: pending.sourceFile }),
    ...(pending.reactComponents && { reactComponents: pending.reactComponents }),
    ...(pending.propsChain && { propsChain: pending.propsChain }),
    ...(pending.vscodeUrl && { vscodeUrl: pending.vscodeUrl }),
  };
}
