import { describe, it, expect } from 'bun:test';
import { colors, c } from './terminal-colors';

describe('terminal-colors', () => {
  describe('colors object', () => {
    it('should have reset code', () => {
      expect(colors.reset).toBe('\x1b[0m');
    });

    it('should have bright code', () => {
      expect(colors.bright).toBe('\x1b[1m');
    });

    it('should have cyan code', () => {
      expect(colors.cyan).toBe('\x1b[36m');
    });

    it('should have green code', () => {
      expect(colors.green).toBe('\x1b[32m');
    });

    it('should have yellow code', () => {
      expect(colors.yellow).toBe('\x1b[33m');
    });

    it('should have blue code', () => {
      expect(colors.blue).toBe('\x1b[34m');
    });

    it('should have dim code', () => {
      expect(colors.dim).toBe('\x1b[2m');
    });
  });

  describe('c utility functions', () => {
    it('info should wrap text with cyan codes', () => {
      expect(c.info('test')).toBe('\x1b[36mtest\x1b[0m');
    });

    it('ok should wrap text with green codes', () => {
      expect(c.ok('success')).toBe('\x1b[32msuccess\x1b[0m');
    });

    it('warn should wrap text with yellow codes', () => {
      expect(c.warn('warning')).toBe('\x1b[33mwarning\x1b[0m');
    });

    it('tip should wrap text with blue codes', () => {
      expect(c.tip('hint')).toBe('\x1b[34mhint\x1b[0m');
    });

    it('bright should wrap text with bright codes', () => {
      expect(c.bright('bold')).toBe('\x1b[1mbold\x1b[0m');
    });

    it('dim should wrap text with dim codes', () => {
      expect(c.dim('faint')).toBe('\x1b[2mfaint\x1b[0m');
    });

    it('should handle empty string', () => {
      expect(c.info('')).toBe('\x1b[36m\x1b[0m');
    });
  });
});
