import { describe, it, expect } from 'bun:test';
import { spawnCli, spawnCliOrThrow } from './spawn-cli';

describe('spawn-cli', () => {
  describe('spawnCli', () => {
    it('should execute simple command and return stdout', async () => {
      const { stdout, stderr, code } = await spawnCli('echo', { args: ['hello'] });
      expect(stdout.trim()).toBe('hello');
      expect(stderr).toBe('');
      expect(code).toBe(0);
    });

    it('should capture stderr', async () => {
      const { stdout, stderr, code } = await spawnCli('node', {
        args: ['-e', 'console.error("error output")'],
      });
      expect(stderr.trim()).toBe('error output');
    });

    it('should handle command with spaces in arguments', async () => {
      const { stdout, code } = await spawnCli('echo', { args: ['hello world'] });
      expect(stdout.trim()).toBe('hello world');
      expect(code).toBe(0);
    });

    it('should use custom cwd option', async () => {
      const { stdout, code } = await spawnCli('pwd', { cwd: '/tmp' });
      // /tmp is symlinked to /private/tmp on macOS
      expect(stdout.trim()).toContain('tmp');
      expect(code).toBe(0);
    });

    it('should reject on non-existent command', async () => {
      await expect(spawnCli('nonexistent-command-12345')).rejects.toThrow();
    });
  });

  describe('spawnCliOrThrow', () => {
    it('should return stdout on success', async () => {
      const stdout = await spawnCliOrThrow('echo', { args: ['success'] });
      expect(stdout.trim()).toBe('success');
    });

    it('should throw error on non-zero exit code', async () => {
      await expect(spawnCliOrThrow('node', { args: ['-e', 'process.exit(1)'] })).rejects.toThrow();
    });

    it('should throw with custom error message', async () => {
      try {
        await spawnCliOrThrow('node', {
          args: ['-e', 'process.exit(1)'],
          errorMessage: 'Custom error',
        });
        fail('should have thrown');
      } catch (e: any) {
        expect(e.message).toBe('Custom error');
      }
    });

    it('should include stderr in error', async () => {
      try {
        await spawnCliOrThrow('node', {
          args: ['-e', 'console.error("stderr content"); process.exit(1)'],
        });
        fail('should have thrown');
      } catch (e: any) {
        expect(e.stderr).toContain('stderr content');
      }
    });

    it('should include exit code in error', async () => {
      try {
        await spawnCliOrThrow('node', { args: ['-e', 'process.exit(42)'] });
        fail('should have thrown');
      } catch (e: any) {
        expect(e.code).toBe(42);
      }
    });
  });
});
