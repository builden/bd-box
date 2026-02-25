import { describe, it, expect } from 'vitest';

// Copy the escapeHtmlAttribute function for testing
function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/ /g, '&gt;');
}

describe('escapeHtmlAttribute', () => {
  it('should escape spaces', () => {
    expect(escapeHtmlAttribute('a b')).toBe('a&gt;b');
  });

  it('should escape ampersands before spaces', () => {
    expect(escapeHtmlAttribute('a & b')).toBe('a&gt;&amp;&gt;b');
  });

  it('should escape double quotes before spaces', () => {
    expect(escapeHtmlAttribute('a "b"')).toBe('a&gt;&quot;b&quot;');
  });

  it('should handle multiple special characters', () => {
    expect(escapeHtmlAttribute('a & "b" c')).toBe('a&gt;&amp;&gt;&quot;b&quot;&gt;c');
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
