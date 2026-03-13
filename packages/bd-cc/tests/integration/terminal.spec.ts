import { describe, it, expect, beforeAll, afterAll } from "bun:test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

describe("Integration Tests - Terminal WebSocket", () => {
  let ws: any;

  afterAll(() => {
    if (ws && ws.readyState === 1) {
      ws.close();
    }
  });

  it("should connect to WebSocket and initialize terminal", async () => {
    const WebSocket = await import("ws");
    const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

    return new Promise((resolve, reject) => {
      ws = new WebSocket.default(wsUrl);

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket connection timeout"));
      }, 15000);

      let terminalId: string | null = null;

      ws.on("open", () => {
        console.log("[TEST] WebSocket connected, sending init...");

        // Send init message to create terminal
        ws.send(
          JSON.stringify({
            type: "init",
            projectPath: "/Users/builden/Develop/my-proj/bd-box",
            sessionId: null,
            hasSession: false,
            provider: "claude",
            cols: 80,
            rows: 24,
            initialCommand: "echo hello",
            isPlainShell: true,
          }),
        );
      });

      ws.on("message", (data: any) => {
        const msg = JSON.parse(data.toString());
        console.log("[TEST] Received:", msg.type);

        if (msg.type === "terminal-created") {
          terminalId = msg.terminalId;
          console.log("[TEST] Terminal created:", terminalId);

          // Send a test command
          ws.send(
            JSON.stringify({
              type: "input",
              terminalId: terminalId,
              data: "echo hello\n",
            }),
          );
        }

        if (msg.type === "output") {
          console.log("[TEST] Terminal output:", msg.data?.substring(0, 100));

          // If we received welcome/start/reconnect message, terminal is working
          if (msg.data && (msg.data.includes("Starting terminal") || msg.data.includes("Reconnected"))) {
            // Terminal started successfully - test passes
            clearTimeout(timeout);
            expect(true).toBe(true);
            ws.close();
            resolve();
          }
        }
      });

      ws.on("error", (err: any) => {
        clearTimeout(timeout);
        console.error("[TEST] WebSocket error:", err.message);
        reject(err);
      });
    });
  }, 20000);
});
