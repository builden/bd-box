/**
 * Provider Factory
 *
 * Factory for creating AI Provider instances dynamically.
 */

import type { IAiProvider, ProviderType } from './interfaces';

export class ProviderFactory {
  private providers = new Map<ProviderType | string, () => IAiProvider>();

  /**
   * Register a provider with a factory function
   */
  register(type: string, factory: () => IAiProvider): void {
    this.providers.set(type, factory);
  }

  /**
   * Create a provider instance by type
   */
  create(type: string): IAiProvider {
    const factory = this.providers.get(type);
    if (!factory) {
      throw new Error(`Provider type "${type}" not found`);
    }
    return factory();
  }

  /**
   * Check if a provider type is registered
   */
  has(type: string): boolean {
    return this.providers.has(type);
  }

  /**
   * Get list of available provider types
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Register all built-in providers
 * Currently empty - will be implemented with actual providers in the future
 */
export function registerProviders(factory: ProviderFactory): void {
  // TODO: Register actual providers when needed
  // For now, this serves as a placeholder for future provider registration
  // Example:
  // factory.register('claude', () => new ClaudeProvider());
  // factory.register('cursor', () => new CursorProvider());
}
