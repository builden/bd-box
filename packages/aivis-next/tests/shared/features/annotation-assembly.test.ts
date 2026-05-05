import { expect, test } from 'bun:test';
import type { PendingAnnotationData } from '@/shared/features/Annotation';
import { buildAnnotationFromPending } from '@/shared/features/Annotation/annotation-assembly';

function createPendingAnnotation(overrides: Partial<PendingAnnotationData> = {}): PendingAnnotationData {
  return {
    x: 12,
    y: 34,
    clientY: 34,
    element: 'Button',
    elementPath: 'div > button',
    timestamp: 1710000000000,
    ...overrides,
  };
}

test('buildAnnotationFromPending preserves the captured metadata', () => {
  const pending = createPendingAnnotation({
    selectedText: 'Save',
    colorId: 'violet',
    popupX: 88,
    popupY: 99,
    fullPath: 'body > main > button',
    cssClasses: 'btn btn-primary',
    boundingBox: { x: 1, y: 2, width: 3, height: 4 },
    nearbyText: 'Click to save',
    computedStyles: 'display: inline-flex',
    accessibility: 'role=button',
    nearbyElements: 'span, icon',
    sourceFile: 'src/App.tsx:12',
    reactComponents: 'App > Button',
    propsChain: 'App > Button',
    vscodeUrl: 'vscode://file/src/App.tsx:12',
  });

  const annotation = buildAnnotationFromPending(pending, 'Looks good', 1711111111111);

  expect(annotation).toMatchObject({
    id: 'annotation-1711111111111',
    x: 12,
    y: 34,
    element: 'Button',
    elementPath: 'div > button',
    comment: 'Looks good',
    timestamp: 1711111111111,
    selectedText: 'Save',
    colorId: 'violet',
    popupX: 88,
    popupY: 99,
    fullPath: 'body > main > button',
    cssClasses: 'btn btn-primary',
    boundingBox: { x: 1, y: 2, width: 3, height: 4 },
    nearbyText: 'Click to save',
    computedStyles: 'display: inline-flex',
    accessibility: 'role=button',
    nearbyElements: 'span, icon',
    sourceFile: 'src/App.tsx:12',
    reactComponents: 'App > Button',
    propsChain: 'App > Button',
    vscodeUrl: 'vscode://file/src/App.tsx:12',
  });
});

test('buildAnnotationFromPending omits absent optional fields', () => {
  const pending = createPendingAnnotation();

  const annotation = buildAnnotationFromPending(pending, 'Needs work', 1712222222222);

  expect(annotation).toMatchObject({
    id: 'annotation-1712222222222',
    x: 12,
    y: 34,
    element: 'Button',
    elementPath: 'div > button',
    comment: 'Needs work',
    timestamp: 1712222222222,
  });
  expect(annotation.selectedText).toBeUndefined();
  expect(annotation.popupX).toBeUndefined();
  expect(annotation.popupY).toBeUndefined();
  expect(annotation.sourceFile).toBeUndefined();
  expect(annotation.reactComponents).toBeUndefined();
  expect(annotation.propsChain).toBeUndefined();
  expect(annotation.vscodeUrl).toBeUndefined();
});
