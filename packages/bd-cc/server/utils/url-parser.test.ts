import { describe, it, expect } from 'bun:test';
import {
  stripAnsiSequences,
  normalizeDetectedUrl,
  extractUrlsFromText,
  shouldAutoOpenUrlFromOutput,
} from './url-parser';

describe('url-parser utilities', () => {
  describe('stripAnsiSequences', () => {
    it('should remove ANSI escape sequences', () => {
      const input = '\x1b[31mred\x1b[0m normal';
      expect(stripAnsiSequences(input)).toBe('red normal');
    });

    it('should handle text without ANSI sequences', () => {
      const input = 'plain text';
      expect(stripAnsiSequences(input)).toBe('plain text');
    });

    it('should handle empty string', () => {
      expect(stripAnsiSequences('')).toBe('');
    });

    it('should handle multiple ANSI codes', () => {
      const input = '\x1b[1m\x1b[31mbold red\x1b[0m';
      expect(stripAnsiSequences(input)).toBe('bold red');
    });
  });

  describe('normalizeDetectedUrl', () => {
    it('should normalize valid HTTP URL', () => {
      expect(normalizeDetectedUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should normalize valid HTTPS URL', () => {
      expect(normalizeDetectedUrl('https://example.com')).toBe('https://example.com/');
    });

    it('should normalize URL with path', () => {
      expect(normalizeDetectedUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should remove trailing punctuation', () => {
      expect(normalizeDetectedUrl('https://example.com)')).toBe('https://example.com/');
      expect(normalizeDetectedUrl('https://example.com.')).toBe('https://example.com/');
    });

    it('should return null for non-HTTP protocol', () => {
      expect(normalizeDetectedUrl('ftp://example.com')).toBeNull();
      expect(normalizeDetectedUrl('file:///path')).toBeNull();
    });

    it('should return null for invalid URL', () => {
      expect(normalizeDetectedUrl('not-a-url')).toBeNull();
      expect(normalizeDetectedUrl('')).toBeNull();
    });

    it('should return null for null/undefined input', () => {
      expect(normalizeDetectedUrl(null as any)).toBeNull();
      expect(normalizeDetectedUrl(undefined as any)).toBeNull();
    });
  });

  describe('extractUrlsFromText', () => {
    it('should extract single URL', () => {
      const text = 'Check https://example.com for more info';
      expect(extractUrlsFromText(text)).toEqual(['https://example.com']);
    });

    it('should extract multiple URLs', () => {
      const text = 'Visit https://example.com and http://test.org';
      expect(extractUrlsFromText(text)).toEqual(['https://example.com', 'http://test.org']);
    });

    it('should extract URLs with paths', () => {
      const text = 'See https://example.com/docs/api/v1';
      expect(extractUrlsFromText(text)).toEqual(['https://example.com/docs/api/v1']);
    });

    it('should deduplicate URLs', () => {
      const text = 'https://example.com appears twice: https://example.com';
      expect(extractUrlsFromText(text)).toEqual(['https://example.com']);
    });

    it('should return empty array for text without URLs', () => {
      expect(extractUrlsFromText('plain text')).toEqual([]);
      expect(extractUrlsFromText('')).toEqual([]);
    });

    it('should not extract URLs with invalid characters', () => {
      const text = 'Check https://example.com<invalid>';
      expect(extractUrlsFromText(text)).toEqual(['https://example.com']);
    });
  });

  describe('shouldAutoOpenUrlFromOutput', () => {
    it('should return true for browser not opened message', () => {
      expect(shouldAutoOpenUrlFromOutput("browser didn't open a new window")).toBe(true);
    });

    it('should return true for open URL prompt', () => {
      expect(shouldAutoOpenUrlFromOutput('open this url in browser')).toBe(true);
    });

    it('should return true for continue in browser', () => {
      expect(shouldAutoOpenUrlFromOutput('continue in your browser')).toBe(true);
    });

    it('should return true for press enter to open', () => {
      expect(shouldAutoOpenUrlFromOutput('press enter to open')).toBe(true);
    });

    it('should return true for open_url marker', () => {
      expect(shouldAutoOpenUrlFromOutput('open_url: https://example.com')).toBe(true);
    });

    it('should return false for normal text', () => {
      expect(shouldAutoOpenUrlFromOutput('normal output')).toBe(false);
      expect(shouldAutoOpenUrlFromOutput('')).toBe(false);
    });
  });
});
