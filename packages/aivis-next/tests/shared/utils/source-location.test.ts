import { expect, test } from 'bun:test';
import { formatSourceLocation, getFiberFromElement } from '@/shared/utils/source-location';

test('getFiberFromElement walks up parent elements to find react fiber', () => {
  const parent = { parentElement: null } as unknown as HTMLElement;
  const child = { parentElement: parent } as unknown as HTMLElement;

  const fiber = { _debugSource: { fileName: 'App.tsx', lineNumber: 12 } };
  Object.defineProperty(parent, '__reactFiber$abc', {
    value: fiber,
    enumerable: true,
    configurable: true,
  });

  expect(getFiberFromElement(child)).toBe(fiber);
});

test('getFiberFromElement walks beyond shallow ancestor depth', () => {
  const root = { parentElement: null } as unknown as HTMLElement;
  let current = root;

  for (let i = 0; i < 30; i++) {
    const child = { parentElement: current } as unknown as HTMLElement;
    current = child;
  }

  const fiber = { _debugSource: { fileName: 'App.tsx', lineNumber: 12 } };
  Object.defineProperty(root, '__reactFiber$abc', {
    value: fiber,
    enumerable: true,
    configurable: true,
  });

  expect(getFiberFromElement(current)).toBe(fiber);
});

test('getFiberFromElement still returns direct element fiber', () => {
  const element = { parentElement: null } as unknown as HTMLElement;
  const fiber = { _debugSource: { fileName: 'Button.tsx', lineNumber: 8 } };

  Object.defineProperty(element, '__reactFiber$def', {
    value: fiber,
    enumerable: true,
    configurable: true,
  });

  expect(getFiberFromElement(element)).toBe(fiber);
});

test('formatSourceLocation strips url host for path output', () => {
  expect(
    formatSourceLocation(
      {
        fileName: 'http://localhost:3002/App.tsx',
        lineNumber: 188,
        columnNumber: 23,
      },
      'path'
    )
  ).toBe('App.tsx:188:23');
});
