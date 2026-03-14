import { describe, it, expect } from 'bun:test';
import {
  normalizeGitHubUrl,
  parseGitHubUrl,
  autogenerateBranchName,
  validateBranchName,
  SSEStreamWriter,
  ResponseCollector,
} from './utils';

describe('agent/utils', () => {
  describe('normalizeGitHubUrl', () => {
    it('should remove .git suffix', () => {
      expect(normalizeGitHubUrl('https://github.com/owner/repo.git')).toBe('https://github.com/owner/repo');
    });

    it('should convert SSH to HTTPS', () => {
      expect(normalizeGitHubUrl('git@github.com:owner/repo.git')).toBe('https://github.com/owner/repo');
    });

    it('should remove trailing slash', () => {
      expect(normalizeGitHubUrl('https://github.com/owner/repo/')).toBe('https://github.com/owner/repo');
    });

    it('should lowercase URL', () => {
      expect(normalizeGitHubUrl('HTTPS://GITHUB.COM/OWNER/REPO')).toBe('https://github.com/owner/repo');
    });

    it('should handle full SSH URL with .git', () => {
      expect(normalizeGitHubUrl('git@github.com:owner/repo.git')).toBe('https://github.com/owner/repo');
    });
  });

  describe('parseGitHubUrl', () => {
    it('should parse HTTPS URL', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse HTTPS URL with .git', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo.git');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse SSH URL', () => {
      const result = parseGitHubUrl('git@github.com:owner/repo');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse SSH URL with .git', () => {
      const result = parseGitHubUrl('git@github.com:owner/repo.git');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should throw on invalid URL', () => {
      expect(() => parseGitHubUrl('invalid-url')).toThrow();
    });
  });

  describe('autogenerateBranchName', () => {
    it('should convert message to branch name', () => {
      const result = autogenerateBranchName('Add new feature');
      expect(result).toMatch(/^add-new-feature-[a-z0-9]+$/);
    });

    it('should remove special characters', () => {
      const result = autogenerateBranchName('Fix bug #123!');
      expect(result).toMatch(/^fix-bug-123-[a-z0-9]+$/);
      expect(result).not.toContain('!');
    });

    it('should handle multiple spaces', () => {
      const result = autogenerateBranchName('Multiple   spaces');
      expect(result).not.toContain('  ');
    });

    it('should use fallback for empty message', () => {
      const result = autogenerateBranchName('!!!');
      expect(result).toMatch(/^task-[a-z0-9]+$/);
    });

    it('should limit branch name length', () => {
      const longMessage = 'a'.repeat(100);
      const result = autogenerateBranchName(longMessage);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should contain timestamp suffix', () => {
      const result = autogenerateBranchName('test');
      // Should end with -XXXXXX (6 char timestamp)
      expect(result).toMatch(/-[a-z0-9]{6}$/);
    });
  });

  describe('validateBranchName', () => {
    it('should accept valid branch names', () => {
      expect(validateBranchName('main').valid).toBe(true);
      expect(validateBranchName('feature/new').valid).toBe(true);
      expect(validateBranchName('bugfix/123').valid).toBe(true);
      expect(validateBranchName('hotfix-critical').valid).toBe(true);
    });

    it('should reject empty branch name', () => {
      const result = validateBranchName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot be empty');
    });

    it('should reject branch starting with dot', () => {
      const result = validateBranchName('.hidden');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot start with a dot');
    });

    it('should reject branch with consecutive dots', () => {
      const result = validateBranchName('branch..name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot contain consecutive dots (..)');
    });

    it('should reject branch with spaces', () => {
      const result = validateBranchName('branch name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot contain spaces');
    });

    it('should reject branch with special characters', () => {
      expect(validateBranchName('branch:name').valid).toBe(false);
      expect(validateBranchName('branch~name').valid).toBe(false);
      expect(validateBranchName('branch^name').valid).toBe(false);
    });

    it('should reject branch ending with slash', () => {
      const result = validateBranchName('branch/');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot end with a slash');
    });

    it('should reject branch with .lock ending', () => {
      const result = validateBranchName('branch.lock');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot end with .lock');
    });
  });

  describe('SSEStreamWriter', () => {
    it('should have isSSEStreamWriter flag', () => {
      const mockRes = { writableEnded: false, write: () => {} };
      const writer = new SSEStreamWriter(mockRes);
      expect(writer.isSSEStreamWriter).toBe(true);
    });

    it('should set and get sessionId', () => {
      const mockRes = { writableEnded: false, write: () => {} };
      const writer = new SSEStreamWriter(mockRes);
      writer.setSessionId('test-session');
      expect(writer.getSessionId()).toBe('test-session');
    });
  });

  describe('ResponseCollector', () => {
    it('should store messages', () => {
      const collector = new ResponseCollector();
      collector.send({ type: 'test', data: 'value' });
      expect(collector.getMessages()).toHaveLength(1);
    });

    it('should extract sessionId from object', () => {
      const collector = new ResponseCollector();
      collector.send({ sessionId: 'session-123', data: 'test' });
      expect(collector.getSessionId()).toBe('session-123');
    });

    it('should extract sessionId from JSON string', () => {
      const collector = new ResponseCollector();
      collector.send('{"sessionId":"session-456"}');
      expect(collector.getSessionId()).toBe('session-456');
    });

    it('should set sessionId', () => {
      const collector = new ResponseCollector();
      collector.setSessionId('manual-session');
      expect(collector.getSessionId()).toBe('manual-session');
    });

    it('should filter assistant messages', () => {
      const collector = new ResponseCollector();
      collector.send({ type: 'status', message: 'starting' });
      collector.send(
        JSON.stringify({
          type: 'claude-response',
          data: { type: 'assistant', content: 'Hello' },
        })
      );
      collector.send(
        JSON.stringify({
          type: 'claude-response',
          data: { type: 'user', content: 'Hi' },
        })
      );

      const assistantMessages = collector.getAssistantMessages();
      expect(assistantMessages).toHaveLength(1);
      expect(assistantMessages[0].type).toBe('assistant');
    });

    it('should calculate total tokens', () => {
      const collector = new ResponseCollector();
      collector.send({
        type: 'claude-response',
        data: {
          message: {
            usage: {
              input_tokens: 100,
              output_tokens: 200,
              cache_read_input_tokens: 50,
              cache_creation_input_tokens: 30,
            },
          },
        },
      });

      const tokens = collector.getTotalTokens();
      expect(tokens.inputTokens).toBe(100);
      expect(tokens.outputTokens).toBe(200);
      expect(tokens.cacheReadTokens).toBe(50);
      expect(tokens.cacheCreationTokens).toBe(30);
      expect(tokens.totalTokens).toBe(380);
    });
  });
});
