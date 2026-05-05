(() => {
  const INSTALLED_KEY = '__AIVIS_NEXT_REACT_PROBE_INSTALLED__';
  const REQUEST_KEY = 'aivis-next/react-probe/request';
  const RESPONSE_KEY = 'aivis-next/react-probe/response';
  const READY_KEY = 'aivis-next/react-probe/ready';
  const NOISE_EXACT = new Set([
    'ScopeProvider',
    'BunshiMoleculeScopeContext',
    'Provider',
    'Providers',
    'Context',
    'ContextProvider',
    'Context.Consumer',
    'Context.Provider',
  ]);
  const NOISE_PATTERNS = [
    /Provider$/,
    /Providers$/,
    /Context$/,
    /ContextProvider$/,
    /ScopeProvider$/,
    /Consumer$/,
    /ForwardRef$/,
    /Memo$/,
  ];

  if (window[INSTALLED_KEY]) return;
  window[INSTALLED_KEY] = true;

  function logDebug() {}

  function shouldLogRequest(data) {
    return data && data.debugContext === 'click';
  }

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

  function shouldIncludeReactComponentName(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return false;
    if (NOISE_EXACT.has(trimmed)) return false;
    return !NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
  }

  function buildReactPath(fiber) {
    const names = [];
    let current = fiber;
    let depth = 0;

    while (current && depth < 15) {
      const name = getFiberNameForChain(current);
      if (name && shouldIncludeReactComponentName(name)) names.unshift(name);
      current = current.return;
      depth += 1;
    }

    return names.length > 0 ? [...new Set(names)].join(' > ') : '';
  }

  function buildPropsChain(fiber) {
    const chain = [];
    let current = fiber;
    let depth = 0;

    while (current && depth < 20) {
      const componentName = getFiberNameForChain(current);
      if (componentName && shouldIncludeReactComponentName(componentName)) {
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
      .filter((item) => shouldIncludeReactComponentName(item.componentName))
      .map((item) => {
        if (!item.keys || item.keys.length === 0) return item.componentName;
        return `${item.componentName}(${item.keys.join(', ')})`;
      })
      .join(' > ');
  }

  function cleanSourcePath(rawPath) {
    if (!rawPath) return rawPath;
    return String(rawPath).replace(/[?#].*$/, '');
  }

  function parseReact19DebugStack(error, componentName) {
    if (!error || !error.stack) return null;

    const lines = String(error.stack).split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const trimmed = line.trim();
      const cleanedLine = trimmed.replace(/\?t=\d+/g, '');
      const frameRe = /at\s+([^\s(]+)\s*\((.+?):(\d+):(\d+)\)/;
      const match = frameRe.exec(cleanedLine);
      if (match && match[1] && match[2] && match[3] && match[4]) {
        const filePath = cleanSourcePath(match[2]);
        if (
          filePath.includes('react-dom') ||
          filePath.includes('react-jsx-dev-runtime') ||
          filePath.includes('react-reconciler') ||
          filePath.includes('scheduler') ||
          filePath.includes('node_modules')
        ) {
          continue;
        }

        return {
          fileName: filePath,
          lineNumber: parseInt(match[3], 10),
          columnNumber: parseInt(match[4], 10),
          componentName: match[1] !== '<anonymous>' ? match[1] : componentName,
        };
      }
    }

    return null;
  }

  function getSourceFromFiber(fiber) {
    const current = fiber;
    if (!current) return null;

    const pendingProps = current.pendingProps || {};
    const memoizedProps = current.memoizedProps || {};
    const sourceCandidates = [
      pendingProps.__source,
      memoizedProps.__source,
      current._debugSource,
      current._debugOwner && current._debugOwner._debugSource,
    ];

    for (const source of sourceCandidates) {
      if (source && typeof source === 'object' && source.fileName && source.lineNumber) {
        return {
          fileName: cleanSourcePath(source.fileName),
          lineNumber: source.lineNumber,
          ...(source.columnNumber !== undefined ? { columnNumber: source.columnNumber } : {}),
          ...(getFiberNameForChain(current) ? { componentName: getFiberNameForChain(current) } : {}),
        };
      }
    }

    const debugStack = current._debugStack;
    if (debugStack && typeof debugStack === 'object' && 'stack' in debugStack) {
      return parseReact19DebugStack(debugStack, getFiberNameForChain(current));
    }

    return null;
  }

  function probeSourceWalk(fiber, maxDepth = 15) {
    let current = fiber;
    let depth = 0;

    while (current && depth < maxDepth) {
      const source = getSourceFromFiber(current);
      if (source) return source;
      current = current.return;
      depth += 1;
    }

    return null;
  }

  function inspectElement(element, shouldLog) {
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
          if (shouldLog) {
            logDebug('fiber empty', { fiberKey, inspectedCount, parentDepth });
          }
          return {
            found: false,
            reason: 'fiber-empty',
            fiberKey,
            inspectedCount,
            parentDepth,
          };
        }

        const componentPath = buildReactPath(fiber);
        const propsChain = buildPropsChain(fiber);
        const source = probeSourceWalk(fiber);

        if (shouldLog) {
          logDebug('inspect element result', {
            fiberKey,
            inspectedCount,
            parentDepth,
            hasComponentPath: !!componentPath,
            hasPropsChain: !!propsChain,
            hasSource: !!source,
          });
        }

        return {
          found: Boolean(componentPath || propsChain),
          reactComponents: componentPath || undefined,
          propsChain: propsChain || undefined,
          source: source || undefined,
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

  function inspectByPoint(x, y, shouldLog) {
    const element = document.elementFromPoint(x, y);
    if (!element) {
      return {
        found: false,
        reason: 'no-element-at-point',
      };
    }

    return inspectElement(element, shouldLog);
  }

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data[REQUEST_KEY] !== true || typeof data.requestId !== 'string') return;

    const x = Number(data.x);
    const y = Number(data.y);
    const shouldLog = shouldLogRequest(data);
    const result =
      Number.isFinite(x) && Number.isFinite(y)
        ? inspectByPoint(x, y, shouldLog)
        : { found: false, reason: 'invalid-coordinates' };

    if (shouldLog) {
      logDebug('request handled', {
        requestId: data.requestId,
        x,
        y,
        found: result.found,
        reason: result.reason,
        hasReactComponents: !!result.reactComponents,
        hasPropsChain: !!result.propsChain,
      });
    }

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
