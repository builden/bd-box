import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { logger, createLogger, logApiRequest, logApiResponse, logUserAction } from './logger';

// Mock import.meta.env
const originalEnv = import.meta.env;

describe('logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock import.meta.env
    import.meta.env = { ...originalEnv, PROD: false };

    // Spy on console methods
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.debug.mockRestore();
    consoleSpy.info.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
    import.meta.env = originalEnv;
  });

  describe('logger.debug', () => {
    it('should log debug message in development', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] Test debug message');
    });

    it('should log debug message with context', () => {
      logger.debug('Test debug message', { userId: 123 });
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] Test debug message {"userId":123}');
    });

    it('should redact sensitive information', () => {
      logger.debug('Test message', { password: 'secret', token: 'abc123' });
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DEBUG] Test message {"password":"[REDACTED]","token":"[REDACTED]"}'
      );
    });

    it('should handle object values as [Object]', () => {
      logger.debug('Test message', { user: { name: 'test' } });
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] Test message {"user":"[Object]"}');
    });
  });

  describe('logger.info', () => {
    it('should log info message', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] Test info message');
    });

    it('should log info message with context', () => {
      logger.info('Test info message', { action: 'click' });
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] Test info message {"action":"click"}');
    });
  });

  describe('logger.warn', () => {
    it('should log warn message', () => {
      logger.warn('Test warn message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] Test warn message');
    });

    it('should log warn message with context', () => {
      logger.warn('Test warn message', { code: 404 });
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] Test warn message {"code":404}');
    });
  });

  describe('logger.error', () => {
    it('should log error message', () => {
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] Test error message');
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(consoleSpy.error).toHaveBeenCalled();
      const callArg = consoleSpy.error.mock.calls[0][0];
      expect(callArg).toContain('[ERROR]');
      expect(callArg).toContain('Test error');
    });

    it('should log error with context', () => {
      logger.error('Test error', new Error('test'), { requestId: 'abc' });
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('should create logger with module name', () => {
      const moduleLogger = createLogger('TestModule');

      moduleLogger.info('Test message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] Test message {"module":"TestModule"}');
    });

    it('should merge context with module', () => {
      const moduleLogger = createLogger('TestModule');

      moduleLogger.debug('Test', { userId: 123 });
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] Test {"module":"TestModule","userId":123}');
    });
  });

  describe('logApiRequest', () => {
    it('should log API request', () => {
      logApiRequest('GET', '/api/users');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] GET /api/users');
    });

    it('should log API request with context', () => {
      logApiRequest('POST', '/api/users', { body: { name: 'test' } });
      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe('logApiResponse', () => {
    it('should log successful API response as info', () => {
      logApiResponse('/api/users', 200, 150);
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log error API response as warn', () => {
      logApiResponse('/api/users', 404, 50);
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('logUserAction', () => {
    it('should log user action as info', () => {
      logUserAction('click_button', { buttonId: 'submit' });
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] User Action: click_button {"buttonId":"submit"}');
    });
  });
});
