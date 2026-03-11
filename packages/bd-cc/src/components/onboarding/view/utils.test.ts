import { describe, it, expect } from "bun:test";
import { gitEmailPattern, createInitialProviderStatuses, readErrorMessageFromResponse } from "./utils";

describe("onboarding utils", () => {
  describe("gitEmailPattern", () => {
    it("should match valid email addresses", () => {
      expect("user@example.com").toMatch(gitEmailPattern);
      expect("test.user@domain.org").toMatch(gitEmailPattern);
    });

    it("should not match invalid email addresses", () => {
      expect("invalid").not.toMatch(gitEmailPattern);
      expect("@example.com").not.toMatch(gitEmailPattern);
      expect("user@").not.toMatch(gitEmailPattern);
    });
  });

  describe("createInitialProviderStatuses", () => {
    it("should create status for all providers", () => {
      const statuses = createInitialProviderStatuses();
      expect(statuses.claude).toBeDefined();
      expect(statuses.cursor).toBeDefined();
      expect(statuses.codex).toBeDefined();
      expect(statuses.gemini).toBeDefined();
    });

    it("should set initial values correctly", () => {
      const statuses = createInitialProviderStatuses();
      expect(statuses.claude.authenticated).toBe(false);
      expect(statuses.claude.email).toBeNull();
      expect(statuses.claude.loading).toBe(true);
      expect(statuses.claude.error).toBeNull();
    });
  });

  describe("readErrorMessageFromResponse", () => {
    it("should read error from JSON response", async () => {
      const response = new Response(JSON.stringify({ error: "Test error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
      const result = await readErrorMessageFromResponse(response, "Fallback");
      expect(result).toBe("Test error");
    });

    it("should return fallback for non-JSON response", async () => {
      const response = new Response("Not JSON", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
      const result = await readErrorMessageFromResponse(response, "Fallback error");
      expect(result).toBe("Fallback error");
    });

    it("should return fallback when error field is missing", async () => {
      const response = new Response(JSON.stringify({ message: "OK" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      const result = await readErrorMessageFromResponse(response, "Fallback");
      expect(result).toBe("Fallback");
    });
  });
});
