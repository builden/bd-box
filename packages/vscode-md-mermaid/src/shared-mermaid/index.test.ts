import { describe, it, expect, beforeEach, mock } from "bun:test";
import { loadMermaidConfig } from "../renderers/mermaid";
import { loadExtensionConfig } from "../config/loader";
import { ClickDragMode, ControlsVisibilityMode } from "../core/types";

// Mock mermaid
mock.module("mermaid", () => ({
  default: {
    parse: mock(() => Promise.resolve(true)),
    render: mock(() =>
      Promise.resolve({
        svg: "<svg></svg>",
        bindFunctions: mock(() => {}),
      }),
    ),
    registerIconPacks: mock(() => {}),
    registerLayoutLoaders: mock(() => {}),
    registerExternalDiagrams: mock(() => Promise.resolve(undefined)),
    initialize: mock(() => {}),
  },
  MermaidConfig: {},
}));

// Mock @mermaid-js/layout-elk
mock.module("@mermaid-js/layout-elk", () => ({}));

// Mock @mermaid-js/layout-tidy-tree
mock.module("@mermaid-js/layout-tidy-tree", () => ({}));

// Mock @mermaid-js/mermaid-zenuml
mock.module("@mermaid-js/mermaid-zenuml", () => ({}));

describe("shared-mermaid index", () => {
  // Helper to create config element
  const createConfigElement = (configData?: object): HTMLElement => {
    const configSpan = document.createElement("span");
    configSpan.id = "markdown-mermaid";
    if (configData) {
      configSpan.dataset.config = JSON.stringify(configData);
    }
    document.body.appendChild(configSpan);
    return configSpan;
  };

  describe("loadExtensionConfig", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    it("should return default config when no config element exists", () => {
      const config = loadExtensionConfig();

      expect(config.darkModeTheme).toBe("dark");
      expect(config.lightModeTheme).toBe("default");
      expect(config.maxTextSize).toBe(50000);
      expect(config.clickDrag).toBe(ClickDragMode.Alt);
      expect(config.showControls).toBe(ControlsVisibilityMode.OnHoverOrFocus);
      expect(config.resizable).toBe(true);
      expect(config.maxHeight).toBe("");
    });

    it("should return default config when config element has no data-config", () => {
      createConfigElement();

      const config = loadExtensionConfig();

      expect(config.darkModeTheme).toBe("dark");
    });

    it("should parse and merge custom config", () => {
      createConfigElement({
        darkModeTheme: "base",
        maxTextSize: 100000,
      });

      const config = loadExtensionConfig();

      expect(config.darkModeTheme).toBe("base");
      expect(config.maxTextSize).toBe(100000);
      expect(config.lightModeTheme).toBe("default");
    });

    it("should return default config on invalid JSON", () => {
      const configSpan = document.createElement("span");
      configSpan.id = "markdown-mermaid";
      configSpan.dataset.config = "invalid json";
      document.body.appendChild(configSpan);

      const config = loadExtensionConfig();

      expect(config.darkModeTheme).toBe("dark");
    });
  });

  describe("loadMermaidConfig", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
      document.body.classList.remove("vscode-dark", "vscode-high-contrast");
    });

    it("should use light theme when not in dark mode", () => {
      document.body.classList.add("vscode-light");

      const mermaidConfig = loadMermaidConfig();

      expect(mermaidConfig.startOnLoad).toBe(false);
      expect(mermaidConfig.theme).toBe("default");
    });

    it("should use dark theme when in vscode-dark", () => {
      document.body.classList.add("vscode-dark");

      const mermaidConfig = loadMermaidConfig();

      expect(mermaidConfig.theme).toBe("dark");
    });

    it("should use dark theme when in vscode-high-contrast", () => {
      document.body.classList.add("vscode-high-contrast");

      const mermaidConfig = loadMermaidConfig();

      expect(mermaidConfig.theme).toBe("dark");
    });

    it("should respect custom dark mode theme", () => {
      document.body.classList.add("vscode-dark");
      createConfigElement({ darkModeTheme: "neutral" });

      const mermaidConfig = loadMermaidConfig();

      expect(mermaidConfig.theme).toBe("neutral");
    });

    it("should respect custom light mode theme", () => {
      document.body.classList.add("vscode-light");
      createConfigElement({ lightModeTheme: "forest" });

      const mermaidConfig = loadMermaidConfig();

      expect(mermaidConfig.theme).toBe("forest");
    });
  });
});
