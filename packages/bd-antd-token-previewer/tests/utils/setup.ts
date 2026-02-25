import { vi } from 'vitest';

vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  (antd as any).theme.defaultConfig.hashed = false;
  return antd;
});

// Mock getComputedStyle for jsdom
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance'],
    getPropertyValue: () => '',
  }),
});
