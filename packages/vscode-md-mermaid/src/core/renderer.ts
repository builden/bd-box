/**
 * Renderer registry - manages all registered diagram renderers.
 */
import type { DiagramRenderer } from "./types";

/**
 * Renderer registry for managing diagram renderers
 */
class RendererRegistry {
  private renderers = new Map<string, DiagramRenderer>();

  /**
   * Register a renderer
   */
  register(renderer: DiagramRenderer): void {
    for (const lang of renderer.languages) {
      this.renderers.set(lang, renderer);
    }
  }

  /**
   * Get renderer by language ID
   */
  get(languageId: string): DiagramRenderer | undefined {
    return this.renderers.get(languageId);
  }

  /**
   * Get all registered renderers
   */
  getAll(): DiagramRenderer[] {
    return [...new Set(this.renderers.values())];
  }

  /**
   * Get all supported language IDs
   */
  getSupportedLanguages(): readonly string[] {
    return [...this.renderers.keys()];
  }

  /**
   * Find renderer by CSS class name
   */
  getByClassName(className: string): DiagramRenderer | undefined {
    for (const renderer of this.renderers.values()) {
      if (renderer.className === className) {
        return renderer;
      }
    }
    return undefined;
  }
}

export const rendererRegistry = new RendererRegistry();
