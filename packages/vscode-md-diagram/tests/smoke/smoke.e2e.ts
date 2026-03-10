import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import http from "http";

const e2eDir = path.resolve(__dirname);
const scriptPath = path.join(e2eDir, "..", "..", "dist", "preview", "index.bundle.js");
const testHtmlPath = path.join(e2eDir, "smoke.html");

test.describe("vscode-md-diagram Smoke Test", () => {
  test("should render diagrams without console errors", async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // Create test HTML with both Mermaid and DOT
    const htmlContent = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Smoke Test</title>
  <style>
    .mermaid, .dot { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Smoke Test</h1>
  <pre class="mermaid">
graph TD
    A[Start] --> B[End]
  </pre>
  <pre class="dot">
digraph { A -> B }
  </pre>
  <script src="/index.bundle.js"></script>
</body>
</html>`;

    // Start HTTP server
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
      server.listen(3457, () => resolve());
    });

    try {
      await page.goto("http://localhost:3457/", { timeout: 60000 });
      await page.waitForTimeout(8000);

      // Wait for rendering to complete
      await page.waitForFunction(
        () => document.querySelectorAll(".mermaid svg").length > 0 && document.querySelectorAll(".dot svg").length > 0,
        { timeout: 90000 },
      );

      // Verify both diagrams rendered
      const mermaidSvgs = page.locator(".mermaid svg");
      const dotSvgs = page.locator(".dot svg");
      await expect(mermaidSvgs).toHaveCount(1);
      await expect(dotSvgs).toHaveCount(1);

      // Verify no console errors
      expect(consoleErrors).toEqual([]);
    } finally {
      server.close();
    }
  });
});
