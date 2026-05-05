export function shouldIncludeReactComponentName(name: string): boolean;
export function formatReactComponentPath(names: string[]): string;
export function getFiberNameForChain(fiber: unknown): string | null;
export function buildReactComponentPath(fiber: unknown, maxDepth?: number): string;
export function buildPropsChain(fiber: unknown, maxDepth?: number, maxProps?: number): string;
