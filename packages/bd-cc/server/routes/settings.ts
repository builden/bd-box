/**
 * Settings Routes
 * API keys and credentials management
 *
 * 遵循 api.md 规范
 */

import express from 'express';
import { apiKeysDb, credentialsDb } from '../database/index.ts';
import { createLogger } from '../utils/logger.ts';
import { success, badRequest, notFound, serverError, created } from '../utils/api-response.ts';

const router = express.Router();
const logger = createLogger('settings');

// ===============================
// API Keys Management
// ===============================

// Get all API keys for the authenticated user
router.get('/api-keys', async (req, res) => {
  try {
    const apiKeys = apiKeysDb.getApiKeys(req.user.id);
    // Don't send the full API key in the list for security
    const sanitizedKeys = apiKeys.map((key) => ({
      ...key,
      api_key: key.api_key.substring(0, 10) + '...',
    }));
    return success(res, { apiKeys: sanitizedKeys });
  } catch (error) {
    logger.error('Error fetching API keys:', error as Error);
    return serverError(res, 'Failed to fetch API keys');
  }
});

// Create a new API key
router.post('/api-keys', async (req, res) => {
  try {
    const { keyName } = req.body;

    if (!keyName || !keyName.trim()) {
      return badRequest(res, 'Key name is required');
    }

    const result = apiKeysDb.createApiKey(req.user.id, keyName.trim());
    return created(res, {
      success: true,
      apiKey: result,
    });
  } catch (error) {
    logger.error('Error creating API key:', error as Error);
    return serverError(res, 'Failed to create API key');
  }
});

// Delete an API key
router.delete('/api-keys/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const deleted = apiKeysDb.deleteApiKey(req.user.id, parseInt(keyId));

    if (deleted) {
      return success(res, { success: true });
    } else {
      return notFound(res, 'API key');
    }
  } catch (error) {
    logger.error('Error deleting API key:', error as Error);
    return serverError(res, 'Failed to delete API key');
  }
});

// Toggle API key active status
router.patch('/api-keys/:keyId/toggle', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return badRequest(res, 'isActive must be a boolean');
    }

    const toggled = apiKeysDb.toggleApiKey(req.user.id, parseInt(keyId), isActive);

    if (toggled) {
      return success(res, { success: true });
    } else {
      return notFound(res, 'API key');
    }
  } catch (error) {
    logger.error('Error toggling API key:', error as Error);
    return serverError(res, 'Failed to toggle API key');
  }
});

// ===============================
// Generic Credentials Management
// ===============================

// Get all credentials for the authenticated user (optionally filtered by type)
router.get('/credentials', async (req, res) => {
  try {
    const { type } = req.query;
    const credentials = credentialsDb.getCredentials(req.user.id, type || null);
    // Don't send the actual credential values for security
    return success(res, { credentials });
  } catch (error) {
    logger.error('Error fetching credentials:', error as Error);
    return serverError(res, 'Failed to fetch credentials');
  }
});

// Create a new credential
router.post('/credentials', async (req, res) => {
  try {
    const { credentialName, credentialType, credentialValue, description } = req.body;

    if (!credentialName || !credentialName.trim()) {
      return badRequest(res, 'Credential name is required');
    }

    if (!credentialType || !credentialType.trim()) {
      return badRequest(res, 'Credential type is required');
    }

    if (!credentialValue || !credentialValue.trim()) {
      return badRequest(res, 'Credential value is required');
    }

    const result = credentialsDb.createCredential(
      req.user.id,
      credentialName.trim(),
      credentialType.trim(),
      credentialValue.trim(),
      description?.trim() || null
    );

    return created(res, {
      success: true,
      credential: result,
    });
  } catch (error) {
    logger.error('Error creating credential:', error as Error);
    return serverError(res, 'Failed to create credential');
  }
});

// Delete a credential
router.delete('/credentials/:credentialId', async (req, res) => {
  try {
    const { credentialId } = req.params;
    const deleted = credentialsDb.deleteCredential(req.user.id, parseInt(credentialId));

    if (deleted) {
      return success(res, { success: true });
    } else {
      return notFound(res, 'Credential');
    }
  } catch (error) {
    logger.error('Error deleting credential:', error as Error);
    return serverError(res, 'Failed to delete credential');
  }
});

// Toggle credential active status
router.patch('/credentials/:credentialId/toggle', async (req, res) => {
  try {
    const { credentialId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return badRequest(res, 'isActive must be a boolean');
    }

    const toggled = credentialsDb.toggleCredential(req.user.id, parseInt(credentialId), isActive);

    if (toggled) {
      return success(res, { success: true });
    } else {
      return notFound(res, 'Credential');
    }
  } catch (error) {
    logger.error('Error toggling credential:', error as Error);
    return serverError(res, 'Failed to toggle credential');
  }
});

export default router;
