import { describe, it, expect } from 'bun:test';
import { runCommand, runCommandRaw, runCommands } from './spawn';

describe('spawn utilities', () => {
  describe('runCommand', () => {
    it('should run a simple command and return stdout', async () => {
      const result = await runCommand('echo', ['hello']);
      expect(result.stdout.trim()).toBe('hello');
      expect(result.code).toBe(0);
    });

    it('should run command with cwd option', async () => {
      const result = await runCommand('pwd', [], { cwd: '/' });
      expect(result.code).toBe(0);
    });

    it('should throw on command failure', async () => {
      await expect(runCommand('ls', ['/nonexistent-path-12345'])).rejects.toThrow();
    });
  });

  describe('runCommandRaw', () => {
    it('should run a command without throwing on failure', async () => {
      const result = await runCommandRaw('ls', ['/nonexistent-path-12345']);
      expect(result.code).not.toBe(0);
    });

    it('should return stdout and stderr', async () => {
      const result = await runCommandRaw('node', ['-e', 'console.log("test output")']);
      expect(result.stdout.trim()).toBe('test output');
    });
  });

  describe('runCommands', () => {
    it('should run multiple commands in parallel', async () => {
      const results = await runCommands([
        { command: 'echo', args: ['hello'] },
        { command: 'echo', args: ['world'] },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].stdout.trim()).toBe('hello');
      expect(results[1].stdout.trim()).toBe('world');
      expect(results[0].code).toBe(0);
      expect(results[1].code).toBe(0);
    });

    it('should handle mixed success/failure', async () => {
      const results = await runCommands([
        { command: 'echo', args: ['success'] },
        { command: 'ls', args: ['/nonexistent'] },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].code).toBe(0);
      expect(results[1].code).not.toBe(0);
    });
  });
});
