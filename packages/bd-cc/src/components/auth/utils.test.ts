import { describe, it, expect } from "bun:test";
import { parseJsonSafely, resolveApiErrorMessage } from "./utils";

describe("auth utils", () => {
  describe("parseJsonSafely", () => {
    it("should parse valid JSON response", async () => {
      const response = new Response(JSON.stringify({ name: "test" }), {
        headers: { "Content-Type": "application/json" },
      });
      const result = await parseJsonSafely<{ name: string }>(response);
      expect(result).toEqual({ name: "test" });
    });

    it("should return null for invalid JSON", async () => {
      const response = new Response("not valid json", {
        headers: { "Content-Type": "application/json" },
      });
      const result = await parseJsonSafely(response);
      expect(result).toBeNull();
    });

    it("should return null when response body is empty", async () => {
      const response = new Response("", {
        headers: { "Content-Type": "application/json" },
      });
      const result = await parseJsonSafely(response);
      expect(result).toBeNull();
    });

    it("should handle non-JSON content type", async () => {
      const response = new Response("plain text", {
        headers: { "Content-Type": "text/plain" },
      });
      const result = await parseJsonSafely(response);
      expect(result).toBeNull();
    });
  });

  describe("resolveApiErrorMessage", () => {
    it("should return fallback for null payload", () => {
      expect(resolveApiErrorMessage(null, "fallback")).toBe("fallback");
    });

    it("should return error field when present", () => {
      const payload = { error: "Error message" };
      expect(resolveApiErrorMessage(payload, "fallback")).toBe("Error message");
    });

    it("should return message field when error is not present", () => {
      const payload = { message: "Message text" };
      expect(resolveApiErrorMessage(payload, "fallback")).toBe("Message text");
    });

    it("should prioritize error over message", () => {
      const payload = { error: "Error text", message: "Message text" };
      expect(resolveApiErrorMessage(payload, "fallback")).toBe("Error text");
    });

    it("should return fallback when neither error nor message", () => {
      const payload = { other: "value" };
      expect(resolveApiErrorMessage(payload, "fallback")).toBe("fallback");
    });
  });
});
