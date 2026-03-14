import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { authenticatedFetch } from '../../../utils/api';
import type { ApiKeyItem, CreatedApiKey } from '../../../features/settings/ui/api-settings/types';
import { ApiKeysListResponseSchema, CredentialsListResponseSchema, ApiKeySchema } from '@shared/api/settings';
import { validateResponse } from '@shared/api/validation';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useCredentialsSettings');

type UseCredentialsSettingsArgs = {
  confirmDeleteApiKeyText: string;
  confirmDeleteGithubCredentialText: string;
};

export function useCredentialsSettings({
  confirmDeleteApiKeyText,
  confirmDeleteGithubCredentialText,
}: UseCredentialsSettingsArgs) {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [githubCredentials, setGithubCredentials] = useState<
    ReturnType<typeof CredentialsListResponseSchema.parse>['credentials']
  >([]);
  const [loading, setLoading] = useState(true);

  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const [showNewGithubForm, setShowNewGithubForm] = useState(false);
  const [newGithubName, setNewGithubName] = useState('');
  const [newGithubToken, setNewGithubToken] = useState('');
  const [newGithubDescription, setNewGithubDescription] = useState('');

  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreatedApiKey | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [apiKeysResponse, credentialsResponse] = await Promise.all([
        authenticatedFetch('/api/settings/api-keys'),
        authenticatedFetch('/api/settings/credentials?type=github_token'),
      ]);

      const [apiKeysJson, credentialsJson] = await Promise.all([apiKeysResponse.json(), credentialsResponse.json()]);

      const apiKeysResult = validateResponse(ApiKeysListResponseSchema, apiKeysJson, {
        endpoint: '/api/settings/api-keys',
        status: apiKeysResponse.status,
        fallbackValue: null,
      });

      const credentialsResult = validateResponse(CredentialsListResponseSchema, credentialsJson, {
        endpoint: '/api/settings/credentials',
        status: credentialsResponse.status,
        fallbackValue: null,
      });

      // Convert snake_case API response to camelCase frontend types
      const convertApiKey = (key: {
        id: string;
        name: string;
        created_at: string;
        enabled: boolean;
        api_key?: string;
        last_used_at?: string;
      }): ApiKeyItem => ({
        id: key.id,
        key_name: key.name,
        api_key: key.api_key || '',
        created_at: key.created_at,
        last_used: key.last_used_at || null,
        is_active: key.enabled,
      });

      setApiKeys((apiKeysResult?.apiKeys || []).map(convertApiKey));
      setGithubCredentials(credentialsResult?.credentials || []);
    } catch (error) {
      logger.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createApiKey = useCallback(async () => {
    if (!newKeyName.trim()) {
      return;
    }

    try {
      const response = await authenticatedFetch('/api/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ keyName: newKeyName.trim() }),
      });

      if (!response.ok) {
        logger.error('Error creating API key: Failed to create');
        return;
      }

      const json = await response.json();
      const result = validateResponse(z.object({ success: z.boolean(), apiKey: ApiKeySchema }), json, {
        endpoint: '/api/settings/api-keys',
        status: response.status,
        fallbackValue: null,
      });

      if (result?.success && result.apiKey) {
        // Convert snake_case from API to camelCase for CreatedApiKey
        setNewlyCreatedKey({
          id: result.apiKey.id,
          keyName: result.apiKey.name,
          apiKey: result.apiKey.api_key || '',
          createdAt: result.apiKey.created_at,
        });
      }
      setNewKeyName('');
      setShowNewKeyForm(false);
      await fetchData();
    } catch (error) {
      logger.error('Error creating API key:', error);
    }
  }, [fetchData, newKeyName]);

  const deleteApiKey = useCallback(
    async (keyId: string) => {
      if (!window.confirm(confirmDeleteApiKeyText)) {
        return;
      }

      try {
        const response = await authenticatedFetch(`/api/settings/api-keys/${keyId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          logger.error('Error deleting API key: Failed to delete');
          return;
        }

        await fetchData();
      } catch (error) {
        logger.error('Error deleting API key:', error);
      }
    },
    [confirmDeleteApiKeyText, fetchData]
  );

  const toggleApiKey = useCallback(
    async (keyId: string, isActive: boolean) => {
      try {
        const response = await authenticatedFetch(`/api/settings/api-keys/${keyId}/toggle`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !isActive }),
        });

        if (!response.ok) {
          logger.error('Error toggling API key: Failed to toggle');
          return;
        }

        await fetchData();
      } catch (error) {
        logger.error('Error toggling API key:', error);
      }
    },
    [fetchData]
  );

  const createGithubCredential = useCallback(async () => {
    if (!newGithubName.trim() || !newGithubToken.trim()) {
      return;
    }

    try {
      const response = await authenticatedFetch('/api/settings/credentials', {
        method: 'POST',
        body: JSON.stringify({
          credentialName: newGithubName.trim(),
          credentialType: 'github_token',
          credentialValue: newGithubToken,
          description: newGithubDescription.trim(),
        }),
      });

      if (!response.ok) {
        logger.error('Error creating GitHub credential: Failed to create');
        return;
      }

      setNewGithubName('');
      setNewGithubToken('');
      setNewGithubDescription('');
      setShowNewGithubForm(false);
      setShowToken((prev) => ({ ...prev, new: false }));
      await fetchData();
    } catch (error) {
      logger.error('Error creating GitHub credential:', error);
    }
  }, [fetchData, newGithubDescription, newGithubName, newGithubToken]);

  const deleteGithubCredential = useCallback(
    async (credentialId: string) => {
      if (!window.confirm(confirmDeleteGithubCredentialText)) {
        return;
      }

      try {
        const response = await authenticatedFetch(`/api/settings/credentials/${credentialId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          logger.error('Error deleting GitHub credential: Failed to delete');
          return;
        }

        await fetchData();
      } catch (error) {
        logger.error('Error deleting GitHub credential:', error);
      }
    },
    [confirmDeleteGithubCredentialText, fetchData]
  );

  const toggleGithubCredential = useCallback(
    async (credentialId: string, isActive: boolean) => {
      try {
        const response = await authenticatedFetch(`/api/settings/credentials/${credentialId}/toggle`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !isActive }),
        });

        if (!response.ok) {
          logger.error('Error toggling GitHub credential: Failed to toggle');
          return;
        }

        await fetchData();
      } catch (error) {
        logger.error('Error toggling GitHub credential:', error);
      }
    },
    [fetchData]
  );

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      copyTextToClipboard(text);
      setCopiedKey(id);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const dismissNewlyCreatedKey = useCallback(() => {
    setNewlyCreatedKey(null);
  }, []);

  const cancelNewApiKeyForm = useCallback(() => {
    setShowNewKeyForm(false);
    setNewKeyName('');
  }, []);

  const cancelNewGithubForm = useCallback(() => {
    setShowNewGithubForm(false);
    setNewGithubName('');
    setNewGithubToken('');
    setNewGithubDescription('');
    setShowToken((prev) => ({ ...prev, new: false }));
  }, []);

  const toggleNewGithubTokenVisibility = useCallback(() => {
    setShowToken((prev) => ({ ...prev, new: !prev.new }));
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    apiKeys,
    githubCredentials,
    loading,
    showNewKeyForm,
    setShowNewKeyForm,
    newKeyName,
    setNewKeyName,
    showNewGithubForm,
    setShowNewGithubForm,
    newGithubName,
    setNewGithubName,
    newGithubToken,
    setNewGithubToken,
    newGithubDescription,
    setNewGithubDescription,
    showToken,
    copiedKey,
    newlyCreatedKey,
    createApiKey,
    deleteApiKey,
    toggleApiKey,
    createGithubCredential,
    deleteGithubCredential,
    toggleGithubCredential,
    copyToClipboard,
    dismissNewlyCreatedKey,
    cancelNewApiKeyForm,
    cancelNewGithubForm,
    toggleNewGithubTokenVisibility,
  };
}
