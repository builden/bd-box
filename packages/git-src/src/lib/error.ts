/**
 * Wrapper for async command actions with consistent error handling
 */
export function withErrorHandling(
  fn: () => Promise<void>
): () => Promise<void> {
  return async () => {
    try {
      await fn();
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };
}

export function withErrorHandling1<T1>(
  fn: (arg1: T1) => Promise<void>
): (arg1: T1) => Promise<void> {
  return async (arg1: T1) => {
    try {
      await fn(arg1);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };
}

export function withErrorHandling2<T1, T2>(
  fn: (arg1: T1, arg2: T2) => Promise<void>
): (arg1: T1, arg2: T2) => Promise<void> {
  return async (arg1: T1, arg2: T2) => {
    try {
      await fn(arg1, arg2);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };
}

export function withErrorHandling3<T1, T2, T3>(
  fn: (arg1: T1, arg2: T2, arg3: T3) => Promise<void>
): (arg1: T1, arg2: T2, arg3: T3) => Promise<void> {
  return async (arg1: T1, arg2: T2, arg3: T3) => {
    try {
      await fn(arg1, arg2, arg3);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };
}
