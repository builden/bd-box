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

export function shouldIncludeReactComponentName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return false;
  if (REACT_COMPONENT_NOISE_EXACT.has(trimmed)) return false;
  return !REACT_COMPONENT_NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function formatReactComponentPath(names) {
  const filtered = names.filter((name) => shouldIncludeReactComponentName(name));
  return [...new Set(filtered)].join(' > ');
}

export function getFiberNameForChain(fiber) {
  if (!fiber || !fiber.type) return null;
  if (typeof fiber.type === 'string') {
    return `<${fiber.type}>`;
  }

  if (typeof fiber.type === 'object' || typeof fiber.type === 'function') {
    const type = fiber.type;
    if (type.displayName) return type.displayName;
    if (type.name) return type.name;
    return 'Anonymous';
  }

  return null;
}

export function buildReactComponentPath(fiber, maxDepth = 15) {
  const names = [];
  let current = fiber;
  let depth = 0;

  while (current && depth < maxDepth) {
    const name = getFiberNameForChain(current);
    if (name && shouldIncludeReactComponentName(name)) names.unshift(name);
    current = current.return;
    depth += 1;
  }

  return names.length > 0 ? [...new Set(names)].join(' > ') : '';
}

export function buildPropsChain(fiber, maxDepth = 20, maxProps = 5) {
  const chain = [];
  let current = fiber;
  let depth = 0;

  while (current && depth < maxDepth) {
    const componentName = getFiberNameForChain(current);
    if (componentName && shouldIncludeReactComponentName(componentName)) {
      const props = current.memoizedProps || current.pendingProps || {};
      const keys = Object.keys(props)
        .filter((key) => !key.startsWith('__') && key !== 'children')
        .slice(0, maxProps);
      chain.unshift({
        componentName,
        keys,
      });
    }

    current = current.return;
    depth += 1;
  }

  if (chain.length === 0) return '';

  return chain
    .filter((item) => shouldIncludeReactComponentName(item.componentName))
    .map((item) => {
      if (!item.keys || item.keys.length === 0) return item.componentName;
      return `${item.componentName}(${item.keys.join(', ')})`;
    })
    .join(' > ');
}
