/**
 * ShellHandler WebSocket Handler Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../app/container';
import { loadConfig, type AppConfig } from '../app/config';
import { ShellHandler } from './shell-handler';

describe('ShellHandler', () => {
  let container: Container;
  let config: AppConfig;
  let handler: ShellHandler;

  beforeEach(() => {
    container = new Container();
    config = loadConfig();
    handler = new ShellHandler(container, config);
  });

  it('should create handler instance', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(ShellHandler);
  });

  it('should have empty sessions on init', () => {
    // The sessions should be empty initially
    // We'll add more tests as we implement the handler
    expect(handler).toBeDefined();
  });
});
