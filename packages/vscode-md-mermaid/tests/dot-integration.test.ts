import { describe, it, expect, beforeEach } from "bun:test";

describe("DOT Integration Tests", () => {
  describe("DOT Rendering Flow", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    it("should render DOT and produce valid SVG output", async () => {
      const { renderDot } = await import("../src/shared-dot/dotRenderer");

      const svg = await renderDot("digraph { A -> B; }");

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      // Verify nodes are in output
      expect(svg).toContain("A");
      expect(svg).toContain("B");
    });

    it("should render using viz.js default colors", async () => {
      const { renderDot } = await import("../src/shared-dot/dotRenderer");

      // Should render without errors using default colors
      const svg = await renderDot("digraph { node [shape=circle]; A -> B; }");
      expect(svg).toContain("<svg");
    });

    it("should produce SVG with proper structure for diagramManager", async () => {
      const { renderDot } = await import("../src/shared-dot/dotRenderer");

      const svg = await renderDot("digraph { A -> B; }");

      // Verify SVG can be parsed and used by diagramManager
      expect(svg).toContain("xmlns");
      expect(svg).toContain("<svg");
      // Should have graph structure
      expect(svg).toContain('class="graph"');
    });
  });

  describe("End-to-End Flow", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    it("should create controls and setup fullscreen for DOT container", async () => {
      // Import the modules we'll use
      const { renderDot } = await import("../src/shared-dot/dotRenderer");
      const { DiagramManager } = await import("../src/shared-mermaid/diagramManager");

      // Create container like webview would
      const container = document.createElement("div");
      container.id = "test-container";
      container.className = "dot";
      document.body.appendChild(container);

      // Render DOT
      const svg = await renderDot("digraph { node1 -> node2; }");

      // Insert SVG into container
      container.innerHTML = svg;

      // Verify SVG inserted
      const svgElement = container.querySelector("svg");
      expect(svgElement).not.toBeNull();
      expect(svgElement?.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");

      // Setup diagram manager (like webview does)
      const config = {
        darkModeTheme: "dark",
        lightModeTheme: "default",
        maxTextSize: 50000,
        clickDrag: "alt" as const,
        showControls: "onHoverOrFocus" as const,
        resizable: true,
        maxHeight: "",
      };
      const diagramManager = new DiagramManager(config);

      // Setup interactions - this verifies the container structure is correct
      const disposables = diagramManager.setup(container.id, container);
      expect(disposables).toBeDefined();

      // Verify controls were created
      const controls = container.querySelector(".diagram-controls");
      expect(controls).not.toBeNull();

      // Verify all control buttons exist
      const zoomInBtn = container.querySelector("#test-container-zoom-in");
      const zoomOutBtn = container.querySelector("#test-container-zoom-out");
      const resetBtn = container.querySelector("#test-container-reset");
      const fullscreenBtn = container.querySelector("#test-container-fullscreen");

      expect(zoomInBtn).not.toBeNull();
      expect(zoomOutBtn).not.toBeNull();
      expect(resetBtn).not.toBeNull();
      expect(fullscreenBtn).not.toBeNull();

      // Verify container has position: relative
      expect(container.style.position).toBe("relative");

      // Verify fullscreen button can toggle fullscreen class
      expect(container.classList.contains("fullscreen")).toBe(false);
      (fullscreenBtn as HTMLButtonElement).click();
      expect(container.classList.contains("fullscreen")).toBe(true);

      // Click again to exit fullscreen
      (fullscreenBtn as HTMLButtonElement).click();
      expect(container.classList.contains("fullscreen")).toBe(false);

      // Clean up
      disposables.dispose();
    });

    it("should setup controls with Always mode", async () => {
      const { renderDot } = await import("../src/shared-dot/dotRenderer");
      const { DiagramManager } = await import("../src/shared-mermaid/diagramManager");

      const container = document.createElement("div");
      container.id = "test-always";
      container.className = "dot";
      document.body.appendChild(container);

      const svg = await renderDot("digraph { A -> B; }");
      container.innerHTML = svg;

      const config = {
        darkModeTheme: "dark",
        lightModeTheme: "default",
        maxTextSize: 50000,
        clickDrag: "alt" as const,
        showControls: "always" as const, // Always show controls
        resizable: false,
        maxHeight: "",
      };
      const diagramManager = new DiagramManager(config);
      const disposables = diagramManager.setup(container.id, container);

      // Controls should be created
      const controls = container.querySelector(".diagram-controls");
      expect(controls).not.toBeNull();

      // Buttons should exist
      const fullscreenBtn = container.querySelector("#test-always-fullscreen");
      expect(fullscreenBtn).not.toBeNull();

      // Fullscreen should work
      (fullscreenBtn as HTMLButtonElement).click();
      expect(container.classList.contains("fullscreen")).toBe(true);

      disposables.dispose();
    });

    it("should work for both mermaid and dot with same setup", async () => {
      const { renderDot } = await import("../src/shared-dot/dotRenderer");
      const { DiagramManager } = await import("../src/shared-mermaid/diagramManager");

      // Test DOT container
      const dotContainer = document.createElement("div");
      dotContainer.id = "dot-test";
      dotContainer.className = "dot";
      document.body.appendChild(dotContainer);

      const dotSvg = await renderDot("digraph { A -> B; }");
      dotContainer.innerHTML = dotSvg;

      // Test mermaid container (with fake mermaid svg)
      const mermaidContainer = document.createElement("div");
      mermaidContainer.id = "mermaid-test";
      mermaidContainer.className = "mermaid";
      document.body.appendChild(mermaidContainer);

      const mermaidSvg = '<svg id="dmermaid-test">test</svg>';
      mermaidContainer.innerHTML = mermaidSvg;

      const config = {
        darkModeTheme: "dark",
        lightModeTheme: "default",
        maxTextSize: 50000,
        clickDrag: "alt" as const,
        showControls: "always" as const,
        resizable: true,
        maxHeight: "",
      };
      const diagramManager = new DiagramManager(config);

      // Setup both containers
      const dotDisposables = diagramManager.setup(dotContainer.id, dotContainer);
      const mermaidDisposables = diagramManager.setup(mermaidContainer.id, mermaidContainer);

      // Both should have controls
      expect(dotContainer.querySelector(".diagram-controls")).not.toBeNull();
      expect(mermaidContainer.querySelector(".diagram-controls")).not.toBeNull();

      // Fullscreen should work for both
      const dotFullscreen = dotContainer.querySelector("#dot-test-fullscreen") as HTMLButtonElement;
      const mermaidFullscreen = mermaidContainer.querySelector("#mermaid-test-fullscreen") as HTMLButtonElement;

      dotFullscreen.click();
      mermaidFullscreen.click();

      expect(dotContainer.classList.contains("fullscreen")).toBe(true);
      expect(mermaidContainer.classList.contains("fullscreen")).toBe(true);

      dotDisposables.dispose();
      mermaidDisposables.dispose();
    });
  });
});
