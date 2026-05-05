export interface ReactFiberLike {
  type?:
    | {
        name?: string;
        displayName?: string;
        prototype?: {
          isReactComponent?: boolean;
        };
      }
    | string
    | null;
  elementType?: unknown;
  tag?: number;
  return?: ReactFiberLike | null;
  child?: ReactFiberLike | null;
  sibling?: ReactFiberLike | null;
  memoizedProps?: Record<string, unknown>;
  pendingProps?: Record<string, unknown>;
  stateNode?: unknown;
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  };
  _debugOwner?: ReactFiberLike;
  _debugStack?: Error;
}

export function getReactFiberKey(element: HTMLElement): string | null {
  const keys = Object.keys(element);
  return (
    keys.find(
      (key) =>
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$') ||
        key.startsWith('__reactContainer$')
    ) || null
  );
}

export function getFiberFromElement(element: HTMLElement): ReactFiberLike | null {
  let current: HTMLElement | null = element;
  let depth = 0;

  while (current && depth < 100) {
    const key = getReactFiberKey(current);
    if (key) {
      return (current as unknown as Record<string, unknown>)[key] as ReactFiberLike | null;
    }

    current = current.parentElement;
    depth += 1;
  }

  return null;
}
