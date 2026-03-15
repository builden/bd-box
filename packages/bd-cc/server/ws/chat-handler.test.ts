/**
 * ChatHandler WebSocket Handler Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../app/container';
import { loadConfig, type AppConfig } from '../app/config';
import { ChatHandler } from './chat-handler';

describe('ChatHandler', () => {
  let container: Container;
  let config: AppConfig;
  let handler: ChatHandler;

  beforeEach(() => {
    container = new Container();
    config = loadConfig();
    handler = new ChatHandler(container, config);
  });

  it('should create handler instance', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(ChatHandler);
  });
});
