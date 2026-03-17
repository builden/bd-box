import { describe, it, expect } from 'bun:test';
import express from 'express';
import { setupMiddleware } from './middleware';

describe('setupMiddleware', () => {
  it('should not throw when setting up middleware', () => {
    const app = express();
    expect(() => setupMiddleware(app)).not.toThrow();
  });

  it('should accept an express application', () => {
    const app = express();
    setupMiddleware(app);
    // Function should complete without error
    expect(true).toBe(true);
  });

  it('should be callable multiple times', () => {
    const app1 = express();
    const app2 = express();

    expect(() => {
      setupMiddleware(app1);
      setupMiddleware(app2);
    }).not.toThrow();
  });
});
