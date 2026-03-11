import { describe, it, expect } from "bun:test";
import { isBinaryFile } from "./binaryFile";

describe("binaryFile", () => {
  describe("isBinaryFile", () => {
    it("should return true for archive extensions", () => {
      expect(isBinaryFile("file.zip")).toBe(true);
      expect(isBinaryFile("file.tar")).toBe(true);
      expect(isBinaryFile("file.gz")).toBe(true);
      expect(isBinaryFile("file.rar")).toBe(true);
      expect(isBinaryFile("file.7z")).toBe(true);
    });

    it("should return true for executable extensions", () => {
      expect(isBinaryFile("file.exe")).toBe(true);
      expect(isBinaryFile("file.dll")).toBe(true);
      expect(isBinaryFile("file.so")).toBe(true);
      expect(isBinaryFile("file.dylib")).toBe(true);
      expect(isBinaryFile("file.app")).toBe(true);
    });

    it("should return true for media extensions", () => {
      expect(isBinaryFile("file.mp3")).toBe(true);
      expect(isBinaryFile("file.mp4")).toBe(true);
      expect(isBinaryFile("file.wav")).toBe(true);
      expect(isBinaryFile("file.avi")).toBe(true);
      expect(isBinaryFile("file.mov")).toBe(true);
    });

    it("should return true for document extensions", () => {
      expect(isBinaryFile("file.pdf")).toBe(true);
      expect(isBinaryFile("file.doc")).toBe(true);
      expect(isBinaryFile("file.docx")).toBe(true);
      expect(isBinaryFile("file.xls")).toBe(true);
      expect(isBinaryFile("file.xlsx")).toBe(true);
    });

    it("should return true for font extensions", () => {
      expect(isBinaryFile("file.ttf")).toBe(true);
      expect(isBinaryFile("file.otf")).toBe(true);
      expect(isBinaryFile("file.woff")).toBe(true);
      expect(isBinaryFile("file.woff2")).toBe(true);
    });

    it("should return false for source code extensions", () => {
      expect(isBinaryFile("file.ts")).toBe(false);
      expect(isBinaryFile("file.js")).toBe(false);
      expect(isBinaryFile("file.py")).toBe(false);
      expect(isBinaryFile("file.java")).toBe(false);
    });

    it("should return false for text file extensions", () => {
      expect(isBinaryFile("file.txt")).toBe(false);
      expect(isBinaryFile("file.md")).toBe(false);
      expect(isBinaryFile("file.json")).toBe(false);
      expect(isBinaryFile("file.xml")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(isBinaryFile("file.ZIP")).toBe(true);
      expect(isBinaryFile("file.PDF")).toBe(true);
      expect(isBinaryFile("file.Ts")).toBe(false);
    });

    it("should return false for files without extension", () => {
      expect(isBinaryFile("README")).toBe(false);
    });

    it("should return false for files with no extension after dot", () => {
      expect(isBinaryFile("file.")).toBe(false);
    });
  });
});
