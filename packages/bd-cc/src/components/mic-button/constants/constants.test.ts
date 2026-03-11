import { describe, it, expect } from "bun:test";
import {
  MIC_BUTTON_STATES,
  MIC_TAP_DEBOUNCE_MS,
  PROCESSING_STATE_DELAY_MS,
  DEFAULT_WHISPER_MODE,
  ENHANCEMENT_WHISPER_MODES,
  BUTTON_BACKGROUND_BY_STATE,
  MIC_ERROR_BY_NAME,
  MIC_NOT_AVAILABLE_ERROR,
  MIC_NOT_SUPPORTED_ERROR,
  MIC_SECURE_CONTEXT_ERROR,
} from "./constants";

describe("mic-button constants", () => {
  describe("MIC_BUTTON_STATES", () => {
    it("should have idle state", () => {
      expect(MIC_BUTTON_STATES.IDLE).toBe("idle");
    });

    it("should have recording state", () => {
      expect(MIC_BUTTON_STATES.RECORDING).toBe("recording");
    });

    it("should have transcribing state", () => {
      expect(MIC_BUTTON_STATES.TRANSCRIBING).toBe("transcribing");
    });

    it("should have processing state", () => {
      expect(MIC_BUTTON_STATES.PROCESSING).toBe("processing");
    });
  });

  describe("MIC_TAP_DEBOUNCE_MS", () => {
    it("should be 300ms", () => {
      expect(MIC_TAP_DEBOUNCE_MS).toBe(300);
    });
  });

  describe("PROCESSING_STATE_DELAY_MS", () => {
    it("should be 2000ms", () => {
      expect(PROCESSING_STATE_DELAY_MS).toBe(2000);
    });
  });

  describe("DEFAULT_WHISPER_MODE", () => {
    it("should be 'default'", () => {
      expect(DEFAULT_WHISPER_MODE).toBe("default");
    });
  });

  describe("ENHANCEMENT_WHISPER_MODES", () => {
    it("should include 'prompt' mode", () => {
      expect(ENHANCEMENT_WHISPER_MODES.has("prompt")).toBe(true);
    });

    it("should include 'vibe' mode", () => {
      expect(ENHANCEMENT_WHISPER_MODES.has("vibe")).toBe(true);
    });

    it("should include 'instructions' mode", () => {
      expect(ENHANCEMENT_WHISPER_MODES.has("instructions")).toBe(true);
    });

    it("should include 'architect' mode", () => {
      expect(ENHANCEMENT_WHISPER_MODES.has("architect")).toBe(true);
    });

    it("should not include 'default' mode", () => {
      expect(ENHANCEMENT_WHISPER_MODES.has("default")).toBe(false);
    });
  });

  describe("BUTTON_BACKGROUND_BY_STATE", () => {
    it("should have idle background color", () => {
      expect(BUTTON_BACKGROUND_BY_STATE.idle).toBe("#374151");
    });

    it("should have recording background color", () => {
      expect(BUTTON_BACKGROUND_BY_STATE.recording).toBe("#ef4444");
    });

    it("should have transcribing background color", () => {
      expect(BUTTON_BACKGROUND_BY_STATE.transcribing).toBe("#3b82f6");
    });

    it("should have processing background color", () => {
      expect(BUTTON_BACKGROUND_BY_STATE.processing).toBe("#a855f7");
    });
  });

  describe("MIC_ERROR_BY_NAME", () => {
    it("should have NotAllowedError message", () => {
      expect(MIC_ERROR_BY_NAME.NotAllowedError).toContain("denied");
    });

    it("should have NotFoundError message", () => {
      expect(MIC_ERROR_BY_NAME.NotFoundError).toContain("microphone");
    });

    it("should have NotSupportedError message", () => {
      expect(MIC_ERROR_BY_NAME.NotSupportedError).toContain("supported");
    });

    it("should have NotReadableError message", () => {
      expect(MIC_ERROR_BY_NAME.NotReadableError).toContain("application");
    });
  });

  describe("Error messages", () => {
    it("should have MIC_NOT_AVAILABLE_ERROR", () => {
      expect(MIC_NOT_AVAILABLE_ERROR).toContain("HTTPS");
    });

    it("should have MIC_NOT_SUPPORTED_ERROR", () => {
      expect(MIC_NOT_SUPPORTED_ERROR).toContain("supported");
    });

    it("should have MIC_SECURE_CONTEXT_ERROR", () => {
      expect(MIC_SECURE_CONTEXT_ERROR).toContain("HTTPS");
    });
  });
});
