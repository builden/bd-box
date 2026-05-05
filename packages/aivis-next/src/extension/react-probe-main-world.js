(() => {
  const INSTALLED_KEY = '__AIVIS_NEXT_REACT_PROBE_INSTALLED__';
  const REQUEST_KEY = 'aivis-next/react-probe/request';
  const RESPONSE_KEY = 'aivis-next/react-probe/response';
  const READY_KEY = 'aivis-next/react-probe/ready';

  if (window[INSTALLED_KEY]) return;
  window[INSTALLED_KEY] = true;

  function getFiberNameForChain(fiber) {
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

  function getComponentName(fiber) {
    if (!fiber || !fiber.type) return null;
    if (typeof fiber.type === 'string') return null;

    if (typeof fiber.type === 'object' || typeof fiber.type === 'function') {
      const type = fiber.type;
      if (type.displayName) return type.displayName;
      if (type.name) return type.name;
    }

    return null;
  }

  function getSourceFromFiber(fiber) {
    if (!fiber) return null;

    if (fiber.pendingProps && typeof fiber.pendingProps === 'object') {
      const source = fiber.pendingProps.__source;
      if (source && source.fileName && source.lineNumber) return source;
    }

    if (fiber.memoizedProps && typeof fiber.memoizedProps === 'object') {
      const source = fiber.memoizedProps.__source;
      if (source && source.fileName && source.lineNumber) return source;
    }

    if (fiber._debugSource) {
      return fiber._debugSource;
    }

    if (fiber._debugOwner && fiber._debugOwner._debugSource) {
      return fiber._debugOwner._debugSource;
    }

    return null;
  }

  function buildReactPath(fiber) {
    const names = [];
    let current = fiber;
    let depth = 0;

    while (current && depth < 15) {
      const name = getFiberNameForChain(current);
      if (name) names.unshift(name);
      current = current.return;
      depth += 1;
    }

    return names.length > 0 ? names.join(' > ') : '';
  }

  function buildPropsChain(fiber) {
    const chain = [];
    let current = fiber;
    let depth = 0;

    while (current && depth < 20) {
      const componentName = getFiberNameForChain(current);
      if (componentName) {
        const props = current.memoizedProps || current.pendingProps || {};
        const keys = Object.keys(props)
          .filter((key) => !key.startsWith('__') && key !== 'children')
          .slice(0, 5);
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
      .map((item) => {
        if (!item.keys || item.keys.length === 0) return item.componentName;
        return `${item.componentName}(${item.keys.join(', ')})`;
      })
      .join(' > ');
  }

  function inspectElement(element) {
    let current = element;
    let inspectedCount = 0;
    let parentDepth = 0;

    while (current && parentDepth < 20) {
      const keys = Object.keys(current);
      inspectedCount += keys.length;

      const fiberKey = keys.find(
        (key) =>
          key.startsWith('__reactFiber$') ||
          key.startsWith('__reactInternalInstance$') ||
          key.startsWith('__reactContainer$')
      );

      if (fiberKey) {
        const fiber = current[fiberKey];
        if (!fiber) {
          return {
            found: false,
            reason: 'fiber-empty',
            fiberKey,
            inspectedCount,
            parentDepth,
          };
        }

        const componentPath = buildReactPath(fiber);
        const source = getSourceFromFiber(fiber);
        const propsChain = buildPropsChain(fiber);
        const componentName = getComponentName(fiber);

        return {
          found: Boolean(componentPath || source || propsChain),
          reactComponents: componentPath || undefined,
          source: source
            ? {
                fileName: source.fileName,
                lineNumber: source.lineNumber,
                ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
                ...(componentName ? { componentName } : {}),
              }
            : undefined,
          propsChain: propsChain || undefined,
          fiberKey,
          inspectedCount,
          parentDepth,
        };
      }

      current = current.parentElement;
      parentDepth += 1;
    }

    return {
      found: false,
      reason: 'fiber-not-found',
      inspectedCount,
      parentDepth,
    };
  }

  function inspectByPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element) {
      return {
        found: false,
        reason: 'no-element-at-point',
      };
    }

    return inspectElement(element);
  }

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data[REQUEST_KEY] !== true || typeof data.requestId !== 'string') return;

    const x = Number(data.x);
    const y = Number(data.y);
    const result =
      Number.isFinite(x) && Number.isFinite(y) ? inspectByPoint(x, y) : { found: false, reason: 'invalid-coordinates' };

    window.postMessage(
      {
        [RESPONSE_KEY]: true,
        requestId: data.requestId,
        result,
      },
      '*'
    );
  });

  window.postMessage({ [READY_KEY]: true, timestamp: Date.now() }, '*');
})();
