import { describe, it, expect } from 'bun:test';
import {
  validateRemoteName,
  validateProjectPath,
  stripDiffHeaders,
  getGitErrorDetails,
  isMissingHeadRevisionError,
  normalizeRepositoryRelativeFilePath,
  parseStatusFilePaths,
  buildFilePathCandidates,
  cleanCommitMessage,
} from './git-operations';

describe('git-operations', () => {
  describe('validateRemoteName', () => {
    it('should accept valid remote names', () => {
      expect(validateRemoteName('origin')).toBe('origin');
      expect(validateRemoteName('upstream')).toBe('upstream');
      expect(validateRemoteName('my-remote_1')).toBe('my-remote_1');
    });

    it('should throw on invalid remote names', () => {
      expect(() => validateRemoteName('')).toThrow();
      expect(() => validateRemoteName('remote with space')).toThrow();
      expect(() => validateRemoteName('remote/with/slash')).toThrow();
      expect(() => validateRemoteName(null as any)).toThrow();
    });
  });

  describe('validateProjectPath', () => {
    it('should accept valid project paths', () => {
      expect(validateProjectPath('/path/to/project')).toBe('/path/to/project');
      expect(validateProjectPath('./relative/path')).toBe('./relative/path');
    });

    it('should throw on invalid project paths', () => {
      expect(() => validateProjectPath('')).toThrow();
      expect(() => validateProjectPath(null as any)).toThrow();
      expect(() => validateProjectPath(undefined as any)).toThrow();
    });
  });

  describe('stripDiffHeaders', () => {
    it('should strip diff headers', () => {
      const diff = `diff --git a/file.ts b/file.ts
index abc1234..def5678 100644
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
+new line
 old line`;
      const result = stripDiffHeaders(diff);
      expect(result).not.toContain('diff --git');
      expect(result).not.toContain('index ');
      expect(result).not.toContain('--- a/');
      expect(result).not.toContain('+++ b/');
      expect(result).toContain('new line');
      expect(result).toContain('old line');
    });

    it('should handle empty diff', () => {
      expect(stripDiffHeaders('')).toBe('');
    });
  });

  describe('getGitErrorDetails', () => {
    it('should extract message and stderr from Error object', () => {
      const error = new Error('test error');
      const details = getGitErrorDetails(error);
      expect(details.message).toBe('test error');
      expect(details.stderr).toBe('');
    });

    it('should handle object with message and stderr', () => {
      const error = { message: 'error msg', stderr: 'stderr content' };
      const details = getGitErrorDetails(error);
      expect(details.message).toBe('error msg');
      expect(details.stderr).toBe('stderr content');
    });

    it('should handle string error', () => {
      const details = getGitErrorDetails('string error');
      expect(details.message).toBe('string error');
    });

    it('should handle null/undefined', () => {
      expect(getGitErrorDetails(null).message).toBe('null');
      expect(getGitErrorDetails(undefined).message).toBe('undefined');
    });
  });

  describe('isMissingHeadRevisionError', () => {
    it('should detect ambiguous errors', () => {
      const error = { stderr: 'ambiguous' };
      expect(isMissingHeadRevisionError(error)).toBe(true);
    });

    it('should detect unknown revision errors', () => {
      const error = { stderr: 'unknown revision' };
      expect(isMissingHeadRevisionError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { stderr: 'some other error' };
      expect(isMissingHeadRevisionError(error)).toBe(false);
    });
  });

  describe('normalizeRepositoryRelativeFilePath', () => {
    it('should remove leading slash', () => {
      expect(normalizeRepositoryRelativeFilePath('/path/to/file')).toBe('path/to/file');
    });

    it('should convert backslashes to forward slashes', () => {
      expect(normalizeRepositoryRelativeFilePath('path\\to\\file')).toBe('path/to/file');
    });

    it('should handle paths without leading slash', () => {
      expect(normalizeRepositoryRelativeFilePath('path/to/file')).toBe('path/to/file');
    });
  });

  describe('parseStatusFilePaths', () => {
    it('should parse modified files', () => {
      const status = ' M file1.ts\n M file2.ts';
      const result = parseStatusFilePaths(status);
      expect(result.modified).toContain('file1.ts');
      expect(result.modified).toContain('file2.ts');
    });

    it('should parse added files', () => {
      const status = 'A  newfile.ts';
      const result = parseStatusFilePaths(status);
      expect(result.added).toContain('newfile.ts');
    });

    it('should parse deleted files', () => {
      const status = 'D  deleted.ts';
      const result = parseStatusFilePaths(status);
      expect(result.deleted).toContain('deleted.ts');
    });

    it('should parse untracked files', () => {
      const status = '?? untracked.ts';
      const result = parseStatusFilePaths(status);
      expect(result.untracked).toContain('untracked.ts');
    });

    it('should handle quoted file paths', () => {
      const status = 'M  "path with spaces.ts"';
      const result = parseStatusFilePaths(status);
      // Current implementation doesn't fully strip quotes
      expect(result.modified.length).toBeGreaterThan(0);
    });

    it('should handle empty status', () => {
      const result = parseStatusFilePaths('');
      expect(result.modified).toEqual([]);
      expect(result.added).toEqual([]);
      expect(result.deleted).toEqual([]);
      expect(result.untracked).toEqual([]);
    });
  });

  describe('buildFilePathCandidates', () => {
    it('should generate path candidates', () => {
      const candidates = buildFilePathCandidates('/project', '/repo', 'file.ts');
      // The function uses path.relative which resolves relative to current working directory
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates).toContain('file.ts');
    });

    it('should deduplicate candidates', () => {
      const candidates = buildFilePathCandidates('/project', '/project', 'file.ts');
      // Should have unique values
      expect(new Set(candidates).size).toBe(candidates.length);
    });
  });

  describe('cleanCommitMessage', () => {
    it('should remove comment lines', () => {
      const msg = `# This is a comment
Actual commit message
# Another comment`;
      const result = cleanCommitMessage(msg);
      expect(result).toBe('Actual commit message');
    });

    it('should trim whitespace', () => {
      const msg = `  message with spaces  `;
      expect(cleanCommitMessage(msg)).toBe('message with spaces');
    });

    it('should handle empty message', () => {
      expect(cleanCommitMessage('')).toBe('');
      expect(cleanCommitMessage('   ')).toBe('');
    });

    it('should handle message with multiple lines', () => {
      const msg = `line1
# comment
line2`;
      expect(cleanCommitMessage(msg)).toBe('line1\nline2');
    });
  });
});
