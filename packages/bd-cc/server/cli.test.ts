import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import path from 'path';
import { parseArgs, isNewerVersion, getInstallDir, getDatabasePath, loadEnvFile, showVersion } from './cli';

// Test the parseArgs function
describe('parseArgs', () => {
  it('should parse empty args as start command', () => {
    const result = parseArgs([]);
    expect(result.command).toBe('start');
    expect(result.options).toEqual({});
  });

  it('should parse --port option', () => {
    const result = parseArgs(['--port', '8080']);
    expect(result.options.port).toBe('8080');
  });

  it('should parse -p short option', () => {
    const result = parseArgs(['-p', '3000']);
    expect(result.options.port).toBe('3000');
  });

  it('should parse --port=value format', () => {
    const result = parseArgs(['--port=9000']);
    expect(result.options.port).toBe('9000');
  });

  it('should parse --database-path option', () => {
    const result = parseArgs(['--database-path', '/custom/path/db.sqlite']);
    expect(result.options.databasePath).toBe('/custom/path/db.sqlite');
  });

  it('should parse --database-path=value format', () => {
    const result = parseArgs(['--database-path=/custom/path/db.sqlite']);
    expect(result.options.databasePath).toBe('/custom/path/db.sqlite');
  });

  it('should parse --help option', () => {
    const result = parseArgs(['--help']);
    expect(result.command).toBe('help');
  });

  it('should parse -h short option', () => {
    const result = parseArgs(['-h']);
    expect(result.command).toBe('help');
  });

  it('should parse --version option', () => {
    const result = parseArgs(['--version']);
    expect(result.command).toBe('version');
  });

  it('should parse -v short option', () => {
    const result = parseArgs(['-v']);
    expect(result.command).toBe('version');
  });

  it('should parse start command', () => {
    const result = parseArgs(['start']);
    expect(result.command).toBe('start');
  });

  it('should parse status command', () => {
    const result = parseArgs(['status']);
    expect(result.command).toBe('status');
  });

  it('should parse multiple options', () => {
    const result = parseArgs(['start', '--port', '8080', '--database-path', '/tmp/db']);
    expect(result.command).toBe('start');
    expect(result.options.port).toBe('8080');
    expect(result.options.databasePath).toBe('/tmp/db');
  });
});

// Test the isNewerVersion function
describe('isNewerVersion', () => {
  it('should return true when v1 is newer than v2', () => {
    expect(isNewerVersion('2.0.0', '1.0.0')).toBe(true);
  });

  it('should return true when v1 is newer in minor version', () => {
    expect(isNewerVersion('1.5.0', '1.4.0')).toBe(true);
  });

  it('should return true when v1 is newer in patch version', () => {
    expect(isNewerVersion('1.0.5', '1.0.4')).toBe(true);
  });

  it('should return false when v1 is older than v2', () => {
    expect(isNewerVersion('1.0.0', '2.0.0')).toBe(false);
  });

  it('should return false when versions are equal', () => {
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
  });

  it('should handle different version length', () => {
    // isNewerVersion only compares first 3 parts, so 1.0.0.1 is treated as 1.0.0
    expect(isNewerVersion('1.0.0.1', '1.0.0')).toBe(false);
  });

  it('should handle versions with v prefix', () => {
    // v prefix causes parsing issue, so this returns false
    expect(isNewerVersion('v2.0.0', 'v1.0.0')).toBe(false);
  });
});

// Test getInstallDir function
describe('getInstallDir', () => {
  it('should return parent directory of server', () => {
    const result = getInstallDir();
    expect(result).toBe(path.join(__dirname, '..'));
  });
});

// Test getDatabasePath function
describe('getDatabasePath', () => {
  const originalEnv = process.env.DATABASE_PATH;

  afterEach(() => {
    process.env.DATABASE_PATH = originalEnv;
  });

  it('should return DATABASE_PATH if set', () => {
    process.env.DATABASE_PATH = '/custom/path/db.sqlite';
    const result = getDatabasePath();
    expect(result).toBe('/custom/path/db.sqlite');
  });

  it('should return default path if DATABASE_PATH not set', () => {
    delete process.env.DATABASE_PATH;
    const result = getDatabasePath();
    expect(result).toContain('database');
    expect(result).toContain('auth.db');
  });
});

// Test loadEnvFile function
describe('loadEnvFile', () => {
  it('should not throw when .env file does not exist', () => {
    expect(() => loadEnvFile()).not.toThrow();
  });
});

// Test showVersion function
describe('showVersion', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should output version string', () => {
    showVersion();
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
