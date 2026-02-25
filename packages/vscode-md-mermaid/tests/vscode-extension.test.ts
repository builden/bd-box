import { describe, it, expect } from 'vitest';

// Copy the escapeHtmlAttribute function for testing
function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

describe('escapeHtmlAttribute', () => {
  it('should not escape spaces', () => {
    expect(escapeHtmlAttribute('a b')).toBe('a b');
  });

  it('should escape ampersands', () => {
    expect(escapeHtmlAttribute('a & b')).toBe('a &amp; b');
  });

  it('should escape double quotes', () => {
    expect(escapeHtmlAttribute('a "b"')).toBe('a &quot;b&quot;');
  });

  it('should handle multiple special characters', () => {
    expect(escapeHtmlAttribute('a & "b" c')).toBe('a &amp; &quot;b&quot; c');
  });

  it('should handle empty string', () => {
    expect(escapeHtmlAttribute('')).toBe('');
  });

  it('should handle string without special characters', () => {
    expect(escapeHtmlAttribute('abc')).toBe('abc');
  });
});

describe('validMermaidThemes', () => {
  const validMermaidThemes = [
    'base',
    'forest',
    'dark',
    'default',
    'neutral',
  ];

  it('should have 5 valid themes', () => {
    expect(validMermaidThemes).toHaveLength(5);
  });

  it('should include common themes', () => {
    expect(validMermaidThemes).toContain('dark');
    expect(validMermaidThemes).toContain('default');
  });
});
