import { describe, it, expect } from 'bun:test';
import { safeJsonParse, cn } from './utils';

describe('lib/utils', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON string', () => {
      const result = safeJsonParse<{ name: string }>('{"name": "test"}');
      expect(result).toEqual({ name: 'test' });
    });

    it('should parse valid JSON array', () => {
      const result = safeJsonParse<string[]>('["a", "b", "c"]');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should return null for invalid JSON', () => {
      const result = safeJsonParse('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = safeJsonParse('');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = safeJsonParse(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = safeJsonParse(undefined);
      expect(result).toBeNull();
    });

    it('should return null for number input', () => {
      const result = safeJsonParse(123);
      expect(result).toBeNull();
    });

    it('should return null for object input', () => {
      const result = safeJsonParse({ foo: 'bar' });
      expect(result).toBeNull();
    });

    it('should return null for array input', () => {
      const result = safeJsonParse([1, 2, 3]);
      expect(result).toBeNull();
    });

    it('should parse nested JSON', () => {
      const result = safeJsonParse<{ nested: { value: number } }>('{"nested": {"value": 42}}');
      expect(result).toEqual({ nested: { value: 42 } });
    });

    it('should handle JSON with whitespace', () => {
      const result = safeJsonParse<{ name: string }>('  {"name": "test"}  ');
      expect(result).toEqual({ name: 'test' });
    });
  });

  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('foo', undefined, 'baz');
      expect(result).toBe('foo baz');
    });

    it('should handle array input', () => {
      const result = cn(['foo', 'bar']);
      expect(result).toBe('foo bar');
    });

    it('should handle object input for conditional classes', () => {
      const result = cn({ foo: true, bar: false });
      expect(result).toBe('foo');
    });

    it('should handle mixed inputs', () => {
      const result = cn('foo', { bar: true, baz: false }, ['qux']);
      expect(result).toBe('foo bar qux');
    });

    it('should merge tailwind classes with conflicts', () => {
      const result = cn('px-2 px-4');
      // tailwind-merge should resolve conflicts, keeping the last value
      expect(result).toContain('px-4');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});
