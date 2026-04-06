import React from 'react';
import type { RawSourceMap, SourceMapConsumer } from 'source-map-js';

// =============================================================================
// Source Location Detection Utilities
// =============================================================================
//
// This module provides utilities for detecting React source file locations from
// DOM elements. It works by accessing React's internal fiber tree and extracting
// _debugSource information that's available in development builds.
//
// Compatibility:
// - React 16.8+ (Hooks era)
// - React 17.x
// - React 18.x
// - React 19.x (with fallbacks for changed internals)
//
// Limitations:
// - Only works in development builds (production builds strip _debugSource)
// - Requires React DevTools-style fiber access
// - Some bundlers may strip debug info even in development
// =============================================================================

/**
 * Source location information for a React component
 */
export interface SourceLocation {
  /** Absolute or relative file path */
  fileName: string;
  /** Line number (1-indexed) */
  lineNumber: number;
  /** Column number (0-indexed, may be undefined) */
  columnNumber?: number;
  /** Component display name if available */
  componentName?: string;
  /** React version detected */
  reactVersion?: string;
  /** Full source path for VSCode navigation (optional) */
  sourcePath?: string;
}

/**
 * Result of source location detection
 */
export interface SourceLocationResult {
  /** Whether source location was found */
  found: boolean;
  /** Source location data (if found) */
  source?: SourceLocation;
  /** Reason if not found */
  reason?: SourceLocationNotFoundReason;
  /** Whether the app appears to be a React app */
  isReactApp: boolean;
  /** Whether running in production mode */
  isProduction: boolean;
}

/**
 * Reasons why source location might not be found
 */
export type SourceLocationNotFoundReason =
  | 'not-react-app'
  | 'production-build'
  | 'no-fiber'
  | 'no-debug-source'
  | 'react-19-changed'
  | 'element-not-in-react-tree'
  | 'unknown';

/**
 * React Fiber node structure (partial, for type safety)
 * Based on React's internal FiberNode type
 */
interface ReactFiber {
  // Debug source info (only in development)
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  };
  // Owner info (React 19 may use this differently)
  _debugOwner?: ReactFiber;
  // Component type
  type?:
    | {
        name?: string;
        displayName?: string;
        // For class components
        prototype?: {
          isReactComponent?: boolean;
        };
      }
    | string
    | null;
  // Element type for built-in elements
  elementType?: unknown;
  // Tag indicating fiber type
  tag?: number;
  // Fiber tree navigation
  return?: ReactFiber | null;
  child?: ReactFiber | null;
  sibling?: ReactFiber | null;
  // Memoized props (for context)
  memoizedProps?: Record<string, unknown>;
  // Pending props (where __source is typically stored during element creation)
  pendingProps?: Record<string, unknown>;
  // State node for class components
  stateNode?: unknown;
}

// React fiber tag constants (for reference)
const FIBER_TAGS = {
  FunctionComponent: 0,
  ClassComponent: 1,
  IndeterminateComponent: 2,
  HostRoot: 3,
  HostPortal: 4,
  HostComponent: 5,
  HostText: 6,
  Fragment: 7,
  Mode: 8,
  ContextConsumer: 9,
  ContextProvider: 10,
  ForwardRef: 11,
  Profiler: 12,
  SuspenseComponent: 13,
  MemoComponent: 14,
  SimpleMemoComponent: 15,
  LazyComponent: 16,
} as const;

/**
 * Checks if the page appears to be running a React application
 *
 * @returns Object with detection results
 */
