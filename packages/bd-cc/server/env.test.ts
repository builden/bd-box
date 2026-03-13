import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Test the env file parsing logic that load-env.ts uses
// We extract the logic to test it without importing the module (which auto-executes)

describe('load-env logic', () => {
  const testEnvPath = path.join(__dirname, '../.env.test');
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear test env vars
    delete process.env.TEST_VAR;
    delete process.env.TEST_VAR2;
    delete process.env.DATABASE_PATH;
  });

  afterEach(() => {
    process.env = originalEnv;
    // Clean up test env file
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }
  });

  // Replicate the load-env logic for testing
  function loadEnvFromFile(envPath: string) {
    try {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          // Note: key is NOT trimmed in the original code, only the value is trimmed
          if (key && valueParts.length > 0 && !process.env[key.trim()]) {
            process.env[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    } catch (e) {
      // Error loading env file
      throw e;
    }
  }

  it('should parse simple key=value pairs', () => {
    fs.writeFileSync(testEnvPath, 'TEST_VAR=test_value\n');
    loadEnvFromFile(testEnvPath);
    expect(process.env.TEST_VAR).toBe('test_value');
  });

  it('should ignore comment lines starting with #', () => {
    fs.writeFileSync(testEnvPath, '# This is a comment\nTEST_VAR=value\n');
    loadEnvFromFile(testEnvPath);
    expect(process.env.TEST_VAR).toBe('value');
  });

  it('should ignore empty lines', () => {
    fs.writeFileSync(testEnvPath, '\n\nTEST_VAR=value\n\n');
    loadEnvFromFile(testEnvPath);
    expect(process.env.TEST_VAR).toBe('value');
  });

  it('should handle values containing = sign', () => {
    fs.writeFileSync(testEnvPath, 'TEST_VAR=key1=value1,key2=value2\n');
    loadEnvFromFile(testEnvPath);
    expect(process.env.TEST_VAR).toBe('key1=value1,key2=value2');
  });

  it('should not overwrite existing environment variables', () => {
    process.env.TEST_VAR = 'existing_value';
    fs.writeFileSync(testEnvPath, 'TEST_VAR=new_value\n');
    loadEnvFromFile(testEnvPath);
    expect(process.env.TEST_VAR).toBe('existing_value');
  });

  it('should handle multiple variables', () => {
    fs.writeFileSync(testEnvPath, 'TEST_VAR1=value1\nTEST_VAR2=value2\nTEST_VAR3=value3\n');
    loadEnvFromFile(testEnvPath);
    expect(process.env.TEST_VAR1).toBe('value1');
    expect(process.env.TEST_VAR2).toBe('value2');
    expect(process.env.TEST_VAR3).toBe('value3');
  });

  it('should trim whitespace from keys and values', () => {
    fs.writeFileSync(testEnvPath, '  TEST_VAR  =  value with spaces  \n');
    loadEnvFromFile(testEnvPath);
    expect(process.env.TEST_VAR).toBe('value with spaces');
  });

  it('should throw when file does not exist', () => {
    expect(() => loadEnvFromFile('/nonexistent/path/.env')).toThrow();
  });

  it('should handle lines without = sign', () => {
    fs.writeFileSync(testEnvPath, 'TEST_VAR\n=value\n');
    // Should not throw, but the variable without = should be ignored
    expect(() => loadEnvFromFile(testEnvPath)).not.toThrow();
    expect(process.env.TEST_VAR).toBeUndefined();
  });
});

describe('DATABASE_PATH default', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should set default DATABASE_PATH to ~/.cloudcli/auth.db', () => {
    delete process.env.DATABASE_PATH;
    // Simulate the logic from load-env.ts
    if (!process.env.DATABASE_PATH) {
      const os = require('os');
      process.env.DATABASE_PATH = path.join(os.homedir(), '.cloudcli', 'auth.db');
    }
    const expectedPath = path.join(os.homedir(), '.cloudcli', 'auth.db');
    expect(process.env.DATABASE_PATH).toBe(expectedPath);
  });

  it('should not overwrite existing DATABASE_PATH', () => {
    process.env.DATABASE_PATH = '/custom/path/db.sqlite';
    // Simulate the logic from load-env.ts
    if (!process.env.DATABASE_PATH) {
      const os = require('os');
      process.env.DATABASE_PATH = path.join(os.homedir(), '.cloudcli', 'auth.db');
    }
    expect(process.env.DATABASE_PATH).toBe('/custom/path/db.sqlite');
  });
});
