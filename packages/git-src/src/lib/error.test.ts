import { describe, it, expect, mock } from "bun:test";
import { withErrorHandling, withErrorHandling1, withErrorHandling2, withErrorHandling3 } from "./error";

describe("withErrorHandling", () => {
  it("should call function successfully", async () => {
    const fn = mock(() => Promise.resolve());
    const wrapped = withErrorHandling(fn);
    await wrapped();
    expect(fn).toHaveBeenCalled();
  });

  it("should handle error and exit", async () => {
    const fn = mock(() => Promise.reject(new Error("test error")));
    const wrapped = withErrorHandling(fn);

    // Mock process.exit
    const exitMock = mock(() => {});
    const originalExit = process.exit;
    (process.exit as unknown) = exitMock;

    try {
      await wrapped();
    } catch {
      // Expected to throw
    } finally {
      process.exit = originalExit;
    }
  });
});

describe("withErrorHandling1", () => {
  it("should pass argument to function", async () => {
    const fn = mock((arg: string) => Promise.resolve());
    const wrapped = withErrorHandling1(fn);
    await wrapped("test");
    expect(fn).toHaveBeenCalledWith("test");
  });

  it("should handle error with 1 argument", async () => {
    const fn = mock((_arg: string) => Promise.reject(new Error("test error")));
    const wrapped = withErrorHandling1(fn);

    const exitMock = mock(() => {});
    const originalExit = process.exit;
    (process.exit as unknown) = exitMock;

    try {
      await wrapped("test");
    } catch {
      // Expected
    } finally {
      process.exit = originalExit;
    }
  });
});

describe("withErrorHandling2", () => {
  it("should pass both arguments to function", async () => {
    const fn = mock((a: string, b: number) => Promise.resolve());
    const wrapped = withErrorHandling2(fn);
    await wrapped("test", 123);
    expect(fn).toHaveBeenCalledWith("test", 123);
  });
});

describe("withErrorHandling3", () => {
  it("should pass all three arguments to function", async () => {
    const fn = mock((a: string, b: number, c: boolean) => Promise.resolve());
    const wrapped = withErrorHandling3(fn);
    await wrapped("test", 123, true);
    expect(fn).toHaveBeenCalledWith("test", 123, true);
  });
});
