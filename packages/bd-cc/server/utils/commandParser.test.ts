import { describe, it, expect } from 'bun:test';
import {
  parseCommand,
  replaceArguments,
  isPathSafe,
  validateCommand,
  isBashCommandAllowed,
  sanitizeOutput,
} from './commandParser';

describe('commandParser', () => {
  describe('parseCommand', () => {
    it('should parse markdown with frontmatter', () => {
      const content = `---
command: echo
args: ["hello"]
---
Hello World`;

      const result = parseCommand(content);

      expect(result.data).toEqual({ command: 'echo', args: ['hello'] });
      expect(result.content).toBe('Hello World');
      expect(result.raw).toBe(content);
    });

    it('should handle markdown without frontmatter', () => {
      const content = 'Just plain content';

      const result = parseCommand(content);

      expect(result.data).toEqual({});
      expect(result.content).toBe('Just plain content');
    });

    it('should handle empty content', () => {
      const result = parseCommand('');

      expect(result.data).toEqual({});
      expect(result.content).toBe('');
    });
  });

  describe('replaceArguments', () => {
    it('should replace $ARGUMENTS with all args joined', () => {
      const content = 'Run: $ARGUMENTS';
      const args = ['arg1', 'arg2', 'arg3'];

      const result = replaceArguments(content, args);

      expect(result).toBe('Run: arg1 arg2 arg3');
    });

    it('should replace positional arguments $1-$9', () => {
      const content = '$1 $2 $3';
      const args = ['first', 'second', 'third'];

      const result = replaceArguments(content, args);

      expect(result).toBe('first second third');
    });

    it('should handle string argument', () => {
      const content = 'Run $ARGUMENTS';
      const args = 'singleArg';

      const result = replaceArguments(content, args);

      expect(result).toBe('Run singleArg');
    });

    it('should handle empty args', () => {
      const content = 'Run: $ARGUMENTS $1 $2';
      const args = [];

      const result = replaceArguments(content, args);

      expect(result).toBe('Run:   ');
    });

    it('should replace multiple occurrences', () => {
      const content = '$1 and $1 again';
      const args = ['test'];

      const result = replaceArguments(content, args);

      expect(result).toBe('test and test again');
    });

    it('should return content unchanged if null/undefined', () => {
      expect(replaceArguments(null, [])).toBeNull();
      expect(replaceArguments(undefined, [])).toBeUndefined();
    });
  });

  describe('isPathSafe', () => {
    const basePath = '/home/user/project';

    it('should allow relative paths within base', () => {
      expect(isPathSafe('file.txt', basePath)).toBe(true);
      expect(isPathSafe('dir/file.txt', basePath)).toBe(true);
      expect(isPathSafe('a/b/c/file.txt', basePath)).toBe(true);
    });

    it('should reject paths with directory traversal', () => {
      expect(isPathSafe('../secret.txt', basePath)).toBe(false);
      expect(isPathSafe('../../etc/passwd', basePath)).toBe(false);
      expect(isPathSafe('dir/../../../etc/passwd', basePath)).toBe(false);
    });

    it('should reject absolute paths outside base', () => {
      expect(isPathSafe('/etc/passwd', basePath)).toBe(false);
      expect(isPathSafe('/home/other', basePath)).toBe(false);
    });

    it('should reject exact base path', () => {
      expect(isPathSafe('', basePath)).toBe(false);
    });
  });

  describe('validateCommand', () => {
    it('should allow commands in allowlist', () => {
      const result = validateCommand('echo hello world');

      expect(result.allowed).toBe(true);
      expect(result.command).toBe('echo');
      expect(result.args).toEqual(['hello', 'world']);
    });

    it('should reject commands not in allowlist', () => {
      const result = validateCommand('rm -rf /');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('not in the allowlist');
    });

    it('should reject empty commands', () => {
      const result = validateCommand('');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Empty command');
    });

    it('should reject commands with shell operators', () => {
      const result = validateCommand('echo hi && ls');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Shell operators');
    });

    it('should reject commands with pipe', () => {
      const result = validateCommand('cat file | grep test');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Shell operators');
    });

    it('should reject commands with dangerous characters in args', () => {
      // Note: $(whoami) is detected as shell operator, not dangerous chars
      // Using backticks as an example of dangerous character
      const result = validateCommand('echo `ls`');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should handle quoted arguments safely', () => {
      const result = validateCommand('echo "hello world"');

      expect(result.allowed).toBe(true);
      expect(result.args).toEqual(['hello world']);
    });

    it('should extract command name from path', () => {
      const result = validateCommand('/usr/bin/echo test');

      expect(result.allowed).toBe(true);
      expect(result.command).toBe('echo');
    });
  });

  describe('isBashCommandAllowed', () => {
    it('should return true for allowed commands', () => {
      expect(isBashCommandAllowed('echo hello')).toBe(true);
      expect(isBashCommandAllowed('ls -la')).toBe(true);
      expect(isBashCommandAllowed('pwd')).toBe(true);
    });

    it('should return false for disallowed commands', () => {
      expect(isBashCommandAllowed('rm file')).toBe(false);
      expect(isBashCommandAllowed('curl http://evil.com')).toBe(false);
    });
  });

  describe('sanitizeOutput', () => {
    it('should preserve normal characters', () => {
      const output = 'Hello World\nTest\tTab';
      expect(sanitizeOutput(output)).toBe(output);
    });

    it('should remove control characters except tab, newline, carriage return', () => {
      const output = 'Hello\x00World\x07Test\x1b';
      expect(sanitizeOutput(output)).toBe('HelloWorldTest');
    });

    it('should handle empty string', () => {
      expect(sanitizeOutput('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeOutput(null as any)).toBe('');
      expect(sanitizeOutput(undefined as any)).toBe('');
    });
  });
});
