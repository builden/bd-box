import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import http from "http";

const e2eDir = path.resolve(__dirname);
const scriptPath = path.join(e2eDir, "..", "..", "dist", "preview", "index.bundle.js");
const testHtmlPath = path.join(e2eDir, "test-dot.html");

test.describe("vscode-md-diagram DOT Rendering E2E", () => {
  test("should render Mermaid and DOT diagrams to SVG", async ({ page }) => {
    // Collect console messages
    const consoleLogs: string[] = [];
    page.on("console", (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => consoleLogs.push(`[pageerror] ${err.message}`));

    // Modify the HTML to use absolute path
    let htmlContent = fs.readFileSync(testHtmlPath, "utf-8");
    htmlContent = htmlContent.replace("../../dist/preview/index.bundle.js", `/index.bundle.js`);

    // Start a simple HTTP server
    const server = http.createServer((req, res) => {
      if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(htmlContent);
      } else if (req.url === "/index.bundle.js") {
        const scriptContent = fs.readFileSync(scriptPath);
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(scriptContent);
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(3456, () => resolve());
    });

    try {
      await page.goto("http://localhost:3456/", { timeout: 60000 });

      // Wait for scripts to load
      await page.waitForTimeout(10000);

      // Check what's on the page
      const mermaidContent = await page.locator(".mermaid").first().innerHTML();
      const dotContent = await page.locator(".dot").first().innerHTML();

      console.log("Mermaid content (first 500):", mermaidContent.substring(0, 500));
      console.log("DOT content (first 500):", dotContent.substring(0, 500));
      console.log("Console logs:", consoleLogs);

      // Wait for rendering to complete
      await page.waitForFunction(
        () => document.querySelectorAll(".mermaid svg").length > 0 && document.querySelectorAll(".dot svg").length > 0,
        { timeout: 90000 },
      );

      // Verify Mermaid rendered
      const mermaidSvgs = page.locator(".mermaid svg");
      await expect(mermaidSvgs).toHaveCount(1);

      // Verify DOT rendered (3 test cases)
      const dotSvgs = page.locator(".dot svg");
      await expect(dotSvgs).toHaveCount(3);

      // Verify each SVG has substantial content
      const mermaidHtml = await mermaidSvgs.first().innerHTML();
      const dotHtml = await dotSvgs.first().innerHTML();

      expect(mermaidHtml.length).toBeGreaterThan(100);
      expect(dotHtml.length).toBeGreaterThan(100);

      console.log("✓ E2E Test Passed: Mermaid and DOT diagrams rendered successfully");
    } finally {
      server.close();
    }
  });
});
