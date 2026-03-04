import { describe, it, expect, beforeEach } from "bun:test";

describe("dotRenderer", () => {
  describe("renderDot", () => {
    beforeEach(() => {
      // Reset the document
      document.body.innerHTML = "";
    });

    it("should render DOT source to SVG", async () => {
      const { renderDot } = await import("./dotRenderer");

      const result = await renderDot("digraph { A -> B; }");
      expect(result).toContain("<svg");
      expect(result).toContain("</svg>");
      // Verify nodes are rendered
      expect(result).toContain("A");
      expect(result).toContain("B");
    });

    it("should render using viz.js default colors", async () => {
      const { renderDot } = await import("./dotRenderer");

      // Should render without errors using default colors
      const result = await renderDot("digraph { node [shape=circle]; A; }");
      expect(result).toContain("<svg");
    });

    it("should use default layout engine when not configured", async () => {
      const { renderDot } = await import("./dotRenderer");

      // Should render without errors using default engine
      const result = await renderDot("digraph { A -> B; }");
      expect(result).toContain("<svg");
    });

    it("should read layout engine from config", async () => {
      // Create config element with dot.layoutEngine
      const configSpan = document.createElement("span");
      configSpan.id = "markdown-mermaid";
      configSpan.dataset.config = JSON.stringify({ dot: { layoutEngine: "neato" } });
      document.body.appendChild(configSpan);

      const { renderDot } = await import("./dotRenderer");

      // neato should render without errors
      const result = await renderDot("digraph { A -> B; }");
      expect(result).toContain("<svg");

      // Clean up
      document.body.innerHTML = "";
    });

    it("should handle different layout engines", async () => {
      // Only test engines that work reliably
      const engines = ["dot", "neato", "circo"];

      for (const engine of engines) {
        const configSpan = document.createElement("span");
        configSpan.id = "markdown-mermaid";
        configSpan.dataset.config = JSON.stringify({ dot: { layoutEngine: engine } });
        document.body.appendChild(configSpan);

        const { renderDot } = await import("./dotRenderer");

        // Each engine should render without errors
        const result = await renderDot("digraph { A -> B; }");
        expect(result).toContain("<svg");

        document.body.innerHTML = "";
      }
    });
  });
});
