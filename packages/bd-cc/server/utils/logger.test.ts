import { describe, it, expect } from 'bun:test';

describe('logger', () => {
  it('should export logger and createLogger', async () => {
    const { logger, createLogger } = await import('./logger');

    expect(logger).toBeDefined();
    expect(typeof logger).toBe('object');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');

    expect(createLogger).toBeDefined();
    expect(typeof createLogger).toBe('function');
  });

  it('should create child logger with name', async () => {
    const { createLogger } = await import('./logger');

    const childLogger = createLogger('test-module');

    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
    expect(typeof childLogger.debug).toBe('function');
  });
});
