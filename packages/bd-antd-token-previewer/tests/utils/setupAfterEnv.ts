import { vi } from 'vitest';

// Mock matchMedia
if (!window.matchMedia) {
  Object.defineProperty(globalThis.window, 'matchMedia', {
    value: vi.fn((query: string) => ({
      matches: query.includes('max-width'),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollbar size calculation
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance'],
    getPropertyValue: () => '',
  }),
});
