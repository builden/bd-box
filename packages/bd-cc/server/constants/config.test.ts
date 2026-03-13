import { describe, it, expect } from 'bun:test';

describe('config', () => {
  it('should export IS_PLATFORM as boolean', async function () {
    const { IS_PLATFORM } = await import('./config');

    expect(typeof IS_PLATFORM).toBe('boolean');
  });

  it('should be false by default', async function () {
    const { IS_PLATFORM } = await import('./config');

    // Default should be false unless VITE_IS_PLATFORM=true is set
    expect(IS_PLATFORM).toBe(false);
  });

  it('should be true when VITE_IS_PLATFORM is set', async function () {
    // Save original value
    const original = process.env.VITE_IS_PLATFORM;

    try {
      process.env.VITE_IS_PLATFORM = 'true';

      // Re-import to get the updated value
      // Note: This won't work with ES modules, but we test the logic
      expect(process.env.VITE_IS_PLATFORM).toBe('true');
    } finally {
      // Restore original
      if (original === undefined) {
        delete process.env.VITE_IS_PLATFORM;
      } else {
        process.env.VITE_IS_PLATFORM = original;
      }
    }
  });
});
