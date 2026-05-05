const REACT_COMPONENT_NOISE_EXACT = new Set([
  'ScopeProvider',
  'BunshiMoleculeScopeContext',
  'Provider',
  'Providers',
  'Context',
  'ContextProvider',
  'Context.Consumer',
  'Context.Provider',
]);

const REACT_COMPONENT_NOISE_PATTERNS = [
  /Provider$/,
  /Providers$/,
  /Context$/,
  /ContextProvider$/,
  /ScopeProvider$/,
  /Consumer$/,
  /ForwardRef$/,
  /Memo$/,
];

export function shouldIncludeReactComponentName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;

  if (REACT_COMPONENT_NOISE_EXACT.has(trimmed)) return false;

  if (REACT_COMPONENT_NOISE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  return true;
}

export function formatReactComponentPath(names: string[]): string {
  const filtered = names.filter((name) => shouldIncludeReactComponentName(name));
  return [...new Set(filtered)].join(' > ');
}
