import { describe, it, expect } from "bun:test";
import { getIntrinsicMessageKey } from "./messageKeys";

describe("messageKeys", () => {
  describe("getIntrinsicMessageKey", () => {
    const createMessage = (overrides: any = {}): any => ({
      id: undefined,
      messageId: undefined,
      toolId: undefined,
      toolCallId: undefined,
      blobId: undefined,
      rowid: undefined,
      sequence: undefined,
      content: "",
      timestamp: new Date().toISOString(),
      type: "user",
      ...overrides,
    });

    it("should return key using id", () => {
      const message = createMessage({ id: "msg-123", type: "user" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBe("message-user-msg-123");
    });

    it("should return key using messageId if id is undefined", () => {
      const message = createMessage({ messageId: "msg-456", type: "assistant" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBe("message-assistant-msg-456");
    });

    it("should return key using toolId", () => {
      const message = createMessage({ toolId: "tool-789", type: "assistant" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBe("message-assistant-tool-789");
    });

    it("should return key using toolCallId", () => {
      const message = createMessage({ toolCallId: "call-111", type: "assistant" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBe("message-assistant-call-111");
    });

    it("should return key using blobId", () => {
      const message = createMessage({ blobId: "blob-222", type: "user" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBe("message-user-blob-222");
    });

    it("should return key using rowid", () => {
      const message = createMessage({ rowid: 999, type: "assistant" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBe("message-assistant-999");
    });

    it("should return key using sequence", () => {
      const message = createMessage({ sequence: 42, type: "user" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBe("message-user-42");
    });

    it("should fallback to timestamp and content preview", () => {
      const message = createMessage({
        content: "This is a very long content that will be truncated",
        type: "assistant",
      });
      const result = getIntrinsicMessageKey(message);
      expect(result).toContain("message-assistant-");
      expect(result).toContain("This");
    });

    it("should include toolName in fallback", () => {
      const message = createMessage({
        content: "some content",
        toolName: "Bash",
        type: "assistant",
      });
      const result = getIntrinsicMessageKey(message);
      expect(result).toContain("Bash");
    });

    it("should return null for invalid timestamp in fallback", () => {
      const message = createMessage({
        timestamp: "invalid",
        content: "test",
        type: "user",
      });
      const result = getIntrinsicMessageKey(message);
      expect(result).toBeNull();
    });

    it("should prioritize id over other fields", () => {
      const message = createMessage({
        id: "primary-id",
        messageId: "secondary-id",
        type: "user",
      });
      const result = getIntrinsicMessageKey(message);
      expect(result).toContain("primary-id");
      expect(result).not.toContain("secondary-id");
    });

    it("should handle numeric id", () => {
      const message = createMessage({ id: 123, type: "user" });
      const result = getIntrinsicMessageKey(message);
      expect(result).toContain("123");
    });
  });
});