export function detectReactApp(): {
  isReact: boolean;
  version?: string;
  isProduction: boolean;
} {
  if (typeof window === 'undefined') {
    return { isReact: false, isProduction: true };
  }

  // Check for React DevTools hook (most reliable)
  const devToolsHook = (window as unknown as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (devToolsHook && typeof devToolsHook === 'object') {
    const hook = devToolsHook as Record<string, unknown>;

    // Check for renderers (React 16+)
    const renderers = hook.renderers as Map<number, { version?: string }> | undefined;
    if (renderers && renderers.size > 0) {
      // Get version from first renderer
      const firstRenderer = renderers.values().next().value;
      const version = firstRenderer?.version;

      // Check for production mode via lack of development tools
      const isProduction = !hook.supportsFiber;

      return {
        isReact: true,
        version: version || 'unknown',
        isProduction,
      };
    }
  }

  // Fallback: Check for React root markers on DOM
  const hasReactRoot = document.querySelector('[data-reactroot]') !== null;
  const hasReactContainer =
    (document.getElementById('root') as HTMLElement & { _reactRootContainer?: unknown })?._reactRootContainer !==
    undefined;

  // Check for fiber keys on body's children
  const bodyChildren = document.body.children;
  let hasFiberKey = false;

  for (let i = 0; i < bodyChildren.length && !hasFiberKey; i++) {
    const child = bodyChildren[i];
    if (!child) continue;
    const keys = Object.keys(child);
    hasFiberKey = keys.some((key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'));
  }

  if (hasReactRoot || hasReactContainer || hasFiberKey) {
    return {
      isReact: true,
      version: 'unknown',
      // Assume production if we can't detect dev tools
      isProduction: !devToolsHook,
    };
  }

  return { isReact: false, isProduction: true };
}

/**
 * Gets the React fiber node associated with a DOM element
 *
 * @param element - DOM element to get fiber for
 * @returns React fiber node or null if not found
 */
export function getFiberFromElement(element: HTMLElement): ReactFiber | null {
  if (!element || typeof element !== 'object') {
    return null;
  }

  const keys = Object.keys(element);

  // React 18+ uses __reactFiber$ prefix
  const fiberKey = keys.find(
    (key) =>
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$') ||
      key.startsWith('__reactContainer$')
  );
  if (fiberKey) {
    return (element as unknown as Record<string, ReactFiber>)[fiberKey] || null;
  }

  return null;
}

/**
 * Gets the display name of a React component from its fiber
 *
 * @param fiber - React fiber node
 * @returns Component name or null
 */
function getComponentName(fiber: ReactFiber): string | null {
  if (!fiber.type) {
    return null;
  }

  // String type means host component (div, span, etc.)
  if (typeof fiber.type === 'string') {
    return null; // We want React component names, not HTML tags
  }

  // Function/class component
  if (typeof fiber.type === 'object' || typeof fiber.type === 'function') {
    const type = fiber.type as { displayName?: string; name?: string };

    // Prefer displayName (set by React DevTools or manually)
    if (type.displayName) {
      return type.displayName;
    }

    // Fall back to function/class name
    if (type.name) {
      return type.name;
    }
  }

  return null;
}

/**
 * Gets a display name for any fiber (including DOM elements)
 * Used for props chain where we want to show the full hierarchy
 */
function getFiberNameForChain(fiber: ReactFiber): string | null {
  if (!fiber.type) {
    return null;
  }

  // DOM element - return tag name with brackets
  if (typeof fiber.type === 'string') {
    return `<${fiber.type}>`;
  }

  // Function/class component
  if (typeof fiber.type === 'object' || typeof fiber.type === 'function') {
    const type = fiber.type as { displayName?: string; name?: string };
    if (type.displayName) {
      return type.displayName;
    }
    if (type.name) {
      return type.name;
    }
    // Anonymous function
    return 'Anonymous';
  }

  return null;
}

/**
 * Walks up the fiber tree to find the nearest component with _debugSource
 *
 * @param fiber - Starting fiber node
 * @param maxDepth - Maximum tree depth to traverse (default: 50)
 * @returns Object with source info and component name, or null
 */
function findDebugSource(
  fiber: ReactFiber,
  maxDepth = 50
): { source: ReactFiber['_debugSource']; componentName: string | null } | null {
  let current: ReactFiber | null | undefined = fiber;
  let depth = 0;
  let debugStackResult: { source: ReactFiber['_debugSource']; componentName: string | null } | null = null;

  // First pass: try to find __source (highest precision)
  // Note: __source is stored in pendingProps, not memoizedProps
  // (pendingProps is where JSX source info is attached during element creation)
  while (current && depth < maxDepth) {
    const componentName = getComponentName(current);

    // Check pendingProps.__source (primary location for JSX source info)
    if (componentName !== null && current.pendingProps) {
      const pendingProps = current.pendingProps as Record<string, unknown>;
      const source = pendingProps.__source as
        | { fileName?: string; lineNumber?: number; columnNumber?: number }
        | undefined;
      if (source?.fileName && source?.lineNumber) {
        return {
          source: {
            fileName: source.fileName,
            lineNumber: source.lineNumber,
            ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
          },
          componentName,
        };
      }
    }

    // Also check memoizedProps.__source
    if (componentName !== null && current.memoizedProps) {
      const memoizedProps = current.memoizedProps as Record<string, unknown>;
      const source = memoizedProps.__source as
        | { fileName?: string; lineNumber?: number; columnNumber?: number }
        | undefined;
      if (source?.fileName && source?.lineNumber) {
        return {
          source: {
            fileName: source.fileName,
            lineNumber: source.lineNumber,
            ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
          },
          componentName,
        };
      }
    }

    // For DOM elements (componentName is null), also check _debugOwner's __source
    if (componentName === null && current._debugOwner) {
      const ownerComponentName = getComponentName(current._debugOwner);
      if (ownerComponentName !== null) {
        const ownerPendingProps = current._debugOwner.pendingProps as Record<string, unknown> | null;
        const ownerMemoizedProps = current._debugOwner.memoizedProps as Record<string, unknown> | null;

        const source = ownerPendingProps?.__source as
          | { fileName?: string; lineNumber?: number; columnNumber?: number }
          | undefined;
        if (source?.fileName && source?.lineNumber) {
          return {
            source: {
              fileName: source.fileName,
              lineNumber: source.lineNumber,
              ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
            },
            componentName: ownerComponentName,
          };
        }

        const memoizedSource = ownerMemoizedProps?.__source as
          | { fileName?: string; lineNumber?: number; columnNumber?: number }
          | undefined;
        if (memoizedSource?.fileName && memoizedSource?.lineNumber) {
          return {
            source: {
              fileName: memoizedSource.fileName,
              lineNumber: memoizedSource.lineNumber,
              ...(memoizedSource.columnNumber !== undefined ? { columnNumber: memoizedSource.columnNumber } : {}),
            },
            componentName: ownerComponentName,
          };
        }
      }
    }

    // Also check _debugSource
    if (current._debugSource) {
      return {
        source: current._debugSource,
        componentName: getComponentName(current),
      };
    }

    // Check debug owner
    if (current._debugOwner?._debugSource) {
      return {
        source: current._debugOwner._debugSource,
        componentName: getComponentName(current._debugOwner),
      };
    }

    // Save _debugStack result but continue searching for __source
    if (!debugStackResult) {
      const anyFiber = current as unknown as Record<string, unknown>;
      const debugStack = anyFiber._debugStack;
      if (debugStack && typeof debugStack === 'object' && 'stack' in debugStack) {
        const errorLike = debugStack as Error;
        const sourceInfo = parseReact19DebugStack(errorLike, getComponentName(current));
        if (sourceInfo) {
          debugStackResult = sourceInfo;
        }
      }
    }

    current = current.return;
    depth++;
  }

  // Return _debugStack as fallback if no __source found
  if (debugStackResult) {
    return debugStackResult;
  }

  return null;
}

/**
 * Parse React 19's _debugStack Error object to extract source location
 * The stack trace format is: "Error: react-stack-top-frame\n    at FunctionName (file:line:col)"
 * File can be a URL like "http://localhost:3002/App.tsx?t=123:7:25"
 */
function parseReact19DebugStack(
  error: Error,
  componentName: string | null
): { source: ReactFiber['_debugSource']; componentName: string | null } | null {
  if (!error.stack) return null;

  // V8 format: "at FunctionName (file:line:col)"
  // But file can be a full URL with port, so we need a more robust pattern
  // Pattern: at NAME (URL:LINE:COL) or at NAME (PATH:LINE:COL)
  const lines = error.stack.split('\n');

  // Skip first line (Error: ...) and find first valid frame
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const trimmed = line.trim();

    // Clean Vite's timestamp query params: "?t=123:7:25" -> ":7:25" then remove the leading colon
    const cleanedLine = trimmed.replace(/\?t=\d+/g, '');

    // Now match with the standard V8 format
    const frameRe = /at\s+([^\s(]+)\s*\((.+?):(\d+):(\d+)\)/;
    const match = frameRe.exec(cleanedLine);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      const fnName = match[1];
      const filePath = match[2];
      const lineNumber = match[3];
      const columnNumber = match[4];

      // Skip React internals - check before cleaning URL
      if (
        filePath.includes('react-dom') ||
        filePath.includes('react-jsx-dev-runtime') ||
        filePath.includes('react-reconciler') ||
        filePath.includes('scheduler') ||
        filePath.includes('node_modules')
      ) {
        continue;
      }

      // Clean URL - extract pathname from full URL but keep enough to identify the server
      // e.g. "http://localhost:3002/App.tsx" -> "http://localhost:3002/App.tsx"
      // Later we'll use this to fetch the file and extract source map
      let cleanUrl = filePath;
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        try {
          const url = new URL(filePath);
          // Keep the full URL with port for source map lookup
          cleanUrl = `${url.protocol}//${url.host}${url.pathname}`;
        } catch {
          // Use original if parsing fails
        }
      }

      // Remove query params (like ?t=timestamp)
      const qIndex = cleanUrl.indexOf('?');
      if (qIndex !== -1) {
        cleanUrl = cleanUrl.substring(0, qIndex);
      }

      return {
        source: {
          fileName: cleanUrl,
          lineNumber: parseInt(lineNumber, 10),
          columnNumber: parseInt(columnNumber, 10),
        },
        componentName: fnName !== '<anonymous>' ? fnName : componentName,
      };
    }
  }

  return null;
}

/**
 * Attempts to find source location using React 19's potentially different structure
 *
 * @param fiber - Starting fiber node
 * @returns Source location info or null
 */
function findDebugSourceReact19(
  fiber: ReactFiber
): { source: ReactFiber['_debugSource']; componentName: string | null } | null {
  // React 19 may store debug info differently
  // This is a forward-compatible attempt based on React 19 RFCs

  let current: ReactFiber | null | undefined = fiber;
  let depth = 0;
  const maxDepth = 50;

  while (current && depth < maxDepth) {
    // Check for new React 19 debug patterns
    const anyFiber = current as unknown as Record<string, unknown>;

    // Possible React 19 locations for debug info
    const possibleSourceKeys = ['_debugSource', '__source', '_source', 'debugSource'];

    for (const key of possibleSourceKeys) {
      const source = anyFiber[key];
      if (source && typeof source === 'object' && 'fileName' in source) {
        return {
          source: source as ReactFiber['_debugSource'],
          componentName: getComponentName(current),
        };
      }
    }

    // Check if debug info is in pendingProps (React 19 preferred location)
    if (current.pendingProps) {
      const props = current.pendingProps as Record<string, unknown>;
      if (props.__source && typeof props.__source === 'object') {
        const source = props.__source as { fileName?: string; lineNumber?: number; columnNumber?: number };
        if (source.fileName && source.lineNumber) {
          const result: { source: ReactFiber['_debugSource']; componentName: string | null } = {
            source: {
              fileName: source.fileName,
              lineNumber: source.lineNumber,
              ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
            },
            componentName: getComponentName(current),
          };
          return result;
        }
      }
    }

    // Check if debug info is in memoizedProps
    if (current.memoizedProps) {
      const props = current.memoizedProps as Record<string, unknown>;
      if (props.__source && typeof props.__source === 'object') {
        const source = props.__source as { fileName?: string; lineNumber?: number; columnNumber?: number };
        if (source.fileName && source.lineNumber) {
          const result: { source: ReactFiber['_debugSource']; componentName: string | null } = {
            source: {
              fileName: source.fileName,
              lineNumber: source.lineNumber,
              ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
            },
            componentName: getComponentName(current),
          };
          return result;
        }
      }
    }

    current = current.return;
    depth++;
  }

  return null;
}

// =============================================================================
// Stack-Trace Fallback for Source File Detection
// =============================================================================
//
// When _debugSource is unavailable (e.g. Next.js with SWC), we fall back to
// invoking the component function with a throwing hooks dispatcher, parsing
// the error stack trace, and stripping bundler URL prefixes. In dev mode,
// stack frames already contain original source paths.
// =============================================================================

/** Cache: component function → probed SourceLocation (or null if unresolvable) */
type ComponentFunction = (...args: unknown[]) => unknown;
const sourceProbeCache = new Map<ComponentFunction, SourceLocation | null>();

/**
 * Extract the callable function from a fiber, handling wrappers.
 * Returns null for class components, host elements, or unrecognized types.
 */
function unwrapComponentType(fiber: ReactFiber): ComponentFunction | null {
  const tag = fiber.tag;
  const type = fiber.type;
  const elementType = fiber.elementType as Record<string, unknown> | null | undefined;

  // Host elements (div, span, etc.)
  if (typeof type === 'string' || type == null) return null;

  // Class components — skip (need `new`, different lifecycle)
  if (
    typeof type === 'function' &&
    (type as { prototype?: { isReactComponent?: boolean } }).prototype?.isReactComponent
  ) {
    return null;
  }

  // FunctionComponent / IndeterminateComponent
  if (
    (tag === FIBER_TAGS.FunctionComponent || tag === FIBER_TAGS.IndeterminateComponent) &&
    typeof type === 'function'
  ) {
    return type as ComponentFunction;
  }

  // ForwardRef
  if (tag === FIBER_TAGS.ForwardRef && elementType) {
    const render = elementType.render;
    if (typeof render === 'function') return render as ComponentFunction;
  }

  // Memo / SimpleMemo
  if ((tag === FIBER_TAGS.MemoComponent || tag === FIBER_TAGS.SimpleMemoComponent) && elementType) {
    const inner = elementType.type;
    if (typeof inner === 'function') return inner as ComponentFunction;
  }

  // Generic fallback: if type is a plain function, use it
  if (typeof type === 'function') return type as ComponentFunction;

  return null;
}

/**
 * Access the React hooks dispatcher from React's module internals.
 * These are properties on the `react` module export, NOT on `window`.
 * Returns get/set helpers or null if not found.
 */
function getReactDispatcher(): {
  get: () => unknown;
  set: (d: unknown) => void;
} | null {
  // Access React internals from the imported module
  const reactModule = React as unknown as Record<string, unknown>;

  // React 19: __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H
  const r19 = reactModule.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE as
    | Record<string, unknown>
    | undefined;
  if (r19 && 'H' in r19) {
    return {
      get: () => r19.H,
      set: (d: unknown) => {
        r19.H = d;
      },
    };
  }

  // React 16-18: __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current
  const r18 = reactModule.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Record<string, unknown> | undefined;
  if (r18) {
    const dispatcher = r18.ReactCurrentDispatcher as { current: unknown } | undefined;
    if (dispatcher && 'current' in dispatcher) {
      return {
        get: () => dispatcher.current,
        set: (d: unknown) => {
          dispatcher.current = d;
        },
      };
    }
  }

  return null;
}

/**
 * Parse the first non-internal frame from an error stack string.
 */
function parseComponentFrame(stack: string): { fileName: string; line: number; column?: number } | null {
  const lines = stack.split('\n');

  // Patterns to skip: our own bundle, React internals, node_modules, chunk files
  const skipPatterns = [
    /source-location/,
    /\/dist\/index\./, // Our bundled output (dist/index.mjs, dist/index.js)
    /node_modules\//, // Any package in node_modules
    /react-dom/,
    /react\.development/,
    /react\.production/,
    /chunk-[A-Z0-9]+/i,
    /react-stack-bottom-frame/,
    /react-reconciler/,
    /scheduler/,
    /<anonymous>/, // Proxy handler frames
  ];

  // V8 format: "    at FnName (file:line:col)" or "    at file:line:col"
  const v8Re = /^\s*at\s+(?:.*?\s+\()?(.+?):(\d+):(\d+)\)?$/;
  // WebKit/Gecko: "FnName@file:line:col" or "@file:line:col"
  const webkitRe = /^[^@]*@(.+?):(\d+):(\d+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip frames from internal files
    if (skipPatterns.some((p) => p.test(trimmed))) continue;

    const match = v8Re.exec(trimmed) || webkitRe.exec(trimmed);
    if (match && match[1] && match[2] && match[3]) {
      return {
        fileName: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
      };
    }
  }

  return null;
}

/**
 * Strip bundler URL prefixes from a raw source path.
 */
function cleanSourcePath(rawPath: string): string {
  let path = rawPath;

  // 1. Strip query params and hashes
  path = path.replace(/[?#].*$/, '');

  // 2. Turbopack project prefix
  path = path.replace(/^turbopack:\/\/\[project\]\//, '');

  // 3. webpack-internal
  path = path.replace(/^webpack-internal:\/\/\/\./, '');
  path = path.replace(/^webpack-internal:\/\/\//, '');

  // 4. webpack
  path = path.replace(/^webpack:\/\/\/\./, '');
  path = path.replace(/^webpack:\/\/\//, '');

  // 5. turbopack generic
  path = path.replace(/^turbopack:\/\/\//, '');

  // 6. http(s)://host:port/
  path = path.replace(/^https?:\/\/[^/]+\//, '');

  // 7. file:///
  path = path.replace(/^file:\/\/\//, '/');

  // 8. Webpack chunk group prefixes like (app-pages-browser)/./
  path = path.replace(/^\([^)]+\)\/\.\//, '');

  // 9. Leading ./
  path = path.replace(/^\.\//, '');

  return path;
}

/**
 * Probe a single fiber's component function by invoking it with a
 * throwing hooks dispatcher and parsing the resulting error stack.
 */
function probeComponentSource(fiber: ReactFiber): SourceLocation | null {
  const fn = unwrapComponentType(fiber);
  if (!fn) return null;

  // Check cache
  if (sourceProbeCache.has(fn)) {
    return sourceProbeCache.get(fn)!;
  }

  const dispatcher = getReactDispatcher();
  if (!dispatcher) {
    sourceProbeCache.set(fn, null);
    return null;
  }

  const original = dispatcher.get();
  let result: SourceLocation | null = null;

  try {
    // Install a proxy dispatcher that throws an Error (with stack) on any hook access.
    // When the component calls useState/useEffect/etc., the proxy's get trap fires,
    // creating an Error whose stack trace includes the component's source location.
    const stackCapturingDispatcher = new Proxy(
      {},
      {
        get() {
          throw new Error('probe');
        },
      }
    );
    dispatcher.set(stackCapturingDispatcher);

    try {
      // Invoke the component — it will either:
      // 1. Call a hook → throws Error with stack (ideal case)
      // 2. Have no hooks → runs to completion (harmless, discarded), no stack to parse
      fn({});
    } catch (e) {
      if (e instanceof Error && e.message === 'probe' && e.stack) {
        const frame = parseComponentFrame(e.stack);
        if (frame) {
          const cleaned = cleanSourcePath(frame.fileName);
          result = {
            fileName: cleaned,
            lineNumber: frame.line,
            ...(frame.column !== undefined ? { columnNumber: frame.column } : {}),
            ...(getComponentName(fiber) ? { componentName: getComponentName(fiber)! } : {}),
          };
        }
      }
    }
  } finally {
    dispatcher.set(original);
  }

  sourceProbeCache.set(fn, result);
  return result;
}

/**
 * Walk the fiber tree via .return, probing each fiber for source info.
 * Stops at the first success.
 */
function probeSourceWalk(fiber: ReactFiber, maxDepth = 15): SourceLocation | null {
  let current: ReactFiber | null | undefined = fiber;
  let depth = 0;

  while (current && depth < maxDepth) {
    const source = probeComponentSource(current);
    if (source) return source;

    current = current.return;
    depth++;
  }

  return null;
}

/**
 * Gets the source file location for a DOM element in a React application
 *
 * This function attempts to extract the source file path and line number
 * where a React component is defined. This only works in development mode
 * as production builds strip debug information.
 *
 * @param element - DOM element to get source location for
 * @returns SourceLocationResult with location info or reason for failure
 *
 * @example
 * ```ts
 * const result = getSourceLocation(element);
 * if (result.found && result.source) {
 *   console.log(`${result.source.fileName}:${result.source.lineNumber}`);
 *   // Output: "/src/components/Button.tsx:42"
 * }
 * ```
 */
export function getSourceLocation(element: HTMLElement): SourceLocationResult {
  // Try to get fiber directly from the element (same approach as getReactComponentName)
  // This avoids detectReactApp() whose production heuristic can give false positives
  const fiber = getFiberFromElement(element);

  if (!fiber) {
    return {
      found: false,
      reason: 'no-fiber',
      isReactApp: false,
      isProduction: false,
    };
  }

  // Try standard React 16-18 debug source finding
  let debugInfo = findDebugSource(fiber);

  // If not found, try React 19 patterns
  if (!debugInfo) {
    debugInfo = findDebugSourceReact19(fiber);
  }

  if (debugInfo?.source) {
    return {
      found: true,
      source: {
        fileName: debugInfo.source.fileName,
        lineNumber: debugInfo.source.lineNumber,
        ...(debugInfo.source.columnNumber !== undefined ? { columnNumber: debugInfo.source.columnNumber } : {}),
        ...(debugInfo.componentName ? { componentName: debugInfo.componentName } : {}),
      },
      isReactApp: true,
      isProduction: false,
    };
  }

  // Fallback: probe component via stack trace
  const probed = probeSourceWalk(fiber);
  if (probed) {
    return { found: true, source: probed, isReactApp: true, isProduction: false };
  }

  return {
    found: false,
    reason: 'no-debug-source',
    isReactApp: true,
    isProduction: false,
  };
}

/**
 * Async version of getSourceLocation that uses source maps to map compiled positions
 * back to original source positions. This is needed for Vite dev server where
 * _debugStack returns compiled positions.
 *
 * @param element - DOM element to get source location for
 * @returns SourceLocationResult with potentially remapped source location
 */
export async function getSourceLocationAsync(element: HTMLElement): Promise<SourceLocationResult> {
  const result = getSourceLocation(element);

  // If no source found, return as-is
  if (!result.found || !result.source) {
    return result;
  }

  // Try to map compiled position to original using source maps
  // This is needed for Vite dev server where positions point to compiled code
  const mappedSource = await mapPositionWithSourceMap(
    result.source.fileName,
    result.source.lineNumber,
    result.source.columnNumber
  );

  return {
    ...result,
    source: mappedSource,
  };
}

/**
 * Formats a source location as a clickable file path string
 *
 * @param source - Source location object
 * @param format - Output format: "vscode" for VSCode URL, "path" for file:line format
 * @returns Formatted string
 *
 * @example
 * ```ts
 * formatSourceLocation(source, "path")
 * // Returns: "src/components/Button.tsx:42:8"
 *
 * formatSourceLocation(source, "vscode")
 * // Returns: "vscode://file/absolute/path/src/components/Button.tsx:42:8"
 * ```
 */
export function formatSourceLocation(source: SourceLocation, format: 'path' | 'vscode' = 'path'): string {
  const { fileName, lineNumber, columnNumber, sourcePath } = source;

  // Build line:column suffix
  let location = `${fileName}:${lineNumber}`;
  if (columnNumber !== undefined) {
    location += `:${columnNumber}`;
  }

  if (format === 'vscode') {
    // VSCode can open files via URL protocol
    // Prefer sourcePath if available (full path from source map)
    const vscodePath = sourcePath || fileName;
    const prefix = vscodePath.startsWith('/') || vscodePath.match(/^[a-zA-Z]:/) ? '' : '/';
    return `vscode://file${prefix}${vscodePath}:${lineNumber}${columnNumber !== undefined ? `:${columnNumber}` : ''}`;
  }

  return location;
}

/**
 * Gets source locations for multiple elements at once
 *
 * @param elements - Array of DOM elements
 * @returns Array of source location results
 */
export function getSourceLocations(elements: HTMLElement[]): SourceLocationResult[] {
  return elements.map((element) => getSourceLocation(element));
}

/**
 * Finds the nearest React component ancestor that has source info
 *
 * Useful when clicking on a deeply nested element (like text or an icon)
 * and wanting to find the component that contains it.
 *
 * @param element - Starting DOM element
 * @param maxAncestors - Maximum DOM ancestors to check (default: 10)
 * @returns Source location result
 */
export function findNearestComponentSource(element: HTMLElement, maxAncestors = 10): SourceLocationResult {
  let current: HTMLElement | null = element;
  let depth = 0;

  while (current && depth < maxAncestors) {
    const result = getSourceLocation(current);

    // Return first successful result
    if (result.found) {
      return result;
    }

    // If we found fiber but no source, keep looking up DOM
    // (might find a parent component with source info)
    current = current.parentElement;
    depth++;
  }

  // Return result for original element (will explain why not found)
  return getSourceLocation(element);
}

/**
 * Gets all component sources in the ancestor chain
 *
 * Useful for understanding the component hierarchy.
 *
 * @param element - Starting DOM element
 * @returns Array of unique source locations from element up to root
 */
export function getComponentHierarchy(element: HTMLElement): SourceLocation[] {
  const fiber = getFiberFromElement(element);
  if (!fiber) {
    return [];
  }

  const sources: SourceLocation[] = [];
  const seenFiles = new Set<string>();

  let current: ReactFiber | null | undefined = fiber;
  let depth = 0;
  const maxDepth = 100;

  while (current && depth < maxDepth) {
    if (current._debugSource) {
      const key = `${current._debugSource.fileName}:${current._debugSource.lineNumber}`;

      // Avoid duplicates
      if (!seenFiles.has(key)) {
        seenFiles.add(key);
        sources.push({
          fileName: current._debugSource.fileName,
          lineNumber: current._debugSource.lineNumber,
          ...(current._debugSource.columnNumber !== undefined
            ? { columnNumber: current._debugSource.columnNumber }
            : {}),
          ...(getComponentName(current) ? { componentName: getComponentName(current)! } : {}),
        });
      }
    }

    current = current.return;
    depth++;
  }

  return sources;
}

/**
 * Checks if source location detection is likely to work in the current environment
 *
 * @returns Object describing support status
 */
export function checkSourceLocationSupport(): {
  supported: boolean;
  reason: string;
  suggestions: string[];
} {
  const reactInfo = detectReactApp();

  if (!reactInfo.isReact) {
    return {
      supported: false,
      reason: 'No React application detected on this page',
      suggestions: [
        "Ensure you're on a page built with React",
        'The page may use a different framework (Vue, Angular, etc.)',
      ],
    };
  }

  if (reactInfo.isProduction) {
    return {
      supported: false,
      reason: 'Production build detected - source info is stripped',
      suggestions: [
        'Run the application in development mode',
        'Set NODE_ENV=development',
        'Ensure your bundler includes source info in development',
      ],
    };
  }

  // Check for DevTools
  const hasDevTools =
    typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (!hasDevTools) {
    return {
      supported: true,
      reason: 'Development mode detected, but React DevTools not installed',
      suggestions: [
        'Install React DevTools browser extension for best results',
        'Source detection may still work without it',
      ],
    };
  }

  return {
    supported: true,
    reason: `React ${reactInfo.version || 'unknown'} development mode detected`,
    suggestions: [],
  };
}

// =============================================================================
// Props Propagation Chain and Context Tracking
// =============================================================================

/**
 * Represents a single item in the props propagation chain
 */
export interface PropsChainItem {
  /** Component name */
  componentName: string;
  /** Source location of this component */
  sourceLocation?: SourceLocation | undefined;
  /** Props that were passed to this component (relevant business props only) */
  relevantProps: Record<string, unknown>;
  /** Whether this component is the clicked target */
  isTarget?: boolean;
}

/**
 * Represents a Context usage in a component
 */
export interface ContextUsage {
  /** Context name */
  contextName: string;
  /** What values are being used */
  usedValues: string[];
}

/**
 * Represents a detected problem in the component hierarchy
 */
export interface ProblemDetection {
  /** Severity level */
  severity: 'high' | 'medium' | 'low';
  /** Problem title */
  title: string;
  /** Problem description */
  description: string;
  /** Suggested fix (optional) */
  suggestion?: string;
}

/**
 * Result of props propagation path analysis
 */
export interface PropsPropagationResult {
  /** The props chain from root to target */
  chain: PropsChainItem[];
  /** Context usages found in the chain */
  contextUsages: ContextUsage[];
  /** Detected problems */
  problems: ProblemDetection[];
}

/**
 * Check if a prop name looks like an internal/react prop (should be filtered out)
 */
function isInternalProp(propName: string): boolean {
  const internalProps = [
    'children',
    'key',
    'ref',
    'style',
    'className',
    'id',
    'testId',
    'data-testid',
    'data-test-id',
    'onClick',
    'onChange',
    'onSubmit',
    'onBlur',
    'onFocus',
    'onKeyDown',
    'onKeyUp',
    'onMouseEnter',
    'onMouseLeave',
    'onMouseOver',
    'onMouseOut',
    'type',
    'disabled',
  ];
  return internalProps.includes(propName);
}

/**
 * Extract relevant business props from fiber memoizedProps
 * Filters out React internal props and event handlers
 */
function extractRelevantProps(memoizedProps: Record<string, unknown> | null): Record<string, unknown> {
  if (!memoizedProps) return {};

  const relevant: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(memoizedProps)) {
    if (isInternalProp(key)) continue;
    if (key.startsWith('__') || key.startsWith('data-')) continue;

    // Simplify complex values for display
    if (value === null || value === undefined) {
      relevant[key] = value;
    } else if (typeof value === 'function') {
      relevant[key] = '[function]';
    } else if (Array.isArray(value)) {
      relevant[key] = `[Array:${value.length}]`;
    } else if (typeof value === 'object') {
      relevant[key] = '[Object]';
    } else {
      relevant[key] = value;
    }
  }
  return relevant;
}

/**
 * Check if a fiber uses React Context
 */
function detectContextUsage(fiber: ReactFiber): ContextUsage[] {
  const usages: ContextUsage[] = [];

  // Check memoizedProps for context values (typically pattern like { context: value })
  if (fiber.memoizedProps) {
    const props = fiber.memoizedProps as Record<string, unknown>;
    for (const [key, value] of Object.entries(props)) {
      if (key.toLowerCase().includes('context') && typeof value === 'object' && value !== null) {
        usages.push({
          contextName: key,
          usedValues: Object.keys(value as Record<string, unknown>),
        });
      }
    }
  }

  // Check fiber.return chain for Provider
  let current: ReactFiber | null | undefined = fiber;
  while (current) {
    if (current.type && typeof current.type === 'object') {
      const type = current.type as Record<string, unknown>;
      // Check for Provider pattern (_context property)
      if (type._context || type.context) {
        const contextName = (type._context || type.context) as { displayName?: string; _currentValue?: unknown };
        usages.push({
          contextName: contextName?.displayName || 'UnnamedContext',
          usedValues: ['Provider'],
        });
      }
    }
    current = current.return;
  }

  return usages;
}

/**
 * Get the props propagation path from root to the target element
 * This walks up the fiber tree collecting component info and props
 */
export function getPropsPropagationPath(element: HTMLElement): PropsPropagationResult | null {
  const fiber = getFiberFromElement(element);
  if (!fiber) {
    return null;
  }

  const chain: PropsChainItem[] = [];
  const contextUsages: ContextUsage[] = [];
  const problems: ProblemDetection[] = [];

  let current: ReactFiber | null | undefined = fiber;
  let depth = 0;
  const maxDepth = 50;

  // Walk from target up to root
  while (current && depth < maxDepth) {
    // Use getFiberNameForChain to include DOM elements in the hierarchy
    const componentName = getFiberNameForChain(current);
    if (componentName) {
      const source = current._debugSource || getSourceFromFiber(current);
      // Try both memoizedProps and pendingProps - take whichever has more content
      const memoizedProps = extractRelevantProps(current.memoizedProps ?? null);
      const pendingPropsData = extractRelevantProps(current.pendingProps ?? null);
      const relevantProps =
        Object.keys(memoizedProps).length >= Object.keys(pendingPropsData).length ? memoizedProps : pendingPropsData;
      const contexts = detectContextUsage(current);

      chain.unshift({
        componentName,
        sourceLocation: source
          ? {
              fileName: source.fileName,
              lineNumber: source.lineNumber,
              ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
            }
          : undefined,
        relevantProps,
        isTarget: depth === 0,
      });

      if (contexts.length > 0) {
        contextUsages.push(...contexts);
      }
    }

    current = current.return;
    depth++;
  }

  // Detect problems based on the chain
  analyzeChainForProblems(chain, problems);

  return { chain, contextUsages, problems };
}

/**
 * Try to get source info from various fiber properties
 */
function getSourceFromFiber(fiber: ReactFiber): ReactFiber['_debugSource'] | null {
  // Try pendingProps.__source (highest priority)
  if (fiber.pendingProps && typeof fiber.pendingProps === 'object') {
    const pendingProps = fiber.pendingProps as Record<string, unknown>;
    const source = pendingProps.__source as
      | { fileName?: string; lineNumber?: number; columnNumber?: number }
      | undefined;
    if (source?.fileName && source?.lineNumber) {
      return source as ReactFiber['_debugSource'];
    }
  }

  // Try _debugSource
  if (fiber._debugSource) {
    return fiber._debugSource;
  }

  return null;
}

/**
 * Analyze the props chain for potential problems
 */
function analyzeChainForProblems(chain: PropsChainItem[], problems: ProblemDetection[]): void {
  if (chain.length < 2) return;

  // Check for props count mismatch between levels
  for (let i = 0; i < chain.length - 1; i++) {
    const current = chain[i]!;
    const parent = chain[i + 1]!;
    const currentPropCount = Object.keys(current.relevantProps).length;
    const parentPropCount = Object.keys(parent.relevantProps).length;

    // If parent passes more props than child uses, some might be unused
    if (parentPropCount > currentPropCount && parentPropCount > 3) {
      const unusedCount = parentPropCount - currentPropCount;
      problems.push({
        severity: 'low',
        title: 'Props 数量差异',
        description: `${parent.componentName} 传递了 ${parentPropCount} 个 props，但 ${current.componentName} 只使用了 ${currentPropCount} 个`,
        suggestion: `检查是否有 ${unusedCount} 个 props 可以优化或内联`,
      });
    }
  }

  // Check for deep nesting
  if (chain.length > 4) {
    problems.push({
      severity: 'medium',
      title: '组件层级过深',
      description: `Props 链路有 ${chain.length} 层嵌套`,
      suggestion: '考虑合并中间层组件或使用 Context 减少 props drilling',
    });
  }

  // Check for arrays that might be over-filtered
  for (const item of chain) {
    for (const [key, value] of Object.entries(item.relevantProps)) {
      if (typeof value === 'string' && (key.includes('filter') || key.includes('search'))) {
        if (value === '' || value === '[]') {
          problems.push({
            severity: 'low',
            title: '过滤条件可能为空',
            description: `${item.componentName} 的 ${key} 为空，可能导致数据全部被过滤`,
          });
        }
      }
    }
  }
}

// =============================================================================
// Source Map Mapping for Vite Dev Server
// =============================================================================
//
// Vite transforms source code during development, so positions from stack traces
// and _debugSource point to transformed code. We use source maps to map these
// compiled positions back to the original source locations.
//
// Vite dev server embeds source maps as inline data URIs in the compiled JS files.
// The source map is at the end of the file as: //# sourceMappingURL=data:application/json;base64,...
// =============================================================================

/** Cache for source map consumers by compiled file URL - limited to prevent memory leaks */
const sourceMapCache = new Map<string, Promise<unknown>>();
const SOURCE_MAP_CACHE_MAX_SIZE = 50;

/** Cache for _jsxFileName (absolute path) by compiled file URL */
const jsxFileNameCache = new Map<string, string>();
const JSX_FILENAME_CACHE_MAX_SIZE = 50;

/** Pre-initialized source-map module promise to avoid first-call initialization delay */
let sourceMapModulePromise: Promise<typeof import('source-map-js')> | null = null;

/**
 * Pre-initialize the source-map module at module load time
 * Call this early in the app lifecycle to avoid initialization delay on first use
 */
export function preinitializeSourceMap(): Promise<void> {
  if (!sourceMapModulePromise) {
    sourceMapModulePromise = (async () => {
      const sourceMap = await import('source-map-js');
      if (typeof sourceMap.SourceMapConsumer === 'function' && 'initialize' in sourceMap.SourceMapConsumer) {
        await (
          sourceMap.SourceMapConsumer as unknown as { initialize: (config: Record<string, string>) => Promise<void> }
        ).initialize({
          'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
        });
      }
      return sourceMap;
    })();
  }
  return sourceMapModulePromise.then(() => {});
}

/**
 * Get or create the source-map module, reusing the pre-initialized instance
 */
async function getSourceMapModule(): Promise<typeof import('source-map-js') | null> {
  if (sourceMapModulePromise) {
    return sourceMapModulePromise;
  }
  // Fallback: initialize on demand
  const sourceMap = await import('source-map-js');
  if (typeof sourceMap.SourceMapConsumer === 'function' && 'initialize' in sourceMap.SourceMapConsumer) {
    await (
      sourceMap.SourceMapConsumer as unknown as { initialize: (config: Record<string, string>) => Promise<void> }
    ).initialize({
      'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
    });
  }
  return sourceMap;
}

/**
 * Extract source map URL or data URI from compiled JS content
 * Vite embeds source maps as: //# sourceMappingURL=data:application/json;base64,...
 */
function extractSourceMapFromContent(
  content: string
): { type: 'data_uri'; data: string } | { type: 'url'; url: string } | null {
  // Match sourceMappingURL= followed by the value
  // Use \/\/ to match literal // and [#@] for the prefix
  const regex = new RegExp('(?:^|[ \\t])/[/][#@]\\s*sourceMappingURL=([^\\s*]*)', 'm');
  const match = content.match(regex);
  if (!match || !match[1]) {
    return null;
  }

  const sourceMapUrl = match[1].trim();

  if (sourceMapUrl.startsWith('data:')) {
    return { type: 'data_uri', data: sourceMapUrl };
  }

  return { type: 'url', url: sourceMapUrl };
}

/**
 * Decode a base64 data URI to a source map object
 */
function decodeDataUri(dataUri: string): object | null {
  try {
    // data:application/json;base64,<base64>
    const commaIndex = dataUri.indexOf(',');
    if (commaIndex === -1) return null;

    const base64 = dataUri.substring(commaIndex + 1);
    const json = atob(base64);
    return JSON.parse(json);
  } catch (error) {
    console.warn('[source-location] Failed to decode data URI:', error);
    return null;
  }
}

/**
 * Extract _jsxFileName from compiled content
 * Vite stores the absolute path in a variable like: var _jsxFileName = "/path/to/file"
 */
function extractJsxFileName(content: string): string | null {
  // Match patterns like: var _jsxFileName = "/path/to/file"
  const patterns = [
    /var\s+_jsxFileName\s*=\s*["']([^"']+)["']/,
    /let\s+_jsxFileName\s*=\s*["']([^"']+)["']/,
    /const\s+_jsxFileName\s*=\s*["']([^"']+)["']/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Evict oldest entries from cache if it exceeds max size
 */
function evictCacheIfNeeded(): void {
  if (sourceMapCache.size >= SOURCE_MAP_CACHE_MAX_SIZE) {
    // Remove oldest 25% of entries
    const entriesToRemove = Math.floor(SOURCE_MAP_CACHE_MAX_SIZE * 0.25);
    const keys = sourceMapCache.keys();
    for (let i = 0; i < entriesToRemove; i++) {
      const next = keys.next();
      if (next.done) break;
      sourceMapCache.delete(next.value);
    }
  }
}

/**
 * Get or create SourceMapConsumer for a compiled file URL
 * This fetches the compiled file, extracts the inline source map, and creates a consumer
 */
async function getSourceMapConsumerForFile(compiledUrl: string): Promise<unknown | null> {
  // Return cached promise if exists (only if it resolved, not rejected)
  const existing = sourceMapCache.get(compiledUrl);
  if (existing) {
    // Check if promise resolved or rejected - if rejected, don't reuse
    const cachedResult = await existing.catch(() => null);
    if (cachedResult !== null) {
      return cachedResult;
    }
    // If it was null/rejected, remove from cache and retry
    sourceMapCache.delete(compiledUrl);
  }

  evictCacheIfNeeded();

  const promise = (async () => {
    try {
      // Use pre-initialized module
      const sourceMapModule = await getSourceMapModule();
      if (!sourceMapModule) return null;

      // Fetch the compiled JS file
      const response = await fetch(compiledUrl);
      if (!response.ok) {
        return null;
      }

      const content = await response.text();

      // Extract _jsxFileName (absolute path) from the compiled content
      const jsxFileName = extractJsxFileName(content);
      if (jsxFileName) {
        // Evict old entries if cache is full
        if (jsxFileNameCache.size >= JSX_FILENAME_CACHE_MAX_SIZE) {
          const firstKey = jsxFileNameCache.keys().next().value;
          if (firstKey) jsxFileNameCache.delete(firstKey);
        }
        jsxFileNameCache.set(compiledUrl, jsxFileName);
      }

      // Extract source map info from content
      const sourceMapInfo = extractSourceMapFromContent(content);
      if (!sourceMapInfo) {
        return null;
      }

      let sourceMapJson: RawSourceMap | null = null;

      if (sourceMapInfo.type === 'data_uri') {
        const decoded = decodeDataUri(sourceMapInfo.data);
        if (!decoded) {
          return null;
        }
        sourceMapJson = decoded as unknown as RawSourceMap;
      } else {
        // Fetch external .map file
        const mapResponse = await fetch(sourceMapInfo.url);
        if (!mapResponse.ok) {
          return null;
        }
        sourceMapJson = await mapResponse.json();
      }

      // Create SourceMapConsumer (module already initialized by getSourceMapModule)
      // The source map JSON from Vite matches RawSourceMap interface
      if (typeof sourceMapModule.SourceMapConsumer === 'function' && sourceMapJson) {
        const consumer = new sourceMapModule.SourceMapConsumer(sourceMapJson);
        return consumer;
      }
      return null;
    } catch {
      return null;
    }
  })();

  sourceMapCache.set(compiledUrl, promise);
  return promise;
}

/**
 * Check if a URL looks like a Vite dev server URL that needs source map mapping
 */
function isViteDevServerUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('[::1]');
}

/**
 * Parse a Vite dev server URL to extract file path and position
 * e.g., "http://localhost:3002/App.tsx" + line:7 + column:25 -> { filePath: "/App.tsx", line: 7, column: 25 }
 */
function parseViteUrl(
  url: string,
  line: number,
  column: number
): { fileUrl: string; line: number; column: number } | null {
  if (!isViteDevServerUrl(url)) {
    return null;
  }

  try {
    // Clean Vite timestamp: App.tsx?t=123 -> App.tsx
    const cleanUrl = url.replace(/\?t=\d+$/, '');
    return {
      fileUrl: cleanUrl,
      line,
      column,
    };
  } catch {
    return null;
  }
}

/**
 * Map a compiled position (from Vite dev server) back to the original source position
 *
 * @param compiledUrl - The compiled file URL, e.g., "http://localhost:3002/App.tsx"
 * @param line - Line number in compiled code (1-indexed)
 * @param column - Column number in compiled code (0-indexed typically)
 * @returns Original source location or null if mapping failed
 */
export async function mapCompiledPositionToOriginal(
  compiledUrl: string,
  line: number,
  column: number
): Promise<{ fileName: string; lineNumber: number; columnNumber?: number; sourcePath?: string } | null> {
  // Check if this looks like a Vite dev server URL
  if (!isViteDevServerUrl(compiledUrl)) {
    return null;
  }

  const parsed = parseViteUrl(compiledUrl, line, column);
  if (!parsed) {
    return null;
  }

  const consumer = await getSourceMapConsumerForFile(parsed.fileUrl);
  if (!consumer) {
    return null;
  }

  // Get _jsxFileName (absolute path) from cache
  const jsxFileName = jsxFileNameCache.get(parsed.fileUrl);

  try {
    const consumerTyped = consumer as SourceMapConsumer;
    const original = consumerTyped.originalPositionFor({
      line: parsed.line,
      column: parsed.column,
    });

    if (!original || !original.source) {
      return null;
    }

    // Get the full source path from the source map
    const rawSourcePath = original.source as string;
    // If we have _jsxFileName, use it to construct the full path
    let cleanSourcePath: string;
    if (jsxFileName && rawSourcePath) {
      // Extract the directory from _jsxFileName and combine with the filename from source map
      const dir = jsxFileName.substring(0, jsxFileName.lastIndexOf('/') + 1);
      cleanSourcePath = dir + rawSourcePath;
    } else {
      cleanSourcePath = rawSourcePath;
    }
    // Clean the path - remove common prefixes like webpack://[project]/
    cleanSourcePath = cleanSourcePathForVsCode(cleanSourcePath);

    return {
      fileName: rawSourcePath.split('/').pop() || rawSourcePath,
      lineNumber: original.line ?? parsed.line,
      columnNumber: original.column,
      sourcePath: cleanSourcePath,
    };
  } finally {
    // Don't close the consumer - we cache it for future use
  }
}

/**
 * Clean source path for VSCode file URL
 * Removes common prefixes like webpack://[project]/
 */
function cleanSourcePathForVsCode(rawPath: string): string {
  let path = rawPath;

  // Remove webpack protocol prefix: webpack://[project]/ or webpack://[project]/
  path = path.replace(/^webpack:\/\/\[[^\]]+\]\//, '');

  // Remove other common prefixes
  path = path.replace(/^webpack:\/\//, '');
  path = path.replace(/^mids:\/\//, '');

  // If it looks like an absolute path already, use as-is
  if (path.startsWith('/') || path.match(/^[a-zA-Z]:/)) {
    return path;
  }

  return path;
}

/**
 * Map a position to its original source location using source maps
 * Handles Vite dev server URLs with timestamps
 */
export async function mapPositionWithSourceMap(
  fileName: string,
  lineNumber: number,
  columnNumber?: number
): Promise<SourceLocation> {
  // If fileName looks like a Vite dev server URL, try to map it using source maps
  if (isViteDevServerUrl(fileName)) {
    const original = await mapCompiledPositionToOriginal(fileName, lineNumber, columnNumber ?? 0);
    if (original) {
      const result: SourceLocation = {
        fileName: original.fileName,
        lineNumber: original.lineNumber,
      };
      if (original.columnNumber !== undefined) {
        result.columnNumber = original.columnNumber;
      }
      if (original.sourcePath) {
        result.sourcePath = original.sourcePath;
      }
      return result;
    }
  }

  // Return original position if no mapping needed or mapping failed
  const result: SourceLocation = {
    fileName: fileName.includes('/') ? fileName.split('/').pop() || fileName : fileName,
    lineNumber,
  };
  if (columnNumber !== undefined) {
    result.columnNumber = columnNumber;
  }
  return result;
}
