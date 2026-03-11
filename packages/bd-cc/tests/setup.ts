// tests/setup.ts - Global test setup for happy-dom
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register happy-dom as global DOM
GlobalRegistrator.register();

// Mock localStorage with working implementation
const localStorageMock = {
  _data: new Map<string, string>(),
  getItem(key: string): string | null {
    return this._data.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    this._data.set(key, value);
  },
  removeItem(key: string): void {
    this._data.delete(key);
  },
  clear(): void {
    this._data.clear();
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock navigator
Object.defineProperty(globalThis, "navigator", {
  value: {
    userAgent: "node.js",
  },
  writable: true,
});
