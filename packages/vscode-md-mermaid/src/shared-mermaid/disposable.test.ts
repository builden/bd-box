import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IDisposable } from './disposable';

describe('disposable', () => {
  describe('IDisposable interface', () => {
    it('should have a dispose method', () => {
      const disposable: IDisposable = {
        dispose: () => {}
      };
      expect(typeof disposable.dispose).toBe('function');
    });

    it('should call dispose callback when dispose is called', () => {
      const mockDispose = vi.fn();
      const disposable: IDisposable = {
        dispose: mockDispose
      };

      disposable.dispose();
      expect(mockDispose).toHaveBeenCalledTimes(1);
    });

    it('should be able to create disposable with cleanup logic', () => {
      const cleanupFn = vi.fn();
      const disposable: IDisposable = {
        dispose: () => {
          cleanupFn();
        }
      };

      disposable.dispose();
      disposable.dispose(); // Should still work after first dispose

      expect(cleanupFn).toHaveBeenCalledTimes(2);
    });
  });
});
