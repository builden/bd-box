import { describe, it, expect, beforeEach, vi } from 'bun:test';
import type { Request, Response } from 'express';
import {
  success,
  successList,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  rateLimited,
  serverError,
  badGateway,
  gatewayTimeout,
  generateRequestId,
  getRequestId,
  handleZodError,
  asyncHandler,
} from './api-response';
import { ZodError } from 'zod';

describe('api-response', () => {
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      req: { headers: {} },
    };
    mockRequest = {
      headers: {},
    } as any;
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getRequestId', () => {
    it('should return existing request ID from header', () => {
      mockRequest.headers = { 'x-request-id': 'custom-id' };
      expect(getRequestId(mockRequest as Request)).toBe('custom-id');
    });

    it('should generate new ID when header is missing', () => {
      mockRequest.headers = {};
      const id = getRequestId(mockRequest as Request);
      expect(id).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('success', () => {
    it('should return data with 200 status', () => {
      success(mockResponse as Response, { key: 'value' });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: { key: 'value' } });
    });

    it('should use custom status code', () => {
      success(mockResponse as Response, { key: 'value' }, 201);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('successList', () => {
    it('should return list with meta', () => {
      successList(mockResponse as Response, [{ id: 1 }], { total: 10, page: 1, limit: 5 });
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [{ id: 1 }],
        meta: { total: 10, page: 1, limit: 5 },
      });
    });

    it('should return empty meta when not provided', () => {
      successList(mockResponse as Response, []);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        meta: {},
      });
    });
  });

  describe('created', () => {
    it('should return data with 201 status', () => {
      created(mockResponse as Response, { id: 1 });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: { id: 1 } });
    });
  });

  describe('noContent', () => {
    it('should return 204 status', () => {
      noContent(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should return error with default code', () => {
      error(mockResponse as Response, { message: 'Error message' });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.code).toBe('internal_error');
      expect(jsonCall.error.message).toBe('Error message');
      expect(jsonCall.error.locale).toBe('zh-CN');
      expect(jsonCall.error.request_id).toMatch(/^req_/);
      expect(jsonCall.error.timestamp).toBeDefined();
    });

    it('should return custom error code and status', () => {
      error(mockResponse as Response, { code: 'custom_code', message: 'Custom error', statusCode: 418 });
      expect(mockResponse.status).toHaveBeenCalledWith(418);
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.code).toBe('custom_code');
    });

    it('should include details when provided', () => {
      error(mockResponse as Response, {
        message: 'Validation failed',
        details: [{ field: 'name', message: 'Required' }],
      });
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.details).toEqual([{ field: 'name', message: 'Required' }]);
    });
  });

  describe('badRequest', () => {
    it('should return 400 with validation error code', () => {
      badRequest(mockResponse as Response, 'Invalid input');
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.code).toBe('validation_error');
    });
  });

  describe('unauthorized', () => {
    it('should return 401 with default message', () => {
      unauthorized(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.code).toBe('auth.unauthorized');
    });

    it('should return custom message', () => {
      unauthorized(mockResponse as Response, 'Token expired');
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.message).toBe('Token expired');
    });
  });

  describe('forbidden', () => {
    it('should return 403', () => {
      forbidden(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('notFound', () => {
    it('should return 404 with resource name', () => {
      notFound(mockResponse as Response, 'User');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.code).toBe('User.not_found');
      expect(jsonCall.error.message).toBe('User不存在');
    });
  });

  describe('conflict', () => {
    it('should return 409', () => {
      conflict(mockResponse as Response, 'Resource already exists');
      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });
  });

  describe('unprocessable', () => {
    it('should return 422', () => {
      unprocessable(mockResponse as Response, 'Invalid data');
      expect(mockResponse.status).toHaveBeenCalledWith(422);
    });
  });

  describe('rateLimited', () => {
    it('should return 429', () => {
      rateLimited(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });
  });

  describe('serverError', () => {
    it('should return 500', () => {
      serverError(mockResponse as Response, 'Internal error');
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('badGateway', () => {
    it('should return 502', () => {
      badGateway(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(502);
    });
  });

  describe('gatewayTimeout', () => {
    it('should return 504', () => {
      gatewayTimeout(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(504);
    });
  });

  describe('handleZodError', () => {
    it('should convert ZodError to unprocessable response', () => {
      const zodError = new ZodError([
        { path: ['name'], message: 'Required' },
        { path: ['email'], message: 'Invalid email' },
      ]);
      handleZodError(mockResponse as Response, zodError);
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      const jsonCall = (mockResponse.json as any).mock.calls[0][0];
      expect(jsonCall.error.details).toEqual([
        { field: 'name', message: 'Required' },
        { field: 'email', message: 'Invalid email' },
      ]);
    });
  });

  describe('asyncHandler', () => {
    it('should call handler and return result', async () => {
      const handler = asyncHandler(async (req, res) => {
        return success(res, { handled: true });
      });
      await handler(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should catch and handle ZodError', async () => {
      const handler = asyncHandler(async () => {
        throw new ZodError([{ path: ['test'], message: 'Test error' }]);
      });
      await handler(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(422);
    });

    it('should catch and handle Error', async () => {
      const handler = asyncHandler(async () => {
        throw new Error('Test error');
      });
      await handler(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
