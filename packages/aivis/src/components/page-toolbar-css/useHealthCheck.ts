/**
 * useHealthCheck - Periodic health check for server connection.
 */

import { useEffect } from 'react';
import { originalSetInterval } from '../../utils/freeze-animations';

interface UseHealthCheckOptions {
  endpoint: string | null;
  mounted: boolean;
  onConnectionStatusChange: (status: 'connected' | 'disconnected') => void;
}

export function useHealthCheck({ endpoint, mounted, onConnectionStatusChange }: UseHealthCheckOptions) {
  useEffect(() => {
    if (!endpoint || !mounted) return;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${endpoint}/health`);
        if (response.ok) {
          onConnectionStatusChange('connected');
        } else {
          onConnectionStatusChange('disconnected');
        }
      } catch {
        onConnectionStatusChange('disconnected');
      }
    };

    // Check immediately, then every 10 seconds
    checkHealth();
    const interval = originalSetInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [endpoint, mounted, onConnectionStatusChange]);
}
