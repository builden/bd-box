import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';

// 直接测试 logger 模块的输出格式
// 由于 pino 在 Bun 环境下使用异步写入，我们通过检查输出内容来验证

describe('logger', () => {
  describe('shared config', () => {
    it('should have consistent colors between frontend and backend', async () => {
      const { LOG_COLORS, LOG_COLORS_BY_LEVEL, PINO_PRETTY_CUSTOM_COLORS } = await import('../../shared/config');

      // 验证颜色配置存在
      expect(LOG_COLORS.debug).toBe('#6c757d');
      expect(LOG_COLORS.info).toBe('#198754');
      expect(LOG_COLORS.warn).toBe('#ffc107');
      expect(LOG_COLORS.error).toBe('#dc3545');

      // 验证数字键版本
      expect(LOG_COLORS_BY_LEVEL[20]).toBe('#6c757d');
      expect(LOG_COLORS_BY_LEVEL[30]).toBe('#198754');
      expect(LOG_COLORS_BY_LEVEL[40]).toBe('#ffc107');
      expect(LOG_COLORS_BY_LEVEL[50]).toBe('#dc3545');

      // 验证 pino-pretty 配置
      expect(PINO_PRETTY_CUSTOM_COLORS.debug).toBe('dim');
      expect(PINO_PRETTY_CUSTOM_COLORS.info).toBe('green');
      expect(PINO_PRETTY_CUSTOM_COLORS.warn).toBe('yellow');
      expect(PINO_PRETTY_CUSTOM_COLORS.error).toBe('red');
    });

    it('should have correct log level names', async () => {
      const { LOG_LEVEL_NAMES } = await import('../../shared/config');

      expect(LOG_LEVEL_NAMES[10]).toBe('TRACE');
      expect(LOG_LEVEL_NAMES[20]).toBe('DEBUG');
      expect(LOG_LEVEL_NAMES[30]).toBe('INFO');
      expect(LOG_LEVEL_NAMES[40]).toBe('WARN');
      expect(LOG_LEVEL_NAMES[50]).toBe('ERROR');
      expect(LOG_LEVEL_NAMES[60]).toBe('FATAL');
    });

    it('should have frontend log level config', async () => {
      const { FRONTEND_LOG_LEVEL } = await import('../../shared/config');

      expect(FRONTEND_LOG_LEVEL.development).toBe('debug');
      expect(FRONTEND_LOG_LEVEL.production).toBe('warn');
    });
  });

  describe('logger functions', () => {
    it('should export logger functions', async () => {
      const { logger, createLogger, logApiRequest, logApiResponse, logUserAction } = await import('./logger');

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof createLogger).toBe('function');
      expect(typeof logApiRequest).toBe('function');
      expect(typeof logApiResponse).toBe('function');
      expect(typeof logUserAction).toBe('function');
    });

    it('should create module logger with context', async () => {
      const { createLogger } = await import('./logger');
      const moduleLogger = createLogger('TestModule');

      expect(typeof moduleLogger.debug).toBe('function');
      expect(typeof moduleLogger.info).toBe('function');
      expect(typeof moduleLogger.warn).toBe('function');
      expect(typeof moduleLogger.error).toBe('function');
    });
  });
});
