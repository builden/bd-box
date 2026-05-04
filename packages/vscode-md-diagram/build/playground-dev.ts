import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, "..");
const playgroundFile = path.join(packageRoot, "playground", "index.html");
const playgroundUrl = pathToFileURL(playgroundFile).toString();

const banner = [
  "",
  "=== Mermaid Playground ===",
  `Target URL: ${playgroundUrl}`,
  "Open that file in your browser and keep this terminal running for rebuilds.",
  "",
].join("\n");

process.stdout.write(banner);
process.stderr.write(banner);

function openInBrowser(url: string) {
  if (process.env.PLAYGROUND_NO_OPEN === "1") {
    return;
  }

  const platform = process.platform;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "darwin" ? [url] : platform === "win32" ? ["/c", "start", "", url] : [url];

  const child = spawn(command, args, {
    cwd: packageRoot,
    detached: true,
    stdio: "ignore",
    shell: platform === "win32",
  });

  child.unref();
}

openInBrowser(playgroundUrl);

const child = spawn("bun", ["./build/esbuild-webview.ts", "--watch"], {
  cwd: packageRoot,
  stdio: "inherit",
});

const shutdown = () => {
  child.kill("SIGINT");
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
