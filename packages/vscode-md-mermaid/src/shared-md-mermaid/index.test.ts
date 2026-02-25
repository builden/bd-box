import { describe, it, expect } from 'vitest';

describe('preProcess', () => {
  // Copy of private function for testing
  const preProcess = (source: string) => {
    return source
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/\n+$/, '')
      .trimStart();
  };

  it('should escape ampersands', () => {
    expect(preProcess('a & b')).toBe('a &amp; b');
  });

  it('should escape angle brackets', () => {
    expect(preProcess('a < b')).toBe('a &lt; b');
  });

  it('should remove trailing newlines', () => {
    expect(preProcess('a\n\n\n')).toBe('a');
  });

  it('should trim leading whitespace', () => {
    expect(preProcess('   a')).toBe('a');
  });

  it('should handle empty string', () => {
    expect(preProcess('')).toBe('');
  });

  it('should handle string without special characters', () => {
    expect(preProcess('abc')).toBe('abc');
  });
});

describe('escapeRegExp', () => {
  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  it('should escape dot character', () => {
    expect(escapeRegExp('a.b')).toBe('a\\.b');
  });

  it('should escape plus character', () => {
    expect(escapeRegExp('a+b')).toBe('a\\+b');
  });

  it('should escape asterisk character', () => {
    expect(escapeRegExp('a*b')).toBe('a\\*b');
  });

  it('should escape parentheses', () => {
    expect(escapeRegExp('a(b)c')).toBe('a\\(b\\)c');
  });

  it('should handle string without special characters', () => {
    expect(escapeRegExp('abc')).toBe('abc');
  });

  it('should handle empty string', () => {
    expect(escapeRegExp('')).toBe('');
  });
});
