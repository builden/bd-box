import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { parseEnvFile, getDefaultDatabasePath } from './env-parser';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('env-parser', () => {
  const tempDirs: string[] = [];
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-parser-test-'));
    tempDirs.push(tempDir);
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    // Clean up temp dirs
    for (const dir of tempDirs) {
      try {
        fs.rmSync(dir, { force: true, recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    tempDirs.length = 0;
  });

  describe('parseEnvFile', () => {
    it('should parse simple key-value pairs', () => {
      const envPath = path.join(tempDirs[0], '.env');
      fs.writeFileSync(envPath, 'KEY1=value1\nKEY2=value2');
      parseEnvFile(envPath);
      expect(process.env.KEY1).toBe('value1');
      expect(process.env.KEY2).toBe('value2');
    });

    it('should ignore comments starting with #', () => {
      const envPath = path.join(tempDirs[0], '.env');
      fs.writeFileSync(envPath, '# This is a comment\nKEY=value');
      parseEnvFile(envPath);
      expect(process.env.KEY).toBe('value');
    });

    it('should ignore empty lines', () => {
      const envPath = path.join(tempDirs[0], '.env');
      fs.writeFileSync(envPath, '\n\nKEY=value\n\n');
      parseEnvFile(envPath);
      expect(process.env.KEY).toBe('value');
    });

    it('should handle values with equals sign', () => {
      const envPath = path.join(tempDirs[0], '.env');
      fs.writeFileSync(envPath, 'JSON={"key":"value"}');
      parseEnvFile(envPath);
      expect(process.env.JSON).toBe('{"key":"value"}');
    });

    it('should trim whitespace from keys and values', () => {
      const envPath = path.join(tempDirs[0], '.env');
      fs.writeFileSync(envPath, '  KEY  =  value  ');
      parseEnvFile(envPath);
      expect(process.env.KEY).toBe('value');
    });

    it('should not overwrite existing env vars by default', () => {
      process.env.EXISTING = 'old';
      const envPath = path.join(tempDirs[0], '.env');
      fs.writeFileSync(envPath, 'EXISTING=new');
      parseEnvFile(envPath);
      expect(process.env.EXISTING).toBe('old');
    });

    it('should overwrite existing env vars when overwrite is true', () => {
      process.env.EXISTING = 'old';
      const envPath = path.join(tempDirs[0], '.env');
      fs.writeFileSync(envPath, 'EXISTING=new');
      parseEnvFile(envPath, true);
      expect(process.env.EXISTING).toBe('new');
    });

    it('should silently ignore missing file', () => {
      expect(() => parseEnvFile('/nonexistent/.env')).not.toThrow();
    });
  });

  describe('getDefaultDatabasePath', () => {
    it('should return path in home directory', () => {
      const dbPath = getDefaultDatabasePath();
      expect(dbPath).toContain(os.homedir());
      expect(dbPath).toContain('.cloudcli');
      expect(dbPath).toContain('auth.db');
    });
  });
});
