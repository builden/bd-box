import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { Response } from 'express';
import {
  handleRouteError,
  sendError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  sendSuccess,
  validateRequired,
  validateQueryRequired,
  parseIntParam,
  parseString,
  parseBoolean,
} from './helpers';

describe('routes/helpers', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('handleRouteError', () => {
    it('should send 500 with error message for Error', () => {
      handleRouteError(mockResponse as Response, new Error('Test error'));
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Test error' });
    });

    it('should send 500 with string for non-Error', () => {
      handleRouteError(mockResponse as Response, 'String error');
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'String error' });
    });

    it('should log context when provided', () => {
      handleRouteError(mockResponse as Response, new Error('Test'), 'test-context');
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('sendError', () => {
    it('should send error with custom status', () => {
      sendError(mockResponse as Response, 418, 'Custom error');
      expect(mockResponse.status).toHaveBeenCalledWith(418);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Custom error' });
    });
  });

  describe('badRequest', () => {
    it('should send 400', () => {
      badRequest(mockResponse as Response, 'Invalid input');
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid input' });
    });
  });

  describe('unauthorized', () => {
    it('should send 401 with default message', () => {
      unauthorized(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should send custom message', () => {
      unauthorized(mockResponse as Response, 'Token expired');
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token expired' });
    });
  });

  describe('forbidden', () => {
    it('should send 403', () => {
      forbidden(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('notFound', () => {
    it('should send 404', () => {
      notFound(mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('sendSuccess', () => {
    it('should send success response', () => {
      sendSuccess(mockResponse as Response, { id: 1 });
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });
  });

  describe('validateRequired', () => {
    it('should return null when all fields present', () => {
      const body = { name: 'test', age: 25 };
      expect(validateRequired(body, ['name', 'age'])).toBeNull();
    });

    it('should return error message for missing field', () => {
      const body = { name: 'test' };
      expect(validateRequired(body, ['name', 'age'])).toBe('Missing required field: age');
    });

    it('should detect null values', () => {
      const body = { name: null as any };
      expect(validateRequired(body, ['name'])).toBe('Missing required field: name');
    });

    it('should detect empty string', () => {
      const body = { name: '' };
      expect(validateRequired(body, ['name'])).toBe('Missing required field: name');
    });
  });

  describe('validateQueryRequired', () => {
    it('should return null when all params present', () => {
      const query = { page: '1', limit: '10' };
      expect(validateQueryRequired(query, ['page', 'limit'])).toBeNull();
    });

    it('should return error for missing param', () => {
      const query = { page: '1' };
      expect(validateQueryRequired(query, ['page', 'limit'])).toBe('Missing required query parameter: limit');
    });
  });

  describe('parseIntParam', () => {
    it('should parse valid integer', () => {
      expect(parseIntParam('42', 10)).toBe(42);
    });

    it('should return default for NaN', () => {
      expect(parseIntParam('abc', 10)).toBe(10);
    });

    it('should return default for undefined', () => {
      expect(parseIntParam(undefined, 10)).toBe(10);
    });

    it('should enforce minimum value', () => {
      expect(parseIntParam('5', 10, 20)).toBe(20);
    });

    it('should return parsed value when above minimum', () => {
      expect(parseIntParam('30', 10, 20)).toBe(30);
    });
  });

  describe('parseString', () => {
    it('should return string as-is', () => {
      expect(parseString('test', 'default')).toBe('test');
    });

    it('should return default for non-string', () => {
      expect(parseString(123, 'default')).toBe('default');
      expect(parseString(null, 'default')).toBe('default');
    });
  });

  describe('parseBoolean', () => {
    it('should return boolean as-is', () => {
      expect(parseBoolean(true, false)).toBe(true);
      expect(parseBoolean(false, true)).toBe(false);
    });

    it('should parse string "true"', () => {
      expect(parseBoolean('true', false)).toBe(true);
      expect(parseBoolean('TRUE', false)).toBe(true);
    });

    it('should parse string "false"', () => {
      expect(parseBoolean('false', true)).toBe(false);
    });

    it('should return default for other values', () => {
      expect(parseBoolean('yes', false)).toBe(false);
      expect(parseBoolean(1, false)).toBe(false);
    });
  });
});
