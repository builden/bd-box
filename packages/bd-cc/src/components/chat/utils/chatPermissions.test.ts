import { describe, it, expect } from 'bun:test';
import { buildClaudeToolPermissionEntry, formatToolInputForDisplay } from './chatPermissions';

describe('chatPermissions', () => {
  describe('buildClaudeToolPermissionEntry', () => {
    it('should return null when toolName is undefined', () => {
      const result = buildClaudeToolPermissionEntry(undefined);
      expect(result).toBeNull();
    });

    it('should return null when toolName is empty string', () => {
      const result = buildClaudeToolPermissionEntry('');
      expect(result).toBeNull();
    });

    it('should return toolName for non-Bash tools', () => {
      const result = buildClaudeToolPermissionEntry('Read');
      expect(result).toBe('Read');
    });

    it('should return toolName for Bash with empty input', () => {
      const result = buildClaudeToolPermissionEntry('Bash', undefined);
      expect(result).toBe('Bash');
    });

    it('should return toolName for Bash with non-JSON string input', () => {
      const result = buildClaudeToolPermissionEntry('Bash', 'string input');
      expect(result).toBe('Bash');
    });

    it('should return toolName for Bash with object input (not JSON string)', () => {
      // safeJsonParse expects a string, object will return null
      const result = buildClaudeToolPermissionEntry('Bash', { command: 'ls' });
      expect(result).toBe('Bash');
    });

    it('should return toolName for Bash with empty command in JSON', () => {
      const result = buildClaudeToolPermissionEntry('Bash', '{"command": ""}');
      expect(result).toBe('Bash');
    });

    it('should format git command with specific subcommand', () => {
      const result = buildClaudeToolPermissionEntry('Bash', '{"command": "git commit -m \\"test\\""}');
      expect(result).toBe('Bash(git commit:*)');
    });

    it('should format npm command', () => {
      const result = buildClaudeToolPermissionEntry('Bash', '{"command": "npm run dev"}');
      expect(result).toBe('Bash(npm:*)');
    });

    it('should format simple command', () => {
      const result = buildClaudeToolPermissionEntry('Bash', '{"command": "ls -la"}');
      expect(result).toBe('Bash(ls:*)');
    });

    it('should handle command with multiple spaces', () => {
      const result = buildClaudeToolPermissionEntry('Bash', '{"command": "  echo   hello  "}');
      expect(result).toBe('Bash(echo:*)');
    });
  });

  describe('formatToolInputForDisplay', () => {
    it('should return empty string for undefined', () => {
      const result = formatToolInputForDisplay(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for null', () => {
      const result = formatToolInputForDisplay(null);
      expect(result).toBe('');
    });

    it('should return string as-is', () => {
      const result = formatToolInputForDisplay('hello world');
      expect(result).toBe('hello world');
    });

    it('should format number as string', () => {
      const result = formatToolInputForDisplay(42);
      expect(result).toBe('42');
    });

    it('should JSON stringify object', () => {
      const result = formatToolInputForDisplay({ foo: 'bar', num: 123 });
      expect(result).toContain('"foo": "bar"');
      expect(result).toContain('"num": 123');
    });

    it('should JSON stringify array with indentation', () => {
      const result = formatToolInputForDisplay([1, 2, 3]);
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should handle nested objects', () => {
      const result = formatToolInputForDisplay({ nested: { value: true } });
      expect(result).toContain('"nested"');
      expect(result).toContain('"value": true');
    });

    it('should return string representation on JSON parse error', () => {
      // Create an object that throws on toJSON
      const obj = { value: 'test' };
      const originalStringify = JSON.stringify;
      JSON.stringify = () => {
        throw new Error('Circular reference');
      };

      const result = formatToolInputForDisplay(obj);
      JSON.stringify = originalStringify;

      expect(result).toContain('[object Object]');
    });
  });
});
