/**
 * Webhook utilities for annotation events.
 * Extracted from page-toolbar-css/index.tsx for better code organization.
 */

export interface WebhookPayload {
  event: string;
  payload: Record<string, unknown>;
  webhookUrl?: string;
  webhooksEnabled?: boolean;
  force?: boolean;
}

/**
 * Fire webhook for annotation events.
 * Returns true on success, false on failure.
 */
export async function fireWebhook(
  event: string,
  payload: Record<string, unknown>,
  options: {
    webhookUrl?: string;
    webhooksEnabled?: boolean;
    force?: boolean;
  } = {}
): Promise<boolean> {
  const { webhookUrl, webhooksEnabled = true, force = false } = options;

  // Skip if no URL, or if webhooks disabled (unless force is true for manual sends)
  if (!webhookUrl || (!webhooksEnabled && !force)) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...payload,
      }),
    });
    return response.ok;
  } catch (error) {
    console.warn('[Agentation] Webhook failed:', error);
    return false;
  }
}
