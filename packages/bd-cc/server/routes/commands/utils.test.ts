import { describe, it, expect } from 'bun:test';
import { processCommandTemplate, builtInCommands } from './utils';

describe('commands/utils', () => {
  describe('processCommandTemplate', () => {
    it('should replace {{args}} with arguments', () => {
      const content = 'bun test {{args}}';
      const result = processCommandTemplate(content, ['--coverage'], {});
      expect(result).toBe('bun test --coverage');
    });

    it('should replace {{args}} with empty string when no args', () => {
      const content = 'bun test {{args}}';
      const result = processCommandTemplate(content, [], {});
      expect(result).toBe('bun test');
    });

    it('should handle {{#if args}} blocks with args', () => {
      const content = 'git commit -m "{{#if args}}{{args}}{{/if}}"';
      const result = processCommandTemplate(content, ['fix bug'], {});
      expect(result).toBe('git commit -m "fix bug"');
    });

    it('should handle {{#if args}} blocks without args', () => {
      const content = 'git commit -m "{{#if args}}{{args}}{{/if}}"';
      const result = processCommandTemplate(content, [], {});
      expect(result).toBe('git commit -m ""');
    });

    it('should replace context variables', () => {
      const content = 'cd {{projectPath}} && npm install';
      const result = processCommandTemplate(content, [], { projectPath: '/my/project' });
      expect(result).toBe('cd /my/project && npm install');
    });

    it('should replace multiple context variables', () => {
      const content = '{{command}} {{args}} in {{projectPath}}';
      const result = processCommandTemplate(content, ['test'], { command: 'bun', projectPath: '/app' });
      expect(result).toBe('bun test in /app');
    });

    it('should handle complex template with all features', () => {
      const content = `git commit -m "{{#if args}}{{args}}{{/if}}"
cd {{projectPath}}`;
      const result = processCommandTemplate(content, ['feat: new feature'], { projectPath: '/workspace' });
      expect(result).toBe('git commit -m "feat: new feature"\ncd /workspace');
    });

    it('should trim whitespace from result', () => {
      const content = '  {{args}}  ';
      const result = processCommandTemplate(content, ['test'], {});
      expect(result).toBe('test');
    });

    it('should handle multiple {{args}} occurrences', () => {
      const content = '{{args}} && {{args}}';
      const result = processCommandTemplate(content, ['echo', 'hello'], {});
      expect(result).toBe('echo hello && echo hello');
    });

    it('should handle empty content', () => {
      expect(processCommandTemplate('', [], {})).toBe('');
    });

    it('should handle content without templates', () => {
      const content = 'simple command';
      expect(processCommandTemplate(content, [], {})).toBe('simple command');
    });
  });

  describe('builtInCommands', () => {
    it('should have test command', () => {
      const cmd = builtInCommands.find((c) => c.name === '/test');
      expect(cmd).toBeDefined();
      expect(cmd?.description).toBe('Run test suite with coverage');
      expect(cmd?.namespace).toBe('builtin');
    });

    it('should have build command', () => {
      const cmd = builtInCommands.find((c) => c.name === '/build');
      expect(cmd).toBeDefined();
    });

    it('should have lint command', () => {
      const cmd = builtInCommands.find((c) => c.name === '/lint');
      expect(cmd).toBeDefined();
    });

    it('should have git commands', () => {
      const gitCommands = ['/commit', '/push', '/pull', '/status', '/diff', '/branch'];
      for (const name of gitCommands) {
        const cmd = builtInCommands.find((c) => c.name === name);
        expect(cmd).toBeDefined();
        expect(cmd?.namespace).toBe('builtin');
      }
    });

    it('should have all required properties for each command', () => {
      for (const cmd of builtInCommands) {
        expect(cmd).toHaveProperty('name');
        expect(cmd).toHaveProperty('description');
        expect(cmd).toHaveProperty('content');
        expect(cmd).toHaveProperty('namespace');
      }
    });
  });
});
