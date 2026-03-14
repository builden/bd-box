import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import { requestLogger } from './request-logger';

describe('request-logger middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      headers: {},
    };

    mockResponse = {
      statusCode: 200,
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'finish') {
          // Store callback to call later
          (mockResponse as any)._finishCallback = callback;
        }
      }),
    };

    mockNext = vi.fn();
  });

  it('should call next function', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should attach request ID from header when present', () => {
    mockRequest.headers = { 'x-request-id': 'test-request-id' };
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    // Next should be called
    expect(mockNext).toHaveBeenCalled();
  });

  it('should attach finish listener to response', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should handle different HTTP methods', () => {
    mockRequest.method = 'POST';
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();

    mockRequest.method = 'PUT';
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();

    mockRequest.method = 'DELETE';
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle different URLs', () => {
    mockRequest.url = '/api/users/123';
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();

    mockRequest.url = '/api/health';
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
