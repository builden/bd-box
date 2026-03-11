// tests/setup.ts - Global test setup for happy-dom
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register happy-dom as global DOM
GlobalRegistrator.register();

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
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
