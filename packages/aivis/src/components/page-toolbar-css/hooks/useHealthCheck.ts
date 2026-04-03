/**
 * useHealthCheck - Periodic health check for server connection.
 * Reads/writes directly from atoms - no props needed.
 */

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { connectionStatusAtom } from '../../../atoms/toolbarAtoms';
import { originalSetInterval } from '../../../utils/freeze-animations';

interface UseHealthCheckOptions {
  endpoint: string | undefined;
}

export function useHealthCheck({ endpoint }: UseHealthCheckOptions) {
  const setConnectionStatus = useSetAtom(connectionStatusAtom);

  useEffect(() => {
    if (!endpoint) return;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${endpoint}/health`);
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch {
        setConnectionStatus('disconnected');
      }
    };

    // Check immediately, then every 10 seconds
    checkHealth();
    const interval = originalSetInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [endpoint, setConnectionStatus]);
}
